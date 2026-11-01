import mongoose, { Schema } from 'mongoose';
const tableSchema = new Schema({
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
}, {
    timestamps: true,
});
tableSchema.index({ restaurant_id: 1, number: 1 }, { unique: true });
const Table = mongoose.model('Table', tableSchema);
export default Table;
//# sourceMappingURL=Table.js.map