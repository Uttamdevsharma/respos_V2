import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: [
        // Platform Staff
        'SUPER_ADMIN',
        'CTO',
        'PROJECT_MANAGER',
        'SUPPORT_LEAD',
        // Restaurant Client Staff
        'OWNER',
        'admin',
        'BRANCH_MANAGER',
        'cashier',
        'waiter',
        'kitchen',
      ],
      default: 'waiter',
    },
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    branch_name: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Operations',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
