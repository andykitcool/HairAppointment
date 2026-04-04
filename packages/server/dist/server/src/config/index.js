"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT) || 3000,
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    jwtExpireIn: '7d',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hair_appointment',
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    },
    wechat: {
        appid: process.env.WX_APPID || '',
        appsecret: process.env.WX_APPSECRET || ''
    }
};
//# sourceMappingURL=index.js.map