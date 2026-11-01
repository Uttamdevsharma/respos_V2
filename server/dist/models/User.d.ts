import mongoose, { Document } from 'mongoose';
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'admin' | 'waiter' | 'cashier' | 'kitchen';
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    restaurant_id?: mongoose.Types.ObjectId | null;
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