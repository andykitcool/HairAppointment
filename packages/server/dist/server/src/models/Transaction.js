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
exports.TransactionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TransactionSchema = new mongoose_1.Schema({
    transaction_id: { type: String, required: true, unique: true },
    merchant_id: { type: String, required: true, index: true },
    appointment_id: { type: String, index: true },
    customer_id: { type: String },
    customer_name: { type: String, required: true },
    staff_id: { type: String, required: true },
    staff_name: { type: String, required: true },
    total_amount: { type: Number, required: true },
    items: [{
            service_name: { type: String, required: true },
            amount: { type: Number, required: true },
            quantity: { type: Number, required: true, default: 1 },
        }],
    payment_method: { type: String, required: true, enum: ['wechat', 'alipay', 'cash', 'stored_value', 'punch_card', 'other'] },
    source: { type: String, required: true, enum: ['coze', 'feishu', 'mini_program', 'web'], default: 'mini_program' },
    note: { type: String },
    transaction_date: { type: String, required: true, index: true },
    _sync_source: { type: String },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
TransactionSchema.pre('save', function (next) {
    this.update_time = new Date();
    next();
});
TransactionSchema.index({ merchant_id: 1, transaction_date: 1 });
exports.TransactionModel = mongoose_1.default.model('Transaction', TransactionSchema);
//# sourceMappingURL=Transaction.js.map