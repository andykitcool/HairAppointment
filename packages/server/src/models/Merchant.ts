import mongoose, { Schema, Document } from 'mongoose'

interface ITimeSlotConfig {
  open: string
  close: string
  is_open: boolean
}

interface IDaySchedule {
  is_open: boolean
  morning: ITimeSlotConfig
  afternoon: ITimeSlotConfig
  evening: ITimeSlotConfig
}

export interface IMerchantDocument extends Document {
  merchant_id: string
  name: string
  address?: string
  phone: string
  business_hours: {
    start?: string
    end?: string
    monday?: IDaySchedule
    tuesday?: IDaySchedule
    wednesday?: IDaySchedule
    thursday?: IDaySchedule
    friday?: IDaySchedule
    saturday?: IDaySchedule
    sunday?: IDaySchedule
  }
  // status 扩展: pending(待审核) | applying(申请中) | active(正常) | inactive(暂停) | rejected(已拒绝)
  status: 'pending' | 'applying' | 'active' | 'inactive' | 'rejected'
  description?: string
  cover_image?: string
  owner_id: string
  daily_counter: number
  counter_date: string
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
  // 门店展示设置
  display_settings?: {
    hero_image?: string
    owner_avatar?: string
    owner_title?: string
    theme_color?: string
    welcome_text?: string
  }
  customer_settings?: {
    membership_levels?: string[]
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
    channel_enabled?: {
      wechat_subscribe: boolean
      sms: boolean
    }
    sms_config?: {
      provider: string
      access_key_id: string
      access_key_secret: string
      sign_name: string
      template_code: string
    }
    wechat_template_ids?: Record<string, string>
  }
  ai_image_settings?: {
    enabled: boolean
    period: 'day' | 'month'
    max_count: number
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
  latitude?: number
  longitude?: number
}

const MerchantSchema = new Schema<IMerchantDocument>({
  merchant_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String, required: true },
  business_hours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '21:00' },
    monday:    { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    tuesday:   { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    wednesday: { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    thursday:  { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    friday:    { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    saturday:  { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
    sunday:    { is_open: { type: Boolean, default: true }, morning: { open: { type: String, default: '09:00' }, close: { type: String, default: '12:00' }, is_open: { type: Boolean, default: true } }, afternoon: { open: { type: String, default: '14:00' }, close: { type: String, default: '18:00' }, is_open: { type: Boolean, default: true } }, evening: { open: { type: String, default: '19:00' }, close: { type: String, default: '21:00' }, is_open: { type: Boolean, default: false } } },
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
  // 门店展示设置
  display_settings: {
    hero_image: { type: String, default: '' },
    owner_avatar: { type: String, default: '' },
    owner_title: { type: String, default: '店长' },
    theme_color: { type: String, default: '#1890ff' },
    welcome_text: { type: String, default: '欢迎预约，我们将为您提供专业服务' },
  },
  customer_settings: {
    membership_levels: {
      type: [String],
      default: ['普通会员', '银卡会员', '金卡会员', '钻石会员'],
    },
  },
  daily_counter: { type: Number, default: 0 },
  counter_date: { type: String, default: '' },
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
    channel_enabled: {
      wechat_subscribe: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    sms_config: {
      provider: String,
      access_key_id: String,
      access_key_secret: String,
      sign_name: String,
      template_code: String,
    },
    wechat_template_ids: { type: Map, of: String },
  },
  ai_image_settings: {
    enabled: { type: Boolean, default: false },
    period: { type: String, enum: ['day', 'month'], default: 'month' },
    max_count: { type: Number, default: 4 },
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
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
})

MerchantSchema.pre('save', function () {
  this.update_time = new Date()
})

export const MerchantModel = mongoose.model<IMerchantDocument>('Merchant', MerchantSchema)
