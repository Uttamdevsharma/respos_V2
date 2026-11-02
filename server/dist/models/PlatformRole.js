import mongoose, { Schema } from 'mongoose';
const platformRoleSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    permissions: {
        type: [String],
        default: [],
    },
    is_system: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
const PlatformRoleModel = mongoose.model('PlatformRole', platformRoleSchema);
export default PlatformRoleModel;
//# sourceMappingURL=PlatformRole.js.map