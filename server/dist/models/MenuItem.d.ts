import mongoose, { Document } from 'mongoose';
export interface IMenuItemOption {
    name: string;
    price: number;
}
export interface IMenuItemOptionGroup {
    title: string;
    required?: boolean;
    options: IMenuItemOption[];
}
export interface IMenuItem extends Document {
    restaurant_id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    category: mongoose.Types.ObjectId;
    image?: string;
    isAvailable: boolean;
    optionGroups?: IMenuItemOptionGroup[];
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