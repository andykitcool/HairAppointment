"use strict";
const common_vendor = require("../common/vendor.js");
const MERCHANT_STORAGE_KEY = "merchant_info";
function normalizeMerchant(info = {}) {
  const merchantId = info.merchantId || info.merchant_id || "";
  const businessHours = info.businessHours || info.business_hours || { start: "09:00", end: "21:00" };
  const coverImage = info.coverImage || info.cover_image || "";
  return {
    merchantId,
    merchant_id: merchantId,
    name: info.name || "",
    address: info.address || "",
    phone: info.phone || "",
    businessHours,
    business_hours: businessHours,
    status: info.status || "active",
    coverImage,
    cover_image: coverImage
  };
}
const useMerchantStore = common_vendor.defineStore("merchant", () => {
  const merchantInfo = common_vendor.ref(normalizeMerchant());
  function setMerchant(info) {
    merchantInfo.value = normalizeMerchant(info);
    common_vendor.index.setStorageSync(MERCHANT_STORAGE_KEY, merchantInfo.value);
  }
  function clearMerchant() {
    merchantInfo.value = normalizeMerchant();
    common_vendor.index.removeStorageSync(MERCHANT_STORAGE_KEY);
  }
  const cachedMerchant = common_vendor.index.getStorageSync(MERCHANT_STORAGE_KEY);
  if (cachedMerchant) {
    merchantInfo.value = normalizeMerchant(cachedMerchant);
  }
  return { merchantInfo, setMerchant, clearMerchant };
});
exports.useMerchantStore = useMerchantStore;
