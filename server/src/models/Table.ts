import mongoose, { Document, Schema } from 'mongoose';

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

const tableSchema = new Schema<ITable>(
  {
    number: {
      type: Number,
      required: [true, 'Table number is required'],
      unique: true,
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

const Table = mongoose.model<ITable>('Table', tableSchema);
export default Table;
