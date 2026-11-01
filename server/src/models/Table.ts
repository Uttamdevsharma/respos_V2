import mongoose, { Document, Schema } from 'mongoose';

export interface ITable extends Document {
  restaurant_id: mongoose.Types.ObjectId;
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

const tableSchema = new Schema<ITable>(
  {
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    number: {
      type: Number,
      required: [true, 'Table number is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [20, 'Capacity cannot exceed 20'],
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Hall',
    },
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

tableSchema.index({ restaurant_id: 1, number: 1 }, { unique: true });

const Table = mongoose.model<ITable>('Table', tableSchema);
export default Table;
