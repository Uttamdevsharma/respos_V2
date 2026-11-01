import mongoose, { Schema } from 'mongoose';
const categorySchema = new Schema({
    restaurant_id: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
categorySchema.index({ restaurant_id: 1, name: 1 }, { unique: true });
const Category = mongoose.model('Category', categorySchema);
export default Category;
//# sourceMappingURL=Category.js.map