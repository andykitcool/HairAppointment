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
exports.ShopClosedPeriodModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ShopClosedPeriodSchema = new mongoose_1.Schema({
    merchant_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['full_day', 'time_range'] },
    start_time: { type: String },
    end_time: { type: String },
    reason: { type: String },
    cancel_appointments: { type: Boolean, default: false },
    notify_customers: { type: Boolean, default: false },
    created_by: { type: String, required: true },
    create_time: { type: Date, default: Date.now },
});
ShopClosedPeriodSchema.index({ merchant_id: 1, date: 1 });
exports.ShopClosedPeriodModel = mongoose_1.default.model('ShopClosedPeriod', ShopClosedPeriodSchema);
//# sourceMappingURL=ShopClosedPeriod.js.map