import Category, { ICategory } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';

export class CategoryService {
  static async getAll(restaurantId: string): Promise<ICategory[]> {
    return Category.find({ restaurant_id: restaurantId }).sort({ sortOrder: 1, name: 1 });
  }

  static async getById(id: string, restaurantId: string): Promise<ICategory> {
    const category = await Category.findOne({ _id: id, restaurant_id: restaurantId });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  static async create(input: Partial<ICategory>, restaurantId: string): Promise<ICategory> {
    const exists = await Category.findOne({ restaurant_id: restaurantId, name: input.name });
    if (exists) throw ApiError.conflict(`Category "${input.name}" already exists`);
    return Category.create({ ...input, restaurant_id: restaurantId });
  }

  static async update(id: string, input: Partial<ICategory>, restaurantId: string): Promise<ICategory> {
    if (input.name) {
      const exists = await Category.findOne({ restaurant_id: restaurantId, name: input.name, _id: { $ne: id } });
      if (exists) throw ApiError.conflict(`Category "${input.name}" already exists`);
    }
    const category = await Category.findOneAndUpdate(
      { _id: id, restaurant_id: restaurantId },
      input,
      { new: true, runValidators: true }
    );
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  static async delete(id: string, restaurantId: string): Promise<void> {
    const category = await Category.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
    if (!category) throw ApiError.notFound('Category not found');
  }
}
