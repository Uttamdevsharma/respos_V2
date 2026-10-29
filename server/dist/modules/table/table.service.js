import Table from '../../models/Table.js';
import Order from '../../models/Order.js';
import { ApiError } from '../../utils/ApiError.js';
export class TableService {
    static async getAll() {
        const tables = await Table.find().sort({ number: 1 }).populate('currentOrder');
        const activeOrders = await Order.find({
            status: { $nin: ['completed', 'cancelled'] }
        });
        return tables.map(table => {
            const tableOrders = activeOrders.filter(order => order.table.toString() === table._id.toString());
            const occupiedSeats = tableOrders.reduce((sum, order) => sum + (order.seatsOccupied || 0), 0);
            const obj = table.toObject();
            obj.occupiedSeats = occupiedSeats;
            obj.activeOrdersCount = tableOrders.length;
            return obj;
        });
    }
    static async getById(id) {
        const table = await Table.findById(id).populate('currentOrder');
        if (!table)
            throw ApiError.notFound('Table not found');
        const activeOrders = await Order.find({
            table: id,
            status: { $nin: ['completed', 'cancelled'] }
        });
        const occupiedSeats = activeOrders.reduce((sum, order) => sum + (order.seatsOccupied || 0), 0);
        const obj = table.toObject();
        obj.occupiedSeats = occupiedSeats;
        obj.activeOrdersCount = activeOrders.length;
        return obj;
    }
    static async create(input) {
        const exists = await Table.findOne({ number: input.number });
        if (exists)
            throw ApiError.conflict(`Table ${input.number} already exists`);
        return Table.create(input);
    }
    static async update(id, input) {
        if (input.number) {
            const exists = await Table.findOne({ number: input.number, _id: { $ne: id } });
            if (exists)
                throw ApiError.conflict(`Table ${input.number} already exists`);
        }
        const table = await Table.findByIdAndUpdate(id, input, { new: true, runValidators: true });
        if (!table)
            throw ApiError.notFound('Table not found');
        return table;
    }
    static async delete(id) {
        const table = await Table.findById(id);
        if (!table)
            throw ApiError.notFound('Table not found');
        if (table.status === 'occupied')
            throw ApiError.badRequest('Cannot delete an occupied table');
        await Table.findByIdAndDelete(id);
    }
    static async updateStatus(id, status) {
        const table = await Table.findByIdAndUpdate(id, { status, ...(status === 'available' && { currentOrder: null }) }, { new: true });
        if (!table)
            throw ApiError.notFound('Table not found');
        return table;
    }
}
//# sourceMappingURL=table.service.js.map