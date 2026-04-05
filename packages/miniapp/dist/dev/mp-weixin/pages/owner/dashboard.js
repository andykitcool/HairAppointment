"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "dashboard",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const merchantName = common_vendor.computed(() => userStore.userInfo.nickname || "我的店铺");
    const todayStats = common_vendor.ref({ appointments: 0, revenue: 0 });
    const todayList = common_vendor.ref([]);
    const todayLabel = common_vendor.computed(() => {
      const d = /* @__PURE__ */ new Date();
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
    });
    const pendingList = common_vendor.computed(() => todayList.value.filter((i) => i.status === "pending"));
    const pendingCount = common_vendor.computed(() => pendingList.value.length);
    const completedCount = common_vendor.computed(() => todayList.value.filter((i) => i.status === "completed").length);
    function formatMoney(fen) {
      return (fen / 100).toFixed(0);
    }
    function formatDateStr(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    async function loadData() {
      const today = formatDateStr(/* @__PURE__ */ new Date());
      const mid = userStore.userInfo.merchantId;
      if (!mid) return;
      try {
        const [aptData, statsData] = await Promise.all([
          api_request.appointmentApi.getList({ merchant_id: mid, date: today, pageSize: 50 }),
          api_request.statsApi.getRevenueStats({ merchant_id: mid, start_date: today, end_date: today })
        ]);
        todayList.value = (aptData == null ? void 0 : aptData.list) || (Array.isArray(aptData) ? aptData : []);
        todayStats.value = statsData || { appointments: 0, revenue: 0 };
      } catch {
        todayList.value = [];
      }
    }
    async function confirmApt(item) {
      try {
        await api_request.appointmentApi.confirm(item.appointment_id);
        common_vendor.index.showToast({ title: "已确认", icon: "success" });
        await loadData();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "操作失败", icon: "none" });
      }
    }
    async function cancelApt(item) {
      common_vendor.index.showModal({
        title: "确认取消",
        content: `取消 ${item.customer_name} 的 ${item.service_name} 预约？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await api_request.appointmentApi.cancel(item.appointment_id);
              common_vendor.index.showToast({ title: "已取消", icon: "success" });
              await loadData();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message || "取消失败", icon: "none" });
            }
          }
        }
      });
    }
    function goAppointment() {
    }
    function goAllAppointments() {
      common_vendor.index.navigateTo({ url: "/pages/owner/appointments" });
    }
    common_vendor.onShow(() => loadData());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(todayLabel.value),
        b: common_vendor.t(merchantName.value),
        c: common_vendor.t(todayStats.value.appointments || 0),
        d: common_vendor.t(pendingCount.value),
        e: common_vendor.t(formatMoney(todayStats.value.revenue || 0)),
        f: common_vendor.t(completedCount.value),
        g: pendingList.value.length === 0
      }, pendingList.value.length === 0 ? {} : {}, {
        h: common_vendor.f(pendingList.value.slice(0, 5), (item, k0, i0) => {
          return {
            a: common_vendor.t(item.customer_name),
            b: common_vendor.t(item.service_name),
            c: common_vendor.t(item.start_time),
            d: common_vendor.o(($event) => confirmApt(item), item.appointment_id),
            e: common_vendor.o(($event) => cancelApt(item), item.appointment_id),
            f: item.appointment_id,
            g: common_vendor.o(goAppointment, item.appointment_id)
          };
        }),
        i: common_vendor.o(goAllAppointments),
        j: todayList.value.length === 0
      }, todayList.value.length === 0 ? {} : {}, {
        k: common_vendor.f(todayList.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.start_time),
            b: common_vendor.t(item.end_time),
            c: common_vendor.t(item.customer_name),
            d: common_vendor.t(item.service_name),
            e: common_vendor.n(item.status),
            f: item.appointment_id
          };
        })
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c74391e7"]]);
wx.createPage(MiniProgramPage);
