import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminDocument extends Document {
  username: string
  password_hash: string
  real_name: string
  phone?: string
  wx_openid?: string
  wx_unionid?: string
  is_active: boolean
  // 新增字段
  role: 'super_admin' | 'owner'
  merchant_id?: string
  type: 'system' | 'merchant'
  create_time: Date
  update_time: Date
}

const AdminSchema = new Schema<IAdminDocument>({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  real_name: { type: String, required: true },
  phone: { type: String, default: '' },
  wx_openid: { type: String, default: '' },
  wx_unionid: { type: String, default: '' },
  is_active: { type: Boolean, required: true, default: true },
  // 新增字段
  role: { type: String, required: true, enum: ['super_admin', 'owner'], default: 'owner' },
  merchant_id: { type: String, index: true },
  type: { type: String, required: true, enum: ['system', 'merchant'], default: 'merchant' },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

AdminSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

export const AdminModel = mongoose.model<IAdminDocument>('Admin', AdminSchema)
