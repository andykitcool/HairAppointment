import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMerchantStore = defineStore('merchant', () => {
  const merchantInfo = ref({
    merchantId: '',
    name: '',
    address: '',
    phone: '',
    businessHours: { start: '09:00', end: '21:00' },
    status: 'active',
    coverImage: ''
  })

  function setMerchant(info: any) {
    merchantInfo.value = info
  }

  return { merchantInfo, setMerchant }
})
