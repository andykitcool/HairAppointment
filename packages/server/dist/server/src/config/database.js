"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_js_1 = require("./index.js");
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(index_js_1.config.mongodbUri);
        console.log('✅ MongoDB connected');
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.js.map