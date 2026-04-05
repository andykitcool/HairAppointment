"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "schedule",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const mid = userStore.userInfo.merchantId;
    const businessHours = common_vendor.ref({ start: "09:00", end: "21:00" });
    const extList = common_vendor.ref([]);
    const closedList = common_vendor.ref([]);
    const extFormVisible = common_vendor.ref(false);
    const extForm = common_vendor.ref({ start_date: "", end_date: "", extended_end: "" });
    const closedFormVisible = common_vendor.ref(false);
    const closedForm = common_vendor.ref({ date: "", type: "full_day", start_time: "", end_time: "", reason: "" });
    function showExtForm(_item) {
      extForm.value = { start_date: "", end_date: "", extended_end: "" };
      extFormVisible.value = true;
    }
    function showClosedForm() {
      closedForm.value = { date: "", type: "full_day", start_time: "", end_time: "", reason: "" };
      closedFormVisible.value = true;
    }
    async function loadData() {
      try {
        const data = await api_request.merchantApi.getInfo(mid);
        if (data == null ? void 0 : data.business_hours) {
          businessHours.value = data.business_hours;
        }
        extList.value = (data == null ? void 0 : data.extended_hours) || [];
      } catch {
      }
      try {
        const cData = await api_request.merchantApi.getClosedPeriods(mid);
        closedList.value = Array.isArray(cData) ? cData : (cData == null ? void 0 : cData.list) || [];
      } catch {
        closedList.value = [];
      }
    }
    async function saveBusinessHours() {
      try {
        await api_request.merchantApi.update(mid, { business_hours: businessHours.value });
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    async function saveExtHours() {
      const { start_date, end_date, extended_end } = extForm.value;
      if (!start_date || !end_date || !extended_end) return common_vendor.index.showToast({ title: "请填写完整", icon: "none" });
      try {
        await api_request.merchantApi.setExtendedHours(mid, { start_date, end_date, extended_end });
        common_vendor.index.showToast({ title: "已添加", icon: "success" });
        extFormVisible.value = false;
        await loadData();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    async function deleteExt(idx) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除此延长营业设置？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await api_request.merchantApi.deleteExtendedHours(mid, idx);
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
              await loadData();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message, icon: "none" });
            }
          }
        }
      });
    }
    async function saveClosedPeriod() {
      const { date, type, start_time, end_time, reason } = closedForm.value;
      if (!date) return common_vendor.index.showToast({ title: "请选择日期", icon: "none" });
      if (type === "time_range" && (!start_time || !end_time)) return common_vendor.index.showToast({ title: "请选择时间段", icon: "none" });
      try {
        await api_request.merchantApi.createClosedPeriod(mid, {
          date,
          type,
          start_time: type === "time_range" ? start_time : void 0,
          end_time: type === "time_range" ? end_time : void 0,
          reason: reason || void 0
        });
        common_vendor.index.showToast({ title: "已添加", icon: "success" });
        closedFormVisible.value = false;
        await loadData();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    async function deleteClosed(item) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "删除此打烊设置？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await api_request.merchantApi.deleteClosedPeriod(mid, item._id);
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
              await loadData();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message, icon: "none" });
            }
          }
        }
      });
    }
    common_vendor.onShow(() => loadData());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(businessHours.value.start),
        b: businessHours.value.start,
        c: common_vendor.o(($event) => businessHours.value.start = $event.detail.value),
        d: common_vendor.t(businessHours.value.end),
        e: businessHours.value.end,
        f: common_vendor.o(($event) => businessHours.value.end = $event.detail.value),
        g: common_vendor.o(saveBusinessHours),
        h: common_vendor.o(($event) => showExtForm()),
        i: extList.value.length === 0
      }, extList.value.length === 0 ? {} : {}, {
        j: common_vendor.f(extList.value, (ext, idx, i0) => {
          return {
            a: common_vendor.t(ext.start_date),
            b: common_vendor.t(ext.end_date),
            c: common_vendor.t(ext.extended_end),
            d: common_vendor.o(($event) => deleteExt(idx), idx),
            e: idx
          };
        }),
        k: common_vendor.o(showClosedForm),
        l: closedList.value.length === 0
      }, closedList.value.length === 0 ? {} : {}, {
        m: common_vendor.f(closedList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.date),
            b: common_vendor.t(item.type === "full_day" ? "全天休息" : `${item.start_time} ~ ${item.end_time}`),
            c: item.reason
          }, item.reason ? {
            d: common_vendor.t(item.reason)
          } : {}, {
            e: common_vendor.o(($event) => deleteClosed(item), item._id),
            f: item._id
          });
        }),
        n: extFormVisible.value
      }, extFormVisible.value ? {
        o: common_vendor.t(extForm.value.start_date || "选择开始日期"),
        p: common_vendor.o(($event) => extForm.value.start_date = $event.detail.value),
        q: common_vendor.t(extForm.value.end_date || "选择结束日期"),
        r: common_vendor.o(($event) => extForm.value.end_date = $event.detail.value),
        s: common_vendor.t(extForm.value.extended_end || "选择时间"),
        t: common_vendor.o(($event) => extForm.value.extended_end = $event.detail.value),
        v: common_vendor.o(saveExtHours),
        w: common_vendor.o(() => {
        }),
        x: common_vendor.o(($event) => extFormVisible.value = false)
      } : {}, {
        y: closedFormVisible.value
      }, closedFormVisible.value ? common_vendor.e({
        z: common_vendor.t(closedForm.value.date || "选择日期"),
        A: common_vendor.o(($event) => closedForm.value.date = $event.detail.value),
        B: closedForm.value.type === "full_day" ? 1 : "",
        C: common_vendor.o(($event) => closedForm.value.type = "full_day"),
        D: closedForm.value.type === "time_range" ? 1 : "",
        E: common_vendor.o(($event) => closedForm.value.type = "time_range"),
        F: closedForm.value.type === "time_range"
      }, closedForm.value.type === "time_range" ? {
        G: common_vendor.t(closedForm.value.start_time || "选择"),
        H: common_vendor.o(($event) => closedForm.value.start_time = $event.detail.value),
        I: common_vendor.t(closedForm.value.end_time || "选择"),
        J: common_vendor.o(($event) => closedForm.value.end_time = $event.detail.value)
      } : {}, {
        K: closedForm.value.reason,
        L: common_vendor.o(($event) => closedForm.value.reason = $event.detail.value),
        M: common_vendor.o(saveClosedPeriod),
        N: common_vendor.o(() => {
        }),
        O: common_vendor.o(($event) => closedFormVisible.value = false)
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6483e5a3"]]);
wx.createPage(MiniProgramPage);
