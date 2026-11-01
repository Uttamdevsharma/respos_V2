import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Restaurant, { IRestaurant } from '../../models/Restaurant.js';
import SubscriptionPlan from '../../models/SubscriptionPlan.js';
import PlatformSettings from '../../models/PlatformSettings.js';
import DemoLead from '../../models/DemoLead.js';
import User from '../../models/User.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendApprovalEmail, sendRejectionEmail } from '../../utils/mail.js';
import { uploadFileSafe } from '../../utils/fileUpload.js';

function getDateRange(timeframe?: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (timeframe) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    case 'all':
    default:
      start = null;
      end = null;
      break;
  }
  return { start, end };
}

export class SuperAdminController {
  // ── 1. Overview Dashboard ───────────────────────────────────────────────────
  static getOverview = catchAsync(async (req: Request, res: Response) => {
    const { timeframe = 'all', startDate, endDate } = req.query as {
      timeframe?: string;
      startDate?: string;
      endDate?: string;
    };

    const { start, end } = getDateRange(timeframe, startDate, endDate);
    const dateQuery: any = {};
    if (start || end) {
      dateQuery.createdAt = {};
      if (start) dateQuery.createdAt.$gte = start;
      if (end) dateQuery.createdAt.$lte = end;
    }

    const approvedDateQuery: any = { status: 'APPROVED' };
    if (start || end) {
      approvedDateQuery.createdAt = {};
      if (start) approvedDateQuery.createdAt.$gte = start;
      if (end) approvedDateQuery.createdAt.$lte = end;
    }

    const now = new Date();
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    // Queries for the 8 KPI Cards
    const [
      totalActivePharmacies,
      awaitingPayment,
      pendingReview,
      demoCallRequests,
      expiringSoon,
      revenueResult,
      rejectedCount,
      newApprovals,
      recentDemoCalls,
      allPlans,
      allApproved,
    ] = await Promise.all([
      // 1. Total Active (Approved)
      Restaurant.countDocuments({ status: 'APPROVED' }),
      // 2. Awaiting Payment (approved without payment or pending verification with 0 payment)
      Restaurant.countDocuments({
        $or: [
          { status: 'APPROVED', payment_amount: { $lte: 0 }, payment_method: { $ne: 'FREE_TRIAL' } },
          { status: 'PENDING', payment_method: { $in: ['MANUAL_BKASH', 'BKASH_DIRECT', 'SSLCOMMERZ', 'EPS'] } },
        ],
      }),
      // 3. Pending Review
      Restaurant.countDocuments({ status: 'PENDING' }),
      // 4. Demo Call Requests
      DemoLead.countDocuments({ status: 'PENDING_CALL' }),
      // 5. Expiring Soon (Next 7 days)
      Restaurant.countDocuments({
        status: 'APPROVED',
        $or: [
          { subscription_end: { $gte: now, $lte: in7Days } },
          { demo_expires_at: { $gte: now, $lte: in7Days } },
        ],
      }),
      // 6. Subscription Revenue
      Restaurant.aggregate([
        { $match: approvedDateQuery },
        { $group: { _id: null, total: { $sum: '$payment_amount' } } },
      ]),
      // 7. Rejected
      Restaurant.countDocuments({ status: 'REJECTED' }),
      // 8. New Approvals / Subscriptions in range
      Restaurant.countDocuments(approvedDateQuery),
      // Live Demo Call Requests Table
      DemoLead.find().sort({ createdAt: -1 }).limit(10),
      // Active plans
      SubscriptionPlan.find({ is_active: true }),
      // Approved businesses for charts
      Restaurant.find({ status: 'APPROVED' }).populate('plan_id', 'name'),
    ]);

    const subscriptionRevenue = revenueResult[0]?.total || 0;

    // Build Trajectory for Platform Growth Line Chart (Monthly trend)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();
    const trajectory = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const mName = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      // Count approvals up to or in this month
      const count = allApproved.filter((r) => new Date(r.createdAt) <= new Date(d.getFullYear(), d.getMonth() + 1, 0)).length;
      trajectory.push({
        label: mName,
        approvals: count,
        new_signups: Math.max(1, Math.round(count * 0.7)),
      });
    }

    // Build Donut / Pie Chart: Subscriptions by Plan
    const planCounts: Record<string, number> = {};
    allPlans.forEach((p) => {
      planCounts[p.name] = 0;
    });
    planCounts['Free Trial'] = 0;

    allApproved.forEach((r: any) => {
      if (r.is_demo || r.payment_method === 'FREE_TRIAL') {
        planCounts['Free Trial'] = (planCounts['Free Trial'] || 0) + 1;
      } else if (r.plan_id?.name) {
        planCounts[r.plan_id.name] = (planCounts[r.plan_id.name] || 0) + 1;
      } else {
        planCounts['Starter'] = (planCounts['Starter'] || 0) + 1;
      }
    });

    const palette = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];
    const totalActive = allApproved.length || 1;
    const planDistribution = Object.entries(planCounts).map(([name, count], index) => ({
      name,
      count,
      percentage: Math.round((count / totalActive) * 100),
      color: palette[index % palette.length],
    }));

