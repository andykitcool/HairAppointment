"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiveWechatMessage = exports.verifyWechatServer = void 0;
const crypto_1 = __importDefault(require("crypto"));
const wechatConfig_1 = require("./wechatConfig");
const auth_1 = require("./auth");
/**
 * 验证微信服务器签名（用于服务器配置时的验证）
 * GET /api/wechat/message
 */
async function verifyWechatServer(ctx) {
    const { signature, timestamp, nonce, echostr } = ctx.query;
    const config = await wechatConfig_1.getActiveServiceConfig();
    if (!config || !config.token) {
        ctx.body = '未配置服务号或Token';
        return;
    }
    // 验证签名
    const tmpStr = [config.token, timestamp, nonce].sort().join('');
    const hash = crypto_1.default.createHash('sha1').update(tmpStr).digest('hex');
    if (hash === signature) {
        ctx.body = echostr; // 返回echostr表示验证成功
    }
    else {
        ctx.body = '验证失败';
    }
}
exports.verifyWechatServer = verifyWechatServer;
/**
 * 接收微信消息和事件推送
 * POST /api/wechat/message
 */
async function receiveWechatMessage(ctx) {
    const { signature, timestamp, nonce } = ctx.query;
    console.log(`[WechatMessage] Received POST request:`, { signature, timestamp, nonce });
    console.log(`[WechatMessage] Raw body:`, ctx.request.body);
    
    const config = await wechatConfig_1.getActiveServiceConfig();
    console.log(`[WechatMessage] Config:`, config ? { hasToken: !!config.token, appid: config.appid } : null);
    
    if (!config || !config.token) {
        console.log('[WechatMessage] No config or token, returning success');
        ctx.body = 'success'; // 微信要求返回success
        return;
    }
    // 验证签名
    const tmpStr = [config.token, timestamp, nonce].sort().join('');
    const hash = crypto_1.default.createHash('sha1').update(tmpStr).digest('hex');
    console.log(`[WechatMessage] Signature check: received=${signature}, calculated=${hash}`);
    
    if (hash !== signature) {
        console.log('[WechatMessage] Signature mismatch, returning success');
        ctx.body = 'success';
        return;
    }
    // 解析XML消息体
    const xmlBody = ctx.request.body;
    if (!xmlBody) {
        console.log('[WechatMessage] No body, returning success');
        ctx.body = 'success';
        return;
    }
    try {
        // 简单解析XML（生产环境建议使用xml2js库）
        const msgType = getXmlValue(xmlBody, 'MsgType');
        const fromUser = getXmlValue(xmlBody, 'FromUserName');
        const event = getXmlValue(xmlBody, 'Event');
        const eventKey = getXmlValue(xmlBody, 'EventKey');
        console.log(`[WechatMessage] Type: ${msgType}, Event: ${event}, From: ${fromUser}, Key: ${eventKey}`);
        // 处理扫码事件
        if (msgType === 'event' && (event === 'SCAN' || event === 'subscribe')) {
            // EventKey 格式为: qrscene_scene值 或 scene值
            let scene = eventKey;
            if (event === 'subscribe' && scene.startsWith('qrscene_')) {
                scene = scene.substring(8); // 去掉 qrscene_ 前缀
            }
            if (scene && scene.startsWith('login_')) {
                // 这是登录扫码
                const result = await auth_1.handleWechatScanEvent(scene, fromUser);
                console.log(`[WechatScan] Login result:`, result);
            }
            else if (scene && scene.startsWith('bind_')) {
                // 这是绑定扫码
                const result = await auth_1.handleWechatBindEvent(scene, fromUser);
                console.log(`[WechatScan] Bind result:`, result);
            }
        }
        ctx.body = 'success';
    }
    catch (err) {
        console.error('[WechatMessage] Error:', err);
        ctx.body = 'success'; // 即使出错也返回success，避免微信重试
    }
}
exports.receiveWechatMessage = receiveWechatMessage;
/**
 * 从XML中提取值（简单实现）
 */
function getXmlValue(xml, tag) {
    const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>|<${tag}>(.*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? (match[1] || match[2] || '') : '';
}
//# sourceMappingURL=wechatMessage.js.map