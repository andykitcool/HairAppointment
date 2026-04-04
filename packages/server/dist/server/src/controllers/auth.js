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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindAdminWechat = exports.handleWechatScanEvent = exports.checkLoginStatus = exports.getWechatLoginQR = exports.getAdminProfile = exports.bindAdminPhone = exports.changeAdminPassword = exports.getAdminInfo = exports.updateProfile = exports.getProfile = exports.applyOwner = exports.adminLogin = exports.getPhone = exports.wechatLogin = void 0;
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const index_1 = require("../../../shared/src/index");
const axios_1 = __importDefault(require("axios"));
/**
 * 微信登录
 */
async function wechatLogin(ctx) {
    const { code } = ctx.request.body;
    if (!code) {
        ctx.body = { code: 400, message: '缺少 code', data: null };
        return;
    }
    try {
        // 通过 code 换取 openid
        const wxRes = await axios_1.default.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: process.env.WX_APPID,
                secret: process.env.WX_APP_SECRET,
                js_code: code,
                grant_type: 'authorization_code',
            },
        });
        const { openid, session_key, unionid } = wxRes.data;
        if (!openid) {
            ctx.body = { code: 400, message: '微信登录失败', data: wxRes.data };
            return;
        }
        // 查找或创建用户
        let user = await models_1.UserModel.findOne({ openid });
        if (!user) {
            user = await models_1.UserModel.create({
                openid,
                union_id: unionid,
                nickname: '微信用户',
                avatar_url: '',
                phone: '',
                role: 'customer',
            });
        }
        // 生成 JWT
        const token = auth_1.signJwt({
            user_id: user._id.toString(),
            openid: user.openid,
            role: user.role,
            merchant_id: user.merchant_id,
        });
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                token,
                user: {
                    _id: user._id,
                    openid: user.openid,
                    nickname: user.nickname,
                    avatar_url: user.avatar_url,
                    phone: user.phone,
                    role: user.role,
                    merchant_id: user.merchant_id,
                },
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.wechatLogin = wechatLogin;
/**
 * 获取手机号
 */
