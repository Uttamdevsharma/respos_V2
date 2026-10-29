import mongoose, { Schema } from 'mongoose';
const expenseSchema = new Schema({
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
}, {
    timestamps: true,
});
export default mongoose.model('Expense', expenseSchema);
//# sourceMappingURL=Expense.js.map