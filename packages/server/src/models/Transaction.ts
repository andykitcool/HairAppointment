import mongoose, { Schema, Document } from 'mongoose'

export interface ITransactionItemDoc {
  service_name: string
  amount: number
  quantity: number
}

export interface ITransactionDocument extends Document {
  transaction_id: string
  merchant_id: string
  appointment_id?: string
  customer_id?: string
  customer_name?: string
  customer_source: 'appointment' | 'walk_in'  // 顾客来源：预约/直接到店
  staff_id: string
  staff_name: string
  total_amount: number
  items: ITransactionItemDoc[]
  payment_method: string
  source: string
  note?: string
  transaction_date: string
  _sync_source?: string
  create_time: Date
  update_time: Date
}

const TransactionSchema = new Schema<ITransactionDocument>({
  transaction_id: { type: String, required: true, unique: true },
  merchant_id: { type: String, required: true, index: true },
  appointment_id: { type: String, index: true },
  customer_id: { type: String },
  customer_name: { type: String },
  customer_source: { type: String, required: true, enum: ['appointment', 'walk_in'], default: 'walk_in' },
  staff_id: { type: String, required: true },
  staff_name: { type: String, required: true },
  total_amount: { type: Number, required: true },
  items: [{
    service_name: { type: String, required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
  }],
  payment_method: { type: String, required: true, enum: ['wechat', 'alipay', 'cash', 'stored_value', 'punch_card', 'other'] },
  source: { type: String, required: true, enum: ['coze', 'feishu', 'mini_program', 'web'], default: 'mini_program' },
  note: { type: String },
  transaction_date: { type: String, required: true, index: true },
  _sync_source: { type: String },
  create_time: { type: Date, default: Date.now },
  update_time: { type: Date, default: Date.now },
})

TransactionSchema.pre('save', function () {
  this.update_time = new Date()
})

TransactionSchema.index({ merchant_id: 1, transaction_date: 1 })

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema)
