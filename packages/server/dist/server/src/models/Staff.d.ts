import mongoose, { Document } from 'mongoose';
export interface IStaffDocument extends Document {
    staff_id: string;
    merchant_id: string;
    user_id?: string;
    name: string;
    title?: string;
    avatar_url?: string;
    phone?: string;
    service_ids: string[];
    is_active: boolean;
    create_time: Date;
    update_time: Date;
}
export declare const StaffModel: mongoose.Model<IStaffDocument, {}, {}, {}, mongoose.Document<unknown, {}, IStaffDocument, {}, {}> & IStaffDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Staff.d.ts.map