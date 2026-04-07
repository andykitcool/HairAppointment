import mongoose, { Schema, Document } from 'mongoose'

export interface IStaffDocument extends Document {
  staff_id: string
  merchant_id: string
  user_id?: string
  name: string
  title?: string
  avatar_url?: string
  phone?: string
  service_ids: string[]
  is_active: boolean
  create_time: Date
  update_time: Date
}

const StaffSchema = new Schema<IStaffDocument>({
  staff_id: { type: String, required: true, unique: true },
  merchant_id: { type: String, required: true, index: true },
  user_id: { type: String },
  name: { type: String, required: true },
  title: { type: String },
  avatar_url: { type: String },
  phone: { type: String },
  service_ids: [{ type: String }],
  is_active: { type: Boolean, required: true, default: true },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

StaffSchema.pre('save', function () {
  this.update_time = new Date()
})

export const StaffModel = mongoose.model<IStaffDocument>('Staff', StaffSchema)
