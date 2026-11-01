import Order from '../../models/Order.js';
import Table from '../../models/Table.js';
import Settings from '../../models/Settings.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateOrderToken } from '../../utils/tokenGenerator.js';
import { emitOrderEvent } from '../../config/socket.js';
export class OrderService {
    static async getAll(restaurantId, filters = {}) {
        return Order.find({ ...filters, restaurant_id: restaurantId })
            .populate('table', 'number capacity location')
            .populate('waiter', 'name')
            .sort({ createdAt: -1 });
    }
    static async getById(id, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query)
            .populate('table', 'number capacity location')
            .populate('waiter', 'name');
        if (!order)
            throw ApiError.notFound('Order not found');
        return order;
    }
    static async create(input, waiterId, restaurantId) {
        let table = null;
        if (input.table) {
            table = await Table.findOne({ _id: input.table, restaurant_id: restaurantId });
        }
        // Get settings for tax/service rates
        let settings = await Settings.findOne({ restaurant_id: restaurantId });
        if (!settings) {
            settings = await Settings.create({ restaurant_id: restaurantId });
        }
        // Calculate totals
        const discount = input.discount || 0;
        const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxableAmount = Math.max(0, subtotal - discount);
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
        const tax = Math.round(taxableAmount * taxRate * 100) / 100;
        const serviceCharge = Math.round(taxableAmount * serviceRate * 100) / 100;
        const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
        // Generate token
        const token = await generateOrderToken();
        const seatsToOccup = input.seatsOccupied && input.seatsOccupied > 0 ? input.seatsOccupied : (table ? table.capacity : 1);
        const isPayFirst = input.paymentMode === 'pay_first' && !!input.paymentMethod;
        const effectivePaid = isPayFirst ? (input.paidAmount ?? grandTotal) : 0;
        const returnAmount = isPayFirst ? Math.max(0, effectivePaid - grandTotal) : 0;
        const orderData = {
            restaurant_id: restaurantId,
            token,
            table: input.table || null,
            waiter: waiterId,
            items: input.items,
            subtotal,
            discount,
            tax,
            serviceCharge,
            grandTotal,
            status: isPayFirst ? 'completed' : 'pending',
            orderType: input.orderType || (input.table ? 'dine_in' : 'takeaway'),
            seatsOccupied: seatsToOccup,
            paymentMode: input.paymentMode || 'pre_bill',
        };
        if (isPayFirst) {
            orderData.paymentMethod = input.paymentMethod;
            orderData.paidAmount = input.paidAmount ?? grandTotal;
            orderData.amountPaid = effectivePaid;
            orderData.amountDue = 0;
            orderData.returnAmount = Math.round(returnAmount * 100) / 100;
            orderData.paidAt = new Date();
        }
        const order = await Order.create(orderData);
        // Update table occupancy status if table exists
        if (input.table) {
            await OrderService.updateTableOccupancyStatus(input.table);
        }
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderCreated', populated);
        return populated;
    }
    /** Append new items to an existing active order and recalculate totals */
    static async addItems(id, input, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (order.status === 'cancelled') {
            throw ApiError.badRequest('Cannot add items to a cancelled order');
        }
        const nextBatch = (order.latestAddonBatch || 0) + 1;
        order.latestAddonBatch = nextBatch;
        for (const newItem of input.items) {
            const existingInBatch = order.items.find((i) => i.isAddon && i.addonBatch === nextBatch && i.menuItem?.toString() === newItem.menuItem && i.name === newItem.name && (i.notes || '') === (newItem.notes || ''));
            if (existingInBatch) {
                existingInBatch.quantity += newItem.quantity;
                if (newItem.notes)
                    existingInBatch.notes = newItem.notes;
            }
            else {
                order.items.push({
                    ...newItem,
                    isAddon: true,
                    addonBatch: nextBatch,
                });
            }
        }
        let settings = await Settings.findOne({ restaurant_id: order.restaurant_id });
        if (!settings)
            settings = await Settings.create({ restaurant_id: order.restaurant_id });
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
        const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const serviceCharge = Math.round(subtotal * serviceRate * 100) / 100;
        order.subtotal = subtotal;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.grandTotal = subtotal + tax + serviceCharge;
        order.amountDue = Math.max(0, Math.round((order.grandTotal - (order.amountPaid || 0)) * 100) / 100);
        if (['completed', 'paid', 'ready', 'served', 'billing'].includes(order.status)) {
            order.status = 'preparing';
        }
        await order.save();
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    /** Cancel (remove or reduce qty of) a specific item in an order */
    static async cancelItem(id, input, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (order.status === 'cancelled') {
            throw ApiError.badRequest('Cannot cancel items from a cancelled order');
        }
        const items = order.items;
        if (input.itemIndex < 0 || input.itemIndex >= items.length) {
            throw ApiError.badRequest('Invalid item index');
        }
        const item = items[input.itemIndex];
        const cancelQty = input.cancelQuantity ?? item.quantity;
        if (cancelQty >= item.quantity) {
            items.splice(input.itemIndex, 1);
        }
        else {
            item.quantity -= cancelQty;
        }
        if (items.length === 0) {
            order.status = 'cancelled';
        }
        let settings = await Settings.findOne({ restaurant_id: order.restaurant_id });
        if (!settings)
            settings = await Settings.create({ restaurant_id: order.restaurant_id });
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = Math.round(subtotal * taxRate * 100) / 100;
        const serviceCharge = Math.round(subtotal * serviceRate * 100) / 100;
        order.subtotal = subtotal;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.grandTotal = subtotal + tax + serviceCharge;
        order.amountDue = Math.max(0, Math.round((order.grandTotal - (order.amountPaid || 0)) * 100) / 100);
        if ((order.amountPaid || 0) > order.grandTotal) {
            order.returnAmount = Math.round(((order.amountPaid || 0) - order.grandTotal) * 100) / 100;
        }
        await order.save();
        if (order.status === 'cancelled') {
            await OrderService.updateTableOccupancyStatus(order.table);
        }
        const populated = await order.populate([
            { path: 'table', select: 'number capacity location' },
            { path: 'waiter', select: 'name' },
        ]);
        emitOrderEvent('orderUpdated', populated);
        return populated;
    }
    static async updateStatus(id, status, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
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
    static async getKitchenOrders(restaurantId) {
        try {
            const orders = await Order.find({
                restaurant_id: restaurantId,
                status: { $in: ['pending', 'preparing', 'ready'] },
            })
                .populate('table', 'number capacity location')
                .populate('waiter', 'name')
                .sort({ createdAt: -1 });
            return orders;
        }
        catch (error) {
            console.error('Error fetching kitchen orders:', error);
            throw error;
        }
    }
    static async getBillingOrders(restaurantId) {
        try {
            const orders = await Order.find({
                restaurant_id: restaurantId,
                status: { $in: ['served', 'billing'] },
                paymentMode: { $ne: 'pay_first' },
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
    static async addPartialPayment(id, input, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (!['served', 'billing'].includes(order.status)) {
            throw ApiError.badRequest('Order must be in served or billing status to accept partial payments');
        }
        let settings = await Settings.findOne({ restaurant_id: order.restaurant_id });
        if (!settings)
            settings = await Settings.create({ restaurant_id: order.restaurant_id });
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
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
    static async processPayment(id, input, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (order.status !== 'served' && order.status !== 'billing') {
            throw ApiError.badRequest('Order must be served or in billing status to process payment');
        }
        let settings = await Settings.findOne({ restaurant_id: order.restaurant_id });
        if (!settings)
            settings = await Settings.create({ restaurant_id: order.restaurant_id });
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
        const taxableAmount = order.subtotal - input.discount;
        const tax = Math.round(taxableAmount * taxRate * 100) / 100;
        const serviceCharge = Math.round(taxableAmount * serviceRate * 100) / 100;
        const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
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
    static async processSplitPayment(id, input, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        if (!['served', 'billing'].includes(order.status)) {
            throw ApiError.badRequest('Order must be served or in billing status to process split payment');
        }
        let settings = await Settings.findOne({ restaurant_id: order.restaurant_id });
        if (!settings)
            settings = await Settings.create({ restaurant_id: order.restaurant_id });
        const taxRate = (settings.taxRate || 0) / 100;
        const serviceRate = (settings.serviceChargeRate || 0) / 100;
        const taxableAmount = order.subtotal - input.discount;
        const tax = Math.round(taxableAmount * taxRate * 100) / 100;
        const serviceCharge = Math.round(taxableAmount * serviceRate * 100) / 100;
        const grandTotal = Math.round((taxableAmount + tax + serviceCharge) * 100) / 100;
        const alreadyPaid = order.amountPaid || 0;
        const remainingDue = Math.max(0, Math.round((grandTotal - alreadyPaid) * 100) / 100);
        const splitsTotal = Math.round(input.splits.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
        if (splitsTotal < remainingDue - 0.01) {
            throw ApiError.badRequest(`Split total (${splitsTotal}) is less than remaining balance (${remainingDue})`);
        }
        const returnAmount = Math.max(0, Math.round((splitsTotal + alreadyPaid - grandTotal) * 100) / 100);
        order.splitPayments = input.splits.map((s) => ({
            paymentMethod: s.paymentMethod,
            amount: s.amount,
            note: s.note,
        }));
        order.discount = input.discount;
        order.tax = tax;
        order.serviceCharge = serviceCharge;
        order.grandTotal = grandTotal;
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
    static async getWaiterOrders(waiterId, restaurantId) {
        return Order.find({
            restaurant_id: restaurantId,
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
    static async deleteOrder(id, restaurantId) {
        const query = { _id: id };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const order = await Order.findOne(query);
        if (!order)
            throw ApiError.notFound('Order not found');
        const tableId = order.table;
        await Order.findByIdAndDelete(order._id);
        if (tableId) {
            await OrderService.updateTableOccupancyStatus(tableId);
        }
        emitOrderEvent('orderDeleted', { _id: id, token: order.token });
        return order;
    }
    static async bulkDeleteOrders(orderIds, restaurantId) {
        const query = { _id: { $in: orderIds } };
        if (restaurantId)
            query.restaurant_id = restaurantId;
        const orders = await Order.find(query);
        if (orders.length === 0)
            return { count: 0 };
        const validIds = orders.map((o) => o._id);
        const tableIds = Array.from(new Set(orders.map((o) => o.table).filter(Boolean)));
        await Order.deleteMany({ _id: { $in: validIds } });
        for (const tableId of tableIds) {
            await OrderService.updateTableOccupancyStatus(tableId);
        }
        for (const order of orders) {
            emitOrderEvent('orderDeleted', { _id: order._id.toString(), token: order.token });
        }
        return { count: orders.length };
    }
}
//# sourceMappingURL=order.service.js.map