import mongoose, { Schema, Document } from 'mongoose'

export interface ITimelineStage {
  stage_name: string
  start: string
  end: string
  staff_busy: boolean
}

export interface IAppointmentDocument extends Document {
  appointment_id: string
  merchant_id: string
  customer_id?: string
  customer_name: string
  customer_phone?: string
  staff_id: string
  staff_name: string
  service_id: string
  service_name: string
  date: string
  start_time: string
  end_time: string
  status: string
  source: string
  timeline: ITimelineStage[]
  actual_duration?: number
  note?: string
  sequence_num: number
  _sync_source?: string
  create_time: Date
  update_time: Date
}

const AppointmentSchema = new Schema<IAppointmentDocument>({
  appointment_id: { type: String, required: true, unique: true },
  merchant_id: { type: String, required: true, index: true },
  customer_id: { type: String, index: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String },
  staff_id: { type: String, required: true, index: true },
  staff_name: { type: String, required: true },
  service_id: { type: String, required: true },
  service_name: { type: String, required: true },
  date: { type: String, required: true, index: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  status: { type: String, required: true, enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'pending', index: true },
  source: { type: String, required: true, enum: ['mini_program', 'coze', 'feishu', 'web'], default: 'mini_program' },
  timeline: [{
    stage_name: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    staff_busy: { type: Boolean, required: true },
  }],
  actual_duration: { type: Number },
  note: { type: String },
  sequence_num: { type: Number, required: true },
  _sync_source: { type: String },
  create_time: { type: Date, default: Date.now, index: true },
  update_time: { type: Date, default: Date.now },
})

AppointmentSchema.pre('save', function (next) {
  this.update_time = new Date()
  next()
})

// 复合索引：按商户+日期+状态查询
AppointmentSchema.index({ merchant_id: 1, date: 1, status: 1 })
AppointmentSchema.index({ merchant_id: 1, staff_id: 1, date: 1 })

export const AppointmentModel = mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema)
