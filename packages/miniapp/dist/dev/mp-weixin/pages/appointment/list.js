"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "list",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const currentTab = common_vendor.ref("pending");
    const loading = common_vendor.ref(false);
    const expandedId = common_vendor.ref("");
    const tabs = common_vendor.ref([
      { key: "pending", label: "待确认", count: 0 },
      { key: "confirmed", label: "已确认", count: 0 },
      { key: "completed", label: "已完成", count: 0 },
      { key: "cancelled", label: "已取消", count: 0 }
    ]);
    const statusMap = {
      pending: "待确认",
      confirmed: "已确认",
      in_progress: "服务中",
      completed: "已完成",
      cancelled: "已取消",
      no_show: "未到店"
    };
    const appointmentList = common_vendor.ref([]);
    const currentTabLabel = common_vendor.computed(() => {
      const tab = tabs.value.find((t) => t.key === currentTab.value);
      return (tab == null ? void 0 : tab.label) || "";
    });
    const filteredList = common_vendor.computed(() => {
      return appointmentList.value.filter((i) => i.status === currentTab.value);
    });
    async function ensureLogin() {
      if (userStore.isLoggedIn && userStore.token) {
        return true;
      }
      try {
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!(loginRes == null ? void 0 : loginRes.code)) {
          return false;
        }
        const data = await api_request.authApi.wechatLogin(loginRes.code);
        if ((data == null ? void 0 : data.token) && (data == null ? void 0 : data.user)) {
          userStore.setToken(data.token);
          userStore.setUser(data.user);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    function canCancel(item) {
      return ["pending", "confirmed"].includes(item.status);
    }
    function switchTab(key) {
      currentTab.value = key;
    }
    function toggleExpand(item) {
      const id = item._id || item.appointment_id;
      expandedId.value = expandedId.value === id ? "" : id;
    }
    async function loadAppointments() {
      loading.value = true;
      try {
        const data = await api_request.appointmentApi.getList({ pageSize: 50 });
        const list = (data == null ? void 0 : data.list) || (Array.isArray(data) ? data : []);
        appointmentList.value = list;
        tabs.value = tabs.value.map((tab) => ({
          ...tab,
          count: list.filter((i) => i.status === tab.key).length
        }));
      } catch {
        appointmentList.value = [];
      } finally {
        loading.value = false;
      }
    }
    async function onCancel(item) {
      common_vendor.index.showModal({
        title: "确认取消",
        content: `确定要取消预约「${item.service_name}」吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const id = item.appointment_id || item._id;
              await api_request.appointmentApi.cancel(id);
              common_vendor.index.showToast({ title: "已取消", icon: "success" });
              await loadAppointments();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message || "取消失败", icon: "none" });
            }
          }
        }
      });
    }
    function goBooking() {
      common_vendor.index.switchTab({ url: "/pages/index/index" });
    }
    common_vendor.onShow(async () => {
      const ok = await ensureLogin();
      if (!ok) {
        appointmentList.value = [];
        return;
      }
      loadAppointments();
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadAppointments();
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(tabs.value, (tab, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(tab.label),
            b: tab.count > 0
          }, tab.count > 0 ? {
            c: common_vendor.t(tab.count > 99 ? "99+" : tab.count)
          } : {}, {
            d: currentTab.value === tab.key
          }, currentTab.value === tab.key ? {} : {}, {
            e: tab.key,
            f: currentTab.value === tab.key ? 1 : "",
            g: common_vendor.o(($event) => switchTab(tab.key), tab.key)
          });
        }),
        b: !loading.value && filteredList.value.length === 0
      }, !loading.value && filteredList.value.length === 0 ? common_vendor.e({
        c: common_vendor.t(currentTab.value === "all" ? "暂无预约记录" : `暂无${currentTabLabel.value}`),
        d: currentTab.value !== "completed" && currentTab.value !== "cancelled"
      }, currentTab.value !== "completed" && currentTab.value !== "cancelled" ? {
        e: common_vendor.o(goBooking)
      } : {}) : {}, {
        f: loading.value
      }, loading.value ? {} : {}, {
        g: !loading.value && filteredList.value.length > 0
      }, !loading.value && filteredList.value.length > 0 ? {
        h: common_vendor.f(filteredList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.service_name),
            b: common_vendor.t(statusMap[item.status] || item.status),
            c: common_vendor.n(item.status),
            d: common_vendor.t(item.appointment_id),
            e: common_vendor.t(item.date),
            f: common_vendor.t(item.start_time),
            g: common_vendor.t(item.end_time),
            h: expandedId.value === (item._id || item.appointment_id)
          }, expandedId.value === (item._id || item.appointment_id) ? common_vendor.e({
            i: common_vendor.t(item.staff_name),
            j: item.note
          }, item.note ? {
            k: common_vendor.t(item.note)
          } : {}, {
            l: item.timeline && item.timeline.length > 0
          }, item.timeline && item.timeline.length > 0 ? {
            m: common_vendor.f(item.timeline, (stage, idx, i1) => {
              return {
                a: stage.staff_busy ? 1 : "",
                b: common_vendor.t(stage.stage_name),
                c: common_vendor.t(stage.start),
                d: common_vendor.t(stage.end),
                e: idx
              };
            })
          } : {}, {
            n: canCancel(item)
          }, canCancel(item) ? {
            o: common_vendor.o(($event) => onCancel(item), item._id || item.appointment_id)
          } : {}) : {}, {
            p: common_vendor.t(expandedId.value === (item._id || item.appointment_id) ? "收起" : "详情"),
            q: item._id || item.appointment_id,
            r: common_vendor.o(($event) => toggleExpand(item), item._id || item.appointment_id)
          });
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6e84a449"]]);
wx.createPage(MiniProgramPage);
