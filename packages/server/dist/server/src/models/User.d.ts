import mongoose, { Document } from 'mongoose';
export interface IUserDocument extends Document {
    openid: string;
    union_id?: string;
    nickname: string;
    avatar_url: string;
    phone: string;
    real_name?: string;
    role: string;
    merchant_id?: string;
    customer_note?: string;
    merchant_note?: string;
    visit_count: number;
    total_spending: number;
    last_visit_time?: Date;
    create_time: Date;
    update_time: Date;
}
export declare const UserModel: mongoose.Model<IUserDocument, {}, {}, {}, mongoose.Document<unknown, {}, IUserDocument, {}, {}> & IUserDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map