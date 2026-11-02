import mongoose, { Document, Schema } from 'mongoose';

export interface IPlatformRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const platformRoleSchema = new Schema<IPlatformRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
    },
    is_system: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const PlatformRoleModel = mongoose.model<IPlatformRole>('PlatformRole', platformRoleSchema);
export default PlatformRoleModel;

