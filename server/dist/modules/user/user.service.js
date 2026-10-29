import User from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
export class UserService {
    static async getAll() {
        return User.find().select('-password').sort({ createdAt: -1 });
    }
    static async getById(id) {
        const user = await User.findById(id).select('-password');
        if (!user)
            throw ApiError.notFound('User not found');
        return user;
    }
    static async create(input) {
        const exists = await User.findOne({ email: input.email });
        if (exists)
            throw ApiError.conflict('Email already registered');
        const user = await User.create(input);
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
    }
    static async update(id, input) {
        if (input.email) {
            const exists = await User.findOne({ email: input.email, _id: { $ne: id } });
            if (exists)
                throw ApiError.conflict('Email already registered');
        }
        const user = await User.findById(id);
        if (!user)
            throw ApiError.notFound('User not found');
        Object.assign(user, input);
        await user.save();
        const userObj = user.toObject();
        delete userObj.password;
        return userObj;
    }
    static async delete(id) {
        const user = await User.findByIdAndDelete(id);
        if (!user)
            throw ApiError.notFound('User not found');
    }
    static async toggleActive(id) {
        const user = await User.findById(id);
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