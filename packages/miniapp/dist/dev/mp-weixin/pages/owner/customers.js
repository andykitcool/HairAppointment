"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "customers",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const loading = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const keyword = common_vendor.ref("");
    const detailVisible = common_vendor.ref(false);
    const currentCustomer = common_vendor.ref(null);
    const merchantNote = common_vendor.ref("");
    function formatDate(d) {
      return new Date(d).toLocaleDateString("zh-CN");
    }
    async function loadList() {
      loading.value = true;
      try {
        const params = { merchant_id: userStore.userInfo.merchantId, pageSize: 50 };
        if (keyword.value.trim()) params.keyword = keyword.value.trim();
        const data = await api_request.customerApi.getList(params);
        list.value = (data == null ? void 0 : data.list) || (Array.isArray(data) ? data : []);
      } catch {
        list.value = [];
      } finally {
        loading.value = false;
      }
    }
    function onSearch() {
      loadList();
    }
    function showDetail(item) {
      currentCustomer.value = item;
      merchantNote.value = item.merchant_note || "";
      detailVisible.value = true;
    }
    async function saveNote() {
      if (!currentCustomer.value) return;
      try {
        await api_request.customerApi.updateMerchantNote(currentCustomer.value._id, merchantNote.value.trim());
        common_vendor.index.showToast({ title: "已保存", icon: "success" });
        currentCustomer.value.merchant_note = merchantNote.value.trim();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message, icon: "none" });
      }
    }
    function callPhone() {
      var _a;
      if ((_a = currentCustomer.value) == null ? void 0 : _a.phone) {
        common_vendor.index.makePhoneCall({ phoneNumber: currentCustomer.value.phone });
      }
    }
    common_vendor.onShow(() => loadList());
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
      return common_vendor.e({
        a: common_vendor.o(onSearch),
        b: keyword.value,
        c: common_vendor.o(($event) => keyword.value = $event.detail.value),
        d: loading.value
      }, loading.value ? {} : list.value.length === 0 ? {} : {
        f: common_vendor.f(list.value, (item, k0, i0) => {
          return common_vendor.e({
            a: item.avatar_url
          }, item.avatar_url ? {
            b: item.avatar_url
          } : {
            c: common_vendor.t((item.nickname || item.real_name || "?")[0])
          }, {
            d: common_vendor.t(item.nickname || item.real_name || "未设置昵称"),
            e: item.phone
          }, item.phone ? {
            f: common_vendor.t(item.phone)
          } : {}, {
            g: common_vendor.t(item.visit_count),
            h: common_vendor.t((item.total_spending / 100).toFixed(0)),
            i: item._id,
            j: common_vendor.o(($event) => showDetail(item), item._id)
          });
        })
      }, {
        e: list.value.length === 0,
        g: detailVisible.value
      }, detailVisible.value ? common_vendor.e({
        h: (_a = currentCustomer.value) == null ? void 0 : _a.avatar_url
      }, ((_b = currentCustomer.value) == null ? void 0 : _b.avatar_url) ? {
        i: currentCustomer.value.avatar_url
      } : {
        j: common_vendor.t((((_c = currentCustomer.value) == null ? void 0 : _c.nickname) || ((_d = currentCustomer.value) == null ? void 0 : _d.real_name) || "?")[0])
      }, {
        k: common_vendor.t(((_e = currentCustomer.value) == null ? void 0 : _e.nickname) || ((_f = currentCustomer.value) == null ? void 0 : _f.real_name) || "未设置昵称"),
        l: (_g = currentCustomer.value) == null ? void 0 : _g.phone
      }, ((_h = currentCustomer.value) == null ? void 0 : _h.phone) ? {
        m: common_vendor.t(currentCustomer.value.phone)
      } : {}, {
        n: common_vendor.t(((_i = currentCustomer.value) == null ? void 0 : _i.visit_count) || 0),
        o: common_vendor.t(((((_j = currentCustomer.value) == null ? void 0 : _j.total_spending) || 0) / 100).toFixed(0)),
        p: common_vendor.t(((_k = currentCustomer.value) == null ? void 0 : _k.last_visit_time) ? formatDate(currentCustomer.value.last_visit_time) : "-"),
        q: merchantNote.value,
        r: common_vendor.o(($event) => merchantNote.value = $event.detail.value),
        s: common_vendor.o(saveNote),
        t: (_l = currentCustomer.value) == null ? void 0 : _l.phone
      }, ((_m = currentCustomer.value) == null ? void 0 : _m.phone) ? {
        v: common_vendor.o(callPhone)
      } : {}, {
        w: common_vendor.o(() => {
        }),
        x: common_vendor.o(($event) => detailVisible.value = false)
      }) : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-384aaca8"]]);
wx.createPage(MiniProgramPage);
