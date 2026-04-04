import mongoose, { Schema, Document } from 'mongoose'

export interface ISyncLogDocument extends Document {
  merchant_id: string
  direction: string
  collectionName: string
  action: string
  record_id: string
  payload: Record<string, any>
  status: string
  retry_count: number
  error_message?: string
  create_time: Date
}

const SyncLogSchema = new Schema<ISyncLogDocument>({
  merchant_id: { type: String, required: true, index: true },
  direction: { type: String, required: true, enum: ['outbound', 'inbound'] },
  collectionName: { type: String, required: true },
  action: { type: String, required: true, enum: ['create', 'update', 'delete'] },
  record_id: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, required: true, enum: ['pending', 'success', 'failed'], default: 'pending' },
  retry_count: { type: Number, required: true, default: 0 },
  error_message: { type: String },
  create_time: { type: Date, default: Date.now },
})

SyncLogSchema.index({ status: 1, create_time: 1 })

export const SyncLogModel = mongoose.model<ISyncLogDocument>('SyncLog', SyncLogSchema)
