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
exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    openid: { type: String, required: true, unique: true },
    union_id: { type: String },
    nickname: { type: String, required: true, default: '微信用户' },
    avatar_url: { type: String, required: true, default: '' },
    phone: { type: String, required: true, default: '' },
    real_name: { type: String },
    role: { type: String, required: true, enum: ['customer', 'owner', 'staff'], default: 'customer' },
    merchant_id: { type: String, index: true },
    customer_note: { type: String },
    merchant_note: { type: String },
    visit_count: { type: Number, required: true, default: 0 },
    total_spending: { type: Number, required: true, default: 0 },
    last_visit_time: { type: Date },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
UserSchema.pre('save', function(next) {
    this.update_time = new Date();
    if (typeof next === 'function') {
        next();
    }
});
exports.UserModel = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map