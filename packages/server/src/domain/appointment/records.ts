export interface AppointmentRecordBase {
  appointmentId: string
  merchantId: string
  staffId: string
  staffName: string
  serviceId: string
  serviceName: string
  date: string
  startTime: string
  endTime: string
  timeline: any[]
  sequenceNumber: number
}

export interface PendingAppointmentCustomer {
  customerId?: string
  customerName: string
  customerPhone?: string
}

export function buildPendingAppointmentRecord(
  base: AppointmentRecordBase,
  customer: PendingAppointmentCustomer,
  note?: string,
) {
  return {
    appointment_id: base.appointmentId,
    merchant_id: base.merchantId,
    customer_id: customer.customerId,
    customer_name: customer.customerName,
    customer_phone: customer.customerPhone,
    staff_id: base.staffId,
    staff_name: base.staffName,
    service_id: base.serviceId,
    service_name: base.serviceName,
    date: base.date,
    start_time: base.startTime,
    end_time: base.endTime,
    status: 'pending',
    source: 'mini_program',
    timeline: base.timeline,
    note,
    sequence_num: base.sequenceNumber,
  }
}

export interface WalkInCustomer {
  customerName?: string
  customerPhone?: string
}

export function buildWalkInAppointmentRecord(
  base: AppointmentRecordBase,
  customer: WalkInCustomer,
) {
  return {
    appointment_id: base.appointmentId,
    merchant_id: base.merchantId,
    customer_name: customer.customerName || '散客',
    customer_phone: customer.customerPhone,
    staff_id: base.staffId,
    staff_name: base.staffName,
    service_id: base.serviceId,
    service_name: base.serviceName,
    date: base.date,
    start_time: base.startTime,
    end_time: base.endTime,
    status: 'in_progress',
    source: 'coze',
    timeline: base.timeline,
    sequence_num: base.sequenceNumber,
  }
}
