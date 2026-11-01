import mongoose, { Schema } from 'mongoose';
const menuItemOptionSchema = new Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0, min: 0 },
});
const menuItemOptionGroupSchema = new Schema({
    title: { type: String, required: true, default: 'Size' },
    required: { type: Boolean, default: true },
    options: [menuItemOptionSchema],
});
const menuItemSchema = new Schema({
    restaurant_id: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
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
}, {
    timestamps: true,
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
export default MenuItem;
//# sourceMappingURL=MenuItem.js.map