import mongoose, { Document, Schema } from 'mongoose';

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

const menuItemOptionSchema = new Schema<IMenuItemOption>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, default: 0, min: 0 },
});

const menuItemOptionGroupSchema = new Schema<IMenuItemOptionGroup>({
  title: { type: String, required: true, default: 'Size' },
  required: { type: Boolean, default: true },
  options: [menuItemOptionSchema],
});

const menuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    image: {
      type: String,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    optionGroups: [menuItemOptionGroupSchema],
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
export default MenuItem;
