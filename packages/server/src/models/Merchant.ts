import mongoose, { Schema, Document } from 'mongoose'

export interface IMerchantDocument extends Document {
  merchant_id: string
  name: string
  address?: string
  phone: string
  business_hours: { start: string; end: string }
  status: string
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
  status: { type: String, required: true, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
  description: { type: String },
  cover_image: { type: String },
  owner_id: { type: String, required: true },
  daily_counter: { type: Number, required: true, default: 0 },
  counter_date: { type: String, required: true, default: '' },
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
