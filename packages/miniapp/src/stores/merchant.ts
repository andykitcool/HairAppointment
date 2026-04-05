import { defineStore } from 'pinia'
import { ref } from 'vue'

const MERCHANT_STORAGE_KEY = 'merchant_info'

function normalizeMerchant(info: any = {}) {
  const merchantId = info.merchantId || info.merchant_id || ''
  const businessHours = info.businessHours || info.business_hours || { start: '09:00', end: '21:00' }
  const coverImage = info.coverImage || info.cover_image || ''

  return {
    merchantId,
    merchant_id: merchantId,
    name: info.name || '',
    address: info.address || '',
    phone: info.phone || '',
    businessHours,
    business_hours: businessHours,
    status: info.status || 'active',
    coverImage,
    cover_image: coverImage,
  }
}

export const useMerchantStore = defineStore('merchant', () => {
  const merchantInfo = ref(normalizeMerchant())

  function setMerchant(info: any) {
    merchantInfo.value = normalizeMerchant(info)
    uni.setStorageSync(MERCHANT_STORAGE_KEY, merchantInfo.value)
  }

  function clearMerchant() {
    merchantInfo.value = normalizeMerchant()
    uni.removeStorageSync(MERCHANT_STORAGE_KEY)
  }

  const cachedMerchant = uni.getStorageSync(MERCHANT_STORAGE_KEY)
  if (cachedMerchant) {
    merchantInfo.value = normalizeMerchant(cachedMerchant)
  }

  return { merchantInfo, setMerchant, clearMerchant }
})
