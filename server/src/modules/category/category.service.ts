import Category, { ICategory } from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';

export class CategoryService {
  static async getAll(): Promise<ICategory[]> {
    return Category.find().sort({ sortOrder: 1, name: 1 });
  }

  static async getById(id: string): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  static async create(input: Partial<ICategory>): Promise<ICategory> {
    return Category.create(input);
  }

  static async update(id: string, input: Partial<ICategory>): Promise<ICategory> {
    const category = await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  static async delete(id: string): Promise<void> {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw ApiError.notFound('Category not found');
  }
}
