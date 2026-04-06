import mongoose, { Schema, Document } from 'mongoose'

export interface IWechatConfigDocument extends Document {
  /** 配置类型：mp-小程序，service-服务号 */
  type: 'mp' | 'service'
  /** 微信 AppID */
  appid: string
  /** 微信 AppSecret */
  app_secret: string
  /** 服务号令牌(Token) - 用于消息加解密 */
  token?: string
  /** 消息加解密密钥 */
  encoding_aes_key?: string
  /** 小程序代码上传密钥 */
  upload_key?: string
  /** 是否启用 */
  is_active: boolean
  /** 创建时间 */
  create_time: Date
  /** 更新时间 */
  update_time: Date
}

const WechatConfigSchema = new Schema<IWechatConfigDocument>({
  type: { type: String, required: true, enum: ['mp', 'service'] },
  appid: { type: String, required: true, unique: true },
  app_secret: { type: String, required: true },
  token: { type: String, default: '' },
  encoding_aes_key: { type: String, default: '' },
  upload_key: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

// 更新时自动更新 update_time
WechatConfigSchema.pre('save', function () {
  if (this.isModified()) {
    this.update_time = new Date()
  }
})

export const WechatConfigModel = mongoose.model<IWechatConfigDocument>('wechat_config', WechatConfigSchema)
