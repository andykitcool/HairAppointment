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
exports.StaffModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StaffSchema = new mongoose_1.Schema({
    staff_id: { type: String, required: true, unique: true },
    merchant_id: { type: String, required: true, index: true },
    user_id: { type: String },
    name: { type: String, required: true },
    title: { type: String },
    avatar_url: { type: String },
    phone: { type: String },
    service_ids: [{ type: String }],
    is_active: { type: Boolean, required: true, default: true },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
StaffSchema.pre('save', function (next) {
    this.update_time = new Date();
    next();
});
exports.StaffModel = mongoose_1.default.model('Staff', StaffSchema);
//# sourceMappingURL=Staff.js.map