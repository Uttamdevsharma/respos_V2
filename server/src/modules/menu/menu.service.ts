import MenuItem, { IMenuItem } from '../../models/MenuItem.js';
import { ApiError } from '../../utils/ApiError.js';

export class MenuService {
  static async getAll(restaurantId: string, categoryId?: string): Promise<IMenuItem[]> {
    const filter: Record<string, unknown> = { restaurant_id: restaurantId };
    if (categoryId) filter.category = categoryId;
    return MenuItem.find(filter).populate('category', 'name').sort({ name: 1 });
  }

  static async getById(id: string, restaurantId: string): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, restaurant_id: restaurantId }).populate('category', 'name');
    if (!item) throw ApiError.notFound('Menu item not found');
    return item;
  }

  static async create(input: Partial<IMenuItem>, restaurantId: string): Promise<IMenuItem> {
    const item = await MenuItem.create({ ...input, restaurant_id: restaurantId });
    return item.populate('category', 'name');
  }

  static async update(id: string, input: Partial<IMenuItem>, restaurantId: string): Promise<IMenuItem> {
    const item = await MenuItem.findOneAndUpdate(
      { _id: id, restaurant_id: restaurantId },
      input,
      { new: true, runValidators: true }
    ).populate('category', 'name');
    if (!item) throw ApiError.notFound('Menu item not found');
    return item;
  }

  static async delete(id: string, restaurantId: string): Promise<void> {
    const item = await MenuItem.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
    if (!item) throw ApiError.notFound('Menu item not found');
  }

  static async toggleAvailability(id: string, restaurantId: string): Promise<IMenuItem> {
    const item = await MenuItem.findOne({ _id: id, restaurant_id: restaurantId });
    if (!item) throw ApiError.notFound('Menu item not found');
    item.isAvailable = !item.isAvailable;
    await item.save();
    return item.populate('category', 'name');
  }
}
