"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "appointments",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const currentStatus = common_vendor.ref("all");
    const filterDate = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const statusTabs = [
      { key: "all", label: "全部" },
      { key: "pending", label: "待确认" },
      { key: "confirmed", label: "已确认" },
      { key: "in_progress", label: "服务中" },
      { key: "completed", label: "已完成" }
    ];
    const statusMap = {
      pending: "待确认",
      confirmed: "已确认",
      in_progress: "服务中",
      completed: "已完成",
      cancelled: "已取消",
      no_show: "未到店"
    };
    const filteredList = common_vendor.computed(() => {
      if (currentStatus.value === "all") return list.value;
      return list.value.filter((i) => i.status === currentStatus.value);
    });
    function onDateChange(e) {
      filterDate.value = e.detail.value;
      loadData();
    }
    async function loadData() {
      loading.value = true;
      try {
        const params = { merchant_id: userStore.userInfo.merchantId, pageSize: 100 };
        if (filterDate.value) params.date = filterDate.value;
        const data = await api_request.appointmentApi.getList(params);
        list.value = (data == null ? void 0 : data.list) || (Array.isArray(data) ? data : []);
      } catch {
        list.value = [];
      } finally {
        loading.value = false;
      }
    }
    async function onConfirm(item) {
      try {
        await api_request.appointmentApi.confirm(item.appointment_id);
        common_vendor.index.showToast({ title: "已确认", icon: "success" });
        await loadData();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    async function onStart(item) {
      try {
        await api_request.appointmentApi.update(item.appointment_id, { status: "in_progress" });
        common_vendor.index.showToast({ title: "服务已开始", icon: "success" });
        await loadData();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    function onCancel(item) {
      common_vendor.index.showModal({
        title: "确认取消",
        content: `取消 ${item.customer_name} 的预约？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await api_request.appointmentApi.cancel(item.appointment_id);
              common_vendor.index.showToast({ title: "已取消", icon: "success" });
              await loadData();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message, icon: "none" });
            }
          }
        }
      });
    }
    function callCustomer(item) {
      common_vendor.index.makePhoneCall({ phoneNumber: item.customer_phone });
    }
    common_vendor.onShow(() => loadData());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(statusTabs, (tab, k0, i0) => {
          return {
            a: common_vendor.t(tab.label),
            b: tab.key,
            c: currentStatus.value === tab.key ? 1 : "",
            d: common_vendor.o(($event) => currentStatus.value = tab.key, tab.key)
          };
        }),
        b: common_vendor.t(filterDate.value || "选择日期"),
        c: filterDate.value,
        d: common_vendor.o(onDateChange),
        e: loading.value
      }, loading.value ? {} : filteredList.value.length === 0 ? {} : {
        g: common_vendor.f(filteredList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.appointment_id),
            b: common_vendor.t(statusMap[item.status]),
            c: common_vendor.n(item.status),
            d: common_vendor.t(item.customer_name),
            e: common_vendor.t(item.date),
            f: common_vendor.t(item.start_time),
            g: common_vendor.t(item.end_time),
            h: common_vendor.t(item.service_name),
            i: item.staff_name
          }, item.staff_name ? {
            j: common_vendor.t(item.staff_name)
          } : {}, {
            k: item.status === "pending"
          }, item.status === "pending" ? {
            l: common_vendor.o(($event) => onConfirm(item), item.appointment_id)
          } : {}, {
            m: item.status === "confirmed"
          }, item.status === "confirmed" ? {
            n: common_vendor.o(($event) => onStart(item), item.appointment_id)
          } : {}, {
            o: ["pending", "confirmed"].includes(item.status)
          }, ["pending", "confirmed"].includes(item.status) ? {
            p: common_vendor.o(($event) => onCancel(item), item.appointment_id)
          } : {}, {
            q: item.customer_phone
          }, item.customer_phone ? {
            r: common_vendor.o(($event) => callCustomer(item), item.appointment_id)
          } : {}, {
            s: item.appointment_id
          });
        })
      }, {
        f: filteredList.value.length === 0
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b5aa9cd2"]]);
wx.createPage(MiniProgramPage);
