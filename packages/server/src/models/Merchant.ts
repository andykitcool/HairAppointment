import mongoose, { Schema, Document } from 'mongoose'

export interface IMerchantDocument extends Document {
  merchant_id: string
  name: string
  address?: string
  phone: string
  business_hours: { start: string; end: string }
  // status 扩展: pending(待审核) | applying(申请中) | active(正常) | inactive(暂停) | rejected(已拒绝)
  status: 'pending' | 'applying' | 'active' | 'inactive' | 'rejected'
  description?: string
  cover_image?: string
  owner_id: string
  daily_counter: number
  counter_date: string
  extended_hours?: Array<{
    start_date: string
    end_date: string
    extended_end: string
  }>
  // 新增：入驻申请信息
  application_info?: {
    applicant_name: string
    applicant_phone: string
    applicant_wx_openid: string
    apply_time: Date
    review_note?: string
    review_time?: Date
    reviewer_id?: string
  }
  coze_config?: {
    bot_id: string
    api_key: string
    api_endpoint: string
  }
  feishu_config?: {
    app_id: string
    app_secret: string
    table_tokens: Record<string, string>
  }
  notify_config?: {
    channel: string
    sms_config?: {
      provider: string
      access_key_id: string
      access_key_secret: string
      sign_name: string
      template_code: string
    }
    wechat_template_ids?: Record<string, string>
  }
  sync_config?: {
    enabled: boolean
    bindings: Array<{
      collection: string
      table_token: string
      enabled: boolean
    }>
  }
  create_time: Date
  update_time: Date
}

const MerchantSchema = new Schema<IMerchantDocument>({
  merchant_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String, required: true },
  business_hours: {
    start: { type: String, required: true, default: '09:00' },
    end: { type: String, required: true, default: '21:00' },
  },
  status: { type: String, required: true, enum: ['pending', 'applying', 'active', 'inactive', 'rejected'], default: 'pending' },
  description: { type: String },
  cover_image: { type: String },
  owner_id: { type: String, default: '' },
  application_info: {
    applicant_name: { type: String },
    applicant_phone: { type: String },
    applicant_wx_openid: { type: String },
    apply_time: { type: Date },
    review_note: { type: String },
    review_time: { type: Date },
    reviewer_id: { type: String },
  },
  daily_counter: { type: Number, default: 0 },
  counter_date: { type: String, default: '' },
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
})

MerchantSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

export const MerchantModel = mongoose.model<IMerchantDocument>('Merchant', MerchantSchema)
