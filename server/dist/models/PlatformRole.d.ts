import mongoose, { Document } from 'mongoose';
export interface IPlatformRole extends Document {
    name: string;
    description: string;
    permissions: string[];
    is_system: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const PlatformRoleModel: mongoose.Model<IPlatformRole, {}, {}, {}, mongoose.Document<unknown, {}, IPlatformRole, {}, {}> & IPlatformRole & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default PlatformRoleModel;
//# sourceMappingURL=PlatformRole.d.ts.map