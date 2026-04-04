import mongoose, { Document } from 'mongoose';
export interface IAdminDocument extends Document {
    username: string;
    password_hash: string;
    real_name: string;
    phone?: string;
    wx_openid?: string;
    wx_unionid?: string;
    is_active: boolean;
    create_time: Date;
    update_time: Date;
}
export declare const AdminModel: mongoose.Model<IAdminDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAdminDocument, {}, {}> & IAdminDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Admin.d.ts.map