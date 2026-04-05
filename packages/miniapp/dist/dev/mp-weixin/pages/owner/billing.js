"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "billing",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const today = /* @__PURE__ */ new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const aptDate = common_vendor.ref("");
    const aptList = common_vendor.ref([]);
    const selectedApt = common_vendor.ref(null);
    const payMethods = [
      { key: "wechat", label: "微信" },
      { key: "alipay", label: "支付宝" },
      { key: "cash", label: "现金" },
      { key: "stored_value", label: "储值" },
      { key: "punch_card", label: "次卡" },
      { key: "other", label: "其他" }
    ];
    const form = common_vendor.ref({
      customer_name: "",
      items: [{ service_name: "", priceYuan: "", quantity: "1" }],
      payment_method: "cash",
      note: ""
    });
    const totalYuan = common_vendor.computed(() => {
      let total = 0;
      for (const item of form.value.items) {
        total += (Number(item.priceYuan) || 0) * (Number(item.quantity) || 0);
      }
      return total.toFixed(2);
    });
    function addItem() {
      form.value.items.push({ service_name: "", priceYuan: "", quantity: "1" });
    }
    function removeItem(idx) {
      form.value.items.splice(idx, 1);
    }
    async function onAptDateChange(e) {
      aptDate.value = e.detail.value;
      selectedApt.value = null;
      try {
        const data = await api_request.appointmentApi.getList({
          merchant_id: userStore.userInfo.merchantId,
          date: aptDate.value,
          status: "completed",
          pageSize: 20
        });
        aptList.value = (data == null ? void 0 : data.list) || (Array.isArray(data) ? data : []);
      } catch {
        aptList.value = [];
      }
    }
    function selectApt(apt) {
      selectedApt.value = apt;
      form.value.customer_name = apt.customer_name;
    }
    async function onSubmit() {
      var _a;
      if (!form.value.customer_name.trim()) return common_vendor.index.showToast({ title: "请输入客户姓名", icon: "none" });
      const validItems = form.value.items.filter((i) => i.service_name.trim() && Number(i.priceYuan) > 0);
      if (validItems.length === 0) return common_vendor.index.showToast({ title: "请至少添加一项有效服务", icon: "none" });
      const items = validItems.map((i) => ({
        service_name: i.service_name.trim(),
        amount: Math.round(Number(i.priceYuan) * 100),
        quantity: Number(i.quantity) || 1
      }));
      const totalAmount = items.reduce((s, i) => s + i.amount * i.quantity, 0);
      try {
        await api_request.transactionApi.create({
          merchant_id: userStore.userInfo.merchantId,
          appointment_id: ((_a = selectedApt.value) == null ? void 0 : _a.appointment_id) || void 0,
          customer_name: form.value.customer_name.trim(),
          staff_id: "",
          total_amount: totalAmount,
          items,
          payment_method: form.value.payment_method,
          note: form.value.note.trim() || void 0
        });
        common_vendor.index.showToast({ title: "记账成功", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "记账失败", icon: "none" });
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(aptDate.value || "选择日期筛选预约"),
        b: todayStr,
        c: common_vendor.o(onAptDateChange),
        d: aptList.value.length > 0
      }, aptList.value.length > 0 ? {
        e: common_vendor.f(aptList.value, (a, k0, i0) => {
          var _a;
          return {
            a: common_vendor.t(a.customer_name),
            b: common_vendor.t(a.start_time),
            c: common_vendor.t(a.service_name),
            d: a.appointment_id,
            e: ((_a = selectedApt.value) == null ? void 0 : _a.appointment_id) === a.appointment_id ? 1 : "",
            f: common_vendor.o(($event) => selectApt(a), a.appointment_id)
          };
        })
      } : {}, {
        f: form.value.customer_name,
        g: common_vendor.o(($event) => form.value.customer_name = $event.detail.value),
        h: common_vendor.o(addItem),
        i: common_vendor.f(form.value.items, (item, idx, i0) => {
          return {
            a: item.service_name,
            b: common_vendor.o(($event) => item.service_name = $event.detail.value, idx),
            c: item.priceYuan,
            d: common_vendor.o(($event) => item.priceYuan = $event.detail.value, idx),
            e: item.quantity,
            f: common_vendor.o(($event) => item.quantity = $event.detail.value, idx),
            g: common_vendor.o(($event) => removeItem(idx), idx),
            h: idx
          };
        }),
        j: form.value.items.length === 0
      }, form.value.items.length === 0 ? {} : {}, {
        k: common_vendor.f(payMethods, (m, k0, i0) => {
          return {
            a: common_vendor.t(m.label),
            b: m.key,
            c: form.value.payment_method === m.key ? 1 : "",
            d: common_vendor.o(($event) => form.value.payment_method = m.key, m.key)
          };
        }),
        l: form.value.note,
        m: common_vendor.o(($event) => form.value.note = $event.detail.value),
        n: common_vendor.t(totalYuan.value),
        o: common_vendor.o(onSubmit)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dc52cf30"]]);
wx.createPage(MiniProgramPage);
