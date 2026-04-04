import mongoose, { Document } from 'mongoose';
export interface ITransactionItemDoc {
    service_name: string;
    amount: number;
    quantity: number;
}
export interface ITransactionDocument extends Document {
    transaction_id: string;
    merchant_id: string;
    appointment_id?: string;
    customer_id?: string;
    customer_name: string;
    staff_id: string;
    staff_name: string;
    total_amount: number;
    items: ITransactionItemDoc[];
    payment_method: string;
    source: string;
    note?: string;
    transaction_date: string;
    _sync_source?: string;
    create_time: Date;
    update_time: Date;
}
export declare const TransactionModel: mongoose.Model<ITransactionDocument, {}, {}, {}, mongoose.Document<unknown, {}, ITransactionDocument, {}, {}> & ITransactionDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Transaction.d.ts.map