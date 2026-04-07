import mongoose, { Schema, Document } from 'mongoose'

export interface IAiUsageLogDocument extends Document {
  merchant_id: string
  user_id: string
  period: 'day' | 'month'
  create_time: Date
}

const AiUsageLogSchema = new Schema<IAiUsageLogDocument>({
  merchant_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  period: { type: String, enum: ['day', 'month'], required: true },
  create_time: { type: Date, default: Date.now },
})

AiUsageLogSchema.index({ merchant_id: 1, user_id: 1, create_time: -1 })

export const AiUsageLogModel = mongoose.model<IAiUsageLogDocument>('AiUsageLog', AiUsageLogSchema)
