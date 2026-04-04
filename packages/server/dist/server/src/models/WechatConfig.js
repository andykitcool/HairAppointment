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
exports.WechatConfigModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const WechatConfigSchema = new mongoose_1.Schema({
    type: { type: String, required: true, enum: ['mp', 'service'] },
    appid: { type: String, required: true, unique: true },
    app_secret: { type: String, required: true },
    token: { type: String, default: '' },
    encoding_aes_key: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    create_time: { type: Date, default: Date.now },
    update_time: { type: Date, default: Date.now },
});
// 更新时自动更新 update_time
WechatConfigSchema.pre('save', function () {
    if (this.isModified()) {
        this.update_time = new Date();
    }
});
exports.WechatConfigModel = mongoose_1.default.model('wechat_config', WechatConfigSchema);
//# sourceMappingURL=WechatConfig.js.map