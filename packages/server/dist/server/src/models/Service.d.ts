import mongoose, { Document } from 'mongoose';
export interface IServiceStageDoc {
    name: string;
    duration: number;
    staff_busy: boolean;
}
export interface IServiceDocument extends Document {
    service_id: string;
    merchant_id: string;
    name: string;
    category: string;
    price: number;
    total_duration: number;
    staff_busy_duration: number;
    stages: IServiceStageDoc[];
    description?: string;
    is_active: boolean;
    sort_order: number;
    create_time: Date;
    update_time: Date;
}
export declare const ServiceModel: mongoose.Model<IServiceDocument, {}, {}, {}, mongoose.Document<unknown, {}, IServiceDocument, {}, {}> & IServiceDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Service.d.ts.map