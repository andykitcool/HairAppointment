"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeToMinutes = timeToMinutes;
exports.minutesToTime = minutesToTime;
exports.isTimeOverlap = isTimeOverlap;
exports.formatDate = formatDate;
exports.formatDateCompact = formatDateCompact;
exports.generateAppointmentId = generateAppointmentId;
exports.generateTimeline = generateTimeline;
exports.getBusyRanges = getBusyRanges;
exports.fenToYuan = fenToYuan;
exports.yuanToFen = yuanToFen;
exports.generateShortId = generateShortId;
exports.generateTimeSlots = generateTimeSlots;
/**
 * 将时间字符串（HH:mm）转换为当天的分钟数
 */
function timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
/**
 * 将分钟数转换为时间字符串（HH:mm）
 */
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
/**
 * 判断两个时间段是否重叠（开区间 [start1, end1) 与 [start2, end2)）
 * @param start1 第一个时间段开始（HH:mm）
 * @param end1 第一个时间段结束（HH:mm）
 * @param start2 第二个时间段开始（HH:mm）
 * @param end2 第二个时间段结束（HH:mm）
 */
function isTimeOverlap(start1, end1, start2, end2) {
    return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(start2) < timeToMinutes(end1);
}
/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * 格式化日期为 YYYYMMDD
 */
function formatDateCompact(date) {
    return date.replace(/-/g, '');
}
/**
 * 生成预约编号 YYYYMMDD-NNN
 */
function generateAppointmentId(date, sequenceNum) {
    return `${formatDateCompact(date)}-${String(sequenceNum).padStart(3, '0')}`;
}
/**
 * 根据服务的 stages 和开始时间生成 timeline
 */
function generateTimeline(stages, startTime) {
    let currentMinutes = timeToMinutes(startTime);
    return stages.map((stage) => {
        const start = minutesToTime(currentMinutes);
        currentMinutes += stage.duration;
        const end = minutesToTime(currentMinutes);
        return {
            stage_name: stage.name,
            start,
            end,
            staff_busy: stage.staff_busy,
        };
    });
}
/**
 * 获取预约的忙碌时间段（合并连续的 staff_busy=true 阶段）
 */
function getBusyRanges(timeline) {
    const ranges = [];
    let current = null;
    for (const stage of timeline) {
        if (stage.staff_busy) {
            if (!current) {
                current = { start: stage.start, end: stage.end };
            }
            else {
                current.end = stage.end;
            }
        }
        else {
            if (current) {
                ranges.push(current);
                current = null;
            }
        }
    }
    if (current) {
        ranges.push(current);
    }
    return ranges;
}
/**
 * 分转元，保留两位小数
 */
function fenToYuan(fen) {
    return (fen / 100).toFixed(2);
}
/**
 * 元转分（四舍五入）
 */
function yuanToFen(yuan) {
    return Math.round(yuan * 100);
}
/**
 * 生成短随机 ID（用于 service_id, staff_id, merchant_id 等）
 */
function generateShortId(prefix = '') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix ? `${prefix}_${id}` : id;
}
/**
 * 按固定步长生成时间段 slots
 */
function generateTimeSlots(start, end, stepMinutes = 15) {
    const slots = [];
    let current = timeToMinutes(start);
    const endTime = timeToMinutes(end);
    while (current + stepMinutes <= endTime) {
        slots.push({
            start: minutesToTime(current),
            end: minutesToTime(current + stepMinutes),
        });
        current += stepMinutes;
    }
    return slots;
}
//# sourceMappingURL=helpers.js.map