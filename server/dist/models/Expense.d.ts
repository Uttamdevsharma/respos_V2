import mongoose, { Document } from 'mongoose';
export interface IExpense extends Document {
    restaurant_id: mongoose.Types.ObjectId;
    title: string;
    amount: number;
    category: string;
    date: Date;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IExpense, {}, {}, {}, mongoose.Document<unknown, {}, IExpense, {}, {}> & IExpense & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Expense.d.ts.map