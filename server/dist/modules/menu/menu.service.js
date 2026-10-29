import MenuItem from '../../models/MenuItem.js';
import { ApiError } from '../../utils/ApiError.js';
export class MenuService {
    static async getAll(categoryId) {
        const filter = {};
        if (categoryId)
            filter.category = categoryId;
        return MenuItem.find(filter).populate('category', 'name').sort({ name: 1 });
    }
    static async getById(id) {
        const item = await MenuItem.findById(id).populate('category', 'name');
        if (!item)
            throw ApiError.notFound('Menu item not found');
        return item;
    }
    static async create(input) {
        const item = await MenuItem.create(input);
        return item.populate('category', 'name');
    }
    static async update(id, input) {
        const item = await MenuItem.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate('category', 'name');
        if (!item)
            throw ApiError.notFound('Menu item not found');
        return item;
    }
    static async delete(id) {
        const item = await MenuItem.findByIdAndDelete(id);
        if (!item)
            throw ApiError.notFound('Menu item not found');
    }
    static async toggleAvailability(id) {
        const item = await MenuItem.findById(id);
        if (!item)
            throw ApiError.notFound('Menu item not found');
        item.isAvailable = !item.isAvailable;
        await item.save();
        return item.populate('category', 'name');
    }
}
//# sourceMappingURL=menu.service.js.map