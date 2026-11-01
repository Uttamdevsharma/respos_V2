import Category from '../../models/Category.js';
import { ApiError } from '../../utils/ApiError.js';
export class CategoryService {
    static async getAll(restaurantId) {
        return Category.find({ restaurant_id: restaurantId }).sort({ sortOrder: 1, name: 1 });
    }
    static async getById(id, restaurantId) {
        const category = await Category.findOne({ _id: id, restaurant_id: restaurantId });
        if (!category)
            throw ApiError.notFound('Category not found');
        return category;
    }
    static async create(input, restaurantId) {
        const exists = await Category.findOne({ restaurant_id: restaurantId, name: input.name });
        if (exists)
            throw ApiError.conflict(`Category "${input.name}" already exists`);
        return Category.create({ ...input, restaurant_id: restaurantId });
    }
    static async update(id, input, restaurantId) {
        if (input.name) {
            const exists = await Category.findOne({ restaurant_id: restaurantId, name: input.name, _id: { $ne: id } });
            if (exists)
                throw ApiError.conflict(`Category "${input.name}" already exists`);
        }
        const category = await Category.findOneAndUpdate({ _id: id, restaurant_id: restaurantId }, input, { new: true, runValidators: true });
        if (!category)
            throw ApiError.notFound('Category not found');
        return category;
    }
    static async delete(id, restaurantId) {
        const category = await Category.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
        if (!category)
            throw ApiError.notFound('Category not found');
    }
}
//# sourceMappingURL=category.service.js.map