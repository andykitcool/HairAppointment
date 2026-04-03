import mongoose, { Schema, Document } from 'mongoose'

export interface IShopClosedPeriodDocument extends Document {
  merchant_id: string
  date: string
  type: string
  start_time?: string
  end_time?: string
  reason?: string
  cancel_appointments?: boolean
  notify_customers?: boolean
  created_by: string
  create_time: Date
}

const ShopClosedPeriodSchema = new Schema<IShopClosedPeriodDocument>({
  merchant_id: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['full_day', 'time_range'] },
  start_time: { type: String },
  end_time: { type: String },
  reason: { type: String },
  cancel_appointments: { type: Boolean, default: false },
  notify_customers: { type: Boolean, default: false },
  created_by: { type: String, required: true },
  create_time: { type: Date, default: Date.now },
})

ShopClosedPeriodSchema.index({ merchant_id: 1, date: 1 })

export const ShopClosedPeriodModel = mongoose.model<IShopClosedPeriodDocument>('ShopClosedPeriod', ShopClosedPeriodSchema)
