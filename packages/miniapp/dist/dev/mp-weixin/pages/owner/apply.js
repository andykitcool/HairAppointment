"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "apply",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const form = common_vendor.ref({
      name: "",
      phone: "",
      address: "",
      description: "",
      business_hours: { start: "09:00", end: "21:00" }
    });
    async function onSubmit() {
      if (!form.value.name.trim()) return common_vendor.index.showToast({ title: "请输入门店名称", icon: "none" });
      if (!form.value.phone.trim()) return common_vendor.index.showToast({ title: "请输入联系电话", icon: "none" });
      common_vendor.index.showModal({
        title: "确认提交",
        content: "确认提交店长入驻申请？提交后需等待平台审核。",
        success: async (res) => {
          if (!res.confirm) return;
          common_vendor.index.showLoading({ title: "提交中..." });
          try {
            await api_request.authApi.applyOwner({
              name: form.value.name.trim(),
              phone: form.value.phone.trim(),
              address: form.value.address.trim() || void 0,
              description: form.value.description.trim() || void 0,
              business_hours: form.value.business_hours
            });
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: "申请已提交", icon: "success" });
            setTimeout(() => common_vendor.index.navigateBack(), 1500);
          } catch (err) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({ title: err.message || "提交失败", icon: "none" });
          }
        }
      });
    }
    return (_ctx, _cache) => {
      return {
        a: form.value.name,
        b: common_vendor.o(($event) => form.value.name = $event.detail.value),
        c: form.value.phone,
        d: common_vendor.o(($event) => form.value.phone = $event.detail.value),
        e: form.value.address,
        f: common_vendor.o(($event) => form.value.address = $event.detail.value),
        g: form.value.description,
        h: common_vendor.o(($event) => form.value.description = $event.detail.value),
        i: common_vendor.t(form.value.business_hours.start || "开始时间"),
        j: form.value.business_hours.start,
        k: common_vendor.o(($event) => form.value.business_hours.start = $event.detail.value),
        l: common_vendor.t(form.value.business_hours.end || "结束时间"),
        m: form.value.business_hours.end,
        n: common_vendor.o(($event) => form.value.business_hours.end = $event.detail.value),
        o: common_vendor.t(common_vendor.unref(userStore).userInfo.nickname || "-"),
        p: common_vendor.t(common_vendor.unref(userStore).userInfo.phone || "-"),
        q: common_vendor.o(onSubmit)
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5de8346d"]]);
wx.createPage(MiniProgramPage);
