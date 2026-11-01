import mongoose, { Schema, Document } from 'mongoose';

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

const expenseSchema = new Schema<IExpense>(
  {
    restaurant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'other',
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IExpense>('Expense', expenseSchema);
