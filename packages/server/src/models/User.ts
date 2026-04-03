import mongoose, { Schema, Document } from 'mongoose'

export interface IUserDocument extends Document {
  openid: string
  union_id?: string
  nickname: string
  avatar_url: string
  phone: string
  real_name?: string
  role: string
  merchant_id?: string
  customer_note?: string
  merchant_note?: string
  visit_count: number
  total_spending: number
  last_visit_time?: Date
  create_time: Date
  update_time: Date
}

const UserSchema = new Schema<IUserDocument>({
  openid: { type: String, required: true, unique: true },
  union_id: { type: String },
  nickname: { type: String, required: true, default: '微信用户' },
  avatar_url: { type: String, required: true, default: '' },
  phone: { type: String, required: true, default: '' },
  real_name: { type: String },
  role: { type: String, required: true, enum: ['customer', 'owner', 'staff'], default: 'customer' },
  merchant_id: { type: String, index: true },
  customer_note: { type: String },
  merchant_note: { type: String },
  visit_count: { type: Number, required: true, default: 0 },
  total_spending: { type: Number, required: true, default: 0 },
  last_visit_time: { type: Date },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

UserSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema)
