import mongoose, { Document } from 'mongoose';
export interface ISyncLogDocument extends Document {
    merchant_id: string;
    direction: string;
    collectionName: string;
    action: string;
    record_id: string;
    payload: Record<string, any>;
    status: string;
    retry_count: number;
    error_message?: string;
    create_time: Date;
}
export declare const SyncLogModel: mongoose.Model<ISyncLogDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISyncLogDocument, {}, {}> & ISyncLogDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=SyncLog.d.ts.map