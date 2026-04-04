"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveMpConfig = exports.getActiveServiceConfig = exports.deleteWechatConfig = exports.updateWechatConfig = exports.createWechatConfig = exports.getWechatConfigById = exports.getWechatConfigs = void 0;
const models_1 = require("../models");
/**
 * 获取微信配置列表
 */
async function getWechatConfigs(ctx) {
    try {
        const configs = await models_1.WechatConfigModel.find().sort({ type: 1, create_time: -1 });
        ctx.body = {
            code: 0,
            message: 'ok',
            data: configs.map(c => ({
                _id: c._id,
                type: c.type,
                appid: c.appid,
                token: c.token ? '***已设置***' : '',
                encoding_aes_key: c.encoding_aes_key ? '***已设置***' : '',
                is_active: c.is_active,
                create_time: c.create_time,
                update_time: c.update_time,
            })),
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getWechatConfigs = getWechatConfigs;
/**
 * 获取单个微信配置
 */
async function getWechatConfigById(ctx) {
    try {
        const { id } = ctx.params;
        const config = await models_1.WechatConfigModel.findById(id);
        if (!config) {
            ctx.body = { code: 404, message: '配置不存在', data: null };
            return;
        }
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                _id: config._id,
                type: config.type,
                appid: config.appid,
                app_secret: config.app_secret,
                token: config.token || '',
                encoding_aes_key: config.encoding_aes_key || '',
                is_active: config.is_active,
                create_time: config.create_time,
                update_time: config.update_time,
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getWechatConfigById = getWechatConfigById;
/**
 * 创建微信配置
 */
async function createWechatConfig(ctx) {
    try {
        const { type, appid, app_secret, token, encoding_aes_key } = ctx.request.body;
        if (!type || !appid || !app_secret) {
            ctx.body = { code: 400, message: '缺少必填参数', data: null };
            return;
        }
        // 检查是否已存在
        const existing = await models_1.WechatConfigModel.findOne({ appid });
        if (existing) {
            ctx.body = { code: 400, message: '该AppID已存在', data: null };
            return;
        }
        const config = await models_1.WechatConfigModel.create({
            type,
            appid,
            app_secret,
            token: token || '',
            encoding_aes_key: encoding_aes_key || '',
            is_active: true,
        });
        ctx.body = {
            code: 0,
            message: '创建成功',
            data: {
                _id: config._id,
                type: config.type,
                appid: config.appid,
                is_active: config.is_active,
            },
        };
    }
    catch (err) {
        console.error('[createWechatConfig Error]', err);
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.createWechatConfig = createWechatConfig;
/**
 * 更新微信配置
 */
async function updateWechatConfig(ctx) {
    try {
        const { id } = ctx.params;
        const { app_secret, token, encoding_aes_key, is_active } = ctx.request.body;
        const config = await models_1.WechatConfigModel.findById(id);
        if (!config) {
            ctx.body = { code: 404, message: '配置不存在', data: null };
            return;
        }
        const updateData = {};
        if (app_secret !== undefined)
            updateData.app_secret = app_secret;
        if (token !== undefined)
            updateData.token = token;
        if (encoding_aes_key !== undefined)
            updateData.encoding_aes_key = encoding_aes_key;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        updateData.update_time = new Date();
        await models_1.WechatConfigModel.findByIdAndUpdate(id, updateData);
        ctx.body = { code: 0, message: '更新成功', data: null };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.updateWechatConfig = updateWechatConfig;
/**
 * 删除微信配置
 */
async function deleteWechatConfig(ctx) {
    try {
        const { id } = ctx.params;
        const config = await models_1.WechatConfigModel.findById(id);
        if (!config) {
            ctx.body = { code: 404, message: '配置不存在', data: null };
            return;
        }
        await models_1.WechatConfigModel.findByIdAndDelete(id);
        ctx.body = { code: 0, message: '删除成功', data: null };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.deleteWechatConfig = deleteWechatConfig;
/**
 * 获取当前激活的服务号配置（内部使用）
 */
async function getActiveServiceConfig() {
    const config = await models_1.WechatConfigModel.findOne({ type: 'service', is_active: true });
    if (!config)
        return null;
    return {
        appid: config.appid,
        app_secret: config.app_secret,
        token: config.token || '',
    };
}
exports.getActiveServiceConfig = getActiveServiceConfig;
/**
 * 获取当前激活的小程序配置（内部使用）
 */
async function getActiveMpConfig() {
    const config = await models_1.WechatConfigModel.findOne({ type: 'mp', is_active: true });
    if (!config)
        return null;
    return {
        appid: config.appid,
        app_secret: config.app_secret,
    };
}
exports.getActiveMpConfig = getActiveMpConfig;
//# sourceMappingURL=wechatConfig.js.map