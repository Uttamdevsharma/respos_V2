import mongoose, { Schema } from 'mongoose';
const menuItemSchema = new Schema({
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
}, {
    timestamps: true,
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
//# sourceMappingURL=MenuItem.js.map