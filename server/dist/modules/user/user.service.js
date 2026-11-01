import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
export class UserService {
    static async getAll(restaurantId) {
        return User.find({ restaurant_id: restaurantId }).select('-password').sort({ createdAt: -1 });
    }
    static async getById(id, restaurantId) {
        const user = await User.findOne({ _id: id, restaurant_id: restaurantId }).select('-password');
        if (!user)
            throw ApiError.notFound('User not found');
        return user;
    }
    static async create(input, restaurantId) {
        const exists = await User.findOne({ email: input.email });
        if (exists)
            throw ApiError.conflict('Email already registered');
        const user = await User.create({ ...input, restaurant_id: restaurantId });
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
    }
    static async update(id, input, restaurantId) {
        if (input.email) {
            const exists = await User.findOne({ email: input.email, _id: { $ne: id } });
            if (exists)
                throw ApiError.conflict('Email already registered');
        }
        const user = await User.findOne({ _id: id, restaurant_id: restaurantId });
        if (!user)
            throw ApiError.notFound('User not found');
        Object.assign(user, input);
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
    }
    static async delete(id, restaurantId) {
        const user = await User.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
        if (!user)
            throw ApiError.notFound('User not found');
    }
    static async toggleActive(id, restaurantId) {
        const user = await User.findOne({ _id: id, restaurant_id: restaurantId });
        if (!user)
            throw ApiError.notFound('User not found');
        user.isActive = !user.isActive;
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
    }
}
//# sourceMappingURL=user.service.js.map