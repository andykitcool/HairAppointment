import mongoose, { Schema, Document } from 'mongoose'

export interface IPlatformAdDocument extends Document {
  ad_id: string
  title: string
  image_url: string
  link_url?: string
  sort_order: number
  status: 'active' | 'inactive'
  start_time?: Date
  end_time?: Date
  create_time: Date
  update_time: Date
}

const PlatformAdSchema = new Schema<IPlatformAdDocument>({
  ad_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  image_url: { type: String, required: true },
  link_url: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  start_time: { type: Date },
  end_time: { type: Date },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

PlatformAdSchema.pre('save', function () {
  this.update_time = new Date()
})

export const PlatformAdModel = mongoose.model<IPlatformAdDocument>('PlatformAd', PlatformAdSchema)
