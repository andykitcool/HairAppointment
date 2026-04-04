import mongoose, { Document } from 'mongoose';
export interface IShopClosedPeriodDocument extends Document {
    merchant_id: string;
    date: string;
    type: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    cancel_appointments?: boolean;
    notify_customers?: boolean;
    created_by: string;
    create_time: Date;
}
export declare const ShopClosedPeriodModel: mongoose.Model<IShopClosedPeriodDocument, {}, {}, {}, mongoose.Document<unknown, {}, IShopClosedPeriodDocument, {}, {}> & IShopClosedPeriodDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ShopClosedPeriod.d.ts.map