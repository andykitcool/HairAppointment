import mongoose, { Schema, Document } from 'mongoose'

export interface IAdminDocument extends Document {
  username: string
  password_hash: string
  real_name: string
  is_active: boolean
  create_time: Date
  update_time: Date
}

const AdminSchema = new Schema<IAdminDocument>({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  real_name: { type: String, required: true },
  is_active: { type: Boolean, required: true, default: true },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

AdminSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

export const AdminModel = mongoose.model<IAdminDocument>('Admin', AdminSchema)
