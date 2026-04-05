"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ServiceSchema = new mongoose_1.Schema({
    service_id: { type: String, required: true, unique: true },
    merchant_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, enum: ['cut', 'perm', 'dye', 'care'] },
    price: { type: Number, required: true },
    total_duration: { type: Number, required: true },
    staff_busy_duration: { type: Number, required: true },
    stages: [{
            name: { type: String, required: true },
            duration: { type: Number, required: true },
            staff_busy: { type: Boolean, required: true },
        }],
    description: { type: String },
    is_active: { type: Boolean, required: true, default: true },
    sort_order: { type: Number, required: true, default: 0 },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
ServiceSchema.pre('save', function(next) {
    this.update_time = new Date();
    if (typeof next === 'function') {
        next();
    }
});
ServiceSchema.index({ merchant_id: 1, is_active: 1, sort_order: 1 });
exports.ServiceModel = mongoose_1.default.model('Service', ServiceSchema);
//# sourceMappingURL=Service.js.map