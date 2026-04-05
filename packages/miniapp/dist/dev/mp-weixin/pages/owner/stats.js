"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "stats",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const activePeriod = common_vendor.ref("week");
    const weekOffset = common_vendor.ref(0);
    const periods = [
      { key: "day", label: "日" },
      { key: "week", label: "周" },
      { key: "month", label: "月" }
    ];
    const statsData = common_vendor.ref({});
    const serviceRanking = common_vendor.ref([]);
    const dailyData = common_vendor.ref([]);
    const totalYuan = common_vendor.computed(() => ((statsData.value.totalRevenue || 0) / 100).toFixed(2));
    const avgYuan = common_vendor.computed(() => {
      const count = statsData.value.completedCount || 0;
      if (count === 0) return "0";
      return ((statsData.value.totalRevenue || 0) / count / 100).toFixed(0);
    });
    function getDateRange() {
      const now = /* @__PURE__ */ new Date();
      if (activePeriod.value === "day") {
        const d = formatDate(now);
        return { start: d, end: d };
      }
      if (activePeriod.value === "week") {
        const day = now.getDay() || 7;
        const start2 = new Date(now);
        start2.setDate(start2.getDate() - day + 1 + weekOffset.value * 7);
        const end2 = new Date(start2);
        end2.setDate(end2.getDate() + 6);
        return { start: formatDate(start2), end: formatDate(end2) };
      }
      const start = new Date(now.getFullYear(), now.getMonth() + weekOffset.value, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return { start: formatDate(start), end: formatDate(end) };
    }
    const displayDateRange = common_vendor.computed(() => {
      const r = getDateRange();
      return r.start === r.end ? r.start : `${r.start} ~ ${r.end}`;
    });
    function formatDate(d) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    function shortDate(dateStr) {
      const parts = dateStr.split("-");
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    function switchPeriod(key) {
      activePeriod.value = key;
      weekOffset.value = 0;
      loadData();
    }
    function shiftDate(dir) {
      if (dir > 0 && activePeriod.value === "day") return;
      weekOffset.value += dir;
      loadData();
    }
    function barHeight(amount) {
      const max = Math.max(...dailyData.value.map((d) => d.amount), 1);
      const pct = Math.round(amount / max * 100);
      return `${Math.max(pct, 8)}%`;
    }
    async function loadData() {
      const mid = userStore.userInfo.merchantId;
      if (!mid) return;
      const { start, end } = getDateRange();
      try {
        const data = await api_request.statsApi.getRevenueStats({ merchant_id: mid, start_date: start, end_date: end });
        statsData.value = (data == null ? void 0 : data.summary) || {};
        serviceRanking.value = (data == null ? void 0 : data.serviceRanking) || [];
        dailyData.value = (data == null ? void 0 : data.daily) || [];
      } catch {
        statsData.value = {};
        serviceRanking.value = [];
        dailyData.value = [];
      }
    }
    common_vendor.onShow(() => {
      weekOffset.value = 0;
      loadData();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(periods, (p, k0, i0) => {
          return {
            a: common_vendor.t(p.label),
            b: p.key,
            c: activePeriod.value === p.key ? 1 : "",
            d: common_vendor.o(($event) => switchPeriod(p.key), p.key)
          };
        }),
        b: common_vendor.o(($event) => shiftDate(-1)),
        c: common_vendor.t(displayDateRange.value),
        d: common_vendor.o(($event) => shiftDate(1)),
        e: common_vendor.t(totalYuan.value),
        f: common_vendor.t(statsData.value.appointmentCount || 0),
        g: common_vendor.t(statsData.value.completedCount || 0),
        h: common_vendor.t(avgYuan.value),
        i: common_vendor.t(statsData.value.cancelCount || 0),
        j: serviceRanking.value.length === 0
      }, serviceRanking.value.length === 0 ? {} : {}, {
        k: common_vendor.f(serviceRanking.value, (item, idx, i0) => {
          return {
            a: common_vendor.t(idx + 1),
            b: idx < 3 ? 1 : "",
            c: common_vendor.t(item.service_name),
            d: common_vendor.t(item.count),
            e: common_vendor.t((item.amount / 100).toFixed(0)),
            f: item.service_name
          };
        }),
        l: dailyData.value.length > 1
      }, dailyData.value.length > 1 ? {
        m: common_vendor.f(dailyData.value, (d, k0, i0) => {
          return {
            a: common_vendor.t((d.amount / 100).toFixed(0)),
            b: barHeight(d.amount),
            c: common_vendor.t(shortDate(d.date)),
            d: d.date
          };
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-809497f6"]]);
wx.createPage(MiniProgramPage);