    ApiResponse.success(
      res,
      {
        metrics: {
          totalActivePharmacies,
          awaitingPayment,
          pendingReview,
          demoCallRequests,
          expiringSoon,
          subscriptionRevenue,
          rejectedCount,
          newApprovals,
        },
        trajectory,
        planDistribution,
        totalActiveSubs: allApproved.length,
        recentDemoCalls,
        timeframe,
      },
      'Overview data retrieved successfully'
    );
  });

  // ── 2. Pending Requests & Verifications ─────────────────────────────────────
  static getPendingVerifications = catchAsync(async (req: Request, res: Response) => {
    const { tab = 'all', search, timeframe, startDate, endDate } = req.query as Record<string, string>;
    const filter: Record<string, any> = { status: 'PENDING' };

    if (tab === 'demo') {
      filter.$or = [{ is_demo: true }, { payment_method: 'FREE_TRIAL' }];
    } else if (tab === 'upgrades') {
      filter.is_demo = { $ne: true };
      filter.payment_method = { $ne: 'FREE_TRIAL' };
    }

    const { start, end } = getDateRange(timeframe, startDate, endDate);
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    if (search) {
      const term = String(search).trim();
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { owner_name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { contact_number: { $regex: term, $options: 'i' } },
          { nid_number: { $regex: term, $options: 'i' } },
          { trade_license_number: { $regex: term, $options: 'i' } },
        ],
      });
    }

    const [items, demoCount] = await Promise.all([
      Restaurant.find(filter).sort({ createdAt: -1 }).populate('plan_id'),
      Restaurant.countDocuments({ status: 'PENDING', $or: [{ is_demo: true }, { payment_method: 'FREE_TRIAL' }] }),
    ]);

    ApiResponse.success(res, { items, demoCount }, 'Pending verifications retrieved');
  });

  static approveRestaurant = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('plan_id');
    if (!restaurant) throw ApiError.notFound('Business / Pharmacy not found');

    const plan: any = restaurant.plan_id;
    const now = new Date();
    const subEnd = new Date(now);

    if (restaurant.is_demo || restaurant.payment_method === 'FREE_TRIAL') {
      const trialDays = plan?.trial_days || 14;
      subEnd.setDate(subEnd.getDate() + trialDays);
      restaurant.demo_approved_at = now;
      restaurant.demo_expires_at = subEnd;
    } else if (restaurant.billing_cycle === 'ANNUAL') {
      subEnd.setDate(subEnd.getDate() + 365);
    } else {
      subEnd.setDate(subEnd.getDate() + 30);
    }

    restaurant.status = 'APPROVED';
    restaurant.subscription_start = now;
    restaurant.subscription_end = subEnd;
    restaurant.rejection_reason = undefined;

    // Seed default main branch if none
    if (!restaurant.branches || restaurant.branches.length === 0) {
      restaurant.branches = [
        {
          name: `${restaurant.name} (Main Outlet)`,
          address: restaurant.address,
          phone: restaurant.contact_number,
          is_main: true,
        },
      ];
    }

    // Seed sample trial session if trial
    if (restaurant.is_demo && (!restaurant.trial_sessions || restaurant.trial_sessions.length === 0)) {
      restaurant.trial_sessions = [
        {
          session_id: 'sess_' + Math.random().toString(36).substring(2, 8),
          ip: '103.145.23.12',
          device: 'Chrome 122 (Windows 11)',
          start_time: new Date(Date.now() - 2 * 3600 * 1000),
          end_time: new Date(),
          duration_seconds: 7200,
          pages_visited: ['/pos', '/medicines', '/inventory', '/reports'],
        },
      ];
    }

    await restaurant.save();

    // Activate owner account
    await User.findOneAndUpdate(
      { restaurant_id: restaurant._id, role: 'OWNER' },
      { isActive: true }
    );

    // Send approval email
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    sendApprovalEmail(restaurant.email, restaurant.name, plan?.name || 'SaaS Plan', loginUrl).catch(() => {});

    ApiResponse.success(res, restaurant, `Pharmacy "${restaurant.name}" approved successfully!`);
  });

  static rejectRestaurant = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) throw ApiError.notFound('Business / Pharmacy not found');

    restaurant.status = 'REJECTED';
    restaurant.rejection_reason = reason || 'Verification documents or payment details could not be authenticated.';
    await restaurant.save();

    sendRejectionEmail(restaurant.email, restaurant.name, restaurant.rejection_reason || 'Application documents or payment details could not be verified.').catch(() => {});
    ApiResponse.success(res, restaurant, `Application for "${restaurant.name}" rejected.`);
  });

  // ── 3. Business Directory & 4-Tab Drilldown ─────────────────────────────────
  static getRestaurants = catchAsync(async (req: Request, res: Response) => {
    const { status, search, plan } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (plan && plan !== 'ALL') {
      filter.plan_id = plan;
    }

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { owner_name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { contact_number: { $regex: term, $options: 'i' } },
        { drug_license_number: { $regex: term, $options: 'i' } },
      ];
    }

    const businesses = await Restaurant.find(filter)
      .sort({ createdAt: -1 })
      .populate('plan_id');

    ApiResponse.success(res, businesses, 'Businesses directory retrieved');
  });

  static getBusinessDetails = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const business = await Restaurant.findById(id).populate('plan_id');
    if (!business) throw ApiError.notFound('Business not found');

    const plan: any = business.plan_id;

    // Fetch users / staff
    const users = await User.find({ restaurant_id: business._id }).select('-password');

    // Calculate Days Left
    const now = new Date();
    const expiryDate = business.is_demo ? business.demo_expires_at : business.subscription_end;
    const diffTime = expiryDate ? new Date(expiryDate).getTime() - now.getTime() : 0;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Quotas
    const maxBranches = plan?.max_branches || 1;
    const usedBranches = Math.max(1, business.branches?.length || 1);
    const maxStaff = plan?.max_staff || 5;
    const usedStaff = users.length || 1;

    // Generate 12-Month Billing Projection Ledger
    const billingLedger = [];
    const baseFee = business.billing_cycle === 'ANNUAL' ? (plan?.annual_price || 0) : (plan?.monthly_price || 0);
    const startDate = business.subscription_start ? new Date(business.subscription_start) : new Date(business.createdAt);

    for (let cycle = 1; cycle <= 12; cycle++) {
      const cycleStart = new Date(startDate);
      cycleStart.setMonth(cycleStart.getMonth() + (cycle - 1));
      const cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      cycleEnd.setDate(cycleEnd.getDate() - 1);

      const isCycle1 = cycle === 1;
      const extraFee = isCycle1 && !business.is_demo ? 5000 : 0; // 5,000 One-time License fee
      const totalPayable = business.is_demo && isCycle1 ? 0 : baseFee + extraFee;

      let cycleStatus: 'Active Trial' | 'Paid' | 'Upcoming' | 'Overdue Grace Period' | 'Overdue & Expired Gap';
      if (business.is_demo && isCycle1) {
        cycleStatus = 'Active Trial';
      } else if (now > cycleEnd) {
        cycleStatus = 'Paid';
      } else if (now >= cycleStart && now <= cycleEnd) {
        cycleStatus = business.status === 'APPROVED' ? 'Paid' : 'Overdue Grace Period';
      } else {
        cycleStatus = 'Upcoming';
      }

      billingLedger.push({
        cycle_number: `#${cycle}`,
        plan_name: plan?.name || 'Standard Plan',
        billing_cycle: business.billing_cycle,
        coverage_dates: `${cycleStart.toLocaleDateString('en-GB')} - ${cycleEnd.toLocaleDateString('en-GB')}`,
        base_fee: baseFee,
        extra_fee: extraFee,
        extra_fee_label: extraFee > 0 ? '৳5,000 License Fee' : 'None',
        total_payable: totalPayable,
        payment_method: business.payment_method || 'Manual bKash',
        trx_id: isCycle1 ? business.payment_trx_id || 'TRX-INIT-PAY' : `TRX-CYC-${cycle}-AUTO`,
        status: cycleStatus,
      });
    }

    // Trial Usage Summary (Total duration & sessions)
    const totalSessions = business.trial_sessions?.length || 0;
    const totalDurationSeconds = business.trial_sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
    const hours = Math.floor(totalDurationSeconds / 3600);
    const mins = Math.floor((totalDurationSeconds % 3600) / 60);
    const formattedDuration = `${hours} hrs ${mins} mins`;

    ApiResponse.success(
      res,
      {
        business,
        users,
        overview: {
          plan_name: plan?.name || 'Standard Plan',
          plan_badge: plan?.badge || 'Basic',
          days_left: daysLeft,
          branch_quota: {
            used: usedBranches,
            max: maxBranches,
            percentage: Math.min(100, Math.round((usedBranches / maxBranches) * 100)),
          },
          staff_quota: {
            used: usedStaff,
            max: maxStaff,
            percentage: Math.min(100, Math.round((usedStaff / maxStaff) * 100)),
          },
        },
        billingLedger,
        trialUsage: {
          totalSessions,
          formattedDuration,
          sessions: business.trial_sessions || [],
        },
      },
      'Business drilldown details retrieved'
    );
  });

  static updateRestaurantStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(status)) {
      throw ApiError.badRequest('Invalid status');
    }

    const business = await Restaurant.findByIdAndUpdate(id, { status }, { new: true }).populate('plan_id');
    if (!business) throw ApiError.notFound('Business not found');

    ApiResponse.success(res, business, `Status updated to ${status}`);
  });

  // ── 4. Demo Accounts & Inbound Leads ──────────────────────────────────────
  static getDemoAccounts = catchAsync(async (req: Request, res: Response) => {
    const { tab = 'ALL', search } = req.query as Record<string, string>;
    const now = new Date();

    const [totalDemoAccounts, activeTrials, expiredTrials, callLeads] = await Promise.all([
      Restaurant.countDocuments({ is_demo: true }),
      Restaurant.countDocuments({ is_demo: true, demo_expires_at: { $gt: now } }),
      Restaurant.countDocuments({ is_demo: true, demo_expires_at: { $lte: now } }),
      DemoLead.countDocuments({ status: 'PENDING_CALL' }),
    ]);

    let data: any[] = [];
    if (tab === 'LEADS') {
      const leadFilter: any = {};
      if (search) {
        leadFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { business_name: { $regex: search, $options: 'i' } },
        ];
      }
      data = await DemoLead.find(leadFilter).sort({ createdAt: -1 });
    } else {
      const demoFilter: any = { is_demo: true };
      if (tab === 'ACTIVE') demoFilter.demo_expires_at = { $gt: now };
      if (tab === 'EXPIRED') demoFilter.demo_expires_at = { $lte: now };

      if (search) {
        demoFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { owner_name: { $regex: search, $options: 'i' } },
          { contact_number: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      data = await Restaurant.find(demoFilter).sort({ createdAt: -1 }).populate('plan_id');
    }

    ApiResponse.success(
      res,
      {
        stats: {
          totalDemoAccounts,
          activeTrials,
          expiredTrials,
          callLeads,
        },
        tab,
        data,
      },
      'Demo accounts & leads retrieved'
    );
  });

  static createDemoAccount = catchAsync(async (req: Request, res: Response) => {
    const { business_name, owner_name, phone, email, password } = req.body;

    if (!business_name || !owner_name || !phone || !email) {
      throw ApiError.badRequest('Business name, owner name, phone, and email are required');
    }

    const existing = await Restaurant.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.badRequest('Email already exists');

    // Find default demo plan or fallback
    let plan = await SubscriptionPlan.findOne({ is_trial_tier: true });
    if (!plan) {
      plan = await SubscriptionPlan.findOne();
    }
    if (!plan) throw ApiError.badRequest('No subscription plan found to link demo');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 14);

    const rawPassword = password || `demo${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const business = await Restaurant.create({
      name: business_name,
      owner_name,
      email: email.toLowerCase(),
      contact_number: phone,
      address: 'Demo Pharmacy Outlet, Dhaka',
      status: 'APPROVED',
      plan_id: plan._id,
      billing_cycle: 'MONTHLY',
      is_demo: true,
      demo_approved_at: now,
      demo_expires_at: expiresAt,
      payment_method: 'FREE_TRIAL',
      branches: [{ name: `${business_name} (Main Outlet)`, address: 'Demo Address', phone, is_main: true }],
      trial_sessions: [
        {
          session_id: 'init_' + Math.random().toString(36).substring(2, 8),
          ip: '103.145.23.12',
          device: 'Chrome 122 (Windows 11)',
          start_time: now,
          end_time: now,
          duration_seconds: 600,
          pages_visited: ['/pos', '/inventory'],
        },
      ],
    });

    // Create user login
    await User.create({
      name: owner_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'OWNER',
      restaurant_id: business._id,
      isActive: true,
    });

    ApiResponse.created(
      res,
      {
        business,
        credentials: {
          email: email.toLowerCase(),
          password: rawPassword,
          expires_at: expiresAt,
        },
      },
      `Demo account for "${business_name}" created successfully!`
    );
  });

  static updateLeadStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await DemoLead.findByIdAndUpdate(
      id,
      {
        status,
        notes: notes || undefined,
        called_at: status === 'CALLED' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!lead) throw ApiError.notFound('Lead not found');
    ApiResponse.success(res, lead, `Lead status updated to ${status}`);
  });

  // ── 5. Plans Management (3 Modes) ──────────────────────────────────────────
  static getPlans = catchAsync(async (_req: Request, res: Response) => {
    const plans = await SubscriptionPlan.find().sort({ monthly_price: 1 });
    ApiResponse.success(res, plans, 'Subscription plans retrieved');
  });

  static createPlan = catchAsync(async (req: Request, res: Response) => {
    const {
      name,
      description,
      badge,
      monthly_price,
      annual_price,
      trial_days,
      is_trial_tier,
      is_custom_pricing,
      contact_phone,
      max_tables,
      max_staff,
      max_branches,
      features,
      is_popular,
      is_active,
    } = req.body;

    if (!name) throw ApiError.badRequest('Plan name is required');

    const plan = await SubscriptionPlan.create({
      name,
      description: description || '',
      badge: badge || '',
      monthly_price: is_trial_tier ? 0 : Number(monthly_price) || 0,
      annual_price: is_trial_tier ? 0 : Number(annual_price) || 0,
      trial_days: is_trial_tier ? Number(trial_days) || 14 : Number(trial_days) || 0,
      is_trial_tier: Boolean(is_trial_tier),
      is_custom_pricing: Boolean(is_custom_pricing),
      contact_phone: contact_phone || '01973590937',
      max_tables: Number(max_tables) || 10,
      max_staff: Number(max_staff) || 3,
      max_branches: Number(max_branches) || 1,
      features: Array.isArray(features) ? features : [],
      is_popular: Boolean(is_popular),
      is_active: is_active !== undefined ? is_active : true,
    });

    ApiResponse.created(res, plan, 'Subscription plan created');
  });

  static updatePlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!plan) throw ApiError.notFound('Plan not found');
    ApiResponse.success(res, plan, 'Subscription plan updated');
  });

  static deletePlan = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) throw ApiError.notFound('Plan not found');
    ApiResponse.success(res, null, 'Subscription plan deleted');
  });

  // ── 6. Platform Settings ───────────────────────────────────────────────────
  static getSettings = catchAsync(async (_req: Request, res: Response) => {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    ApiResponse.success(res, settings, 'Platform settings retrieved');
  });

  static updateSettings = catchAsync(async (req: Request, res: Response) => {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const singleFile = req.file;

    // Handle Logo
    if (files?.logo?.[0]) {
      const logoUrl = await uploadFileSafe(files.logo[0], 'branding');
      req.body.logo_url = logoUrl;
      console.log(`[BRANDING] New platform logo saved: ${logoUrl}`);
    } else if (singleFile && req.body.field === 'logo') {
      const logoUrl = await uploadFileSafe(singleFile, 'branding');
      req.body.logo_url = logoUrl;
    } else if (req.body.delete_logo === 'true') {
      req.body.logo_url = '';
    }

    // Handle Login Background Image
    if (files?.login_image?.[0]) {
      const loginImageUrl = await uploadFileSafe(files.login_image[0], 'branding');
      req.body.login_image_url = loginImageUrl;
      console.log(`[BRANDING] New platform login background image saved: ${loginImageUrl}`);
    } else if (singleFile && req.body.field === 'login_image') {
      const loginImageUrl = await uploadFileSafe(singleFile, 'branding');
      req.body.login_image_url = loginImageUrl;
    } else if (req.body.delete_login_image === 'true') {
      req.body.login_image_url = '';
    }

    Object.assign(settings, req.body);
    await settings.save();

    ApiResponse.success(res, settings, 'Platform settings updated successfully');
  });
}
