"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = exports.connectRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const index_js_1 = require("./index.js");
let redis = null;
async function connectRedis() {
    redis = new ioredis_1.default({
        host: index_js_1.config.redis.host,
        port: index_js_1.config.redis.port,
        password: index_js_1.config.redis.password,
        retryStrategy: (times) => Math.min(times * 200, 5000)
    });
    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => console.error('❌ Redis error:', err));
    return redis;
}
exports.connectRedis = connectRedis;
function getRedis() {
    if (!redis)
        throw new Error('Redis not initialized');
    return redis;
}
exports.getRedis = getRedis;
//# sourceMappingURL=redis.js.map