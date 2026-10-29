import mongoose, { Document } from 'mongoose';
export interface ISettings extends Document {
    restaurantName: string;
    address: string;
    phone: string;
    taxRate: number;
    serviceChargeRate: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const Settings: mongoose.Model<ISettings, {}, {}, {}, mongoose.Document<unknown, {}, ISettings, {}, {}> & ISettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Settings;
//# sourceMappingURL=Settings.d.ts.map