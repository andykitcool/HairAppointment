"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "notifications",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const targets = [
      { key: "all", label: "全部顾客" },
      { key: "recent_7d", label: "近7天到店" },
      { key: "recent_30d", label: "近30天到店" },
      { key: "vip", label: "消费超500元" }
    ];
    const form = common_vendor.ref({
      target: "all",
      content: ""
    });
    const canSend = common_vendor.computed(() => form.value.content.trim().length > 0);
    const historyList = common_vendor.ref([]);
    function getTargetLabel(key) {
      var _a;
      return ((_a = targets.find((t) => t.key === key)) == null ? void 0 : _a.label) || key;
    }
    function getStatusLabel(status) {
      const map = { success: "发送成功", failed: "发送失败", pending: "发送中" };
      return map[status] || status;
    }
    function formatTime(time) {
      if (!time) return "";
      const d = new Date(time);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${mm}-${dd} ${hh}:${mi}`;
    }
    async function onSend() {
      if (!canSend.value) return;
      common_vendor.index.showModal({
        title: "确认发送",
        content: `向「${getTargetLabel(form.value.target)}」发送通知？`,
        success: async (res) => {
          if (!res.confirm) return;
          common_vendor.index.showLoading({ title: "发送中..." });
          try {
            await api_request.notificationApi.broadcast({
              merchant_id: userStore.userInfo.merchantId,
              target: form.value.target,
              content: form.value.content.trim()
            });
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "发送成功", icon: "success" });
            form.value.content = "";
            await loadHistory();
          } catch (err) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: err.message || "发送失败", icon: "none" });
          }
        }
      });
    }
    async function loadHistory() {
      const mid = userStore.userInfo.merchantId;
      if (!mid) return;
      try {
        const data = await api_request.notificationApi.broadcast({ merchant_id: mid, action: "history" });
        historyList.value = (data == null ? void 0 : data.list) || [];
      } catch {
        historyList.value = [];
      }
    }
    common_vendor.onShow(() => loadHistory());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(targets, (t, k0, i0) => {
          return {
            a: common_vendor.t(t.label),
            b: t.key,
            c: form.value.target === t.key ? 1 : "",
            d: common_vendor.o(($event) => form.value.target = t.key, t.key)
          };
        }),
        b: form.value.content,
        c: common_vendor.o(($event) => form.value.content = $event.detail.value),
        d: common_vendor.t(form.value.content.length),
        e: !canSend.value ? 1 : "",
        f: common_vendor.o(onSend),
        g: historyList.value.length === 0
      }, historyList.value.length === 0 ? {} : {}, {
        h: common_vendor.f(historyList.value, (item, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getTargetLabel(item.target)),
            b: common_vendor.t(formatTime(item.create_time)),
            c: common_vendor.t(item.content),
            d: common_vendor.t(getStatusLabel(item.status)),
            e: common_vendor.n(item.status),
            f: item.sent_count
          }, item.sent_count ? {
            g: common_vendor.t(item.sent_count)
          } : {}, {
            h: item._id
          });
        })
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a782a3cc"]]);
wx.createPage(MiniProgramPage);
