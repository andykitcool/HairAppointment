"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const api_request = require("./api/request.js");
const stores_user = require("./stores/user.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/booking/create.js";
  "./pages/appointment/list.js";
  "./pages/profile/index.js";
  "./pages/owner/dashboard.js";
  "./pages/owner/appointments.js";
  "./pages/owner/proxy-booking.js";
  "./pages/owner/services.js";
  "./pages/owner/billing.js";
  "./pages/owner/schedule.js";
  "./pages/owner/customers.js";
  "./pages/owner/notifications.js";
  "./pages/owner/stats.js";
  "./pages/owner/apply.js";
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "App",
  setup(__props) {
    common_vendor.onLaunch(() => {
      console.log("App Launch");
      initApp();
    });
    common_vendor.onShow(() => {
      console.log("App Show");
    });
    common_vendor.onHide(() => {
      console.log("App Hide");
    });
    async function initApp() {
      const userStore = stores_user.useUserStore();
      if (userStore.token) {
        try {
          const data = await api_request.authApi.getProfile();
          if (data) {
            userStore.setUser(data);
          }
        } catch {
          userStore.logout();
        }
      } else {
        await silentWechatLogin();
      }
      const systemInfo = common_vendor.index.getSystemInfoSync();
      console.log("System Info:", systemInfo.platform, systemInfo.system);
    }
    async function silentWechatLogin() {
      const userStore = stores_user.useUserStore();
      try {
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!(loginRes == null ? void 0 : loginRes.code)) {
          return;
        }
        const data = await api_request.authApi.wechatLogin(loginRes.code);
        if ((data == null ? void 0 : data.token) && (data == null ? void 0 : data.user)) {
          userStore.setToken(data.token);
          userStore.setUser(data.user);
        }
      } catch {
      }
    }
    return () => {
    };
  }
});
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
