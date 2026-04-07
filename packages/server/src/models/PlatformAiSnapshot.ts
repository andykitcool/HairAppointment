import mongoose, { Schema, Document } from 'mongoose'

export interface IPlatformAiSnapshotDocument extends Document {
  client_id: string
  user_id: string
  task_id: string
  status: 'processing' | 'done' | 'failed'
  progress: number
  message: string
  input_image_url: string
  image_url: string
  error_message: string
  create_time: Date
  update_time: Date
}

const PlatformAiSnapshotSchema = new Schema<IPlatformAiSnapshotDocument>({
  client_id: { type: String, required: true, index: true },
  user_id: { type: String, default: '', index: true },
  task_id: { type: String, default: '' },
  status: { type: String, enum: ['processing', 'done', 'failed'], default: 'processing' },
  progress: { type: Number, default: 0 },
  message: { type: String, default: '' },
  input_image_url: { type: String, default: '' },
  image_url: { type: String, default: '' },
  error_message: { type: String, default: '' },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

PlatformAiSnapshotSchema.index({ client_id: 1, update_time: -1 })
PlatformAiSnapshotSchema.index({ user_id: 1, update_time: -1 })

PlatformAiSnapshotSchema.pre('save', function () {
  this.update_time = new Date()
})

export const PlatformAiSnapshotModel = mongoose.model<IPlatformAiSnapshotDocument>('PlatformAiSnapshot', PlatformAiSnapshotSchema)
