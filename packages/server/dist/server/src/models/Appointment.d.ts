import mongoose, { Document } from 'mongoose';
export interface ITimelineStage {
    stage_name: string;
    start: string;
    end: string;
    staff_busy: boolean;
}
export interface IAppointmentDocument extends Document {
    appointment_id: string;
    merchant_id: string;
    customer_id?: string;
    customer_name: string;
    customer_phone?: string;
    staff_id: string;
    staff_name: string;
    service_id: string;
    service_name: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    source: string;
    timeline: ITimelineStage[];
    actual_duration?: number;
    note?: string;
    sequence_num: number;
    _sync_source?: string;
    create_time: Date;
    update_time: Date;
}
export declare const AppointmentModel: mongoose.Model<IAppointmentDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAppointmentDocument, {}, {}> & IAppointmentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Appointment.d.ts.map