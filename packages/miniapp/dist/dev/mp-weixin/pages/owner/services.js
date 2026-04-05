"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "services",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const loading = common_vendor.ref(false);
    const list = common_vendor.ref([]);
    const categoryMap = {
      cut: "剪发",
      perm: "烫发",
      dye: "染发",
      care: "护理"
    };
    const categories = [
      { key: "cut", label: "剪发" },
      { key: "perm", label: "烫发" },
      { key: "dye", label: "染发" },
      { key: "care", label: "护理" }
    ];
    const formVisible = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editId = common_vendor.ref("");
    const form = common_vendor.ref({
      name: "",
      category: "cut",
      priceYuan: "",
      total_duration: "",
      description: ""
    });
    function showForm(item) {
      if (item) {
        isEdit.value = true;
        editId.value = item._id;
        form.value = {
          name: item.name,
          category: item.category,
          priceYuan: String(item.price / 100),
          total_duration: String(item.total_duration),
          description: item.description || ""
        };
      } else {
        isEdit.value = false;
        editId.value = "";
        form.value = { name: "", category: "cut", priceYuan: "", total_duration: "", description: "" };
      }
      formVisible.value = true;
    }
    async function onSubmit() {
      const { name, category, priceYuan, total_duration, description } = form.value;
      if (!name.trim()) return common_vendor.index.showToast({ title: "请输入服务名称", icon: "none" });
      const price = Math.round(Number(priceYuan) * 100);
      if (!price || price <= 0) return common_vendor.index.showToast({ title: "请输入有效价格", icon: "none" });
      const dur = Number(total_duration);
      if (!dur || dur <= 0) return common_vendor.index.showToast({ title: "请输入有效时长", icon: "none" });
      const body = {
        name: name.trim(),
        category,
        price,
        total_duration: dur,
        staff_busy_duration: dur,
        stages: [{ name, duration: dur, staff_busy: true }],
        description: description.trim() || void 0,
        is_active: true,
        sort_order: list.value.length
      };
      try {
        if (isEdit.value) {
          await api_request.serviceApi.update(editId.value, body);
          common_vendor.index.showToast({ title: "已更新", icon: "success" });
        } else {
          body.merchant_id = userStore.userInfo.merchantId;
          await api_request.serviceApi.create(body);
          common_vendor.index.showToast({ title: "已添加", icon: "success" });
        }
        formVisible.value = false;
        await loadList();
      } catch (err) {
        common_vendor.index.showToast({ title: err.message || "操作失败", icon: "none" });
      }
    }
    function onDelete(item) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: `删除「${item.name}」？删除后不可恢复。`,
        success: async (res) => {
          if (res.confirm) {
            try {
              await api_request.serviceApi.delete(item._id);
              common_vendor.index.showToast({ title: "已删除", icon: "success" });
              await loadList();
            } catch (err) {
              common_vendor.index.showToast({ title: err.message, icon: "none" });
            }
          }
        }
      });
    }
    async function loadList() {
      loading.value = true;
      try {
        const mid = userStore.userInfo.merchantId;
        const data = await api_request.serviceApi.getList(mid);
        list.value = Array.isArray(data) ? data : (data == null ? void 0 : data.list) || [];
      } catch {
        list.value = [];
      } finally {
        loading.value = false;
      }
    }
    common_vendor.onShow(() => loadList());
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => showForm(null)),
        b: loading.value
      }, loading.value ? {} : list.value.length === 0 ? {} : {
        d: common_vendor.f(list.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.name),
            b: common_vendor.t((item.price / 100).toFixed(0)),
            c: common_vendor.t(item.total_duration),
            d: common_vendor.t(categoryMap[item.category]),
            e: common_vendor.n(item.category),
            f: common_vendor.o(($event) => showForm(item), item._id),
            g: common_vendor.o(($event) => onDelete(item), item._id),
            h: item._id
          };
        })
      }, {
        c: list.value.length === 0,
        e: formVisible.value
      }, formVisible.value ? {
        f: common_vendor.t(isEdit.value ? "编辑服务" : "添加服务"),
        g: form.value.name,
        h: common_vendor.o(($event) => form.value.name = $event.detail.value),
        i: common_vendor.f(categories, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.label),
            b: cat.key,
            c: form.value.category === cat.key ? 1 : "",
            d: common_vendor.o(($event) => form.value.category = cat.key, cat.key)
          };
        }),
        j: form.value.priceYuan,
        k: common_vendor.o(($event) => form.value.priceYuan = $event.detail.value),
        l: form.value.total_duration,
        m: common_vendor.o(($event) => form.value.total_duration = $event.detail.value),
        n: form.value.description,
        o: common_vendor.o(($event) => form.value.description = $event.detail.value),
        p: common_vendor.o(onSubmit),
        q: common_vendor.o(() => {
        }),
        r: common_vendor.o(($event) => formVisible.value = false)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c53677aa"]]);
wx.createPage(MiniProgramPage);
