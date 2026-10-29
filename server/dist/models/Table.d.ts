import mongoose, { Document } from 'mongoose';
export interface ITable extends Document {
    number: number;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    location: string;
    currentOrder?: mongoose.Types.ObjectId;
    occupiedSeats?: number;
    activeOrdersCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Table: mongoose.Model<ITable, {}, {}, {}, mongoose.Document<unknown, {}, ITable, {}, {}> & ITable & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Table;
//# sourceMappingURL=Table.d.ts.map