import mongoose, { Document } from 'mongoose';
export type PlatformRole = 'SUPER_ADMIN' | 'CTO' | 'PROJECT_MANAGER' | 'SUPPORT_LEAD';
export type RestaurantRole = 'OWNER' | 'admin' | 'BRANCH_MANAGER' | 'cashier' | 'waiter' | 'kitchen';
export type UserRole = PlatformRole | RestaurantRole;
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    restaurant_id?: mongoose.Types.ObjectId | null;
    branch_name?: string;
    permissions?: string[];
    department?: string;
    isActive: boolean;
    refreshToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map