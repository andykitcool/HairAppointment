"use strict";
const common_vendor = require("../common/vendor.js");
const USER_STORAGE_KEY = "user_info";
function normalizeUser(info = {}) {
  const avatarUrl = info.avatarUrl || info.avatar_url || "";
  const realName = info.realName || info.real_name || "";
  const merchantId = info.merchantId || info.merchant_id || "";
  const customerNote = info.customerNote || info.customer_note || "";
  const totalSpending = Number(info.totalSpending ?? info.total_spending ?? 0);
  const visitCount = Number(info.visitCount ?? info.visit_count ?? 0);
  return {
    _id: info._id || "",
    openid: info.openid || "",
    nickname: info.nickname || "",
    avatarUrl,
    avatar_url: avatarUrl,
    phone: info.phone || "",
    realName,
    real_name: realName,
    role: info.role || "customer",
    merchantId,
    merchant_id: merchantId,
    customerNote,
    customer_note: customerNote,
    totalSpending,
    total_spending: totalSpending,
    visitCount,
    visit_count: visitCount
  };
}
const useUserStore = common_vendor.defineStore("user", () => {
  const token = common_vendor.ref("");
  const userInfo = common_vendor.ref(normalizeUser());
  const isLoggedIn = common_vendor.ref(false);
  function setToken(t) {
    token.value = t;
    common_vendor.index.setStorageSync("token", t);
  }
  function setUser(info) {
    userInfo.value = normalizeUser(info);
    isLoggedIn.value = true;
    common_vendor.index.setStorageSync(USER_STORAGE_KEY, userInfo.value);
  }
  function logout() {
    token.value = "";
    userInfo.value = normalizeUser();
    isLoggedIn.value = false;
    common_vendor.index.removeStorageSync("token");
    common_vendor.index.removeStorageSync(USER_STORAGE_KEY);
  }
  const cachedToken = common_vendor.index.getStorageSync("token");
  const cachedUser = common_vendor.index.getStorageSync(USER_STORAGE_KEY);
  if (cachedToken) {
    token.value = cachedToken;
    isLoggedIn.value = true;
  }
  if (cachedUser) {
    userInfo.value = normalizeUser(cachedUser);
    isLoggedIn.value = !!token.value;
  }
  return { token, userInfo, isLoggedIn, setToken, setUser, logout };
});
exports.useUserStore = useUserStore;
