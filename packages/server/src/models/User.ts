import mongoose, { Schema, Document } from 'mongoose'

export interface IUserDocument extends Document {
  user_id: string
  openid: string
  union_id?: string
  nickname: string
  avatar_url: string
  phone: string
  real_name?: string
  gender?: 'male' | 'female' | 'unknown'
  age?: number
  birthday?: string
  role: string
  merchant_id?: string
  customer_note?: string
  merchant_note?: string
  points: number
  membership_level: string
  punch_card_remaining: number
  stored_value_balance: number
  visit_count: number
  total_spending: number
  last_visit_time?: Date
  create_time: Date
  update_time: Date
}

const UserSchema = new Schema<IUserDocument>({
  user_id: { type: String, required: true, unique: true, index: true },
  openid: { type: String, required: true, unique: true },
  union_id: { type: String },
  nickname: { type: String, required: true, default: '微信用户' },
  avatar_url: { type: String, default: '' },
  phone: { type: String, default: '' },
  real_name: { type: String },
  gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  age: { type: Number, default: 0 },
  birthday: { type: String, default: '' },
  // role 扩展: customer(顾客) | pending_owner(申请中店长) | owner(店长) | staff(店员)
  role: { type: String, required: true, enum: ['customer', 'pending_owner', 'owner', 'staff'], default: 'customer' },
  merchant_id: { type: String, index: true },
  customer_note: { type: String },
  merchant_note: { type: String },
  points: { type: Number, required: true, default: 0 },
  membership_level: { type: String, default: 'normal' },
  punch_card_remaining: { type: Number, required: true, default: 0 },
  stored_value_balance: { type: Number, required: true, default: 0 },
  visit_count: { type: Number, required: true, default: 0 },
  total_spending: { type: Number, required: true, default: 0 },
  last_visit_time: { type: Date },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

UserSchema.pre('save', function () {
  this.update_time = new Date()
})

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema)
