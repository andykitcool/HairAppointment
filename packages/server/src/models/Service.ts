import mongoose, { Schema, Document } from 'mongoose'

export interface IServiceStageDoc {
  name: string
  duration: number
  staff_busy: boolean
}

export interface IServiceDocument extends Document {
  service_id: string
  merchant_id: string
  name: string
  category: string
  price: number
  total_duration: number
  staff_busy_duration: number
  stages: IServiceStageDoc[]
  description?: string
  is_active: boolean
  sort_order: number
  create_time: Date
  update_time: Date
}

const ServiceSchema = new Schema<IServiceDocument>({
  service_id: { type: String, required: true, unique: true },
  merchant_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['cut', 'perm', 'dye', 'care'] },
  price: { type: Number, required: true },
  total_duration: { type: Number, required: true },
  staff_busy_duration: { type: Number, required: true },
  stages: [{
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    staff_busy: { type: Boolean, required: true },
  }],
  description: { type: String },
  is_active: { type: Boolean, required: true, default: true },
  sort_order: { type: Number, required: true, default: 0 },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

ServiceSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

ServiceSchema.index({ merchant_id: 1, is_active: 1, sort_order: 1 })

export const ServiceModel = mongoose.model<IServiceDocument>('Service', ServiceSchema)
