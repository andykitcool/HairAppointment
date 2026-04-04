import mongoose, { Document } from 'mongoose';
export interface IMerchantDocument extends Document {
    merchant_id: string;
    name: string;
    address?: string;
    phone: string;
    business_hours: {
        start: string;
        end: string;
    };
    status: string;
    description?: string;
    cover_image?: string;
    owner_id: string;
    daily_counter: number;
    counter_date: string;
    extended_hours?: Array<{
        start_date: string;
        end_date: string;
        extended_end: string;
    }>;
    coze_config?: {
        bot_id: string;
        api_key: string;
        api_endpoint: string;
    };
    feishu_config?: {
        app_id: string;
        app_secret: string;
        table_tokens: Record<string, string>;
    };
    notify_config?: {
        channel: string;
        sms_config?: {
            provider: string;
            access_key_id: string;
            access_key_secret: string;
            sign_name: string;
            template_code: string;
        };
        wechat_template_ids?: Record<string, string>;
    };
    sync_config?: {
        enabled: boolean;
        bindings: Array<{
            collection: string;
            table_token: string;
            enabled: boolean;
        }>;
    };
    create_time: Date;
    update_time: Date;
}
export declare const MerchantModel: mongoose.Model<IMerchantDocument, {}, {}, {}, mongoose.Document<unknown, {}, IMerchantDocument, {}, {}> & IMerchantDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Merchant.d.ts.map