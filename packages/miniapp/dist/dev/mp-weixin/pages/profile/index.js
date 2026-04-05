"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_merchant = require("../../stores/merchant.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const merchantStore = stores_merchant.useMerchantStore();
    const isLoggedIn = common_vendor.computed(() => userStore.isLoggedIn);
    const isOwner = common_vendor.computed(() => userStore.userInfo.role === "owner");
    const userInfo = common_vendor.computed(() => userStore.userInfo);
    const useMock = common_vendor.ref(true);
    const apiBaseUrl = common_vendor.ref("");
    const apiModeLabel = common_vendor.computed(() => useMock.value ? "Mock 模式" : "真实接口");
    function syncApiEnv() {
      const env = api_request.getApiEnv();
      useMock.value = env.useMock;
      apiBaseUrl.value = env.baseUrl;
    }
    function maskPhone(phone) {
      if (!phone || phone.length < 7) return phone;
      return phone.slice(0, 3) + "****" + phone.slice(-4);
    }
    function formatSpending(fen) {
      return (fen / 100).toFixed(0);
    }
    async function loadProfile() {
      if (!userStore.isLoggedIn) {
        await autoLogin();
        return;
      }
      try {
        const data = await api_request.authApi.getProfile();
        userStore.setUser(data);
      } catch {
        await autoLogin();
      }
    }
    async function autoLogin() {
      try {
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!(loginRes == null ? void 0 : loginRes.code)) {
          console.log("uni.login failed: missing code");
          return;
        }
        const data = await api_request.authApi.wechatLogin(loginRes.code);
        if ((data == null ? void 0 : data.token) && (data == null ? void 0 : data.user)) {
          userStore.setToken(data.token);
          userStore.setUser(data.user);
        }
      } catch (err) {
        console.log("Auto login failed:", err);
      }
    }
    function onTapAvatar() {
      if (!isLoggedIn.value) {
        autoLogin();
        return;
      }
      common_vendor.index.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sizeType: ["compressed"],
        success: async (res) => {
          var _a;
          const tempFilePath = (_a = res.tempFiles[0]) == null ? void 0 : _a.tempFilePath;
          if (tempFilePath) {
            common_vendor.index.showToast({ title: "头像更新功能开发中", icon: "none" });
          }
        }
      });
    }
    function editNote() {
      if (!isLoggedIn.value) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      common_vendor.index.showModal({
        title: "我的备注",
        editable: true,
        placeholderText: "记录您的发型偏好等",
        content: userInfo.value.customerNote || "",
        success: async (res) => {
          if (res.confirm && res.content !== void 0) {
            try {
              await api_request.authApi.updateProfile({ customer_note: res.content });
              userStore.setUser({ ...userInfo.value, customerNote: res.content });
              common_vendor.index.showToast({ title: "已保存", icon: "success" });
            } catch {
              common_vendor.index.showToast({ title: "保存失败", icon: "none" });
            }
          }
        }
      });
    }
    function navigateTo(url) {
      common_vendor.index.navigateTo({ url });
    }
    function onLogout() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            userStore.logout();
            merchantStore.clearMerchant();
            common_vendor.index.showToast({ title: "已退出", icon: "success" });
          }
        }
      });
    }
    function onMockToggle(event) {
      const enabled = !!event.detail.value;
      api_request.setMockEnabled(enabled);
      syncApiEnv();
      common_vendor.index.showToast({ title: enabled ? "已切换为 Mock" : "已切换为真实接口", icon: "none" });
    }
    function editBaseUrl() {
      common_vendor.index.showModal({
        title: "设置接口地址",
        editable: true,
        placeholderText: "例如 http://localhost:3000/api",
        content: apiBaseUrl.value,
        success: (res) => {
          if (!res.confirm || res.content === void 0) {
            return;
          }
          api_request.setApiBaseUrl(res.content);
          syncApiEnv();
          common_vendor.index.showToast({ title: "接口地址已更新", icon: "success" });
        }
      });
    }
    function resetMockData() {
      api_request.resetMockDb();
      merchantStore.clearMerchant();
      common_vendor.index.showToast({ title: "Mock 数据已重置", icon: "success" });
    }
    common_vendor.onShow(() => {
      syncApiEnv();
      loadProfile();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: userInfo.value.avatarUrl
      }, userInfo.value.avatarUrl ? {
        b: userInfo.value.avatarUrl
      } : {
        c: common_vendor.t(((_a = userInfo.value.nickname) == null ? void 0 : _a.charAt(0)) || "?")
      }, {
        d: !isLoggedIn.value
      }, !isLoggedIn.value ? {} : {}, {
        e: common_vendor.o(onTapAvatar),
        f: common_vendor.t(userInfo.value.nickname || "微信用户"),
        g: userInfo.value.phone
      }, userInfo.value.phone ? {
        h: common_vendor.t(maskPhone(userInfo.value.phone))
      } : {}, {
        i: userInfo.value.role === "owner"
      }, userInfo.value.role === "owner" ? {} : {}, {
        j: common_vendor.t(formatSpending(userInfo.value.totalSpending || 0)),
        k: common_vendor.t(userInfo.value.visitCount || 0),
        l: isOwner.value
      }, isOwner.value ? {
        m: common_vendor.o(($event) => navigateTo("/pages/owner/dashboard"))
      } : {}, {
        n: !isOwner.value
      }, !isOwner.value ? {
        o: common_vendor.o(($event) => navigateTo("/pages/owner/apply"))
      } : {}, {
        p: isOwner.value
      }, isOwner.value ? {
        q: common_vendor.o(($event) => navigateTo("/pages/owner/customers"))
      } : {}, {
        r: isOwner.value
      }, isOwner.value ? {
        s: common_vendor.o(($event) => navigateTo("/pages/owner/billing"))
      } : {}, {
        t: isOwner.value
      }, isOwner.value ? {
        v: common_vendor.o(($event) => navigateTo("/pages/owner/stats"))
      } : {}, {
        w: userInfo.value.customerNote
      }, userInfo.value.customerNote ? {} : {}, {
        x: common_vendor.o(editNote),
        y: isOwner.value
      }, isOwner.value ? {
        z: common_vendor.o(($event) => navigateTo("/pages/owner/notifications"))
      } : {}, {
        A: isOwner.value
      }, isOwner.value ? {
        B: common_vendor.o(($event) => navigateTo("/pages/owner/appointments")),
        C: common_vendor.o(($event) => navigateTo("/pages/owner/services")),
        D: common_vendor.o(($event) => navigateTo("/pages/owner/schedule")),
        E: common_vendor.o(($event) => navigateTo("/pages/owner/proxy-booking"))
      } : {}, {
        F: isLoggedIn.value
      }, isLoggedIn.value ? {
        G: common_vendor.o(onLogout)
      } : {}, {
        H: common_vendor.t(apiModeLabel.value),
        I: useMock.value,
        J: common_vendor.o(onMockToggle),
        K: common_vendor.t(apiBaseUrl.value),
        L: common_vendor.o(editBaseUrl),
        M: common_vendor.o(editBaseUrl),
        N: common_vendor.o(resetMockData)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-f97f9319"]]);
wx.createPage(MiniProgramPage);
