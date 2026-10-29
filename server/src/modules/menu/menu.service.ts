import MenuItem, { IMenuItem } from '../../models/MenuItem.js';
import { ApiError } from '../../utils/ApiError.js';

export class MenuService {
  static async getAll(categoryId?: string): Promise<IMenuItem[]> {
    const filter: Record<string, unknown> = {};
    if (categoryId) filter.category = categoryId;
    return MenuItem.find(filter).populate('category', 'name').sort({ name: 1 });
  }

  static async getById(id: string): Promise<IMenuItem> {
    const item = await MenuItem.findById(id).populate('category', 'name');
    if (!item) throw ApiError.notFound('Menu item not found');
    return item;
  }

  static async create(input: Partial<IMenuItem>): Promise<IMenuItem> {
    const item = await MenuItem.create(input);
    return item.populate('category', 'name');
  }

  static async update(id: string, input: Partial<IMenuItem>): Promise<IMenuItem> {
    const item = await MenuItem.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate('category', 'name');
    if (!item) throw ApiError.notFound('Menu item not found');
    return item;
  }

  static async delete(id: string): Promise<void> {
    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) throw ApiError.notFound('Menu item not found');
  }

  static async toggleAvailability(id: string): Promise<IMenuItem> {
    const item = await MenuItem.findById(id);
    if (!item) throw ApiError.notFound('Menu item not found');
    item.isAvailable = !item.isAvailable;
    await item.save();
    return item.populate('category', 'name');
  }
}
