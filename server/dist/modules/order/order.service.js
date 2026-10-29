import Order from '../../models/Order.js';
import Table from '../../models/Table.js';
import Settings from '../../models/Settings.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateOrderToken } from '../../utils/tokenGenerator.js';
import { emitOrderEvent } from '../../config/socket.js';
export class OrderService {
    static async getAll(filters = {}) {
        return Order.find(filters)
            .populate('table', 'number capacity location')
            .populate('waiter', 'name')
            .sort({ createdAt: -1 });
    }
    static async getById(id) {
        const order = await Order.findById(id)
            .populate('table', 'number capacity location')
            .populate('waiter', 'name');
        if (!order)
            throw ApiError.notFound('Order not found');
        return order;
    }
    static async create(input, waiterId) {
        // Verify table exists and is available or occupied
        const table = await Table.findById(input.table);
        if (!table)
            throw ApiError.notFound('Table not found');
        // Get settings for tax/service rates
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        // Calculate totals
        const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxRate = settings.taxRate / 100;
        const serviceRate = settings.serviceChargeRate / 100;
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const serviceCharge = Math.round(subtotal * serviceRate * 100) / 100;
        const grandTotal = subtotal + tax + serviceCharge;
        // Generate token
        const token = await generateOrderToken();
        const seatsToOccup = input.seatsOccupied && input.seatsOccupied > 0 ? input.seatsOccupied : table.capacity;
        const order = await Order.create({
            token,
            table: input.table,
            waiter: waiterId,
            items: input.items,
            subtotal,
            tax,
            serviceCharge,
            grandTotal,
            status: 'pending',
            seatsOccupied: seatsToOccup,
        });
        // Update table occupancy status
        await OrderService.updateTableOccupancyStatus(input.table);
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderCreated', populated);
        return populated;
    }
    static async updateStatus(id, status) {
        const order = await Order.findById(id);
        if (!order)
            throw ApiError.notFound('Order not found');
        // Validate status transitions
        const validTransitions = {
            pending: ['preparing', 'cancelled'],
            preparing: ['ready', 'cancelled'],
            ready: ['served'],
            served: ['billing'],
            billing: ['paid'],
            paid: ['completed'],
        };
        const allowed = validTransitions[order.status];
        if (!allowed || !allowed.includes(status)) {
            throw ApiError.badRequest(`Cannot change status from '${order.status}' to '${status}'`);
        }
        order.status = status;
        await order.save();
        // If completed or cancelled, update table occupancy status
        if (status === 'completed' || status === 'cancelled') {
            await OrderService.updateTableOccupancyStatus(order.table);
        }
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    static async getKitchenOrders() {
        try {
            const orders = await Order.find({
                status: { $in: ['pending', 'preparing', 'ready'] },
            })
                .populate('table', 'number capacity location')
                .populate('waiter', 'name')
                .sort({ createdAt: 1 });
            return orders;
        }
        catch (error) {
            console.error('Error fetching kitchen orders:', error);
            throw error;
        }
    }
    static async getBillingOrders() {
        try {
            const orders = await Order.find({
                status: { $in: ['served', 'billing'] },
            })
                .populate('table', 'number capacity location')
                .populate('waiter', 'name')
                .sort({ createdAt: -1 });
            return orders;
        }
        catch (error) {
            console.error('Error fetching billing orders:', error);
            throw error;
        }
    }
    static async addPartialPayment(id, input) {
        const order = await Order.findById(id);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (!['served', 'billing'].includes(order.status)) {
            throw ApiError.badRequest('Order must be in served or billing status to accept partial payments');
        }
        // Recalculate grand total with current discount
        let settings = await Settings.findOne();
        if (!settings)
            settings = await Settings.create({});
        const taxRate = settings.taxRate / 100;
        const serviceRate = settings.serviceChargeRate / 100;
        const taxableAmount = order.subtotal - (order.discount || 0);
        const grandTotal = Math.round((taxableAmount * (1 + taxRate + serviceRate)) * 100) / 100;
        const alreadyPaid = order.amountPaid || 0;
        const remaining = Math.round((grandTotal - alreadyPaid) * 100) / 100;
        if (input.amount > remaining + 0.01) {
            throw ApiError.badRequest(`Partial amount (${input.amount}) exceeds remaining balance (${remaining})`);
        }
        order.partialPayments.push({
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            note: input.note,
            paidAt: new Date(),
        });
        const newAmountPaid = Math.round((alreadyPaid + input.amount) * 100) / 100;
        order.amountPaid = newAmountPaid;
        order.amountDue = Math.max(0, Math.round((grandTotal - newAmountPaid) * 100) / 100);
        order.grandTotal = grandTotal;
        // Move to billing status if not already there
        if (order.status === 'served') {
            order.status = 'billing';
        }
        await order.save();
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    static async processPayment(id, input) {
        const order = await Order.findById(id);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (order.status !== 'served' && order.status !== 'billing') {
            throw ApiError.badRequest('Order must be served or in billing status to process payment');
        }
        // Recalculate with discount
        let settings = await Settings.findOne();
        if (!settings)
            settings = await Settings.create({});
        const taxRate = settings.taxRate / 100;
        const serviceRate = settings.serviceChargeRate / 100;
        const taxableAmount = order.subtotal - input.discount;
        const tax = Math.round(taxableAmount * taxRate * 100) / 100;
        const serviceCharge = Math.round(taxableAmount * serviceRate * 100) / 100;
        const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
        // Subtract already-collected partial payments
        const alreadyPaid = order.amountPaid || 0;
        const remainingDue = Math.max(0, Math.round((grandTotal - alreadyPaid) * 100) / 100);
        const effectivePaid = input.paidAmount + alreadyPaid;
        const returnAmount = Math.max(0, effectivePaid - grandTotal);
        order.discount = input.discount;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.grandTotal = grandTotal;
        order.paymentMethod = input.paymentMethod;
        order.paidAmount = input.paidAmount;
        order.returnAmount = Math.round(returnAmount * 100) / 100;
        order.amountPaid = Math.round(effectivePaid * 100) / 100;
        order.amountDue = 0;
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();
        // Auto-complete and free table
        order.status = 'completed';
        await order.save();
        await OrderService.updateTableOccupancyStatus(order.table);
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    static async processSplitPayment(id, input) {
        const order = await Order.findById(id);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (!['served', 'billing'].includes(order.status)) {
            throw ApiError.badRequest('Order must be served or in billing status to process split payment');
        }
        let settings = await Settings.findOne();
        if (!settings)
            settings = await Settings.create({});
        const taxRate = settings.taxRate / 100;
        const serviceRate = settings.serviceChargeRate / 100;
        const taxableAmount = order.subtotal - input.discount;
        const tax = Math.round(taxableAmount * taxRate * 100) / 100;
        const serviceCharge = Math.round(taxableAmount * serviceRate * 100) / 100;
        const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
        // Already collected via partial payments
        const alreadyPaid = order.amountPaid || 0;
        const remainingDue = Math.max(0, Math.round((grandTotal - alreadyPaid) * 100) / 100);
        // Validate: splits total must cover the remaining due
        const splitsTotal = Math.round(input.splits.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
        if (splitsTotal < remainingDue - 0.01) {
            throw ApiError.badRequest(`Split total (${splitsTotal}) is less than remaining balance (${remainingDue})`);
        }
        const returnAmount = Math.max(0, Math.round((splitsTotal + alreadyPaid - grandTotal) * 100) / 100);
        // Persist split entries
        order.splitPayments = input.splits.map((s) => ({
            paymentMethod: s.paymentMethod,
            amount: s.amount,
            note: s.note,
        }));
        order.discount = input.discount;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.grandTotal = grandTotal;
        // Primary method = whichever split has the largest amount
        const primary = input.splits.reduce((a, b) => (a.amount >= b.amount ? a : b));
        order.paymentMethod = primary.paymentMethod;
        order.paidAmount = splitsTotal;
        order.returnAmount = returnAmount;
        order.amountPaid = Math.round((alreadyPaid + splitsTotal) * 100) / 100;
        order.amountDue = 0;
        order.status = 'paid';
        order.paidAt = new Date();
        await order.save();
        order.status = 'completed';
        await order.save();
        await OrderService.updateTableOccupancyStatus(order.table);
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    static async getWaiterOrders(waiterId) {
        return Order.find({
            waiter: waiterId,
            status: { $in: ['pending', 'preparing', 'ready', 'served'] },
        })
            .populate('table', 'number capacity location')
            .sort({ createdAt: -1 });
    }
    static async updateTableOccupancyStatus(tableId) {
        const table = await Table.findById(tableId);
        if (!table)
            return;
        const activeOrders = await Order.find({
            table: tableId,
            status: { $nin: ['completed', 'cancelled'] }
        });
        if (activeOrders.length > 0) {
            await Table.findByIdAndUpdate(tableId, {
                status: 'occupied',
                currentOrder: activeOrders[0]._id
            });
        }
        else {
            await Table.findByIdAndUpdate(tableId, {
                status: 'available',
                currentOrder: null
            });
        }
    }
}
//# sourceMappingURL=order.service.js.map