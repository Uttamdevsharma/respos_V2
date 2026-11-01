import Table, { ITable } from '../../models/Table.js';
import Order from '../../models/Order.js';
import { ApiError } from '../../utils/ApiError.js';
import { CreateTableInput, UpdateTableInput } from './table.validation.js';

export class TableService {
  static async getAll(restaurantId: string): Promise<ITable[]> {
    const tables = await Table.find({ restaurant_id: restaurantId }).sort({ number: 1 }).populate('currentOrder');
    const activeOrders = await Order.find({
      restaurant_id: restaurantId,
      status: { $nin: ['completed', 'cancelled'] }
    });

    return tables.map(table => {
      const tableOrders = activeOrders.filter(order => order.table && order.table.toString() === table._id.toString());
      const occupiedSeats = tableOrders.reduce((sum, order) => sum + (order.seatsOccupied || 0), 0);
      
      const obj = table.toObject() as any;
      obj.occupiedSeats = occupiedSeats;
      obj.activeOrdersCount = tableOrders.length;
      return obj;
    });
  }

  static async getById(id: string, restaurantId: string): Promise<ITable> {
    const table = await Table.findOne({ _id: id, restaurant_id: restaurantId }).populate('currentOrder');
    if (!table) throw ApiError.notFound('Table not found');

    const activeOrders = await Order.find({
      restaurant_id: restaurantId,
      table: id,
      status: { $nin: ['completed', 'cancelled'] }
    });
    const occupiedSeats = activeOrders.reduce((sum, order) => sum + (order.seatsOccupied || 0), 0);

    const obj = table.toObject() as any;
    obj.occupiedSeats = occupiedSeats;
    obj.activeOrdersCount = activeOrders.length;
    return obj;
  }

  static async create(input: CreateTableInput, restaurantId: string): Promise<ITable> {
    const exists = await Table.findOne({ restaurant_id: restaurantId, number: input.number });
    if (exists) throw ApiError.conflict(`Table ${input.number} already exists`);
    return Table.create({ ...input, restaurant_id: restaurantId });
  }

  static async update(id: string, input: UpdateTableInput, restaurantId: string): Promise<ITable> {
    if (input.number) {
      const exists = await Table.findOne({ restaurant_id: restaurantId, number: input.number, _id: { $ne: id } });
      if (exists) throw ApiError.conflict(`Table ${input.number} already exists`);
    }
    const table = await Table.findOneAndUpdate({ _id: id, restaurant_id: restaurantId }, input, { new: true, runValidators: true });
    if (!table) throw ApiError.notFound('Table not found');
    return table;
  }

  static async delete(id: string, restaurantId: string): Promise<void> {
    const table = await Table.findOne({ _id: id, restaurant_id: restaurantId });
    if (!table) throw ApiError.notFound('Table not found');
    if (table.status === 'occupied') throw ApiError.badRequest('Cannot delete an occupied table');
    await Table.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
  }

  static async updateStatus(id: string, status: 'available' | 'occupied' | 'reserved', restaurantId: string): Promise<ITable> {
    const table = await Table.findOneAndUpdate(
      { _id: id, restaurant_id: restaurantId },
      { status, ...(status === 'available' && { currentOrder: null }) },
      { new: true }
    );
    if (!table) throw ApiError.notFound('Table not found');
    return table;
  }
}
