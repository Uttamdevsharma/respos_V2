import User, { IUser } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';

export class UserService {
  static async getAll(): Promise<IUser[]> {
    return User.find().select('-password').sort({ createdAt: -1 });
  }

  static async getById(id: string): Promise<IUser> {
    const user = await User.findById(id).select('-password');
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async create(input: Partial<IUser>): Promise<IUser> {
    const exists = await User.findOne({ email: input.email });
    if (exists) throw ApiError.conflict('Email already registered');
    const user = await User.create(input);
    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }

  static async update(id: string, input: Partial<IUser>): Promise<IUser> {
    if (input.email) {
      const exists = await User.findOne({ email: input.email, _id: { $ne: id } });
      if (exists) throw ApiError.conflict('Email already registered');
    }

    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    Object.assign(user, input);
    await user.save();

    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }

  static async delete(id: string): Promise<void> {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw ApiError.notFound('User not found');
  }

  static async toggleActive(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    user.isActive = !user.isActive;
    await user.save();
    const userObj = user.toObject();
    delete (userObj as any).password;
    return userObj as IUser;
  }
}
