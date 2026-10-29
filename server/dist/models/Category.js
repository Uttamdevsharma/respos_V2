import mongoose, { Schema } from 'mongoose';
const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
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
const Category = mongoose.model('Category', categorySchema);
export default Category;
//# sourceMappingURL=Category.js.map