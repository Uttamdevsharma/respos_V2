import { Response } from 'express';
import Restaurant from '../../models/Restaurant.js';
import Table from '../../models/Table.js';
import User from '../../models/User.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';

export class SubscriptionController {
  static getCurrent = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');

    const restaurant = await Restaurant.findById(restaurantId).populate('plan_id');
    if (!restaurant) throw ApiError.notFound('Restaurant not found');

    const [tablesCount, staffCount] = await Promise.all([
      Table.countDocuments({ restaurant_id: restaurantId }),
      User.countDocuments({ restaurant_id: restaurantId }),
    ]);

    const plan: any = restaurant.plan_id;
    const now = new Date();
    const expiry = restaurant.subscription_end ? new Date(restaurant.subscription_end) : null;
    let daysRemaining = 0;
    let subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PENDING' = 'ACTIVE';

    if (restaurant.status === 'PENDING') {
      subscriptionStatus = 'PENDING';
    } else if (expiry) {
      const diffMs = expiry.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        subscriptionStatus = 'EXPIRED';
      } else if (restaurant.payment_method === 'FREE_TRIAL') {
        subscriptionStatus = 'TRIAL';
      } else {
        subscriptionStatus = 'ACTIVE';
      }
    }

    ApiResponse.success(res, {
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        status: restaurant.status,
        billing_cycle: restaurant.billing_cycle,
        subscription_start: restaurant.subscription_start,
        subscription_end: restaurant.subscription_end,
      },
      plan: plan || null,
      status: subscriptionStatus,
      daysRemaining,
      quotas: {
        tables: {
          used: tablesCount,
          max: plan?.max_tables ?? 10,
        },
        staff: {
          used: staffCount,
          max: plan?.max_staff ?? 5,
        },
        branches: {
          used: 1,
          max: plan?.max_branches ?? 1,
        },
      },
    }, 'Current subscription retrieved');
  });

  static upgrade = catchAsync(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId) throw ApiError.forbidden('Restaurant context missing');

    const { planId, billingCycle, paymentMethod, paymentTrxId, senderNumber } = req.body;
    if (!planId) throw ApiError.badRequest('Plan selection is required');

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw ApiError.notFound('Plan not found');

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw ApiError.notFound('Restaurant not found');

    const amount = billingCycle === 'ANNUAL' ? plan.annual_price : plan.monthly_price;

    restaurant.plan_id = plan._id as any;
    restaurant.billing_cycle = billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
    restaurant.payment_method = paymentMethod || 'MANUAL_BKASH';
    restaurant.payment_trx_id = paymentTrxId || '';
    restaurant.sender_number = senderNumber || '';
    restaurant.payment_amount = amount;
    
    // In production SaaS, renewals/upgrades with manual payments submit as pending review, or direct update
    if (paymentMethod === 'FREE_TRIAL') {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + (plan.trial_days || 7));
      restaurant.subscription_start = now;
      restaurant.subscription_end = end;
    } else {
      // Direct extension for convenience in Phase 1
      const now = new Date();
      const currentEnd = restaurant.subscription_end && new Date(restaurant.subscription_end) > now
        ? new Date(restaurant.subscription_end)
        : now;
      const newEnd = new Date(currentEnd);
      if (billingCycle === 'ANNUAL') {
        newEnd.setDate(newEnd.getDate() + 365);
      } else {
        newEnd.setDate(newEnd.getDate() + 30);
      }
      restaurant.subscription_end = newEnd;
    }

    await restaurant.save();

    ApiResponse.success(res, restaurant, 'Subscription upgraded / renewed successfully');
  });
}
