"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_merchant = require("../../stores/merchant.js");
const stores_user = require("../../stores/user.js");
const DEFAULT_MERCHANT_ID = "M_mock_001";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "create",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const merchantStore = stores_merchant.useMerchantStore();
    const merchantId = common_vendor.ref("");
    const merchantName = common_vendor.ref("美发工作室");
    const step = common_vendor.ref(1);
    const services = common_vendor.ref([]);
    const selectedService = common_vendor.ref(null);
    const dateList = common_vendor.ref([]);
    const selectedDateIndex = common_vendor.ref(0);
    const allSlots = common_vendor.ref([]);
    const selectedTime = common_vendor.ref("");
    const note = common_vendor.ref("");
    const contactName = common_vendor.ref("");
    const contactPhone = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const loadingSlots = common_vendor.ref(false);
    const slotsClosed = common_vendor.ref(false);
    const availableSlots = common_vendor.computed(() => allSlots.value.filter((s) => s.available));
    const selectedDateLabel = common_vendor.computed(() => {
      const d = dateList.value[selectedDateIndex.value];
      if (!d) return "";
      return `${d.date} ${d.weekday}`;
    });
    const selectedDate = common_vendor.computed(() => {
      var _a;
      return ((_a = dateList.value[selectedDateIndex.value]) == null ? void 0 : _a.date) || "";
    });
    function formatPrice(fen) {
      return (fen / 100).toFixed(0);
    }
    function formatDateStr(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    function generateDateList() {
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const list = [];
      for (let i = 0; i < 14; i++) {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() + i);
        const weekday = i === 0 ? "今天" : i === 1 ? "明天" : weekdays[date.getDay()];
        list.push({
          date: formatDateStr(date),
          weekday,
          day: date.getDate(),
          month: date.getMonth() + 1,
          closed: false
        });
      }
      return list;
    }
    function selectService(service) {
      selectedService.value = service;
    }
    function selectDate(index) {
      selectedDateIndex.value = index;
      selectedTime.value = "";
      loadSlots();
    }
    async function loadSlots() {
      var _a;
      if (!selectedDate.value || !merchantId.value) return;
      loadingSlots.value = true;
      slotsClosed.value = false;
      try {
        const data = await api_request.appointmentApi.getAvailableSlots({
          merchant_id: merchantId.value,
          date: selectedDate.value,
          service_id: ((_a = selectedService.value) == null ? void 0 : _a.service_id) || ""
        });
        if (data == null ? void 0 : data.closed) {
          slotsClosed.value = true;
          allSlots.value = [];
        } else {
          allSlots.value = (data == null ? void 0 : data.slots) || [];
        }
      } catch {
        allSlots.value = [];
      } finally {
        loadingSlots.value = false;
      }
    }
    async function onSubmit() {
      if (submitting.value) return;
      if (!selectedService.value || !selectedTime.value || !selectedDate.value) return;
      if (!merchantId.value) {
        common_vendor.index.showToast({ title: "门店信息异常，请返回重试", icon: "none" });
        return;
      }
      if (!contactName.value.trim()) {
        common_vendor.index.showToast({ title: "请输入联系人姓名", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(contactPhone.value.trim())) {
        common_vendor.index.showToast({ title: "请输入正确手机号", icon: "none" });
        return;
      }
      submitting.value = true;
      try {
        const data = await api_request.appointmentApi.create({
          merchant_id: merchantId.value,
          service_id: selectedService.value.service_id,
          date: selectedDate.value,
          start_time: selectedTime.value,
          customer_name: contactName.value.trim(),
          customer_phone: contactPhone.value.trim(),
          note: note.value || void 0
        });
        common_vendor.index.showToast({ title: "预约成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/appointment/list" });
        }, 1500);
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "预约失败", icon: "none" });
      } finally {
        submitting.value = false;
      }
    }
    async function ensureLogin() {
      if (userStore.isLoggedIn && userStore.token) {
        return true;
      }
      try {
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!(loginRes == null ? void 0 : loginRes.code)) {
          common_vendor.index.showToast({ title: "请先登录", icon: "none" });
          return false;
        }
        const data = await api_request.authApi.wechatLogin(loginRes.code);
        if ((data == null ? void 0 : data.token) && (data == null ? void 0 : data.user)) {
          userStore.setToken(data.token);
          userStore.setUser(data.user);
          return true;
        }
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return false;
      } catch {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return false;
      }
    }
    common_vendor.watch([step, selectedDate, selectedService], async ([currentStep]) => {
      if (currentStep === 2 && selectedService.value && selectedDate.value) {
        await loadSlots();
      }
    });
    common_vendor.onLoad(async (query) => {
      const ok = await ensureLogin();
      if (!ok) return;
      merchantId.value = (query == null ? void 0 : query.merchantId) || userStore.userInfo.merchant_id || DEFAULT_MERCHANT_ID;
      const preServiceId = (query == null ? void 0 : query.serviceId) || "";
      contactName.value = userStore.userInfo.realName || userStore.userInfo.nickname || "";
      contactPhone.value = userStore.userInfo.phone || "";
      if (merchantStore.merchantInfo.merchant_id === merchantId.value && merchantStore.merchantInfo.name) {
        merchantName.value = merchantStore.merchantInfo.name;
      } else if (merchantId.value) {
        try {
          const merchant = await api_request.merchantApi.getInfo(merchantId.value);
          merchantName.value = (merchant == null ? void 0 : merchant.name) || merchantName.value;
          merchantStore.setMerchant(merchant);
        } catch {
          merchantName.value = "黑白造型工作室";
        }
      }
      dateList.value = generateDateList();
      if (merchantId.value) {
        try {
          const data = await api_request.serviceApi.getList(merchantId.value);
          services.value = Array.isArray(data) ? data : [];
        } catch {
          services.value = [];
        }
      } else {
        services.value = [
          { service_id: "preset_1", name: "儿童剪发", category: "cut", price: 2e3, total_duration: 20, description: "儿童专属剪发服务" },
          { service_id: "preset_2", name: "男士剪发", category: "cut", price: 3e3, total_duration: 25, description: "男士精剪服务" },
          { service_id: "preset_3", name: "女士剪发", category: "cut", price: 5e3, total_duration: 30, description: "女士精剪造型服务" },
          { service_id: "preset_4", name: "染发", category: "dye", price: 15e3, total_duration: 80, description: "专业染发服务，含洗剪吹" },
          { service_id: "preset_5", name: "烫发", category: "perm", price: 2e4, total_duration: 75, description: "专业烫发服务，含造型" }
        ];
      }
      if (preServiceId) {
        const found = services.value.find((s) => s.service_id === preServiceId);
        if (found) {
          selectedService.value = found;
          step.value = 2;
          await loadSlots();
        }
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e;
      return common_vendor.e({
        a: common_vendor.t(merchantName.value),
        b: step.value >= 1 ? 1 : "",
        c: step.value > 1 ? 1 : "",
        d: step.value > 1 ? 1 : "",
        e: step.value >= 2 ? 1 : "",
        f: step.value > 2 ? 1 : "",
        g: step.value > 2 ? 1 : "",
        h: step.value >= 3 ? 1 : "",
        i: step.value === 1
      }, step.value === 1 ? common_vendor.e({
        j: services.value.length === 0
      }, services.value.length === 0 ? {} : {}, {
        k: common_vendor.f(services.value, (service, k0, i0) => {
          var _a2;
          return {
            a: common_vendor.t(service.name),
            b: common_vendor.t(service.description || ""),
            c: common_vendor.t(formatPrice(service.price)),
            d: common_vendor.t(service.total_duration),
            e: service.service_id,
            f: ((_a2 = selectedService.value) == null ? void 0 : _a2.service_id) === service.service_id ? 1 : "",
            g: common_vendor.o(($event) => selectService(service), service.service_id)
          };
        })
      }) : {}, {
        l: step.value === 2
      }, step.value === 2 ? common_vendor.e({
        m: common_vendor.t((_a = selectedService.value) == null ? void 0 : _a.name),
        n: common_vendor.t((_b = selectedService.value) == null ? void 0 : _b.total_duration),
        o: common_vendor.f(dateList.value, (day, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(day.weekday),
            b: common_vendor.t(day.day),
            c: common_vendor.t(day.month),
            d: day.closed
          }, day.closed ? {} : {}, {
            e: day.date,
            f: selectedDateIndex.value === index ? 1 : "",
            g: day.closed ? 1 : "",
            h: common_vendor.o(($event) => !day.closed && selectDate(index), day.date)
          });
        }),
        p: slotsClosed.value
      }, slotsClosed.value ? {} : {}, {
        q: loadingSlots.value
      }, loadingSlots.value ? {} : availableSlots.value.length === 0 && !slotsClosed.value ? {} : {
        s: common_vendor.f(allSlots.value, (slot, k0, i0) => {
          return {
            a: common_vendor.t(slot.start),
            b: slot.start,
            c: selectedTime.value === slot.start ? 1 : "",
            d: !slot.available ? 1 : "",
            e: common_vendor.o(($event) => slot.available && (selectedTime.value = slot.start), slot.start)
          };
        })
      }, {
        r: availableSlots.value.length === 0 && !slotsClosed.value
      }) : {}, {
        t: step.value === 3
      }, step.value === 3 ? {
        v: common_vendor.t((_c = selectedService.value) == null ? void 0 : _c.name),
        w: common_vendor.t((_d = selectedService.value) == null ? void 0 : _d.total_duration),
        x: common_vendor.t(formatPrice(((_e = selectedService.value) == null ? void 0 : _e.price) || 0)),
        y: common_vendor.t(selectedDateLabel.value),
        z: common_vendor.t(selectedTime.value),
        A: contactName.value,
        B: common_vendor.o(($event) => contactName.value = $event.detail.value),
        C: contactPhone.value,
        D: common_vendor.o(($event) => contactPhone.value = $event.detail.value),
        E: note.value,
        F: common_vendor.o(($event) => note.value = $event.detail.value)
      } : {}, {
        G: step.value === 1
      }, step.value === 1 ? {
        H: !selectedService.value,
        I: common_vendor.o(($event) => step.value = 2)
      } : {}, {
        J: step.value === 2
      }, step.value === 2 ? {
        K: common_vendor.o(($event) => step.value = 1)
      } : {}, {
        L: step.value === 2
      }, step.value === 2 ? {
        M: !selectedTime.value,
        N: common_vendor.o(($event) => step.value = 3)
      } : {}, {
        O: step.value === 3
      }, step.value === 3 ? {
        P: common_vendor.o(($event) => step.value = 2)
      } : {}, {
        Q: step.value === 3
      }, step.value === 3 ? {
        R: common_vendor.t(submitting.value ? "提交中..." : "确认预约"),
        S: submitting.value,
        T: common_vendor.o(onSubmit)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8ad5571f"]]);
wx.createPage(MiniProgramPage);
