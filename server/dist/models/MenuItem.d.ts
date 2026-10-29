import mongoose, { Document } from 'mongoose';
export interface IMenuItem extends Document {
    name: string;
    description?: string;
    price: number;
    category: mongoose.Types.ObjectId;
    image?: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const MenuItem: mongoose.Model<IMenuItem, {}, {}, {}, mongoose.Document<unknown, {}, IMenuItem, {}, {}> & IMenuItem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default MenuItem;
//# sourceMappingURL=MenuItem.d.ts.map