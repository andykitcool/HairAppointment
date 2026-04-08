import mongoose, { Schema, Document } from 'mongoose'

export interface IPlatformConfigDocument extends Document {
  config_key: string
  coze_config: {
    enabled: boolean
    api_key: string
    model: string
    prompt: string
    size: string
  }
  amap_config: {
    enabled: boolean
    js_api_key: string
    security_js_code: string
    service_host: string
    web_service_key: string
  }
  email_config: {
    enabled: boolean
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from_name: string
    from_email: string
  }
  create_time: Date
  update_time: Date
}

const PlatformConfigSchema = new Schema<IPlatformConfigDocument>({
  config_key: { type: String, required: true, unique: true, default: 'platform_default' },
  coze_config: {
    enabled: { type: Boolean, default: false },
    api_key: { type: String, default: '' },
    model: { type: String, default: 'doubao-seedream-5-0-260128' },
    prompt: { type: String, default: '' },
    size: { type: String, default: '2K' },
  },
  amap_config: {
    enabled: { type: Boolean, default: false },
    js_api_key: { type: String, default: '' },
    security_js_code: { type: String, default: '' },
    service_host: { type: String, default: '' },
    web_service_key: { type: String, default: '' },
  },
  email_config: {
    enabled: { type: Boolean, default: false },
    host: { type: String, default: '' },
    port: { type: Number, default: 465 },
    secure: { type: Boolean, default: true },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    from_name: { type: String, default: '' },
    from_email: { type: String, default: '' },
  },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

PlatformConfigSchema.pre('save', function () {
  this.update_time = new Date()
})

export const PlatformConfigModel = mongoose.model<IPlatformConfigDocument>('PlatformConfig', PlatformConfigSchema)
