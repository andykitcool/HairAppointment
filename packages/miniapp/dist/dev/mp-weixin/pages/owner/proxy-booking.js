"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "proxy-booking",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const services = common_vendor.ref([]);
    const selectedService = common_vendor.ref(null);
    const selectedDate = common_vendor.ref("");
    const selectedTime = common_vendor.ref("");
    const slotsLoading = common_vendor.ref(false);
    const availableSlots = common_vendor.ref([]);
    const customerName = common_vendor.ref("");
    const customerPhone = common_vendor.ref("");
    const note = common_vendor.ref("");
    const today = /* @__PURE__ */ new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const canSubmit = common_vendor.computed(
      () => selectedService.value && selectedDate.value && selectedTime.value && customerName.value.trim()
    );
    async function loadServices() {
      try {
        const data = await api_request.serviceApi.getList(userStore.userInfo.merchantId);
        services.value = Array.isArray(data) ? data : (data == null ? void 0 : data.list) || [];
      } catch {
        services.value = [];
      }
    }
    async function onDateChange(e) {
      selectedDate.value = e.detail.value;
      selectedTime.value = "";
      await loadSlots();
    }
    async function loadSlots() {
      if (!selectedService.value || !selectedDate.value) return;
      slotsLoading.value = true;
      try {
        const data = await api_request.appointmentApi.getAvailableSlots({
          merchant_id: userStore.userInfo.merchantId,
          service_id: selectedService.value._id,
          date: selectedDate.value
        });
        availableSlots.value = Array.isArray(data) ? data : (data == null ? void 0 : data.slots) || [];
      } catch {
        availableSlots.value = [];
      } finally {
        slotsLoading.value = false;
      }
    }
    async function onSubmit() {
      if (!customerName.value.trim()) return common_vendor.index.showToast({ title: "请输入客户姓名", icon: "none" });
      try {
        await api_request.appointmentApi.create({
          merchant_id: userStore.userInfo.merchantId,
          service_id: selectedService.value._id,
          date: selectedDate.value,
          start_time: selectedTime.value,
          customer_name: customerName.value.trim(),
          customer_phone: customerPhone.value.trim() || void 0,
          note: note.value.trim() || void 0,
          source: "mini_program"
        });
        common_vendor.index.showToast({ title: "预约创建成功", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "创建失败", icon: "none" });
      }
    }
    loadServices();
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(services.value, (s, k0, i0) => {
          var _a;
          return {
            a: common_vendor.t(s.name),
            b: common_vendor.t((s.price / 100).toFixed(0)),
            c: s._id,
            d: ((_a = selectedService.value) == null ? void 0 : _a._id) === s._id ? 1 : "",
            e: common_vendor.o(($event) => selectedService.value = s, s._id)
          };
        }),
        b: selectedService.value
      }, selectedService.value ? common_vendor.e({
        c: common_vendor.t(selectedDate.value || "请选择日期"),
        d: todayStr,
        e: common_vendor.o(onDateChange),
        f: !selectedDate.value
      }, !selectedDate.value ? {} : slotsLoading.value ? {} : availableSlots.value.length === 0 ? {} : {
        i: common_vendor.f(availableSlots.value, (slot, k0, i0) => {
          return {
            a: common_vendor.t(slot.start_time),
            b: slot.start_time,
            c: selectedTime.value === slot.start_time ? 1 : "",
            d: !slot.available ? 1 : "",
            e: common_vendor.o(($event) => slot.available && (selectedTime.value = slot.start_time), slot.start_time)
          };
        })
      }, {
        g: slotsLoading.value,
        h: availableSlots.value.length === 0
      }) : {}, {
        j: selectedService.value && selectedDate.value && selectedTime.value
      }, selectedService.value && selectedDate.value && selectedTime.value ? {
        k: customerName.value,
        l: common_vendor.o(($event) => customerName.value = $event.detail.value),
        m: customerPhone.value,
        n: common_vendor.o(($event) => customerPhone.value = $event.detail.value),
        o: note.value,
        p: common_vendor.o(($event) => note.value = $event.detail.value)
      } : {}, {
        q: canSubmit.value
      }, canSubmit.value ? {
        r: common_vendor.o(onSubmit)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-74ba1b7b"]]);
wx.createPage(MiniProgramPage);
