import mongoose, { Document } from 'mongoose';
export interface IOtp extends Document {
    email: string;
    otp: string;
    verified: boolean;
    expiresAt: Date;
    createdAt: Date;
}
declare const Otp: mongoose.Model<IOtp, {}, {}, {}, mongoose.Document<unknown, {}, IOtp, {}, {}> & IOtp & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Otp;
//# sourceMappingURL=Otp.d.ts.map