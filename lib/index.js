import { nextTick as Q, defineComponent as Ee, ref as L, onMounted as Le, watch as He, createElementBlock as q, openBlock as V, renderSlot as Ne, createElementVNode as O, createCommentVNode as oe, withModifiers as je, toDisplayString as de, computed as ie, onUnmounted as ze, normalizeClass as xe, normalizeStyle as Re, createVNode as we, TransitionGroup as Ce, withCtx as _e, Fragment as qe, renderList as Ve, mergeProps as Te, unref as Ge } from "vue";
let ue = null;
function Ue() {
  if (ue != null) return ue;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const l = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), ue = l, l;
}
function Xe(e, o, l, i = {}) {
  const {
    gutterX: h = 0,
    gutterY: v = 0,
    header: a = 0,
    footer: n = 0,
    paddingLeft: d = 0,
    paddingRight: u = 0,
    sizes: c = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: b = "masonry"
  } = i;
  let m = 0, x = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const w = window.getComputedStyle(o);
      m = parseFloat(w.paddingLeft) || 0, x = parseFloat(w.paddingRight) || 0;
    }
  } catch {
  }
  const F = (d || 0) + m, _ = (u || 0) + x, H = o.offsetWidth - o.clientWidth, T = H > 0 ? H + 2 : Ue() + 2, P = o.offsetWidth - T - F - _, U = h * (l - 1), S = Math.floor((P - U) / l), M = e.map((w) => {
    const N = w.width, I = w.height;
    return Math.round(S * I / N) + n + a;
  });
  if (b === "sequential-balanced") {
    const w = M.length;
    if (w === 0) return [];
    const N = (p, k, B) => p + (k > 0 ? v : 0) + B;
    let I = Math.max(...M), D = M.reduce((p, k) => p + k, 0) + v * Math.max(0, w - 1);
    const Z = (p) => {
      let k = 1, B = 0, z = 0;
      for (let $ = 0; $ < w; $++) {
        const G = M[$], R = N(B, z, G);
        if (R <= p)
          B = R, z++;
        else if (k++, B = G, z = 1, G > p || k > l) return !1;
      }
      return k <= l;
    };
    for (; I < D; ) {
      const p = Math.floor((I + D) / 2);
      Z(p) ? D = p : I = p + 1;
    }
    const ee = D, X = new Array(l).fill(0);
    let te = l - 1, Y = 0, J = 0;
    for (let p = w - 1; p >= 0; p--) {
      const k = M[p], B = p < te;
      !(N(Y, J, k) <= ee) || B ? (X[te] = p + 1, te--, Y = k, J = 1) : (Y = N(Y, J, k), J++);
    }
    X[0] = 0;
    const j = [], ae = new Array(l).fill(0);
    for (let p = 0; p < l; p++) {
      const k = X[p], B = p + 1 < l ? X[p + 1] : w, z = p * (S + h);
      for (let $ = k; $ < B; $++) {
        const R = {
          ...e[$],
          columnWidth: S,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        R.imageHeight = M[$] - (n + a), R.columnHeight = M[$], R.left = z, R.top = ae[p], ae[p] += R.columnHeight + ($ + 1 < B ? v : 0), j.push(R);
      }
    }
    return j;
  }
  const y = new Array(l).fill(0), W = [];
  for (let w = 0; w < e.length; w++) {
    const N = e[w], I = {
      ...N,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, D = y.indexOf(Math.min(...y)), Z = N.width, ee = N.height;
    I.columnWidth = S, I.left = D * (S + h), I.imageHeight = Math.round(S * ee / Z), I.columnHeight = I.imageHeight + n + a, I.top = y[D], y[D] += I.columnHeight + v, W.push(I);
  }
  return W;
}
var Ye = typeof global == "object" && global && global.Object === Object && global, Je = typeof self == "object" && self && self.Object === Object && self, $e = Ye || Je || Function("return this")(), se = $e.Symbol, Ae = Object.prototype, Ke = Ae.hasOwnProperty, Qe = Ae.toString, re = se ? se.toStringTag : void 0;
function Ze(e) {
  var o = Ke.call(e, re), l = e[re];
  try {
    e[re] = void 0;
    var i = !0;
  } catch {
  }
  var h = Qe.call(e);
  return i && (o ? e[re] = l : delete e[re]), h;
}
var et = Object.prototype, tt = et.toString;
function at(e) {
  return tt.call(e);
}
var nt = "[object Null]", rt = "[object Undefined]", Me = se ? se.toStringTag : void 0;
function ot(e) {
  return e == null ? e === void 0 ? rt : nt : Me && Me in Object(e) ? Ze(e) : at(e);
}
function lt(e) {
  return e != null && typeof e == "object";
}
var it = "[object Symbol]";
function st(e) {
  return typeof e == "symbol" || lt(e) && ot(e) == it;
}
var ut = /\s/;
function ct(e) {
  for (var o = e.length; o-- && ut.test(e.charAt(o)); )
    ;
  return o;
}
var ft = /^\s+/;
function dt(e) {
  return e && e.slice(0, ct(e) + 1).replace(ft, "");
}
function ge(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var Ie = NaN, gt = /^[-+]0x[0-9a-f]+$/i, mt = /^0b[01]+$/i, vt = /^0o[0-7]+$/i, pt = parseInt;
function Pe(e) {
  if (typeof e == "number")
    return e;
  if (st(e))
    return Ie;
  if (ge(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = ge(o) ? o + "" : o;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = dt(e);
  var l = mt.test(e);
  return l || vt.test(e) ? pt(e.slice(2), l ? 2 : 8) : gt.test(e) ? Ie : +e;
}
var ce = function() {
  return $e.Date.now();
}, ht = "Expected a function", yt = Math.max, bt = Math.min;
function Se(e, o, l) {
  var i, h, v, a, n, d, u = 0, c = !1, b = !1, m = !0;
  if (typeof e != "function")
    throw new TypeError(ht);
  o = Pe(o) || 0, ge(l) && (c = !!l.leading, b = "maxWait" in l, v = b ? yt(Pe(l.maxWait) || 0, o) : v, m = "trailing" in l ? !!l.trailing : m);
  function x(y) {
    var W = i, w = h;
    return i = h = void 0, u = y, a = e.apply(w, W), a;
  }
  function F(y) {
    return u = y, n = setTimeout(T, o), c ? x(y) : a;
  }
  function _(y) {
    var W = y - d, w = y - u, N = o - W;
    return b ? bt(N, v - w) : N;
  }
  function H(y) {
    var W = y - d, w = y - u;
    return d === void 0 || W >= o || W < 0 || b && w >= v;
  }
  function T() {
    var y = ce();
    if (H(y))
      return P(y);
    n = setTimeout(T, _(y));
  }
  function P(y) {
    return n = void 0, m && i ? x(y) : (i = h = void 0, a);
  }
  function U() {
    n !== void 0 && clearTimeout(n), u = 0, i = d = h = n = void 0;
  }
  function S() {
    return n === void 0 ? a : P(ce());
  }
  function M() {
    var y = ce(), W = H(y);
    if (i = arguments, h = this, d = y, W) {
      if (n === void 0)
        return F(d);
      if (b)
        return clearTimeout(n), n = setTimeout(T, o), x(d);
    }
    return n === void 0 && (n = setTimeout(T, o)), a;
  }
  return M.cancel = U, M.flush = S, M;
}
function fe(e) {
  const o = window.innerWidth, l = e.sizes;
  return o >= 1536 && l["2xl"] ? l["2xl"] : o >= 1280 && l.xl ? l.xl : o >= 1024 && l.lg ? l.lg : o >= 768 && l.md ? l.md : o >= 640 && l.sm ? l.sm : l.base;
}
function xt(e) {
  return e.reduce((l, i) => Math.max(l, i.top + i.columnHeight), 0) + 500;
}
function wt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function Tt(e, o = 0) {
  return {
    style: wt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function me(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const i = Array.from(new Set(e.map((a) => a.left))).sort((a, n) => a - n).slice(0, o), h = /* @__PURE__ */ new Map();
  for (let a = 0; a < i.length; a++) h.set(i[a], a);
  const v = new Array(i.length).fill(0);
  for (const a of e) {
    const n = h.get(a.left);
    n != null && (v[n] = Math.max(v[n], a.top + a.columnHeight));
  }
  for (; v.length < o; ) v.push(0);
  return v;
}
function Mt(e, o) {
  function l(a, n) {
    const d = parseInt(a.dataset.left || "0", 10), u = parseInt(a.dataset.top || "0", 10), c = parseInt(a.dataset.index || "0", 10), b = Math.min(c * 20, 160), m = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${b}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${d}px, ${u}px, 0) scale(1)`;
      const x = () => {
        m ? a.style.setProperty("--masonry-opacity-delay", m) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", x), n();
      };
      a.addEventListener("transitionend", x);
    });
  }
  function i(a) {
    const n = parseInt(a.dataset.left || "0", 10), d = parseInt(a.dataset.top || "0", 10);
    a.style.opacity = "0", a.style.transform = `translate3d(${n}px, ${d + 10}px, 0) scale(0.985)`;
  }
  function h(a) {
    const n = parseInt(a.dataset.left || "0", 10), d = parseInt(a.dataset.top || "0", 10);
    a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${n}px, ${d}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      a.style.transition = "";
    });
  }
  function v(a, n) {
    const d = parseInt(a.dataset.left || "0", 10), u = parseInt(a.dataset.top || "0", 10), c = typeof (o == null ? void 0 : o.leaveDurationMs) == "number" ? o.leaveDurationMs : NaN;
    let b = Number.isFinite(c) && c > 0 ? c : NaN;
    if (!Number.isFinite(b)) {
      const T = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", P = parseFloat(T);
      b = Number.isFinite(P) && P > 0 ? P : 200;
    }
    const m = a.style.transitionDuration, x = () => {
      a.removeEventListener("transitionend", F), clearTimeout(_), a.style.transitionDuration = m || "";
    }, F = (H) => {
      (!H || H.target === a) && (x(), n());
    }, _ = setTimeout(() => {
      x(), n();
    }, b + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${b}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${d}px, ${u + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", F);
    });
  }
  return {
    onEnter: l,
    onBeforeEnter: i,
    onBeforeLeave: h,
    onLeave: v
  };
}
function It({
  container: e,
  masonry: o,
  columns: l,
  containerHeight: i,
  isLoading: h,
  pageSize: v,
  refreshLayout: a,
  setItemsRaw: n,
  loadNext: d,
  loadThresholdPx: u
}) {
  let c = 0;
  async function b(m) {
    if (!e.value) return;
    const x = m ?? me(o.value, l.value), F = x.length ? Math.max(...x) : 0, _ = e.value.scrollTop + e.value.clientHeight, H = e.value.scrollTop > c + 1;
    c = e.value.scrollTop;
    const T = typeof u == "number" ? u : 200, P = T >= 0 ? Math.max(0, F - T) : Math.max(0, F + T);
    if (_ >= P && H && !h.value) {
      await d(), await Q();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
const Pt = { class: "relative w-full h-full group" }, St = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, kt = {
  key: 0,
  class: "absolute inset-0 flex items-center justify-center bg-slate-100"
}, Et = {
  key: 1,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Lt = ["src"], Ht = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75" }, Nt = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, $t = /* @__PURE__ */ Ee({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: { type: Function }
  },
  setup(e) {
    const o = e, l = L(!1), i = L(!1), h = L(null);
    function v(a) {
      return new Promise((n, d) => {
        if (!a) {
          d(new Error("No image source provided"));
          return;
        }
        const u = new Image(), c = Date.now(), b = 300;
        u.onload = () => {
          const m = Date.now() - c, x = Math.max(0, b - m);
          setTimeout(() => {
            l.value = !0, i.value = !1, n();
          }, x);
        }, u.onerror = () => {
          i.value = !0, l.value = !1, d(new Error("Failed to load image"));
        }, u.src = a;
      });
    }
    return Le(async () => {
      var n, d;
      console.log("[MasonryItem] Component mounted", (n = o.item) == null ? void 0 : n.id);
      const a = (d = o.item) == null ? void 0 : d.src;
      if (a) {
        h.value = a, l.value = !1, i.value = !1;
        try {
          await v(a);
        } catch {
        }
      }
    }), He(
      () => {
        var a;
        return (a = o.item) == null ? void 0 : a.src;
      },
      async (a) => {
        if (a && a !== h.value) {
          l.value = !1, i.value = !1, h.value = a;
          try {
            await v(a);
          } catch {
          }
        }
      }
    ), (a, n) => (V(), q("div", Pt, [
      Ne(a.$slots, "default", {
        item: a.item,
        remove: a.remove,
        imageLoaded: l.value,
        imageError: i.value
      }, () => [
        O("div", St, [
          !l.value && !i.value ? (V(), q("div", kt, n[1] || (n[1] = [
            O("div", { class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }, null, -1)
          ]))) : oe("", !0),
          i.value ? (V(), q("div", Et, n[2] || (n[2] = [
            O("i", { class: "fas fa-image text-2xl mb-2 opacity-50" }, null, -1),
            O("span", null, "Failed to load image", -1)
          ]))) : oe("", !0),
          l.value && h.value ? (V(), q("img", {
            key: 2,
            src: h.value,
            class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            loading: "lazy",
            decoding: "async"
          }, null, 8, Lt)) : oe("", !0),
          n[4] || (n[4] = O("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" }, null, -1)),
          a.remove ? (V(), q("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer",
            onClick: n[0] || (n[0] = je((d) => a.remove(a.item), ["stop"])),
            "aria-label": "Remove item"
          }, n[3] || (n[3] = [
            O("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : oe("", !0),
          O("div", Ht, [
            O("p", Nt, "Item #" + de(String(a.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ]));
  }
}), At = /* @__PURE__ */ Ee({
  __name: "Masonry",
  props: {
    getNextPage: {
      type: Function,
      default: () => {
      }
    },
    loadAtPage: {
      type: [Number, String],
      default: null
    },
    items: {
      type: Array,
      default: () => []
    },
    layout: {
      type: Object
    },
    paginationType: {
      type: String,
      default: "page",
      // or 'cursor'
      validator: (e) => ["page", "cursor"].includes(e)
    },
    skipInitialLoad: {
      type: Boolean,
      default: !1
    },
    pageSize: {
      type: Number,
      default: 40
    },
    // Backfill configuration
    backfillEnabled: {
      type: Boolean,
      default: !0
    },
    backfillDelayMs: {
      type: Number,
      default: 2e3
    },
    backfillMaxCalls: {
      type: Number,
      default: 10
    },
    // Retry configuration
    retryMaxAttempts: {
      type: Number,
      default: 3
    },
    retryInitialDelayMs: {
      type: Number,
      default: 2e3
    },
    retryBackoffStepMs: {
      type: Number,
      default: 2e3
    },
    transitionDurationMs: {
      type: Number,
      default: 450
    },
    // Shorter, snappier duration specifically for item removal (leave)
    leaveDurationMs: {
      type: Number,
      default: 160
    },
    transitionEasing: {
      type: String,
      default: "cubic-bezier(.22,.61,.36,1)"
    },
    // Force motion even when user has reduced-motion enabled
    forceMotion: {
      type: Boolean,
      default: !1
    },
    virtualBufferPx: {
      type: Number,
      default: 600
    },
    loadThresholdPx: {
      type: Number,
      default: 200
    },
    autoRefreshOnEmpty: {
      type: Boolean,
      default: !1
    }
  },
  emits: [
    "update:items",
    "backfill:start",
    "backfill:tick",
    "backfill:stop",
    "retry:start",
    "retry:tick",
    "retry:stop",
    "remove-all:complete"
  ],
  setup(e, { expose: o, emit: l }) {
    const i = e, h = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, v = ie(() => {
      var t;
      return {
        ...h,
        ...i.layout,
        sizes: {
          ...h.sizes,
          ...((t = i.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), a = l, n = ie({
      get: () => i.items,
      set: (t) => a("update:items", t)
    }), d = L(7), u = L(null), c = L([]), b = L(null), m = L(!1), x = L(0), F = L(/* @__PURE__ */ new Set());
    function _(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function H(t, r) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const s = t.filter((g) => !_(g == null ? void 0 : g.width) || !_(g == null ? void 0 : g.height));
        if (s.length === 0) return;
        const f = [];
        for (const g of s) {
          const A = (g == null ? void 0 : g.id) ?? `idx:${t.indexOf(g)}`;
          F.value.has(A) || (F.value.add(A), f.push(A));
        }
        if (f.length > 0) {
          const g = f.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: r,
              count: f.length,
              sampleIds: g,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const T = L(0), P = L(0), U = i.virtualBufferPx, S = L(!1), M = L({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), y = (t) => {
      if (!u.value) return;
      const { scrollTop: r, clientHeight: s } = u.value, f = r + s, g = t ?? me(n.value, d.value), A = g.length ? Math.max(...g) : 0, C = typeof i.loadThresholdPx == "number" ? i.loadThresholdPx : 200, K = C >= 0 ? Math.max(0, A - C) : Math.max(0, A + C), be = Math.max(0, K - f), De = be <= 100;
      M.value = {
        distanceToTrigger: Math.round(be),
        isNearTrigger: De
      };
    }, { onEnter: W, onBeforeEnter: w, onBeforeLeave: N, onLeave: I } = Mt(n, { leaveDurationMs: i.leaveDurationMs });
    function D(t, r) {
      if (S.value) {
        const s = parseInt(t.dataset.left || "0", 10), f = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${s}px, ${f}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", r();
        });
      } else
        W(t, r);
    }
    function Z(t) {
      if (S.value) {
        const r = parseInt(t.dataset.left || "0", 10), s = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${r}px, ${s}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        w(t);
    }
    function ee(t) {
      S.value || N(t);
    }
    function X(t, r) {
      S.value ? r() : I(t, r);
    }
    const te = ie(() => {
      const t = T.value - U, r = T.value + P.value + U, s = n.value;
      return !s || s.length === 0 ? [] : s.filter((f) => {
        const g = f.top;
        return f.top + f.columnHeight >= t && g <= r;
      });
    }), { handleScroll: Y } = It({
      container: u,
      masonry: n,
      columns: d,
      containerHeight: x,
      isLoading: m,
      pageSize: i.pageSize,
      refreshLayout: j,
      setItemsRaw: (t) => {
        n.value = t;
      },
      loadNext: z,
      loadThresholdPx: i.loadThresholdPx
    });
    o({
      isLoading: m,
      refreshLayout: j,
      containerHeight: x,
      remove: G,
      removeMany: R,
      removeAll: We,
      loadNext: z,
      loadPage: B,
      refreshCurrentPage: $,
      reset: Fe,
      init: Oe,
      paginationHistory: c,
      cancelLoad: pe,
      scrollToTop: ve,
      totalItems: ie(() => n.value.length)
    });
    function J(t) {
      const r = xt(t);
      let s = 0;
      if (u.value) {
        const { scrollTop: f, clientHeight: g } = u.value;
        s = f + g + 100;
      }
      x.value = Math.max(r, s);
    }
    function j(t) {
      if (!u.value) return;
      H(t, "refreshLayout");
      const r = t.map((f, g) => ({
        ...f,
        originalIndex: f.originalIndex ?? g
      })), s = Xe(r, u.value, d.value, v.value);
      J(s), n.value = s;
    }
    function ae(t, r) {
      return new Promise((s) => {
        const f = Math.max(0, t | 0), g = Date.now();
        r(f, f);
        const A = setInterval(() => {
          if (E.value) {
            clearInterval(A), s();
            return;
          }
          const C = Date.now() - g, K = Math.max(0, f - C);
          r(K, f), K <= 0 && (clearInterval(A), s());
        }, 100);
      });
    }
    async function p(t) {
      try {
        const r = await k(() => i.getNextPage(t));
        return j([...n.value, ...r.items]), r;
      } catch (r) {
        throw console.error("Error in getContent:", r), r;
      }
    }
    async function k(t) {
      let r = 0;
      const s = i.retryMaxAttempts;
      let f = i.retryInitialDelayMs;
      for (; ; )
        try {
          const g = await t();
          return r > 0 && a("retry:stop", { attempt: r, success: !0 }), g;
        } catch (g) {
          if (r++, r > s)
            throw a("retry:stop", { attempt: r - 1, success: !1 }), g;
          a("retry:start", { attempt: r, max: s, totalMs: f }), await ae(f, (A, C) => {
            a("retry:tick", { attempt: r, remainingMs: A, totalMs: C });
          }), f += i.retryBackoffStepMs;
        }
    }
    async function B(t) {
      if (!m.value) {
        E.value = !1, m.value = !0;
        try {
          const r = n.value.length;
          if (E.value) return;
          const s = await p(t);
          return E.value ? void 0 : (b.value = t, c.value.push(s.nextPage), await ne(r), s);
        } catch (r) {
          throw console.error("Error loading page:", r), r;
        } finally {
          m.value = !1;
        }
      }
    }
    async function z() {
      if (!m.value) {
        E.value = !1, m.value = !0;
        try {
          const t = n.value.length;
          if (E.value) return;
          const r = c.value[c.value.length - 1], s = await p(r);
          return E.value ? void 0 : (b.value = r, c.value.push(s.nextPage), await ne(t), s);
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          m.value = !1;
        }
      }
    }
    async function $() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", m.value, "currentPage:", b.value), !m.value) {
        E.value = !1, m.value = !0;
        try {
          const t = b.value;
          if (console.log("[Masonry] pageToRefresh:", t), t == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", b.value, "paginationHistory:", c.value);
            return;
          }
          n.value = [], x.value = 0, c.value = [t], await Q();
          const r = await p(t);
          if (E.value) return;
          b.value = t, c.value.push(r.nextPage);
          const s = n.value.length;
          return await ne(s), r;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          m.value = !1;
        }
      }
    }
    async function G(t) {
      const r = n.value.filter((s) => s.id !== t.id);
      if (n.value = r, await Q(), console.log("[Masonry] remove - next.length:", r.length, "paginationHistory.length:", c.value.length), r.length === 0 && c.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await $();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await z(), await ne(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((s) => requestAnimationFrame(() => s())), requestAnimationFrame(() => {
        j(r);
      });
    }
    async function R(t) {
      if (!t || t.length === 0) return;
      const r = new Set(t.map((f) => f.id)), s = n.value.filter((f) => !r.has(f.id));
      if (n.value = s, await Q(), s.length === 0 && c.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          await $();
        else
          try {
            await z(), await ne(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        j(s);
      });
    }
    function ve(t) {
      u.value && u.value.scrollTo({
        top: 0,
        behavior: (t == null ? void 0 : t.behavior) ?? "smooth",
        ...t
      });
    }
    async function We() {
      ve({ behavior: "smooth" }), n.value = [], x.value = 0, await Q(), a("remove-all:complete");
    }
    function Be() {
      d.value = fe(v.value), j(n.value), u.value && (T.value = u.value.scrollTop, P.value = u.value.clientHeight);
    }
    let le = !1;
    const E = L(!1);
    async function ne(t, r = !1) {
      if (!r && !i.backfillEnabled || le || E.value) return;
      const s = (t || 0) + (i.pageSize || 0);
      if (!(!i.pageSize || i.pageSize <= 0 || c.value[c.value.length - 1] == null) && !(n.value.length >= s)) {
        le = !0;
        try {
          let g = 0;
          for (a("backfill:start", { target: s, fetched: n.value.length, calls: g }); n.value.length < s && g < i.backfillMaxCalls && c.value[c.value.length - 1] != null && !E.value && (await ae(i.backfillDelayMs, (C, K) => {
            a("backfill:tick", {
              fetched: n.value.length,
              target: s,
              calls: g,
              remainingMs: C,
              totalMs: K
            });
          }), !E.value); ) {
            const A = c.value[c.value.length - 1];
            try {
              m.value = !0;
              const C = await p(A);
              if (E.value) break;
              c.value.push(C.nextPage);
            } finally {
              m.value = !1;
            }
            g++;
          }
          a("backfill:stop", { fetched: n.value.length, calls: g });
        } finally {
          le = !1;
        }
      }
    }
    function pe() {
      E.value = !0, m.value = !1, le = !1;
    }
    function Fe() {
      pe(), E.value = !1, u.value && u.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), n.value = [], x.value = 0, b.value = i.loadAtPage, c.value = [i.loadAtPage], M.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const he = Se(async () => {
      u.value && (T.value = u.value.scrollTop, P.value = u.value.clientHeight), S.value = !0, await Q(), await new Promise((r) => requestAnimationFrame(() => r())), S.value = !1;
      const t = me(n.value, d.value);
      Y(t), y(t);
    }, 200), ye = Se(Be, 200);
    function Oe(t, r, s) {
      b.value = r, c.value = [r], c.value.push(s), H(t, "init"), j([...n.value, ...t]), y();
    }
    return He(
      v,
      () => {
        u.value && (d.value = fe(v.value), j(n.value));
      },
      { deep: !0 }
    ), Le(async () => {
      var t;
      try {
        d.value = fe(v.value), u.value && (T.value = u.value.scrollTop, P.value = u.value.clientHeight);
        const r = i.loadAtPage;
        c.value = [r], i.skipInitialLoad || await B(c.value[0]), y();
      } catch (r) {
        console.error("Error during component initialization:", r), m.value = !1;
      }
      (t = u.value) == null || t.addEventListener("scroll", he, { passive: !0 }), window.addEventListener("resize", ye);
    }), ze(() => {
      var t;
      (t = u.value) == null || t.removeEventListener("scroll", he), window.removeEventListener("resize", ye);
    }), (t, r) => (V(), q("div", {
      class: xe(["overflow-auto w-full flex-1 masonry-container", { "force-motion": i.forceMotion }]),
      ref_key: "container",
      ref: u
    }, [
      O("div", {
        class: "relative",
        style: Re({ height: `${x.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        we(Ce, {
          name: "masonry",
          css: !1,
          onEnter: D,
          onBeforeEnter: Z,
          onLeave: X,
          onBeforeLeave: ee
        }, {
          default: _e(() => [
            (V(!0), q(qe, null, Ve(te.value, (s, f) => (V(), q("div", Te({
              key: `${s.page}-${s.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, Ge(Tt)(s, f), {
              style: { paddingTop: `${v.value.header}px`, paddingBottom: `${v.value.footer}px` }
            }), [
              Ne(t.$slots, "item", Te({ ref_for: !0 }, { item: s, remove: G }), () => [
                we($t, {
                  item: s,
                  remove: G
                }, null, 8, ["item"])
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }),
        x.value > 0 ? (V(), q("div", {
          key: 0,
          class: xe(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !M.value.isNearTrigger, "opacity-100": M.value.isNearTrigger }])
        }, [
          O("span", null, de(n.value.length) + " items", 1),
          r[0] || (r[0] = O("span", { class: "mx-2" }, "|", -1)),
          O("span", null, de(M.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : oe("", !0)
      ], 4)
    ], 2));
  }
}), Wt = (e, o) => {
  const l = e.__vccOpts || e;
  for (const [i, h] of o)
    l[i] = h;
  return l;
}, ke = /* @__PURE__ */ Wt(At, [["__scopeId", "data-v-08b0e6d9"]]), Ft = {
  install(e) {
    e.component("WyxosMasonry", ke), e.component("WMasonry", ke);
  }
};
export {
  ke as Masonry,
  Ft as default
};
