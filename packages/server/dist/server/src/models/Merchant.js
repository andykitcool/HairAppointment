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
exports.MerchantModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MerchantSchema = new mongoose_1.Schema({
    merchant_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    business_hours: {
        start: { type: String, required: true, default: '09:00' },
        end: { type: String, required: true, default: '21:00' },
    },
    status: { type: String, required: true, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
    description: { type: String },
    cover_image: { type: String },
    owner_id: { type: String, required: true },
    daily_counter: { type: Number, required: true, default: 0 },
    counter_date: { type: String, required: true, default: '' },
    extended_hours: [{
            start_date: String,
            end_date: String,
            extended_end: String,
        }],
    coze_config: {
        bot_id: String,
        api_key: String,
        api_endpoint: String,
    },
    feishu_config: {
        app_id: String,
        app_secret: String,
        table_tokens: { type: Map, of: String },
    },
    notify_config: {
        channel: { type: String, default: 'wechat_subscribe' },
        sms_config: {
            provider: String,
            access_key_id: String,
            access_key_secret: String,
            sign_name: String,
            template_code: String,
        },
        wechat_template_ids: { type: Map, of: String },
    },
    sync_config: {
        enabled: { type: Boolean, default: true },
        bindings: [{
                collection: String,
                table_token: String,
                enabled: { type: Boolean, default: true },
            }],
    },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
MerchantSchema.pre('save', function (next) {
    this.update_time = new Date();
    next();
});
exports.MerchantModel = mongoose_1.default.model('Merchant', MerchantSchema);
//# sourceMappingURL=Merchant.js.map