async function getPhone(ctx) {
    const { code } = ctx.request.body;
    if (!code) {
        ctx.body = { code: 400, message: '缺少 code', data: null };
        return;
    }
    try {
        // 获取微信 access_token
        const tokenRes = await axios_1.default.get('https://api.weixin.qq.com/cgi-bin/token', {
            params: {
                grant_type: 'client_credential',
                appid: process.env.WX_APPID,
                secret: process.env.WX_APP_SECRET,
            },
        });
        const accessToken = tokenRes.data.access_token;
        const phoneRes = await axios_1.default.post(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`, { code });
        const phoneInfo = phoneRes.data.phone_info;
        if (!phoneInfo) {
            ctx.body = { code: 400, message: '获取手机号失败', data: phoneRes.data };
            return;
        }
        // 更新用户手机号
        const userId = ctx.state.user._id;
        await models_1.UserModel.findByIdAndUpdate(userId, { phone: phoneInfo.phoneNumber });
        ctx.body = { code: 0, message: 'ok', data: { phone: phoneInfo.phoneNumber } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getPhone = getPhone;
/**
 * Web 后台登录（超管/店长）
 */
async function adminLogin(ctx) {
    const { username, password } = ctx.request.body;
    if (!username || !password) {
        ctx.body = { code: 400, message: '缺少用户名或密码', data: null };
        return;
    }
    try {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        // 查找账号
        const admin = await AdminModel.findOne({ username, is_active: true });
        if (!admin) {
            ctx.body = { code: 404, message: '账号不存在', data: null };
            return;
        }
        // 验证密码
        const valid = await bcrypt.compare(password, admin.password_hash);
        if (!valid) {
            ctx.body = { code: 400, message: '密码错误', data: null };
            return;
        }
        // 使用数据库中的真实角色
        const adminRole = admin.role || 'owner';
        // 生成 JWT Token
        const token = auth_1.signJwt({
            user_id: admin._id.toString(),
            role: adminRole,
            type: 'admin',
        });
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                token,
                role: adminRole,
                real_name: admin.real_name,
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.adminLogin = adminLogin;
/**
 * 申请成为店长
 */
async function applyOwner(ctx) {
    const { shop_name, phone, address, description } = ctx.request.body;
    const userId = ctx.state.user._id;
    if (!shop_name || !phone) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    try {
        // 检查是否已申请或已是店长
        const existingMerchant = await models_1.MerchantModel.findOne({ owner_id: userId.toString() });
        if (existingMerchant) {
            ctx.body = { code: 400, message: '已有申请或已是店长', data: null };
            return;
        }
        // 创建待审核商户
        const merchant = await models_1.MerchantModel.create({
            merchant_id: index_1.generateShortId('M'),
            name: shop_name,
            phone,
            address,
            description,
            status: 'pending',
            owner_id: userId.toString(),
            business_hours: { start: '09:00', end: '21:00' },
            daily_counter: 0,
            counter_date: '',
        });
        ctx.body = { code: 0, message: '申请已提交，等待审核', data: { merchant_id: merchant.merchant_id } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.applyOwner = applyOwner;
/**
 * 获取当前用户信息
 */
async function getProfile(ctx) {
    const userId = ctx.state.user._id;
    const user = await models_1.UserModel.findById(userId);
    if (!user) {
        ctx.body = { code: 404, message: '用户不存在', data: null };
        return;
    }
    ctx.body = {
        code: 0,
        message: 'ok',
        data: {
            _id: user._id,
            openid: user.openid,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            phone: user.phone,
            real_name: user.real_name,
            role: user.role,
            merchant_id: user.merchant_id,
            customer_note: user.customer_note,
            merchant_note: user.merchant_note,
            visit_count: user.visit_count,
            total_spending: user.total_spending,
            last_visit_time: user.last_visit_time,
        },
    };
}
exports.getProfile = getProfile;
/**
 * 更新用户信息
 */
async function updateProfile(ctx) {
    const userId = ctx.state.user._id;
    const { nickname, avatar_url, real_name, customer_note } = ctx.request.body;
    const updateData = {};
    if (nickname !== undefined)
        updateData.nickname = nickname;
    if (avatar_url !== undefined)
        updateData.avatar_url = avatar_url;
    if (real_name !== undefined)
        updateData.real_name = real_name;
    if (customer_note !== undefined)
        updateData.customer_note = customer_note;
    await models_1.UserModel.findByIdAndUpdate(userId, updateData);
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateProfile = updateProfile;
/**
 * 获取店长的管理信息（商户信息+员工列表）
 */
async function getAdminInfo(ctx) {
    const { merchant_id } = ctx.state.user;
    if (!merchant_id) {
        ctx.body = { code: 400, message: '您不是店长', data: null };
        return;
    }
    const merchant = await models_1.MerchantModel.findOne({ merchant_id });
    const staff = await models_1.StaffModel.find({ merchant_id, is_active: true });
    const services = await models_1.ServiceModel.find({ merchant_id, is_active: true }).sort({ sort_order: 1 });
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { merchant, staff, services },
    };
}
exports.getAdminInfo = getAdminInfo;
/**
 * 管理员修改密码
 */
async function changeAdminPassword(ctx) {
    const { old_password, new_password } = ctx.request.body;
    if (!old_password || !new_password) {
        ctx.body = { code: 400, message: '缺少旧密码或新密码', data: null };
        return;
    }
    if (new_password.length < 6) {
        ctx.body = { code: 400, message: '新密码长度不能少于6位', data: null };
        return;
    }
    try {
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        // 获取当前管理员ID
        const adminId = ctx.state.user._id;
        const admin = await AdminModel.findById(adminId);
        if (!admin) {
            ctx.body = { code: 404, message: '管理员不存在', data: null };
            return;
        }
        // 验证旧密码
        const valid = await bcrypt.compare(old_password, admin.password_hash);
        if (!valid) {
            ctx.body = { code: 400, message: '旧密码错误', data: null };
            return;
        }
        // 更新密码
        const newHash = await bcrypt.hash(new_password, 10);
        await AdminModel.findByIdAndUpdate(adminId, { password_hash: newHash });
        ctx.body = { code: 0, message: '密码修改成功', data: null };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.changeAdminPassword = changeAdminPassword;
/**
 * 管理员绑定手机号
 */
async function bindAdminPhone(ctx) {
    const { phone, code } = ctx.request.body;
    if (!phone || !code) {
        ctx.body = { code: 400, message: '缺少手机号或验证码', data: null };
        return;
    }
    // 简单的手机号格式校验
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        ctx.body = { code: 400, message: '手机号格式不正确', data: null };
        return;
    }
    // TODO: 校验验证码（这里简化处理，实际应该调用短信服务验证）
    // 暂时允许任意6位数字验证码通过
    if (!/^\d{6}$/.test(code)) {
        ctx.body = { code: 400, message: '验证码格式错误', data: null };
        return;
    }
    try {
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const adminId = ctx.state.user._id;
        // 检查手机号是否已被其他管理员绑定
        const existing = await AdminModel.findOne({ phone, _id: { $ne: adminId } });
        if (existing) {
            ctx.body = { code: 400, message: '该手机号已被其他账号绑定', data: null };
            return;
        }
        await AdminModel.findByIdAndUpdate(adminId, { phone });
        ctx.body = { code: 0, message: '手机号绑定成功', data: { phone } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.bindAdminPhone = bindAdminPhone;
/**
 * 获取当前管理员信息
 */
async function getAdminProfile(ctx) {
    try {
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const adminId = ctx.state.user._id;
        const admin = await AdminModel.findById(adminId);
        if (!admin) {
            ctx.body = { code: 404, message: '管理员不存在', data: null };
            return;
        }
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                _id: admin._id,
                username: admin.username,
                real_name: admin.real_name,
                phone: admin.phone || '',
                wx_openid: admin.wx_openid || '',
                is_active: admin.is_active,
                create_time: admin.create_time,
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getAdminProfile = getAdminProfile;
const wechatConfig_1 = require("./wechatConfig");
// 内存存储扫码登录状态（生产环境建议使用Redis）
const loginQRStore = new Map();
// 内存存储扫码绑定状态
const bindQRStore = new Map();
// 清理过期的二维码（每5分钟执行一次）
setInterval(() => {
    const now = Date.now();
    for (const [scene, data] of loginQRStore.entries()) {
        if (now - data.create_time > 300000) { // 5分钟过期
            loginQRStore.delete(scene);
        }
    }
    for (const [scene, data] of bindQRStore.entries()) {
        if (now - data.create_time > 300000) { // 5分钟过期
            bindQRStore.delete(scene);
        }
    }
}, 300000);
/**
 * 生成微信扫码登录二维码（服务号带参数二维码）
 */
async function getWechatLoginQR(ctx) {
    try {
        // 获取服务号配置
        const config = await wechatConfig_1.getActiveServiceConfig();
        if (!config) {
            ctx.body = { code: 500, message: '未配置服务号，请先前往系统设置配置', data: null };
            return;
        }
        // 生成一个随机的scene值用于标识本次登录请求
        const scene = `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        // 获取微信access_token
        console.log('[WechatLoginQR] Getting access_token with appid:', config.appid);
        const tokenRes = await axios_1.default.get('https://api.weixin.qq.com/cgi-bin/token', {
            params: {
                grant_type: 'client_credential',
                appid: config.appid,
                secret: config.app_secret,
            },
        });
        console.log('[WechatLoginQR] Token response:', tokenRes.data);
        const accessToken = tokenRes.data.access_token;
        if (!accessToken) {
            const errCode = tokenRes.data.errcode;
            const errMsg = tokenRes.data.errmsg || '';
            console.error('[WechatLoginQR] Failed to get access_token:', { errCode, errMsg });
            if (errCode === -40164 || errMsg.includes('ip')) {
                ctx.body = { code: 500, message: '获取access_token失败：服务器IP未在微信后台白名单中，请在微信服务号后台添加服务器IP', data: tokenRes.data };
            } else if (errCode === 40013 || errMsg.includes('appid') || errMsg.includes('invalid')) {
                ctx.body = { code: 500, message: '获取access_token失败：AppID或AppSecret不正确', data: tokenRes.data };
            } else {
                ctx.body = { code: 500, message: `获取access_token失败：${errMsg || '请检查微信配置'}`, data: tokenRes.data };
            }
            return;
        }
        // 创建临时二维码（服务号接口）
        const qrRes = await axios_1.default.post(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`, {
            expire_seconds: 300,
            action_name: 'QR_STR_SCENE',
            action_info: {
                scene: {
                    scene_str: scene,
                },
            },
        });
        if (qrRes.data.errcode) {
            ctx.body = { code: 500, message: qrRes.data.errmsg || '生成二维码失败', data: qrRes.data };
            return;
        }
        const { ticket, expire_seconds, url } = qrRes.data;
        // 存储登录状态
        loginQRStore.set(scene, {
            status: 'pending',
            create_time: Date.now(),
        });
        // 返回二维码URL（微信二维码图片地址）
        const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                scene,
                qr_code: qrCodeUrl,
                qr_url: url,
                expire_seconds,
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getWechatLoginQR = getWechatLoginQR;
/**
 * 查询扫码登录状态（前端轮询使用）
 */
async function checkLoginStatus(ctx) {
    const { scene } = ctx.query;
    if (!scene) {
        ctx.body = { code: 400, message: '缺少scene参数', data: null };
        return;
    }
    const loginData = loginQRStore.get(scene);
    if (!loginData) {
        ctx.body = { code: 404, message: '二维码已过期或不存在', data: { status: 'expired' } };
        return;
    }
    // 检查是否过期
    if (Date.now() - loginData.create_time > 300000) {
        loginQRStore.delete(scene);
        ctx.body = { code: 404, message: '二维码已过期', data: { status: 'expired' } };
        return;
    }
    ctx.body = {
        code: 0,
        message: 'ok',
        data: {
            status: loginData.status,
            ...(loginData.status === 'success' && {
                token: loginData.token,
                role: loginData.role,
                real_name: loginData.real_name,
            }),
        },
    };
    // 如果登录成功，清除该记录
    if (loginData.status === 'success') {
        loginQRStore.delete(scene);
    }
}
exports.checkLoginStatus = checkLoginStatus;
/**
 * 生成微信绑定二维码（服务号带参数二维码）
 */
async function getWechatBindQR(ctx) {
    try {
        // 获取当前管理员ID
        const adminId = ctx.state.user._id;
        if (!adminId) {
            ctx.body = { code: 401, message: '未登录', data: null };
            return;
        }
        // 获取服务号配置
        const config = await wechatConfig_1.getActiveServiceConfig();
        if (!config) {
            ctx.body = { code: 500, message: '未配置服务号，请先前往系统设置-微信配置中添加并激活服务号', data: null };
            return;
        }
        // 生成scene值，包含管理员ID
        const scene = `bind_${adminId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        // 获取微信access_token
        const tokenRes = await axios_1.default.get('https://api.weixin.qq.com/cgi-bin/token', {
            params: {
                grant_type: 'client_credential',
                appid: config.appid,
                secret: config.app_secret,
            },
        });
        const accessToken = tokenRes.data.access_token;
        if (!accessToken) {
            const errCode = tokenRes.data.errcode;
            const errMsg = tokenRes.data.errmsg || '';
            if (errCode === -40164 || errMsg.includes('ip')) {
                ctx.body = { code: 500, message: '获取access_token失败：服务器IP未在微信后台白名单中', data: tokenRes.data };
            } else if (errCode === 40013 || errMsg.includes('appid') || errMsg.includes('invalid')) {
                ctx.body = { code: 500, message: '获取access_token失败：AppID或AppSecret不正确', data: tokenRes.data };
            } else {
                ctx.body = { code: 500, message: `获取access_token失败：${errMsg || '请检查微信配置'}`, data: tokenRes.data };
            }
            return;
        }
        // 创建临时二维码
        const qrRes = await axios_1.default.post(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`, {
            expire_seconds: 300,
            action_name: 'QR_STR_SCENE',
            action_info: {
                scene: { scene_str: scene },
            },
        });
        if (qrRes.data.errcode) {
            ctx.body = { code: 500, message: qrRes.data.errmsg || '生成二维码失败', data: qrRes.data };
            return;
        }
        const { ticket, expire_seconds, url } = qrRes.data;
        // 存储绑定状态
        bindQRStore.set(scene, {
            status: 'pending',
            admin_id: adminId,
            create_time: Date.now(),
        });
        const qrCodeUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(ticket)}`;
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                scene,
                qr_code: qrCodeUrl,
                qr_url: url,
                expire_seconds,
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getWechatBindQR = getWechatBindQR;
/**
 * 查询扫码绑定状态
 */
async function checkBindStatus(ctx) {
    const { scene } = ctx.query;
    if (!scene) {
        ctx.body = { code: 400, message: '缺少scene参数', data: null };
        return;
    }
    const bindData = bindQRStore.get(scene);
    if (!bindData) {
        ctx.body = { code: 404, message: '二维码已过期或不存在', data: { status: 'expired' } };
        return;
    }
    // 检查是否过期
    if (Date.now() - bindData.create_time > 300000) {
        bindQRStore.delete(scene);
        ctx.body = { code: 404, message: '二维码已过期', data: { status: 'expired' } };
        return;
    }
    ctx.body = {
        code: 0,
        message: 'ok',
        data: {
            status: bindData.status,
            message: bindData.message,
        },
    };
    // 如果绑定成功或失败，清除该记录
    if (bindData.status === 'success' || bindData.status === 'expired') {
        bindQRStore.delete(scene);
    }
}
exports.checkBindStatus = checkBindStatus;
/**
 * 处理微信扫码绑定事件（由服务号消息推送触发）
 */
async function handleWechatBindEvent(scene, openid) {
    try {
        const bindData = bindQRStore.get(scene);
        if (!bindData) {
            console.log(`[WechatBind] Scene ${scene} not found or expired`);
            return { success: false, message: '二维码已过期' };
        }
        // 更新状态为已扫描
        bindData.status = 'scanned';
        bindData.openid = openid;
        bindQRStore.set(scene, bindData);
        // 检查该微信是否已被其他管理员绑定
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const existing = await AdminModel.findOne({ wx_openid: openid, _id: { $ne: bindData.admin_id } });
        if (existing) {
            bindData.status = 'expired';
            bindData.message = '该微信已被其他账号绑定';
            bindQRStore.set(scene, bindData);
            return { success: false, message: '该微信已被其他账号绑定' };
        }
        // 绑定微信到管理员账号
        await AdminModel.findByIdAndUpdate(bindData.admin_id, {
            wx_openid: openid,
        });
        // 更新状态为成功
        bindData.status = 'success';
        bindData.message = '绑定成功';
        bindQRStore.set(scene, bindData);
        console.log(`[WechatBind] Admin ${bindData.admin_id} bound with openid ${openid}`);
        return { success: true, message: '绑定成功' };
    }
    catch (err) {
        console.error('[WechatBind] Error:', err);
        return { success: false, message: err.message };
    }
}
exports.handleWechatBindEvent = handleWechatBindEvent;
/**
 * 微信扫码登录回调（由服务号消息推送触发）
 * 这是内部方法，由微信消息接收接口调用
 */
async function handleWechatScanEvent(scene, openid) {
    try {
        const loginData = loginQRStore.get(scene);
        if (!loginData) {
            console.log(`[WechatScan] Scene ${scene} not found or expired`);
            return { success: false, message: '二维码已过期' };
        }
        // 更新状态为已扫描
        loginData.status = 'scanned';
        loginData.openid = openid;
        loginQRStore.set(scene, loginData);
        // 查找是否已有管理员绑定此微信号
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const admin = await AdminModel.findOne({ wx_openid: openid });
        if (!admin) {
            // 没有绑定账号，标记为失败
            loginData.status = 'expired';
            loginQRStore.set(scene, loginData);
            return { success: false, message: '该微信未绑定任何管理员账号' };
        }
        if (!admin.is_active) {
            loginData.status = 'expired';
            loginQRStore.set(scene, loginData);
            return { success: false, message: '账号已被禁用' };
        }
        // 使用数据库中的真实角色
        const adminRole = admin.role || 'owner';
        // 生成JWT Token
        const token = auth_1.signJwt({
            user_id: admin._id.toString(),
            role: adminRole,
            type: 'admin',
        });
        // 更新状态为成功
        loginData.status = 'success';
        loginData.token = token;
        loginData.role = adminRole;
        loginData.real_name = admin.real_name || '';
        loginQRStore.set(scene, loginData);
        return { success: true, message: '登录成功' };
    }
    catch (err) {
        console.error('[WechatScan] Error:', err);
        return { success: false, message: err.message };
    }
}
exports.handleWechatScanEvent = handleWechatScanEvent;
/**
 * 管理员绑定微信号
 */
async function bindAdminWechat(ctx) {
    const { code } = ctx.request.body;
    if (!code) {
        ctx.body = { code: 400, message: '缺少code', data: null };
        return;
    }
    try {
        // 通过code换取openid
        const wxRes = await axios_1.default.get('https://api.weixin.qq.com/sns/jscode2session', {
            params: {
                appid: process.env.WX_APPID,
                secret: process.env.WX_APP_SECRET,
                js_code: code,
                grant_type: 'authorization_code',
            },
        });
        const { openid, unionid } = wxRes.data;
        if (!openid) {
            ctx.body = { code: 400, message: '微信绑定失败', data: wxRes.data };
            return;
        }
        const { AdminModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const adminId = ctx.state.user._id;
        // 检查该微信是否已被其他管理员绑定
        const existing = await AdminModel.findOne({ wx_openid: openid, _id: { $ne: adminId } });
        if (existing) {
            ctx.body = { code: 400, message: '该微信已被其他账号绑定', data: null };
            return;
        }
        await AdminModel.findByIdAndUpdate(adminId, {
            wx_openid: openid,
            ...(unionid && { wx_unionid: unionid })
        });
        ctx.body = { code: 0, message: '微信绑定成功', data: { openid } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.bindAdminWechat = bindAdminWechat;
//# sourceMappingURL=auth.js.map