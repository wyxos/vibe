import { nextTick as Q, defineComponent as Le, ref as L, onMounted as He, watch as Ne, createElementBlock as q, openBlock as V, renderSlot as $e, createElementVNode as O, createCommentVNode as oe, withModifiers as ze, toDisplayString as de, computed as se, onUnmounted as Re, normalizeClass as we, normalizeStyle as Ce, createVNode as Me, TransitionGroup as _e, withCtx as qe, Fragment as Ve, renderList as Ge, mergeProps as Te, unref as Ue } from "vue";
let ue = null;
function Xe() {
  if (ue != null) return ue;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const l = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), ue = l, l;
}
function Ye(e, o, l, s = {}) {
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
  } = s;
  let m = 0, x = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const w = window.getComputedStyle(o);
      m = parseFloat(w.paddingLeft) || 0, x = parseFloat(w.paddingRight) || 0;
    }
  } catch {
  }
  const F = (d || 0) + m, _ = (u || 0) + x, H = o.offsetWidth - o.clientWidth, M = H > 0 ? H + 2 : Xe() + 2, P = o.offsetWidth - M - F - _, U = h * (l - 1), S = Math.floor((P - U) / l), T = e.map((w) => {
    const N = w.width, I = w.height;
    return Math.round(S * I / N) + n + a;
  });
  if (b === "sequential-balanced") {
    const w = T.length;
    if (w === 0) return [];
    const N = (p, k, B) => p + (k > 0 ? v : 0) + B;
    let I = Math.max(...T), D = T.reduce((p, k) => p + k, 0) + v * Math.max(0, w - 1);
    const Z = (p) => {
      let k = 1, B = 0, z = 0;
      for (let $ = 0; $ < w; $++) {
        const G = T[$], R = N(B, z, G);
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
      const k = T[p], B = p < te;
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
        R.imageHeight = T[$] - (n + a), R.columnHeight = T[$], R.left = z, R.top = ae[p], ae[p] += R.columnHeight + ($ + 1 < B ? v : 0), j.push(R);
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
var Je = typeof global == "object" && global && global.Object === Object && global, Ke = typeof self == "object" && self && self.Object === Object && self, Ae = Je || Ke || Function("return this")(), ie = Ae.Symbol, We = Object.prototype, Qe = We.hasOwnProperty, Ze = We.toString, re = ie ? ie.toStringTag : void 0;
function et(e) {
  var o = Qe.call(e, re), l = e[re];
  try {
    e[re] = void 0;
    var s = !0;
  } catch {
  }
  var h = Ze.call(e);
  return s && (o ? e[re] = l : delete e[re]), h;
}
var tt = Object.prototype, at = tt.toString;
function nt(e) {
  return at.call(e);
}
var rt = "[object Null]", ot = "[object Undefined]", Ie = ie ? ie.toStringTag : void 0;
function lt(e) {
  return e == null ? e === void 0 ? ot : rt : Ie && Ie in Object(e) ? et(e) : nt(e);
}
function st(e) {
  return e != null && typeof e == "object";
}
var it = "[object Symbol]";
function ut(e) {
  return typeof e == "symbol" || st(e) && lt(e) == it;
}
var ct = /\s/;
function ft(e) {
  for (var o = e.length; o-- && ct.test(e.charAt(o)); )
    ;
  return o;
}
var dt = /^\s+/;
function gt(e) {
  return e && e.slice(0, ft(e) + 1).replace(dt, "");
}
function ge(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var Pe = NaN, mt = /^[-+]0x[0-9a-f]+$/i, vt = /^0b[01]+$/i, pt = /^0o[0-7]+$/i, ht = parseInt;
function Se(e) {
  if (typeof e == "number")
    return e;
  if (ut(e))
    return Pe;
  if (ge(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = ge(o) ? o + "" : o;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = gt(e);
  var l = vt.test(e);
  return l || pt.test(e) ? ht(e.slice(2), l ? 2 : 8) : mt.test(e) ? Pe : +e;
}
var ce = function() {
  return Ae.Date.now();
}, yt = "Expected a function", bt = Math.max, xt = Math.min;
function ke(e, o, l) {
  var s, h, v, a, n, d, u = 0, c = !1, b = !1, m = !0;
  if (typeof e != "function")
    throw new TypeError(yt);
  o = Se(o) || 0, ge(l) && (c = !!l.leading, b = "maxWait" in l, v = b ? bt(Se(l.maxWait) || 0, o) : v, m = "trailing" in l ? !!l.trailing : m);
  function x(y) {
    var W = s, w = h;
    return s = h = void 0, u = y, a = e.apply(w, W), a;
  }
  function F(y) {
    return u = y, n = setTimeout(M, o), c ? x(y) : a;
  }
  function _(y) {
    var W = y - d, w = y - u, N = o - W;
    return b ? xt(N, v - w) : N;
  }
  function H(y) {
    var W = y - d, w = y - u;
    return d === void 0 || W >= o || W < 0 || b && w >= v;
  }
  function M() {
    var y = ce();
    if (H(y))
      return P(y);
    n = setTimeout(M, _(y));
  }
  function P(y) {
    return n = void 0, m && s ? x(y) : (s = h = void 0, a);
  }
  function U() {
    n !== void 0 && clearTimeout(n), u = 0, s = d = h = n = void 0;
  }
  function S() {
    return n === void 0 ? a : P(ce());
  }
  function T() {
    var y = ce(), W = H(y);
    if (s = arguments, h = this, d = y, W) {
      if (n === void 0)
        return F(d);
      if (b)
        return clearTimeout(n), n = setTimeout(M, o), x(d);
    }
    return n === void 0 && (n = setTimeout(M, o)), a;
  }
  return T.cancel = U, T.flush = S, T;
}
function fe(e) {
  const o = window.innerWidth, l = e.sizes;
  return o >= 1536 && l["2xl"] ? l["2xl"] : o >= 1280 && l.xl ? l.xl : o >= 1024 && l.lg ? l.lg : o >= 768 && l.md ? l.md : o >= 640 && l.sm ? l.sm : l.base;
}
function wt(e) {
  return e.reduce((l, s) => Math.max(l, s.top + s.columnHeight), 0) + 500;
}
function Mt(e) {
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
    style: Mt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function me(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const s = Array.from(new Set(e.map((a) => a.left))).sort((a, n) => a - n).slice(0, o), h = /* @__PURE__ */ new Map();
  for (let a = 0; a < s.length; a++) h.set(s[a], a);
  const v = new Array(s.length).fill(0);
  for (const a of e) {
    const n = h.get(a.left);
    n != null && (v[n] = Math.max(v[n], a.top + a.columnHeight));
  }
  for (; v.length < o; ) v.push(0);
  return v;
}
function It(e, o) {
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
  function s(a) {
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
      const M = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", P = parseFloat(M);
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
    onBeforeEnter: s,
    onBeforeLeave: h,
    onLeave: v
  };
}
function Pt({
  container: e,
  masonry: o,
  columns: l,
  containerHeight: s,
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
    const M = typeof u == "number" ? u : 200, P = M >= 0 ? Math.max(0, F - M) : Math.max(0, F + M);
    if (_ >= P && H && !h.value) {
      await d(), await Q();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
const St = { class: "relative w-full h-full group" }, kt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, Et = {
  key: 0,
  class: "absolute inset-0 flex items-center justify-center bg-slate-100"
}, Lt = {
  key: 1,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ht = ["src"], Nt = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75" }, $t = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, ve = /* @__PURE__ */ Le({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: { type: Function }
  },
  setup(e) {
    const o = e, l = L(!1), s = L(!1), h = L(null);
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
            l.value = !0, s.value = !1, n();
          }, x);
        }, u.onerror = () => {
          s.value = !0, l.value = !1, d(new Error("Failed to load image"));
        }, u.src = a;
      });
    }
    return He(async () => {
      var n, d;
      console.log("[MasonryItem] Component mounted", (n = o.item) == null ? void 0 : n.id);
      const a = (d = o.item) == null ? void 0 : d.src;
      if (a) {
        h.value = a, l.value = !1, s.value = !1;
        try {
          await v(a);
        } catch {
        }
      }
    }), Ne(
      () => {
        var a;
        return (a = o.item) == null ? void 0 : a.src;
      },
      async (a) => {
        if (a && a !== h.value) {
          l.value = !1, s.value = !1, h.value = a;
          try {
            await v(a);
          } catch {
          }
        }
      }
    ), (a, n) => (V(), q("div", St, [
      $e(a.$slots, "default", {
        item: a.item,
        remove: a.remove,
        imageLoaded: l.value,
        imageError: s.value
      }, () => [
        O("div", kt, [
          !l.value && !s.value ? (V(), q("div", Et, n[1] || (n[1] = [
            O("div", { class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }, null, -1)
          ]))) : oe("", !0),
          s.value ? (V(), q("div", Lt, n[2] || (n[2] = [
            O("i", { class: "fas fa-image text-2xl mb-2 opacity-50" }, null, -1),
            O("span", null, "Failed to load image", -1)
          ]))) : oe("", !0),
          l.value && h.value ? (V(), q("img", {
            key: 2,
            src: h.value,
            class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            loading: "lazy",
            decoding: "async"
          }, null, 8, Ht)) : oe("", !0),
          n[4] || (n[4] = O("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" }, null, -1)),
          a.remove ? (V(), q("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer",
            onClick: n[0] || (n[0] = ze((d) => a.remove(a.item), ["stop"])),
            "aria-label": "Remove item"
          }, n[3] || (n[3] = [
            O("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : oe("", !0),
          O("div", Nt, [
            O("p", $t, "Item #" + de(String(a.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ]));
  }
}), At = /* @__PURE__ */ Le({
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
    const s = e, h = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, v = se(() => {
      var t;
      return {
        ...h,
        ...s.layout,
        sizes: {
          ...h.sizes,
          ...((t = s.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), a = l, n = se({
      get: () => s.items,
      set: (t) => a("update:items", t)
    }), d = L(7), u = L(null), c = L([]), b = L(null), m = L(!1), x = L(0), F = L(/* @__PURE__ */ new Set());
    function _(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function H(t, r) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const i = t.filter((g) => !_(g == null ? void 0 : g.width) || !_(g == null ? void 0 : g.height));
        if (i.length === 0) return;
        const f = [];
        for (const g of i) {
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
    const M = L(0), P = L(0), U = s.virtualBufferPx, S = L(!1), T = L({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), y = (t) => {
      if (!u.value) return;
      const { scrollTop: r, clientHeight: i } = u.value, f = r + i, g = t ?? me(n.value, d.value), A = g.length ? Math.max(...g) : 0, C = typeof s.loadThresholdPx == "number" ? s.loadThresholdPx : 200, K = C >= 0 ? Math.max(0, A - C) : Math.max(0, A + C), xe = Math.max(0, K - f), je = xe <= 100;
      T.value = {
        distanceToTrigger: Math.round(xe),
        isNearTrigger: je
      };
    }, { onEnter: W, onBeforeEnter: w, onBeforeLeave: N, onLeave: I } = It(n, { leaveDurationMs: s.leaveDurationMs });
    function D(t, r) {
      if (S.value) {
        const i = parseInt(t.dataset.left || "0", 10), f = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${i}px, ${f}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", r();
        });
      } else
        W(t, r);
    }
    function Z(t) {
      if (S.value) {
        const r = parseInt(t.dataset.left || "0", 10), i = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${r}px, ${i}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        w(t);
    }
    function ee(t) {
      S.value || N(t);
    }
    function X(t, r) {
      S.value ? r() : I(t, r);
    }
    const te = se(() => {
      const t = M.value - U, r = M.value + P.value + U, i = n.value;
      return !i || i.length === 0 ? [] : i.filter((f) => {
        const g = f.top;
        return f.top + f.columnHeight >= t && g <= r;
      });
    }), { handleScroll: Y } = Pt({
      container: u,
      masonry: n,
      columns: d,
      containerHeight: x,
      isLoading: m,
      pageSize: s.pageSize,
      refreshLayout: j,
      setItemsRaw: (t) => {
        n.value = t;
      },
      loadNext: z,
      loadThresholdPx: s.loadThresholdPx
    });
    o({
      isLoading: m,
      refreshLayout: j,
      containerHeight: x,
      remove: G,
      removeMany: R,
      removeAll: Be,
      loadNext: z,
      loadPage: B,
      refreshCurrentPage: $,
      reset: Oe,
      init: De,
      paginationHistory: c,
      cancelLoad: he,
      scrollToTop: pe,
      totalItems: se(() => n.value.length)
    });
    function J(t) {
      const r = wt(t);
      let i = 0;
      if (u.value) {
        const { scrollTop: f, clientHeight: g } = u.value;
        i = f + g + 100;
      }
      x.value = Math.max(r, i);
    }
    function j(t) {
      if (!u.value) return;
      H(t, "refreshLayout");
      const r = t.map((f, g) => ({
        ...f,
        originalIndex: f.originalIndex ?? g
      })), i = Ye(r, u.value, d.value, v.value);
      J(i), n.value = i;
    }
    function ae(t, r) {
      return new Promise((i) => {
        const f = Math.max(0, t | 0), g = Date.now();
        r(f, f);
        const A = setInterval(() => {
          if (E.value) {
            clearInterval(A), i();
            return;
          }
          const C = Date.now() - g, K = Math.max(0, f - C);
          r(K, f), K <= 0 && (clearInterval(A), i());
        }, 100);
      });
    }
    async function p(t) {
      try {
        const r = await k(() => s.getNextPage(t));
        return j([...n.value, ...r.items]), r;
      } catch (r) {
        throw console.error("Error in getContent:", r), r;
      }
    }
    async function k(t) {
      let r = 0;
      const i = s.retryMaxAttempts;
      let f = s.retryInitialDelayMs;
      for (; ; )
        try {
          const g = await t();
          return r > 0 && a("retry:stop", { attempt: r, success: !0 }), g;
        } catch (g) {
          if (r++, r > i)
            throw a("retry:stop", { attempt: r - 1, success: !1 }), g;
          a("retry:start", { attempt: r, max: i, totalMs: f }), await ae(f, (A, C) => {
            a("retry:tick", { attempt: r, remainingMs: A, totalMs: C });
          }), f += s.retryBackoffStepMs;
        }
    }
    async function B(t) {
      if (!m.value) {
        E.value = !1, m.value = !0;
        try {
          const r = n.value.length;
          if (E.value) return;
          const i = await p(t);
          return E.value ? void 0 : (b.value = t, c.value.push(i.nextPage), await ne(r), i);
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
          const r = c.value[c.value.length - 1], i = await p(r);
          return E.value ? void 0 : (b.value = r, c.value.push(i.nextPage), await ne(t), i);
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
          const i = n.value.length;
          return await ne(i), r;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          m.value = !1;
        }
      }
    }
    async function G(t) {
      const r = n.value.filter((i) => i.id !== t.id);
      if (n.value = r, await Q(), console.log("[Masonry] remove - next.length:", r.length, "paginationHistory.length:", c.value.length), r.length === 0 && c.value.length > 0) {
        if (s.autoRefreshOnEmpty)
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
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        j(r);
      });
    }
    async function R(t) {
      if (!t || t.length === 0) return;
      const r = new Set(t.map((f) => f.id)), i = n.value.filter((f) => !r.has(f.id));
      if (n.value = i, await Q(), i.length === 0 && c.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          await $();
        else
          try {
            await z(), await ne(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        j(i);
      });
    }
    function pe(t) {
      u.value && u.value.scrollTo({
        top: 0,
        behavior: (t == null ? void 0 : t.behavior) ?? "smooth",
        ...t
      });
    }
    async function Be() {
      pe({ behavior: "smooth" }), n.value = [], x.value = 0, await Q(), a("remove-all:complete");
    }
    function Fe() {
      d.value = fe(v.value), j(n.value), u.value && (M.value = u.value.scrollTop, P.value = u.value.clientHeight);
    }
    let le = !1;
    const E = L(!1);
    async function ne(t, r = !1) {
      if (!r && !s.backfillEnabled || le || E.value) return;
      const i = (t || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || c.value[c.value.length - 1] == null) && !(n.value.length >= i)) {
        le = !0;
        try {
          let g = 0;
          for (a("backfill:start", { target: i, fetched: n.value.length, calls: g }); n.value.length < i && g < s.backfillMaxCalls && c.value[c.value.length - 1] != null && !E.value && (await ae(s.backfillDelayMs, (C, K) => {
            a("backfill:tick", {
              fetched: n.value.length,
              target: i,
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
    function he() {
      E.value = !0, m.value = !1, le = !1;
    }
    function Oe() {
      he(), E.value = !1, u.value && u.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), n.value = [], x.value = 0, b.value = s.loadAtPage, c.value = [s.loadAtPage], T.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const ye = ke(async () => {
      u.value && (M.value = u.value.scrollTop, P.value = u.value.clientHeight), S.value = !0, await Q(), await new Promise((r) => requestAnimationFrame(() => r())), S.value = !1;
      const t = me(n.value, d.value);
      Y(t), y(t);
    }, 200), be = ke(Fe, 200);
    function De(t, r, i) {
      b.value = r, c.value = [r], c.value.push(i), H(t, "init"), j([...n.value, ...t]), y();
    }
    return Ne(
      v,
      () => {
        u.value && (d.value = fe(v.value), j(n.value));
      },
      { deep: !0 }
    ), He(async () => {
      var t;
      try {
        d.value = fe(v.value), u.value && (M.value = u.value.scrollTop, P.value = u.value.clientHeight);
        const r = s.loadAtPage;
        c.value = [r], s.skipInitialLoad || await B(c.value[0]), y();
      } catch (r) {
        console.error("Error during component initialization:", r), m.value = !1;
      }
      (t = u.value) == null || t.addEventListener("scroll", ye, { passive: !0 }), window.addEventListener("resize", be);
    }), Re(() => {
      var t;
      (t = u.value) == null || t.removeEventListener("scroll", ye), window.removeEventListener("resize", be);
    }), (t, r) => (V(), q("div", {
      class: we(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: u
    }, [
      O("div", {
        class: "relative",
        style: Ce({ height: `${x.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        Me(_e, {
          name: "masonry",
          css: !1,
          onEnter: D,
          onBeforeEnter: Z,
          onLeave: X,
          onBeforeLeave: ee
        }, {
          default: qe(() => [
            (V(!0), q(Ve, null, Ge(te.value, (i, f) => (V(), q("div", Te({
              key: `${i.page}-${i.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, Ue(Tt)(i, f), {
              style: { paddingTop: `${v.value.header}px`, paddingBottom: `${v.value.footer}px` }
            }), [
              $e(t.$slots, "item", Te({ ref_for: !0 }, { item: i, remove: G }), () => [
                Me(ve, {
                  item: i,
                  remove: G
                }, null, 8, ["item"])
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }),
        x.value > 0 ? (V(), q("div", {
          key: 0,
          class: we(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !T.value.isNearTrigger, "opacity-100": T.value.isNearTrigger }])
        }, [
          O("span", null, de(n.value.length) + " items", 1),
          r[0] || (r[0] = O("span", { class: "mx-2" }, "|", -1)),
          O("span", null, de(T.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : oe("", !0)
      ], 4)
    ], 2));
  }
}), Wt = (e, o) => {
  const l = e.__vccOpts || e;
  for (const [s, h] of o)
    l[s] = h;
  return l;
}, Ee = /* @__PURE__ */ Wt(At, [["__scopeId", "data-v-08b0e6d9"]]), Ft = {
  install(e) {
    e.component("WyxosMasonry", Ee), e.component("WMasonry", Ee), e.component("WyxosMasonryItem", ve), e.component("WMasonryItem", ve);
  }
};
export {
  Ee as Masonry,
  ve as MasonryItem,
  Ft as default
};
