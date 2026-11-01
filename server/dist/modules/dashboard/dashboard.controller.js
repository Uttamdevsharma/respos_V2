import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Table from '../../models/Table.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiError } from '../../utils/ApiError.js';
const TZ = '+06:00';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export class DashboardController {
    static getReports = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const restObjId = new mongoose.Types.ObjectId(restaurantId);
        const type = req.query.type || 'daily';
        const dateParam = req.query.date;
        const startDateParam = req.query.startDate;
        const endDateParam = req.query.endDate;
        const yearParam = req.query.year;
        const monthParam = req.query.month;
        const weekStartParam = req.query.weekStart;
        const now = new Date();
        let matchStart;
        let matchEnd = null;
        let groupFormat;
        let labelFn;
        let fillLabels;
        if (type === 'daily') {
            const target = dateParam ? new Date(dateParam) : new Date(now);
            target.setHours(0, 0, 0, 0);
            matchStart = target;
            if (dateParam) {
                matchEnd = new Date(target);
                matchEnd.setHours(23, 59, 59, 999);
            }
            groupFormat = '%H';
            fillLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
            labelFn = (key) => {
                const h = parseInt(key, 10);
                const suffix = h < 12 ? 'AM' : 'PM';
                const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
                return `${display}${suffix}`;
            };
        }
        else if (type === 'date') {
            if (startDateParam && endDateParam) {
                const start = new Date(startDateParam);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDateParam);
                end.setHours(23, 59, 59, 999);
                matchStart = start;
                matchEnd = end;
                groupFormat = '%Y-%m-%d';
                const labels = [];
                const current = new Date(start);
                while (current <= end) {
                    labels.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                }
                fillLabels = labels;
                labelFn = (key) => {
                    const d = new Date(key + 'T00:00:00');
                    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
                };
            }
            else {
                const target = dateParam ? new Date(dateParam) : new Date(now);
                target.setHours(0, 0, 0, 0);
                matchStart = target;
                matchEnd = new Date(target);
                matchEnd.setHours(23, 59, 59, 999);
                groupFormat = '%H';
                fillLabels = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
                labelFn = (key) => {
                    const h = parseInt(key, 10);
                    const suffix = h < 12 ? 'AM' : 'PM';
                    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
                    return `${display}${suffix}`;
                };
            }
        }
        else if (type === 'weekly') {
            let start;
            if (weekStartParam) {
                start = new Date(weekStartParam);
            }
            else {
                const dow = now.getDay();
                const diffToMon = dow === 0 ? -6 : 1 - dow;
                start = new Date(now);
                start.setDate(now.getDate() + diffToMon);
            }
            start.setHours(0, 0, 0, 0);
            matchStart = start;
            matchEnd = new Date(matchStart);
            matchEnd.setDate(matchStart.getDate() + 6);
            matchEnd.setHours(23, 59, 59, 999);
            groupFormat = '%Y-%m-%d';
            fillLabels = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(matchStart);
                d.setDate(matchStart.getDate() + i);
                return d.toISOString().split('T')[0];
            });
            labelFn = (key) => {
                const d = new Date(key + 'T00:00:00');
                return `${DAYS[d.getDay()]} ${d.getDate()}`;
            };
        }
        else if (type === 'monthly') {
            const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
            const monthVal = monthParam ? parseInt(monthParam, 10) : (now.getMonth() + 1);
            matchStart = new Date(year, monthVal - 1, 1);
            matchEnd = new Date(year, monthVal, 0);
            matchEnd.setHours(23, 59, 59, 999);
            groupFormat = '%Y-%m-%d';
            const daysInMonth = matchEnd.getDate();
            fillLabels = Array.from({ length: daysInMonth }, (_, i) => {
                const dayStr = String(i + 1).padStart(2, '0');
                const monthStr = String(monthVal).padStart(2, '0');
                return `${year}-${monthStr}-${dayStr}`;
            });
            labelFn = (key) => {
                const parts = key.split('-');
                return `${parseInt(parts[2], 10)}`;
            };
        }
        else {
            const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
            matchStart = new Date(year, 0, 1);
            matchEnd = new Date(year, 11, 31, 23, 59, 59, 999);
            groupFormat = '%Y-%m';
            fillLabels = Array.from({ length: 12 }, (_, i) => {
                const monthStr = String(i + 1).padStart(2, '0');
                return `${year}-${monthStr}`;
            });
            labelFn = (key) => {
                const monthIdx = parseInt(key.split('-')[1], 10) - 1;
                return MONTHS_SHORT[monthIdx];
            };
        }
        const baseMatch = {
            restaurant_id: restObjId,
            createdAt: matchEnd
                ? { $gte: matchStart, $lte: matchEnd }
                : { $gte: matchStart },
            status: 'completed',
        };
        const [chartRaw, topItemsRaw, paymentRaw, summaryRaw, channelRaw] = await Promise.all([
            Order.aggregate([
                { $match: baseMatch },
                {
                    $group: {
                        _id: { $dateToString: { format: groupFormat, date: '$createdAt', timezone: TZ } },
                        sales: { $sum: '$grandTotal' },
                        orders: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            Order.aggregate([
                { $match: baseMatch },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.name',
                        quantity: { $sum: '$items.quantity' },
                        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    },
                },
                { $sort: { quantity: -1 } },
                { $limit: 5 },
            ]),
            Order.aggregate([
                { $match: baseMatch },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        total: { $sum: '$grandTotal' },
                    },
                },
            ]),
            Order.aggregate([
                { $match: baseMatch },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$grandTotal' },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]),
            Order.aggregate([
                { $match: baseMatch },
                {
                    $group: {
                        _id: { $ifNull: ['$orderType', 'dine_in'] },
                        count: { $sum: 1 },
                        totalSales: { $sum: '$grandTotal' },
                    },
                },
                { $sort: { totalSales: -1 } },
            ]),
        ]);
        const salesMap = new Map(chartRaw.map((item) => [item._id, item]));
        const chartData = fillLabels.map((key) => {
            const existing = salesMap.get(key);
            return {
                label: labelFn(key),
                sales: existing ? existing.sales : 0,
                orders: existing ? existing.orders : 0,
            };
        });
        const totalSales = summaryRaw[0]?.totalSales || 0;
        const totalOrders = summaryRaw[0]?.totalOrders || 0;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        ApiResponse.success(res, {
            type,
            totalSales,
            totalOrders,
            avgOrderValue,
            chartData,
            topItems: topItemsRaw,
            paymentBreakdown: paymentRaw,
            channelBreakdown: channelRaw,
        }, 'Sales report retrieved');
    });
    static getStats = catchAsync(async (req, res) => {
        const restaurantId = req.user?.restaurant_id;
        if (!restaurantId)
            throw ApiError.forbidden('Restaurant context missing');
        const restObjId = new mongoose.Types.ObjectId(restaurantId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const [todaySales, todayOrders, totalTables, activeTables, pendingOrders, preparingOrders, readyOrders, completedOrders, recentOrders, dailySales,] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        restaurant_id: restObjId,
                        createdAt: { $gte: today },
                        status: 'completed',
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$grandTotal' },
                    },
                },
            ]),
            Order.countDocuments({ restaurant_id: restaurantId, createdAt: { $gte: today } }),
            Table.countDocuments({ restaurant_id: restaurantId }),
            Table.countDocuments({ restaurant_id: restaurantId, status: 'occupied' }),
            Order.countDocuments({ restaurant_id: restaurantId, status: 'pending', createdAt: { $gte: today } }),
            Order.countDocuments({ restaurant_id: restaurantId, status: 'preparing', createdAt: { $gte: today } }),
            Order.countDocuments({ restaurant_id: restaurantId, status: 'ready', createdAt: { $gte: today } }),
            Order.countDocuments({ restaurant_id: restaurantId, status: 'completed', createdAt: { $gte: today } }),
            Order.find({ restaurant_id: restaurantId })
                .populate('table', 'number')
                .populate('waiter', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Order.aggregate([
                {
                    $match: {
                        restaurant_id: restObjId,
                        createdAt: { $gte: sevenDaysAgo },
                        status: 'completed',
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } },
                        sales: { $sum: '$grandTotal' },
                        orders: { $sum: 1 },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
            ]),
        ]);
        const salesMap = new Map((dailySales || []).map((item) => [item._id, item]));
        const completeDailySales = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const existing = salesMap.get(dateStr);
            completeDailySales.push({
                _id: dateStr,
                sales: existing ? existing.sales : 0,
                orders: existing ? existing.orders : 0,
            });
        }
        const stats = {
            todaySales: todaySales[0]?.total || 0,
            todayOrders,
            totalTables,
            activeTables,
            orderStatus: {
                pending: pendingOrders,
                preparing: preparingOrders,
                ready: readyOrders,
                completed: completedOrders,
            },
            recentOrders,
            dailySales: completeDailySales,
        };
        ApiResponse.success(res, stats, 'Dashboard stats retrieved');
    });
}
//# sourceMappingURL=dashboard.controller.js.map