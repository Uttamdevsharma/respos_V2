import User, { IUser } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';

export class UserService {
  static async getAll(restaurantId: string): Promise<IUser[]> {
    return User.find({ restaurant_id: restaurantId }).select('-password').sort({ createdAt: -1 });
  }

  static async getById(id: string, restaurantId: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, restaurant_id: restaurantId }).select('-password');
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async create(input: Partial<IUser>, restaurantId: string): Promise<IUser> {
    const exists = await User.findOne({ email: input.email });
    if (exists) throw ApiError.conflict('Email already registered');
    const user = await User.create({ ...input, restaurant_id: restaurantId });
    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }

  static async update(id: string, input: Partial<IUser>, restaurantId: string): Promise<IUser> {
    if (input.email) {
      const exists = await User.findOne({ email: input.email, _id: { $ne: id } });
      if (exists) throw ApiError.conflict('Email already registered');
    }

    const user = await User.findOne({ _id: id, restaurant_id: restaurantId });
    if (!user) throw ApiError.notFound('User not found');

    Object.assign(user, input);
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }

  static async delete(id: string, restaurantId: string): Promise<void> {
    const user = await User.findOneAndDelete({ _id: id, restaurant_id: restaurantId });
    if (!user) throw ApiError.notFound('User not found');
  }

  static async toggleActive(id: string, restaurantId: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, restaurant_id: restaurantId });
    if (!user) throw ApiError.notFound('User not found');
    user.isActive = !user.isActive;
    await user.save();
    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }
}
