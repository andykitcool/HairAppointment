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
exports.AdminModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AdminSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    real_name: { type: String, required: true },
    phone: { type: String, default: '' },
    wx_openid: { type: String, default: '' },
    wx_unionid: { type: String, default: '' },
    is_active: { type: Boolean, required: true, default: true },
    role: { type: String, required: true, enum: ['super_admin', 'owner'], default: 'owner' },
    merchant_id: { type: String, index: true },
    type: { type: String, required: true, enum: ['system', 'merchant'], default: 'merchant' },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
AdminSchema.pre('save', function(next) {
    this.update_time = new Date();
    if (typeof next === 'function') {
        next();
    }
});
exports.AdminModel = mongoose_1.default.model('Admin', AdminSchema);
//# sourceMappingURL=Admin.js.map