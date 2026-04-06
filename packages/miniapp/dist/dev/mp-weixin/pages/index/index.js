"use strict";
const common_vendor = require("../../common/vendor.js");
const api_request = require("../../api/request.js");
const stores_user = require("../../stores/user.js");
const stores_merchant = require("../../stores/merchant.js");
const DEFAULT_MERCHANT_ID = "M_mock_001";
const REST_PERIOD = "12:00-13:00";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const merchantStore = stores_merchant.useMerchantStore();
    const statusBarHeight = common_vendor.ref(0);
    const heroHeight = common_vendor.ref(0);
    try {
      const sys = common_vendor.index.getSystemInfoSync();
      statusBarHeight.value = sys.statusBarHeight || 0;
      heroHeight.value = Math.round(sys.windowWidth * 9 / 16);
    } catch {
      statusBarHeight.value = 0;
      heroHeight.value = 211;
    }
    const CATEGORIES = [
      { id: "cat_cut", name: "剪发", category: "cut", icon: "✂", duration: 45, desc: "精准剪裁，塑造完美发型" },
      { id: "cat_perm", name: "烫发", category: "perm", icon: "〜", duration: 120, desc: "持久定型，自然蓬松质感" },
      { id: "cat_dye", name: "染发", category: "dye", icon: "◉", duration: 90, desc: "潮流色系，呵护发质光泽" },
      { id: "cat_care", name: "养护", category: "care", icon: "❋", duration: 60, desc: "深层修护，锁水润泽养发" }
    ];
    const merchantInfo = common_vendor.ref({
      merchant_id: "",
      name: "黑白造型工作室",
      address: "星光大道 88号2楼",
      phone: "",
      business_hours: { start: "09:00", end: "18:00" },
      status: "active"
    });
    const apiServices = common_vendor.ref([]);
    const displayServices = common_vendor.computed(
      () => CATEGORIES.map((cat) => {
        const matched = apiServices.value.find((s) => s.category === cat.category);
        return {
          ...cat,
          service_id: (matched == null ? void 0 : matched.service_id) || cat.id,
          apiPrice: (matched == null ? void 0 : matched.price) ?? null,
          duration: (matched == null ? void 0 : matched.total_duration) ?? cat.duration,
          desc: (matched == null ? void 0 : matched.description) || cat.desc
        };
      })
    );
    const selectedCategory = common_vendor.ref(null);
    const dateList = common_vendor.ref([]);
    const selectedDateIndex = common_vendor.ref(0);
    const allSlots = common_vendor.ref([]);
    const selectedTime = common_vendor.ref("");
    const loadingSlots = common_vendor.ref(false);
    const slotsClosed = common_vendor.ref(false);
    const showSheet = common_vendor.ref(false);
    const contactName = common_vendor.ref("");
    const contactPhone = common_vendor.ref("");
    const submitting = common_vendor.ref(false);
    const canBook = common_vendor.computed(() => !!selectedCategory.value && !!selectedTime.value);
    const restPeriod = common_vendor.computed(() => REST_PERIOD);
    const selectedDate = common_vendor.computed(() => {
      var _a;
      return ((_a = dateList.value[selectedDateIndex.value]) == null ? void 0 : _a.date) || "";
    });
    const selectedDateShort = common_vendor.computed(() => {
      const d = dateList.value[selectedDateIndex.value];
      return d ? `${d.month}/${d.day}` : "";
    });
    function formatPrice(fen) {
      return (fen / 100).toFixed(0);
    }
    function formatDateStr(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    function generateDateList() {
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      return Array.from({ length: 7 }, (_, i) => {
        const date = /* @__PURE__ */ new Date();
        date.setDate(date.getDate() + i);
        return {
          date: formatDateStr(date),
          weekday: i === 0 ? "今天" : i === 1 ? "明天" : weekdays[date.getDay()],
          day: date.getDate(),
          month: date.getMonth() + 1,
          closed: false
        };
      });
    }
    async function onSelectCategory(svc) {
      var _a;
      if (((_a = selectedCategory.value) == null ? void 0 : _a.id) === svc.id) return;
      selectedCategory.value = svc;
      if (selectedDate.value && merchantInfo.value.merchant_id) await loadSlots();
    }
    function selectDate(index) {
      selectedDateIndex.value = index;
      selectedTime.value = "";
      loadSlots();
    }
    function selectTime(time) {
      selectedTime.value = time;
    }
    async function loadSlots() {
      var _a;
      if (!selectedDate.value || !merchantInfo.value.merchant_id) return;
      loadingSlots.value = true;
      slotsClosed.value = false;
      try {
        const data = await api_request.appointmentApi.getAvailableSlots({
          merchant_id: merchantInfo.value.merchant_id,
          date: selectedDate.value,
          service_id: ((_a = selectedCategory.value) == null ? void 0 : _a.service_id) || ""
        });
        if (data == null ? void 0 : data.closed) {
          slotsClosed.value = true;
          allSlots.value = [];
          selectedTime.value = "";
        } else {
          const rawSlots = (data == null ? void 0 : data.slots) || [];
          allSlots.value = rawSlots.filter((slot) => !isInRestPeriod(slot.start));
          if (selectedTime.value) {
            const keepSelectedTime = allSlots.value.some((slot) => {
              return slot.start === selectedTime.value && slot.available;
            });
            if (!keepSelectedTime) selectedTime.value = "";
          }
        }
      } catch {
        allSlots.value = [];
        selectedTime.value = "";
      } finally {
        loadingSlots.value = false;
      }
    }
    function isInRestPeriod(time) {
      const [startStr, endStr] = REST_PERIOD.split("-");
      const toMinutes = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const target = toMinutes(time);
      const restStart = toMinutes(startStr);
      const restEnd = toMinutes(endStr);
      return target >= restStart && target < restEnd;
    }
    common_vendor.watch(selectedDate, (val) => {
      if (val) loadSlots();
    });
    function onBook() {
      if (!canBook.value) return;
      const storedName = userStore.userInfo.realName || userStore.userInfo.nickname || "";
      const storedPhone = userStore.userInfo.phone || "";
      const storedAvatar = userStore.userInfo.avatarUrl || userStore.userInfo.avatar_url || "";
      if (storedName && storedPhone && storedAvatar) {
        contactName.value = storedName;
        contactPhone.value = storedPhone;
        void createAppointment();
      } else {
        contactName.value = storedName;
        contactPhone.value = storedPhone;
        showSheet.value = true;
      }
    }
    async function onSubmit() {
      if (submitting.value) return;
      if (!contactName.value.trim()) {
        common_vendor.index.showToast({ title: "请输入联系人姓名", icon: "none" });
        return;
      }
      if (!/^1\d{10}$/.test(contactPhone.value.trim())) {
        common_vendor.index.showToast({ title: "请输入正确手机号", icon: "none" });
        return;
      }
      await createAppointment();
    }
    async function createAppointment() {
      if (submitting.value) return;
      submitting.value = true;
      try {
        await api_request.appointmentApi.create({
          merchant_id: merchantInfo.value.merchant_id,
          service_id: selectedCategory.value.service_id,
          date: selectedDate.value,
          start_time: selectedTime.value,
          customer_name: contactName.value.trim(),
          customer_phone: contactPhone.value.trim()
        });
        showSheet.value = false;
        common_vendor.index.showToast({ title: "预约成功", icon: "success" });
        setTimeout(() => {
          common_vendor.index.switchTab({ url: "/pages/appointment/list" });
        }, 1500);
      } catch (err) {
        common_vendor.index.showToast({ title: (err == null ? void 0 : err.message) || "预约失败，请重试", icon: "none" });
      } finally {
        submitting.value = false;
      }
    }
    async function ensureLogin() {
      if (userStore.isLoggedIn && userStore.token) return true;
      try {
        const loginRes = await common_vendor.index.login({ provider: "weixin" });
        if (!(loginRes == null ? void 0 : loginRes.code)) return false;
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
    async function loadMerchant() {
      if (merchantStore.merchantInfo.merchant_id) {
        merchantInfo.value = { ...merchantStore.merchantInfo };
        return merchantStore.merchantInfo.merchant_id;
      }
      const mid = userStore.userInfo.merchant_id || DEFAULT_MERCHANT_ID;
      try {
        const data = await api_request.merchantApi.getInfo(mid);
        merchantInfo.value = data;
        merchantStore.setMerchant(data);
        return data.merchant_id;
      } catch {
        merchantInfo.value = {
          merchant_id: DEFAULT_MERCHANT_ID,
          name: "黑白造型工作室",
          address: "星光大道 88号2楼",
          phone: "13800000000",
          business_hours: { start: "09:00", end: "18:00" },
          status: "active"
        };
        return DEFAULT_MERCHANT_ID;
      }
    }
    async function init() {
      await ensureLogin();
      const mid = await loadMerchant();
      dateList.value = generateDateList();
      try {
        const data = await api_request.serviceApi.getList(mid);
        apiServices.value = Array.isArray(data) ? data : [];
      } catch {
        apiServices.value = [];
      }
      await loadSlots();
    }
    common_vendor.onShow(() => {
      void init();
    });
    common_vendor.onPullDownRefresh(async () => {
      await init();
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      var _a, _b, _c;
      return common_vendor.e({
        a: statusBarHeight.value + 6 + "px",
        b: common_vendor.t(merchantInfo.value.name),
        c: common_vendor.t(merchantInfo.value.address || "暂无地址"),
        d: common_vendor.t(((_a = merchantInfo.value.business_hours) == null ? void 0 : _a.start) || "09:00"),
        e: common_vendor.t(((_b = merchantInfo.value.business_hours) == null ? void 0 : _b.end) || "18:00"),
        f: heroHeight.value + "px",
        g: common_vendor.f(displayServices.value, (svc, k0, i0) => {
          var _a2;
          return {
            a: common_vendor.t(svc.icon),
            b: common_vendor.t(svc.apiPrice ? "¥" + formatPrice(svc.apiPrice) : "面议"),
            c: common_vendor.t(svc.name),
            d: common_vendor.t(svc.desc),
            e: common_vendor.t(svc.duration),
            f: svc.id,
            g: ((_a2 = selectedCategory.value) == null ? void 0 : _a2.id) === svc.id ? 1 : "",
            h: common_vendor.o(($event) => onSelectCategory(svc), svc.id)
          };
        }),
        h: restPeriod.value
      }, restPeriod.value ? {
        i: common_vendor.t(restPeriod.value)
      } : {}, {
        j: common_vendor.f(dateList.value, (d, i, i0) => {
          return {
            a: common_vendor.t(d.weekday),
            b: common_vendor.t(d.month),
            c: common_vendor.t(d.day),
            d: d.date,
            e: selectedDateIndex.value === i ? 1 : "",
            f: d.closed ? 1 : "",
            g: common_vendor.o(($event) => !d.closed && selectDate(i), d.date)
          };
        }),
        k: slotsClosed.value
      }, slotsClosed.value ? {} : allSlots.value.length === 0 ? {} : {
        m: common_vendor.f(allSlots.value, (slot, k0, i0) => {
          return {
            a: common_vendor.t(slot.start),
            b: slot.start,
            c: selectedTime.value === slot.start ? 1 : "",
            d: !slot.available ? 1 : "",
            e: common_vendor.o(($event) => slot.available && selectTime(slot.start), slot.start)
          };
        })
      }, {
        l: allSlots.value.length === 0,
        n: !canBook.value ? 1 : "",
        o: common_vendor.o(onBook),
        p: showSheet.value
      }, showSheet.value ? {
        q: common_vendor.o(($event) => showSheet.value = false),
        r: common_vendor.o(($event) => showSheet.value = false),
        s: contactName.value,
        t: common_vendor.o(($event) => contactName.value = $event.detail.value),
        v: contactPhone.value,
        w: common_vendor.o(($event) => contactPhone.value = $event.detail.value),
        x: common_vendor.t((_c = selectedCategory.value) == null ? void 0 : _c.name),
        y: common_vendor.t(selectedDateShort.value),
        z: common_vendor.t(selectedTime.value),
        A: common_vendor.t(submitting.value ? "提交中..." : "确认预约"),
        B: submitting.value ? 1 : "",
        C: common_vendor.o(onSubmit)
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
