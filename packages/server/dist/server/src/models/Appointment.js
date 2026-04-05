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
exports.AppointmentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AppointmentSchema = new mongoose_1.Schema({
    appointment_id: { type: String, required: true, unique: true },
    merchant_id: { type: String, required: true, index: true },
    customer_id: { type: String, index: true },
    customer_name: { type: String, required: true },
    customer_phone: { type: String },
    staff_id: { type: String, required: true, index: true },
    staff_name: { type: String, required: true },
    service_id: { type: String, required: true },
    service_name: { type: String, required: true },
    date: { type: String, required: true, index: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'pending', index: true },
    source: { type: String, required: true, enum: ['mini_program', 'coze', 'feishu', 'web'], default: 'mini_program' },
    timeline: [{
            stage_name: { type: String, required: true },
            start: { type: String, required: true },
            end: { type: String, required: true },
            staff_busy: { type: Boolean, required: true },
        }],
    actual_duration: { type: Number },
    note: { type: String },
    sequence_num: { type: Number, required: true },
    _sync_source: { type: String },
    create_time: { type: Date, default: Date.now, index: true },
    update_time: { type: Date, default: Date.now },
});
AppointmentSchema.pre('save', function(next) {
    this.update_time = new Date();
    if (typeof next === 'function') {
        next();
    }
});
// 复合索引：按商户+日期+状态查询
AppointmentSchema.index({ merchant_id: 1, date: 1, status: 1 });
AppointmentSchema.index({ merchant_id: 1, staff_id: 1, date: 1 });
exports.AppointmentModel = mongoose_1.default.model('Appointment', AppointmentSchema);
//# sourceMappingURL=Appointment.js.map