"use strict";
const common_vendor = require("../common/vendor.js");
const DEFAULT_BASE_URL = "http://localhost:3000/api";
const MOCK_FLAG_KEY = "miniapp_use_mock_api";
const MOCK_DB_KEY = "miniapp_mock_db";
function getToken() {
  return common_vendor.index.getStorageSync("token") || "";
}
function getBaseUrl() {
  return common_vendor.index.getStorageSync("api_base_url") || DEFAULT_BASE_URL;
}
function isMockEnabled() {
  const saved = common_vendor.index.getStorageSync(MOCK_FLAG_KEY);
  if (saved === false || saved === "false" || saved === 0 || saved === "0") {
    return false;
  }
  return true;
}
function setMockEnabled(enabled) {
  common_vendor.index.setStorageSync(MOCK_FLAG_KEY, enabled);
}
function setApiBaseUrl(baseUrl) {
  const normalized = (baseUrl || "").trim();
  if (!normalized) {
    common_vendor.index.removeStorageSync("api_base_url");
    return;
  }
  common_vendor.index.setStorageSync("api_base_url", normalized.replace(/\/$/, ""));
}
function resetMockDb() {
  common_vendor.index.removeStorageSync(MOCK_DB_KEY);
}
function getApiEnv() {
  return {
    useMock: isMockEnabled(),
    baseUrl: getBaseUrl(),
    defaultBaseUrl: DEFAULT_BASE_URL
  };
}
function createDefaultMockDb() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    merchant: {
      merchant_id: "M_mock_001",
      name: "黑白造型工作室",
      address: "测试路 88 号",
      phone: "13800000000",
      business_hours: { start: "09:00", end: "21:00" },
      status: "active"
    },
    user: {
      _id: "U_mock_001",
      openid: "openid_mock_001",
      nickname: "体验用户",
      avatar_url: "",
      phone: "13800138000",
      role: "customer",
      merchant_id: "M_mock_001",
      customer_note: "",
      total_spending: 0,
      visit_count: 0,
      create_time: now,
      update_time: now
    },
    services: [
      { service_id: "S_mock_001", merchant_id: "M_mock_001", name: "洗剪吹定制", category: "cut", price: 5800, total_duration: 60, description: "精准剪裁，塑造完美发型" },
      { service_id: "S_mock_002", merchant_id: "M_mock_001", name: "质感纹理烫发", category: "perm", price: 28e3, total_duration: 120, description: "持久定型，自然蓬松质感" },
      { service_id: "S_mock_003", merchant_id: "M_mock_001", name: "高级色彩染发", category: "dye", price: 18e3, total_duration: 90, description: "潮流色系，呵护发质光泽" },
      { service_id: "S_mock_004", merchant_id: "M_mock_001", name: "深层结构修护", category: "care", price: 9800, total_duration: 60, description: "深层修护，锁水润泽养发" }
    ],
    appointments: [],
    appointmentSeq: 0
  };
}
function loadMockDb() {
  const raw = common_vendor.index.getStorageSync(MOCK_DB_KEY);
  if (raw) {
    return raw;
  }
  const initial = createDefaultMockDb();
  common_vendor.index.setStorageSync(MOCK_DB_KEY, initial);
  return initial;
}
function saveMockDb(db) {
  common_vendor.index.setStorageSync(MOCK_DB_KEY, db);
}
function createSlots(start = "09:00", end = "21:00") {
  const slots = [];
  const [sh, sm] = start.split(":").map((n) => parseInt(n, 10));
  const [eh, em] = end.split(":").map((n) => parseInt(n, 10));
  let current = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (current < endMin) {
    const next = current + 30;
    const startH = String(Math.floor(current / 60)).padStart(2, "0");
    const startM = String(current % 60).padStart(2, "0");
    const endH = String(Math.floor(next / 60)).padStart(2, "0");
    const endM = String(next % 60).padStart(2, "0");
    slots.push({
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
      available: true
    });
    current = next;
  }
  return slots;
}
function timeToMinutes(time) {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  return h * 60 + m;
}
function minutesToTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}
function ensureMockAuth(needAuth) {
  if (needAuth === false) return;
  const token = getToken();
  if (!token) {
    throw new Error("请先登录");
  }
}
async function handleMockRequest(options) {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const db = loadMockDb();
  const url = options.url;
  const method = options.method || "GET";
  const data = options.data || {};
  if (url === "/auth/wechat-login" && method === "POST") {
    const token = `mock_token_${Date.now()}`;
    common_vendor.index.setStorageSync("token", token);
    db.user.update_time = (/* @__PURE__ */ new Date()).toISOString();
    saveMockDb(db);
    return { token, user: db.user };
  }
  if (url === "/auth/profile" && method === "GET") {
    ensureMockAuth(options.needAuth);
    return db.user;
  }
  if (url === "/auth/profile" && method === "PUT") {
    ensureMockAuth(options.needAuth);
    db.user = {
      ...db.user,
      ...data,
      customer_note: data.customer_note ?? db.user.customer_note,
      update_time: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveMockDb(db);
    return db.user;
  }
  if (url.startsWith("/merchants/") && method === "GET") {
    ensureMockAuth(options.needAuth);
    return db.merchant;
  }
  if (url === "/services" && method === "GET") {
    const merchantId = data.merchant_id || db.merchant.merchant_id;
    return db.services.filter((s) => s.merchant_id === merchantId);
  }
  if (url === "/slots/available" && method === "GET") {
    const merchantId = data.merchant_id || db.merchant.merchant_id;
    const date = data.date;
    const serviceId = data.service_id;
    const service = db.services.find((s) => s.service_id === serviceId) || db.services[0];
    const serviceDuration = (service == null ? void 0 : service.total_duration) || 30;
    const baseSlots = createSlots(db.merchant.business_hours.start, db.merchant.business_hours.end);
    const appointments = db.appointments.filter((a) => a.merchant_id === merchantId && a.date === date && a.status !== "cancelled");
    const slots = baseSlots.map((slot) => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = slotStart + serviceDuration;
      const hasConflict = appointments.some((appt) => {
        const apptStart = timeToMinutes(appt.start_time);
        const apptEnd = timeToMinutes(appt.end_time);
        return slotStart < apptEnd && apptStart < slotEnd;
      });
      const businessEnd = timeToMinutes(db.merchant.business_hours.end);
      return {
        ...slot,
        available: !hasConflict && slotEnd <= businessEnd
      };
    });
    return {
      slots,
      closed: false,
      business_hours: db.merchant.business_hours
    };
  }
  if (url === "/appointments" && method === "POST") {
    ensureMockAuth(options.needAuth);
    if (!data.merchant_id || !data.service_id || !data.date || !data.start_time) {
      throw new Error("预约参数不完整");
    }
    const service = db.services.find((s) => s.service_id === data.service_id) || db.services.find((s) => s.category === data.service_id.replace("cat_", "")) || db.services[0];
    if (!service) {
      throw new Error("服务不存在");
    }
    const startMin = timeToMinutes(data.start_time);
    const endMin = startMin + (service.total_duration || 30);
    const endTime = minutesToTime(endMin);
    const hasConflict = db.appointments.some((appt) => {
      if (appt.merchant_id !== data.merchant_id || appt.date !== data.date || appt.status === "cancelled") {
        return false;
      }
      const apptStart = timeToMinutes(appt.start_time);
      const apptEnd = timeToMinutes(appt.end_time);
      return startMin < apptEnd && apptStart < endMin;
    });
    if (hasConflict) {
      throw new Error("该时段已被预约，请选择其他时间");
    }
    db.appointmentSeq += 1;
    const seq = String(db.appointmentSeq).padStart(3, "0");
    const appointmentId = `${data.date.replace(/-/g, "")}-${seq}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      _id: `A_${Date.now()}`,
      appointment_id: appointmentId,
      merchant_id: data.merchant_id,
      customer_id: db.user._id,
      customer_name: db.user.nickname,
      customer_phone: db.user.phone,
      staff_id: "staff_mock_001",
      staff_name: "店长",
      service_id: service.service_id,
      service_name: service.name,
      date: data.date,
      start_time: data.start_time,
      end_time: endTime,
      status: "pending",
      source: "mini_program",
      note: data.note || "",
      timeline: [
        {
          stage_name: service.name,
          start: data.start_time,
          end: endTime,
          staff_busy: true
        }
      ],
      create_time: now,
      update_time: now
    };
    db.appointments.unshift(record);
    saveMockDb(db);
    return { appointment_id: appointmentId, end_time: endTime };
  }
  if (url === "/appointments" && method === "GET") {
    ensureMockAuth(options.needAuth);
    const status = data.status;
    const list = db.appointments.filter((a) => {
      if (status && a.status !== status) return false;
      return a.customer_id === db.user._id;
    });
    return {
      list,
      total: list.length,
      page: 1,
      pageSize: data.pageSize || list.length
    };
  }
  const appointmentIdMatch = url.match(/^\/appointments\/([^/]+)$/);
  if (appointmentIdMatch && method === "GET") {
    ensureMockAuth(options.needAuth);
    const found = db.appointments.find((a) => a.appointment_id === appointmentIdMatch[1] || a._id === appointmentIdMatch[1]);
    if (!found) throw new Error("预约不存在");
    return found;
  }
  if (appointmentIdMatch && method === "DELETE") {
    ensureMockAuth(options.needAuth);
    const found = db.appointments.find((a) => a.appointment_id === appointmentIdMatch[1] || a._id === appointmentIdMatch[1]);
    if (!found) throw new Error("预约不存在");
    if (!["pending", "confirmed"].includes(found.status)) {
      throw new Error("当前状态不可取消");
    }
    found.status = "cancelled";
    found.update_time = (/* @__PURE__ */ new Date()).toISOString();
    saveMockDb(db);
    return null;
  }
  throw new Error(`Mock 未实现接口: ${method} ${url}`);
}
function request(options) {
  if (isMockEnabled()) {
    return handleMockRequest(options);
  }
  return new Promise((resolve, reject) => {
    const header = {
      "Content-Type": "application/json"
    };
    if (options.needAuth !== false) {
      const token = getToken();
      if (token) {
        header["Authorization"] = `Bearer ${token}`;
      }
    }
    common_vendor.index.request({
      url: `${getBaseUrl()}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header,
      success: (res) => {
        var _a;
        if (res.statusCode === 200 || res.statusCode === 201) {
          const body = res.data;
          if (body.code === 0) {
            resolve(body.data);
          } else {
            reject(new Error(body.message || "请求失败"));
          }
        } else if (res.statusCode === 401) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.removeStorageSync("user_info");
          reject(new Error("登录已过期"));
        } else {
          reject(new Error(((_a = res.data) == null ? void 0 : _a.message) || "请求失败"));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络错误"));
      }
    });
  });
}
request.get = (url, data) => request({ url, method: "GET", data, needAuth: true });
request.post = (url, data) => request({ url, method: "POST", data, needAuth: true });
request.put = (url, data) => request({ url, method: "PUT", data, needAuth: true });
request.delete = (url, data) => request({ url, method: "DELETE", data, needAuth: true });
request.publicGet = (url, data) => request({ url, method: "GET", data, needAuth: false });
request.publicPost = (url, data) => request({ url, method: "POST", data, needAuth: false });
const authApi = {
  wechatLogin: (code) => request.publicPost("/auth/wechat-login", { code }),
  getPhone: (code) => request.post("/auth/phone", { code }),
  getProfile: () => request.get("/auth/profile"),
  updateProfile: (data) => request.put("/auth/profile", data),
  applyOwner: (data) => request.post("/auth/apply-owner", data),
  adminLogin: (data) => request.publicPost("/auth/admin-login", data)
};
const appointmentApi = {
  getAvailableSlots: (params) => request.publicGet("/slots/available", params),
  create: (data) => request.post("/appointments", data),
  getList: (params) => request.get("/appointments", params),
  getById: (id) => request.get(`/appointments/${id}`),
  cancel: (id) => request.delete(`/appointments/${id}`),
  update: (id, data) => request.put(`/appointments/${id}`, data),
  confirm: (id) => request.post(`/appointments/${id}/confirm`)
};
const serviceApi = {
  getList: (merchantId) => request.get("/services", { merchant_id: merchantId }),
  create: (data) => request.post("/services", data),
  update: (id, data) => request.put(`/services/${id}`, data),
  delete: (id) => request.delete(`/services/${id}`)
};
const merchantApi = {
  getInfo: (id) => request.get(`/merchants/${id}`),
  update: (id, data) => request.put(`/merchants/${id}`, data),
  getClosedPeriods: (id, params) => request.get(`/merchants/${id}/closed-periods`, params),
  createClosedPeriod: (id, data) => request.post(`/merchants/${id}/closed-periods`, data),
  deleteClosedPeriod: (merchantId, periodId) => request.delete(`/merchants/${merchantId}/closed-periods/${periodId}`),
  setExtendedHours: (merchantId, data) => request.post(`/merchants/${merchantId}/extended-hours`, data),
  updateExtendedHours: (merchantId, index, data) => request.put(`/merchants/${merchantId}/extended-hours/${index}`, data),
  deleteExtendedHours: (merchantId, index) => request.delete(`/merchants/${merchantId}/extended-hours/${index}`)
};
const transactionApi = {
  create: (data) => request.post("/transactions", data),
  getList: (params) => request.get("/transactions", params)
};
const statsApi = {
  getRevenue: (params) => request.get("/stats/revenue", params),
  getRevenueStats: (params) => request.get("/stats/revenue", params)
};
const customerApi = {
  getList: (params) => request.get("/customers", params),
  updateMerchantNote: (id, note) => request.put(`/customers/${id}/merchant-note`, { merchant_note: note })
};
const notificationApi = {
  broadcast: (data) => request.post("/notifications/broadcast", data)
};
exports.appointmentApi = appointmentApi;
exports.authApi = authApi;
exports.customerApi = customerApi;
exports.getApiEnv = getApiEnv;
exports.merchantApi = merchantApi;
exports.notificationApi = notificationApi;
exports.resetMockDb = resetMockDb;
exports.serviceApi = serviceApi;
exports.setApiBaseUrl = setApiBaseUrl;
exports.setMockEnabled = setMockEnabled;
exports.statsApi = statsApi;
exports.transactionApi = transactionApi;
