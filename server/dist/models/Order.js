import mongoose, { Schema } from 'mongoose';
const orderItemSchema = new Schema({
    menuItem: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    notes: {
        type: String,
        trim: true,
    },
    isAddon: {
        type: Boolean,
        default: false,
    },
    addonBatch: {
        type: Number,
        default: 0,
    },
}, { _id: false });
const partialPaymentSchema = new Schema({
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
    note: { type: String, trim: true },
    paidAt: { type: Date, default: () => new Date() },
}, { _id: false });
const orderSchema = new Schema({
    restaurant_id: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
    token: {
        type: String,
        required: true,
    },
    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        required: false,
        default: null,
    },
    waiter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Waiter is required'],
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (v) => v.length > 0,
            message: 'Order must have at least one item',
        },
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served', 'billing', 'paid', 'completed', 'cancelled'],
        default: 'pending',
    },
    orderType: {
        type: String,
        enum: ['dine_in', 'takeaway', 'foodpanda', 'pathao', 'foodi', 'delivery'],
        default: 'dine_in',
    },
    subtotal: {
        type: Number,
        required: true,
        default: 0,
    },
    tax: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    serviceCharge: {
        type: Number,
        default: 0,
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0,
    },
    seatsOccupied: {
        type: Number,
        min: [0, 'Occupied seats cannot be negative'],
        default: 0,
    },
    latestAddonBatch: {
        type: Number,
        default: 0,
    },
    // Partial payment ledger
    partialPayments: {
        type: [partialPaymentSchema],
        default: [],
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    amountDue: {
        type: Number,
        default: 0,
    },
    // Split (multi-method single-transaction) payment ledger
    splitPayments: {
        type: [{
                paymentMethod: { type: String, enum: ['cash', 'card', 'mobile'], required: true },
                amount: { type: Number, required: true, min: 0.01 },
                note: { type: String, trim: true },
            }],
        default: [],
    },
    // Final payment settlement
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'mobile'],
    },
    paidAmount: {
        type: Number,
    },
    returnAmount: {
        type: Number,
    },
    paidAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Index for efficient querying
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ table: 1, status: 1 });
orderSchema.index({ waiter: 1, status: 1 });
const Order = mongoose.model('Order', orderSchema);
export default Order;
//# sourceMappingURL=Order.js.map