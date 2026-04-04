import mongoose, { Document } from 'mongoose';
export interface IWechatConfigDocument extends Document {
    /** 配置类型：mp-小程序，service-服务号 */
    type: 'mp' | 'service';
    /** 微信 AppID */
    appid: string;
    /** 微信 AppSecret */
    app_secret: string;
    /** 服务号令牌(Token) - 用于消息加解密 */
    token?: string;
    /** 消息加解密密钥 */
    encoding_aes_key?: string;
    /** 是否启用 */
    is_active: boolean;
    /** 创建时间 */
    create_time: Date;
    /** 更新时间 */
    update_time: Date;
}
export declare const WechatConfigModel: mongoose.Model<IWechatConfigDocument, {}, {}, {}, mongoose.Document<unknown, {}, IWechatConfigDocument, {}, {}> & IWechatConfigDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=WechatConfig.d.ts.map