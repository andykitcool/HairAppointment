/**
 * 将时间字符串（HH:mm）转换为当天的分钟数
 */
export declare function timeToMinutes(time: string): number;
/**
 * 将分钟数转换为时间字符串（HH:mm）
 */
export declare function minutesToTime(minutes: number): string;
/**
 * 判断两个时间段是否重叠（开区间 [start1, end1) 与 [start2, end2)）
 * @param start1 第一个时间段开始（HH:mm）
 * @param end1 第一个时间段结束（HH:mm）
 * @param start2 第二个时间段开始（HH:mm）
 * @param end2 第二个时间段结束（HH:mm）
 */
export declare function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean;
/**
 * 格式化日期为 YYYY-MM-DD
 */
export declare function formatDate(date: Date): string;
/**
 * 格式化日期为 YYYYMMDD
 */
export declare function formatDateCompact(date: string): string;
/**
 * 生成预约编号 YYYYMMDD-NNN
 */
export declare function generateAppointmentId(date: string, sequenceNum: number): string;
/**
 * 根据服务的 stages 和开始时间生成 timeline
 */
export declare function generateTimeline(stages: Array<{
    name: string;
    duration: number;
    staff_busy: boolean;
}>, startTime: string): Array<{
    stage_name: string;
    start: string;
    end: string;
    staff_busy: boolean;
}>;
/**
 * 获取预约的忙碌时间段（合并连续的 staff_busy=true 阶段）
 */
export declare function getBusyRanges(timeline: Array<{
    start: string;
    end: string;
    staff_busy: boolean;
}>): Array<{
    start: string;
    end: string;
}>;
/**
 * 分转元，保留两位小数
 */
export declare function fenToYuan(fen: number): string;
/**
 * 元转分（四舍五入）
 */
export declare function yuanToFen(yuan: number): number;
/**
 * 生成短随机 ID（用于 service_id, staff_id, merchant_id 等）
 */
export declare function generateShortId(prefix?: string): string;
/**
 * 按固定步长生成时间段 slots
 */
export declare function generateTimeSlots(start: string, end: string, stepMinutes?: number): Array<{
    start: string;
    end: string;
}>;
//# sourceMappingURL=helpers.d.ts.map