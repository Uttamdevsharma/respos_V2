import Category from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';
export class CategoryService {
    static async getAll() {
        return Category.find().sort({ sortOrder: 1, name: 1 });
    }
    static async getById(id) {
        const category = await Category.findById(id);
        if (!category)
            throw ApiError.notFound('Category not found');
        return category;
    }
    static async create(input) {
        return Category.create(input);
    }
    static async update(id, input) {
        const category = await Category.findByIdAndUpdate(id, input, { new: true, runValidators: true });
        if (!category)
            throw ApiError.notFound('Category not found');
        return category;
    }
    static async delete(id) {
        const category = await Category.findByIdAndDelete(id);
        if (!category)
            throw ApiError.notFound('Category not found');
    }
}
//# sourceMappingURL=category.service.js.map