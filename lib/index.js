import { nextTick as U, ref as H, computed as ae, defineComponent as ft, onMounted as dt, onUnmounted as ht, watch as se, createElementBlock as R, openBlock as j, createCommentVNode as ie, createElementVNode as q, normalizeStyle as He, renderSlot as K, normalizeClass as me, withModifiers as nt, toDisplayString as qe, unref as ye, Fragment as lt, renderList as ot, createVNode as Re, withCtx as Ie, mergeProps as Ee, TransitionGroup as Ht } from "vue";
let je = null;
function St() {
  if (je != null) return je;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const c = document.createElement("div");
  c.style.width = "100%", t.appendChild(c);
  const v = t.offsetWidth - c.offsetWidth;
  return document.body.removeChild(t), je = v, v;
}
function rt(t, c, v, r = {}) {
  const {
    gutterX: E = 0,
    gutterY: w = 0,
    header: y = 0,
    footer: f = 0,
    paddingLeft: x = 0,
    paddingRight: M = 0,
    sizes: s = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: T = "masonry"
  } = r;
  let p = 0, b = 0;
  try {
    if (c && c.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const $ = window.getComputedStyle(c);
      p = parseFloat($.paddingLeft) || 0, b = parseFloat($.paddingRight) || 0;
    }
  } catch {
  }
  const i = (x || 0) + p, L = (M || 0) + b, l = c.offsetWidth - c.clientWidth, h = l > 0 ? l + 2 : St() + 2, k = c.offsetWidth - h - i - L, P = E * (v - 1), W = Math.floor((k - P) / v), I = t.map(($) => {
    const C = $.width, B = $.height;
    return Math.round(W * B / C) + f + y;
  });
  if (T === "sequential-balanced") {
    const $ = I.length;
    if ($ === 0) return [];
    const C = (N, G, Z) => N + (G > 0 ? w : 0) + Z;
    let B = Math.max(...I), a = I.reduce((N, G) => N + G, 0) + w * Math.max(0, $ - 1);
    const d = (N) => {
      let G = 1, Z = 0, ve = 0;
      for (let ee = 0; ee < $; ee++) {
        const ge = I[ee], le = C(Z, ve, ge);
        if (le <= N)
          Z = le, ve++;
        else if (G++, Z = ge, ve = 1, ge > N || G > v) return !1;
      }
      return G <= v;
    };
    for (; B < a; ) {
      const N = Math.floor((B + a) / 2);
      d(N) ? a = N : B = N + 1;
    }
    const _ = a, D = new Array(v).fill(0);
    let ne = v - 1, X = 0, A = 0;
    for (let N = $ - 1; N >= 0; N--) {
      const G = I[N], Z = N < ne;
      !(C(X, A, G) <= _) || Z ? (D[ne] = N + 1, ne--, X = G, A = 1) : (X = C(X, A, G), A++);
    }
    D[0] = 0;
    const ue = [], ce = new Array(v).fill(0);
    for (let N = 0; N < v; N++) {
      const G = D[N], Z = N + 1 < v ? D[N + 1] : $, ve = N * (W + E);
      for (let ee = G; ee < Z; ee++) {
        const le = {
          ...t[ee],
          columnWidth: W,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        le.imageHeight = I[ee] - (f + y), le.columnHeight = I[ee], le.left = ve, le.top = ce[N], ce[N] += le.columnHeight + (ee + 1 < Z ? w : 0), ue.push(le);
      }
    }
    return ue;
  }
  const m = new Array(v).fill(0), z = [];
  for (let $ = 0; $ < t.length; $++) {
    const C = t[$], B = {
      ...C,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, a = m.indexOf(Math.min(...m)), d = C.width, _ = C.height;
    B.columnWidth = W, B.left = a * (W + E), B.imageHeight = Math.round(W * _ / d), B.columnHeight = B.imageHeight + f + y, B.top = m[a], m[a] += B.columnHeight + w, z.push(B);
  }
  return z;
}
var Pt = typeof global == "object" && global && global.Object === Object && global, $t = typeof self == "object" && self && self.Object === Object && self, mt = Pt || $t || Function("return this")(), $e = mt.Symbol, gt = Object.prototype, Nt = gt.hasOwnProperty, Ft = gt.toString, Le = $e ? $e.toStringTag : void 0;
function Wt(t) {
  var c = Nt.call(t, Le), v = t[Le];
  try {
    t[Le] = void 0;
    var r = !0;
  } catch {
  }
  var E = Ft.call(t);
  return r && (c ? t[Le] = v : delete t[Le]), E;
}
var Bt = Object.prototype, Dt = Bt.toString;
function At(t) {
  return Dt.call(t);
}
var zt = "[object Null]", Ot = "[object Undefined]", it = $e ? $e.toStringTag : void 0;
function Rt(t) {
  return t == null ? t === void 0 ? Ot : zt : it && it in Object(t) ? Wt(t) : At(t);
}
function jt(t) {
  return t != null && typeof t == "object";
}
var Ct = "[object Symbol]";
function qt(t) {
  return typeof t == "symbol" || jt(t) && Rt(t) == Ct;
}
var Vt = /\s/;
function Yt(t) {
  for (var c = t.length; c-- && Vt.test(t.charAt(c)); )
    ;
  return c;
}
var Ut = /^\s+/;
function _t(t) {
  return t && t.slice(0, Yt(t) + 1).replace(Ut, "");
}
function Ve(t) {
  var c = typeof t;
  return t != null && (c == "object" || c == "function");
}
var st = NaN, Xt = /^[-+]0x[0-9a-f]+$/i, Gt = /^0b[01]+$/i, Jt = /^0o[0-7]+$/i, Kt = parseInt;
function ut(t) {
  if (typeof t == "number")
    return t;
  if (qt(t))
    return st;
  if (Ve(t)) {
    var c = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Ve(c) ? c + "" : c;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = _t(t);
  var v = Gt.test(t);
  return v || Jt.test(t) ? Kt(t.slice(2), v ? 2 : 8) : Xt.test(t) ? st : +t;
}
var Ce = function() {
  return mt.Date.now();
}, Qt = "Expected a function", Zt = Math.max, ea = Math.min;
function ct(t, c, v) {
  var r, E, w, y, f, x, M = 0, s = !1, T = !1, p = !0;
  if (typeof t != "function")
    throw new TypeError(Qt);
  c = ut(c) || 0, Ve(v) && (s = !!v.leading, T = "maxWait" in v, w = T ? Zt(ut(v.maxWait) || 0, c) : w, p = "trailing" in v ? !!v.trailing : p);
  function b(m) {
    var z = r, $ = E;
    return r = E = void 0, M = m, y = t.apply($, z), y;
  }
  function i(m) {
    return M = m, f = setTimeout(h, c), s ? b(m) : y;
  }
  function L(m) {
    var z = m - x, $ = m - M, C = c - z;
    return T ? ea(C, w - $) : C;
  }
  function l(m) {
    var z = m - x, $ = m - M;
    return x === void 0 || z >= c || z < 0 || T && $ >= w;
  }
  function h() {
    var m = Ce();
    if (l(m))
      return k(m);
    f = setTimeout(h, L(m));
  }
  function k(m) {
    return f = void 0, p && r ? b(m) : (r = E = void 0, y);
  }
  function P() {
    f !== void 0 && clearTimeout(f), M = 0, r = x = E = f = void 0;
  }
  function W() {
    return f === void 0 ? y : k(Ce());
  }
  function I() {
    var m = Ce(), z = l(m);
    if (r = arguments, E = this, x = m, z) {
      if (f === void 0)
        return i(x);
      if (T)
        return clearTimeout(f), f = setTimeout(h, c), b(x);
    }
    return f === void 0 && (f = setTimeout(h, c)), y;
  }
  return I.cancel = P, I.flush = W, I;
}
function we(t, c) {
  const v = c ?? (typeof window < "u" ? window.innerWidth : 1024), r = t.sizes;
  return v >= 1536 && r["2xl"] ? r["2xl"] : v >= 1280 && r.xl ? r.xl : v >= 1024 && r.lg ? r.lg : v >= 768 && r.md ? r.md : v >= 640 && r.sm ? r.sm : r.base;
}
function ta(t) {
  const c = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return c >= 1536 ? "2xl" : c >= 1280 ? "xl" : c >= 1024 ? "lg" : c >= 768 ? "md" : c >= 640 ? "sm" : "base";
}
function aa(t) {
  return t.reduce((v, r) => Math.max(v, r.top + r.columnHeight), 0) + 500;
}
function na(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function la(t, c = 0) {
  return {
    style: na(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": c
  };
}
function Ye(t, c) {
  if (!t.length || c <= 0)
    return new Array(Math.max(1, c)).fill(0);
  const r = Array.from(new Set(t.map((y) => y.left))).sort((y, f) => y - f).slice(0, c), E = /* @__PURE__ */ new Map();
  for (let y = 0; y < r.length; y++) E.set(r[y], y);
  const w = new Array(r.length).fill(0);
  for (const y of t) {
    const f = E.get(y.left);
    f != null && (w[f] = Math.max(w[f], y.top + y.columnHeight));
  }
  for (; w.length < c; ) w.push(0);
  return w;
}
function oa(t, c) {
  let v = 0, r = 0;
  const E = 1e3;
  function w(s, T) {
    var i;
    const p = (i = t.container) == null ? void 0 : i.value;
    if (p) {
      const L = p.scrollTop, l = p.clientHeight;
      v = L - E, r = L + l + E;
    }
    return s + T >= v && s <= r;
  }
  function y(s, T) {
    const p = parseInt(s.dataset.left || "0", 10), b = parseInt(s.dataset.top || "0", 10), i = parseInt(s.dataset.index || "0", 10), L = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(b, L)) {
      s.style.opacity = "1", s.style.transform = `translate3d(${p}px, ${b}px, 0) scale(1)`, s.style.transition = "none", T();
      return;
    }
    const l = Math.min(i * 20, 160), h = s.style.getPropertyValue("--masonry-opacity-delay");
    s.style.setProperty("--masonry-opacity-delay", `${l}ms`), requestAnimationFrame(() => {
      s.style.opacity = "1", s.style.transform = `translate3d(${p}px, ${b}px, 0) scale(1)`;
      const k = () => {
        h ? s.style.setProperty("--masonry-opacity-delay", h) : s.style.removeProperty("--masonry-opacity-delay"), s.removeEventListener("transitionend", k), T();
      };
      s.addEventListener("transitionend", k);
    });
  }
  function f(s) {
    const T = parseInt(s.dataset.left || "0", 10), p = parseInt(s.dataset.top || "0", 10);
    s.style.opacity = "0", s.style.transform = `translate3d(${T}px, ${p + 10}px, 0) scale(0.985)`;
  }
  function x(s) {
    const T = parseInt(s.dataset.left || "0", 10), p = parseInt(s.dataset.top || "0", 10), b = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(p, b)) {
      s.style.transition = "none";
      return;
    }
    s.style.transition = "none", s.style.opacity = "1", s.style.transform = `translate3d(${T}px, ${p}px, 0) scale(1)`, s.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      s.style.transition = "";
    });
  }
  function M(s, T) {
    const p = parseInt(s.dataset.left || "0", 10), b = parseInt(s.dataset.top || "0", 10), i = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(b, i)) {
      s.style.transition = "none", s.style.opacity = "0", T();
      return;
    }
    const L = typeof (c == null ? void 0 : c.leaveDurationMs) == "number" ? c.leaveDurationMs : NaN;
    let l = Number.isFinite(L) && L > 0 ? L : NaN;
    if (!Number.isFinite(l)) {
      const m = getComputedStyle(s).getPropertyValue("--masonry-leave-duration") || "", z = parseFloat(m);
      l = Number.isFinite(z) && z > 0 ? z : 200;
    }
    const h = s.style.transitionDuration, k = () => {
      s.removeEventListener("transitionend", P), clearTimeout(W), s.style.transitionDuration = h || "";
    }, P = (I) => {
      (!I || I.target === s) && (k(), T());
    }, W = setTimeout(() => {
      k(), T();
    }, l + 100);
    requestAnimationFrame(() => {
      s.style.transitionDuration = `${l}ms`, s.style.opacity = "0", s.style.transform = `translate3d(${p}px, ${b + 10}px, 0) scale(0.985)`, s.addEventListener("transitionend", P);
    });
  }
  return {
    onEnter: y,
    onBeforeEnter: f,
    onBeforeLeave: x,
    onLeave: M
  };
}
function ra({
  container: t,
  masonry: c,
  columns: v,
  containerHeight: r,
  isLoading: E,
  pageSize: w,
  refreshLayout: y,
  setItemsRaw: f,
  loadNext: x,
  loadThresholdPx: M
}) {
  let s = 0;
  async function T(p) {
    if (!t.value) return;
    const b = p ?? Ye(c.value, v.value), i = b.length ? Math.max(...b) : 0, L = t.value.scrollTop + t.value.clientHeight, l = t.value.scrollTop > s + 1;
    s = t.value.scrollTop;
    const h = typeof M == "number" ? M : 200, k = h >= 0 ? Math.max(0, i - h) : Math.max(0, i + h);
    if (L >= k && l && !E.value) {
      await x(), await U();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
function ia(t) {
  const { useSwipeMode: c, masonry: v, isLoading: r, loadNext: E, loadPage: w, paginationHistory: y } = t, f = H(0), x = H(0), M = H(!1), s = H(0), T = H(0), p = H(null), b = ae(() => {
    if (!c.value || v.value.length === 0) return null;
    const a = Math.max(0, Math.min(f.value, v.value.length - 1));
    return v.value[a] || null;
  }), i = ae(() => {
    if (!c.value || !b.value) return null;
    const a = f.value + 1;
    return a >= v.value.length ? null : v.value[a] || null;
  }), L = ae(() => {
    if (!c.value || !b.value) return null;
    const a = f.value - 1;
    return a < 0 ? null : v.value[a] || null;
  });
  function l() {
    if (!p.value) return;
    const a = p.value.clientHeight;
    x.value = -f.value * a;
  }
  function h() {
    if (!i.value) {
      E();
      return;
    }
    f.value++, l(), f.value >= v.value.length - 5 && E();
  }
  function k() {
    L.value && (f.value--, l());
  }
  function P(a) {
    c.value && (M.value = !0, s.value = a.touches[0].clientY, T.value = x.value, a.preventDefault());
  }
  function W(a) {
    if (!c.value || !M.value) return;
    const d = a.touches[0].clientY - s.value;
    x.value = T.value + d, a.preventDefault();
  }
  function I(a) {
    if (!c.value || !M.value) return;
    M.value = !1;
    const d = x.value - T.value;
    Math.abs(d) > 100 ? d > 0 && L.value ? k() : d < 0 && i.value ? h() : l() : l(), a.preventDefault();
  }
  function m(a) {
    c.value && (M.value = !0, s.value = a.clientY, T.value = x.value, a.preventDefault());
  }
  function z(a) {
    if (!c.value || !M.value) return;
    const d = a.clientY - s.value;
    x.value = T.value + d, a.preventDefault();
  }
  function $(a) {
    if (!c.value || !M.value) return;
    M.value = !1;
    const d = x.value - T.value;
    Math.abs(d) > 100 ? d > 0 && L.value ? k() : d < 0 && i.value ? h() : l() : l(), a.preventDefault();
  }
  function C() {
    !c.value && f.value > 0 && (f.value = 0, x.value = 0), c.value && v.value.length === 0 && !r.value && w(y.value[0]), c.value && l();
  }
  function B() {
    f.value = 0, x.value = 0, M.value = !1;
  }
  return {
    // State
    currentSwipeIndex: f,
    swipeOffset: x,
    isDragging: M,
    swipeContainer: p,
    // Computed
    currentItem: b,
    nextItem: i,
    previousItem: L,
    // Functions
    handleTouchStart: P,
    handleTouchMove: W,
    handleTouchEnd: I,
    handleMouseDown: m,
    handleMouseMove: z,
    handleMouseUp: $,
    goToNextItem: h,
    goToPreviousItem: k,
    snapToCurrentItem: l,
    handleWindowResize: C,
    reset: B
  };
}
const sa = { class: "flex-1 relative min-h-0" }, ua = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ca = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, va = {
  key: 1,
  class: "relative w-full h-full"
}, fa = ["src"], da = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ma = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ga = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ne = /* @__PURE__ */ ft({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 },
    headerHeight: { default: 0 },
    footerHeight: { default: 0 },
    isActive: { type: Boolean, default: !1 },
    inSwipeMode: { type: Boolean, default: !1 }
  },
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave"],
  setup(t, { emit: c }) {
    const v = t, r = c, E = H(!1), w = H(!1), y = H(null), f = H(!1), x = H(!1), M = H(null), s = H(!1), T = H(!1), p = H(!1), b = H(null), i = H(null);
    let L = null;
    const l = ae(() => {
      var a;
      return v.type ?? ((a = v.item) == null ? void 0 : a.type) ?? "image";
    }), h = ae(() => {
      var a;
      return v.notFound ?? ((a = v.item) == null ? void 0 : a.notFound) ?? !1;
    }), k = ae(() => !!v.inSwipeMode);
    function P(a) {
      r("mouse-enter", { item: v.item, type: a });
    }
    function W(a) {
      r("mouse-leave", { item: v.item, type: a });
    }
    function I(a) {
      if (k.value) return;
      const d = a.target;
      d && (d.paused ? d.play() : d.pause());
    }
    function m(a) {
      const d = a.target;
      d && (k.value || d.play(), P("video"));
    }
    function z(a) {
      const d = a.target;
      d && (k.value || d.pause(), W("video"));
    }
    function $(a) {
      return new Promise((d, _) => {
        if (!a) {
          const A = new Error("No image source provided");
          r("preload:error", { item: v.item, type: "image", src: a, error: A }), _(A);
          return;
        }
        const D = new Image(), ne = Date.now(), X = 300;
        D.onload = () => {
          const A = Date.now() - ne, ue = Math.max(0, X - A);
          setTimeout(async () => {
            E.value = !0, w.value = !1, T.value = !1, await U(), await new Promise((ce) => setTimeout(ce, 100)), p.value = !0, r("preload:success", { item: v.item, type: "image", src: a }), d();
          }, ue);
        }, D.onerror = () => {
          w.value = !0, E.value = !1, T.value = !1;
          const A = new Error("Failed to load image");
          r("preload:error", { item: v.item, type: "image", src: a, error: A }), _(A);
        }, D.src = a;
      });
    }
    function C(a) {
      return new Promise((d, _) => {
        if (!a) {
          const A = new Error("No video source provided");
          r("preload:error", { item: v.item, type: "video", src: a, error: A }), _(A);
          return;
        }
        const D = document.createElement("video"), ne = Date.now(), X = 300;
        D.preload = "metadata", D.muted = !0, D.onloadedmetadata = () => {
          const A = Date.now() - ne, ue = Math.max(0, X - A);
          setTimeout(async () => {
            f.value = !0, x.value = !1, T.value = !1, await U(), await new Promise((ce) => setTimeout(ce, 100)), p.value = !0, r("preload:success", { item: v.item, type: "video", src: a }), d();
          }, ue);
        }, D.onerror = () => {
          x.value = !0, f.value = !1, T.value = !1;
          const A = new Error("Failed to load video");
          r("preload:error", { item: v.item, type: "video", src: a, error: A }), _(A);
        }, D.src = a;
      });
    }
    async function B() {
      var d;
      if (!s.value || T.value || h.value || l.value === "video" && f.value || l.value === "image" && E.value)
        return;
      const a = (d = v.item) == null ? void 0 : d.src;
      if (a)
        if (T.value = !0, p.value = !1, l.value === "video") {
          M.value = a, f.value = !1, x.value = !1;
          try {
            await C(a);
          } catch {
          }
        } else {
          y.value = a, E.value = !1, w.value = !1;
          try {
            await $(a);
          } catch {
          }
        }
    }
    return dt(() => {
      b.value && (L = new IntersectionObserver(
        (a) => {
          a.forEach((d) => {
            d.isIntersecting && d.intersectionRatio >= 1 ? s.value || (s.value = !0, B()) : d.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), L.observe(b.value));
    }), ht(() => {
      L && (L.disconnect(), L = null);
    }), se(
      () => {
        var a;
        return (a = v.item) == null ? void 0 : a.src;
      },
      async (a) => {
        if (!(!a || h.value)) {
          if (l.value === "video") {
            if (a !== M.value && (f.value = !1, x.value = !1, M.value = a, s.value)) {
              T.value = !0;
              try {
                await C(a);
              } catch {
              }
            }
          } else if (a !== y.value && (E.value = !1, w.value = !1, y.value = a, s.value)) {
            T.value = !0;
            try {
              await $(a);
            } catch {
            }
          }
        }
      }
    ), se(
      () => v.isActive,
      (a) => {
        !k.value || !i.value || (a ? i.value.play() : i.value.pause());
      }
    ), (a, d) => (j(), R("div", {
      ref_key: "containerRef",
      ref: b,
      class: "relative w-full h-full flex flex-col"
    }, [
      a.headerHeight > 0 ? (j(), R("div", {
        key: 0,
        class: "relative z-10",
        style: He({ height: `${a.headerHeight}px` })
      }, [
        K(a.$slots, "header", {
          item: a.item,
          remove: a.remove,
          imageLoaded: E.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: x.value,
          showNotFound: h.value,
          isLoading: T.value,
          mediaType: l.value
        })
      ], 4)) : ie("", !0),
      q("div", sa, [
        K(a.$slots, "default", {
          item: a.item,
          remove: a.remove,
          imageLoaded: E.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: x.value,
          showNotFound: h.value,
          isLoading: T.value,
          mediaType: l.value,
          imageSrc: y.value,
          videoSrc: M.value,
          showMedia: p.value
        }, () => [
          q("div", ua, [
            h.value ? (j(), R("div", ca, d[3] || (d[3] = [
              q("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              q("span", { class: "font-medium" }, "Not Found", -1),
              q("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), R("div", va, [
              l.value === "image" && y.value ? (j(), R("img", {
                key: 0,
                src: y.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  E.value && p.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: d[0] || (d[0] = (_) => P("image")),
                onMouseleave: d[1] || (d[1] = (_) => W("image"))
              }, null, 42, fa)) : ie("", !0),
              l.value === "video" && M.value ? (j(), R("video", {
                key: 1,
                ref_key: "videoEl",
                ref: i,
                src: M.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  f.value && p.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: k.value && v.isActive,
                controls: k.value,
                onClick: nt(I, ["stop"]),
                onTouchend: nt(I, ["stop", "prevent"]),
                onMouseenter: m,
                onMouseleave: z,
                onError: d[2] || (d[2] = (_) => x.value = !0)
              }, null, 42, da)) : ie("", !0),
              !E.value && !f.value && !w.value && !x.value ? (j(), R("div", {
                key: 2,
                class: me([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  p.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                q("div", ha, [
                  K(a.$slots, "placeholder-icon", { mediaType: l.value }, () => [
                    q("i", {
                      class: me(l.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ie("", !0),
              T.value ? (j(), R("div", ma, d[4] || (d[4] = [
                q("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  q("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ie("", !0),
              l.value === "image" && w.value || l.value === "video" && x.value ? (j(), R("div", ga, [
                q("i", {
                  class: me(l.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                q("span", null, "Failed to load " + qe(l.value), 1)
              ])) : ie("", !0)
            ]))
          ])
        ])
      ]),
      a.footerHeight > 0 ? (j(), R("div", {
        key: 1,
        class: "relative z-10",
        style: He({ height: `${a.footerHeight}px` })
      }, [
        K(a.$slots, "footer", {
          item: a.item,
          remove: a.remove,
          imageLoaded: E.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: x.value,
          showNotFound: h.value,
          isLoading: T.value,
          mediaType: l.value
        })
      ], 4)) : ie("", !0)
    ], 512));
  }
});
function ke(t) {
  return t instanceof Error ? t : new Error(String(t));
}
const pa = { class: "w-full h-full flex items-center justify-center p-4" }, ya = { class: "w-full h-full max-w-full max-h-full relative" }, wa = {
  key: 0,
  class: "w-full py-8 text-center"
}, xa = {
  key: 1,
  class: "w-full py-8 text-center"
}, ba = { class: "text-red-500 dark:text-red-400" }, Ma = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ta = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ia = { class: "text-red-500 dark:text-red-400" }, Ea = /* @__PURE__ */ ft({
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
      validator: (t) => ["page", "cursor"].includes(t)
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
    },
    // Layout mode: 'auto' (detect from screen size), 'masonry', or 'swipe'
    layoutMode: {
      type: String,
      default: "auto",
      validator: (t) => ["auto", "masonry", "swipe"].includes(t)
    },
    // Breakpoint for switching to swipe mode (in pixels or Tailwind breakpoint name)
    mobileBreakpoint: {
      type: [Number, String],
      default: 768
      // 'md' breakpoint
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
    "remove-all:complete",
    // Re-emit item-level preload events from the default MasonryItem
    "item:preload:success",
    "item:preload:error",
    // Mouse events from MasonryItem content
    "item:mouse-enter",
    "item:mouse-leave"
  ],
  setup(t, { expose: c, emit: v }) {
    const r = t, E = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, w = ae(() => {
      var e;
      return {
        ...E,
        ...r.layout,
        sizes: {
          ...E.sizes,
          ...((e = r.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), y = H(null), f = H(typeof window < "u" ? window.innerWidth : 1024), x = H(typeof window < "u" ? window.innerHeight : 768), M = H(null);
    let s = null;
    function T(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const p = ae(() => {
      if (r.layoutMode === "masonry") return !1;
      if (r.layoutMode === "swipe") return !0;
      const e = typeof r.mobileBreakpoint == "string" ? T(r.mobileBreakpoint) : r.mobileBreakpoint;
      return f.value < e;
    }), b = v, i = ae({
      get: () => r.items,
      set: (e) => b("update:items", e)
    }), L = H(7), l = H(null), h = H([]), k = H(null), P = H(!1), W = H(0), I = H(!1), m = H(null), z = ae(() => ta(f.value)), $ = H(/* @__PURE__ */ new Set());
    function C(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function B(e, n) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const o = e.filter((u) => !C(u == null ? void 0 : u.width) || !C(u == null ? void 0 : u.height));
        if (o.length === 0) return;
        const g = [];
        for (const u of o) {
          const F = (u == null ? void 0 : u.id) ?? `idx:${e.indexOf(u)}`;
          $.value.has(F) || ($.value.add(F), g.push(F));
        }
        if (g.length > 0) {
          const u = g.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: n,
              count: g.length,
              sampleIds: u,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const a = H(0), d = H(0), _ = r.virtualBufferPx, D = H(!1), ne = H({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), X = (e) => {
      if (!l.value) return;
      const { scrollTop: n, clientHeight: o } = l.value, g = n + o, u = e ?? Ye(i.value, L.value), F = u.length ? Math.max(...u) : 0, S = typeof r.loadThresholdPx == "number" ? r.loadThresholdPx : 200, O = S >= 0 ? Math.max(0, F - S) : Math.max(0, F + S), Q = Math.max(0, O - g), re = Q <= 100;
      ne.value = {
        distanceToTrigger: Math.round(Q),
        isNearTrigger: re
      };
    }, { onEnter: A, onBeforeEnter: ue, onBeforeLeave: ce, onLeave: N } = oa(
      { container: l },
      { leaveDurationMs: r.leaveDurationMs }
    );
    function G(e, n) {
      if (D.value) {
        const o = parseInt(e.dataset.left || "0", 10), g = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${o}px, ${g}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", n();
        });
      } else
        A(e, n);
    }
    function Z(e) {
      if (D.value) {
        const n = parseInt(e.dataset.left || "0", 10), o = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${n}px, ${o}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ue(e);
    }
    function ve(e) {
      D.value || ce(e);
    }
    function ee(e, n) {
      D.value ? n() : N(e, n);
    }
    const ge = ae(() => {
      const e = a.value - _, n = a.value + d.value + _, o = i.value;
      return !o || o.length === 0 ? [] : o.filter((u) => {
        if (typeof u.top != "number" || typeof u.columnHeight != "number")
          return !0;
        const F = u.top;
        return u.top + u.columnHeight >= e && F <= n;
      });
    }), { handleScroll: le } = ra({
      container: l,
      masonry: i,
      columns: L,
      containerHeight: W,
      isLoading: P,
      pageSize: r.pageSize,
      refreshLayout: J,
      setItemsRaw: (e) => {
        i.value = e;
      },
      loadNext: xe,
      loadThresholdPx: r.loadThresholdPx
    });
    function pt(e) {
      M.value = e, e ? (e.width !== void 0 && (f.value = e.width), e.height !== void 0 && (x.value = e.height), !p.value && l.value && i.value.length > 0 && U(() => {
        L.value = we(w.value, f.value), J(i.value), X();
      })) : y.value && (f.value = y.value.clientWidth, x.value = y.value.clientHeight);
    }
    c({
      isLoading: P,
      refreshLayout: J,
      // Container dimensions (wrapper element)
      containerWidth: f,
      containerHeight: x,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: W,
      // Current page
      currentPage: k,
      // End of list tracking
      hasReachedEnd: I,
      // Load error tracking
      loadError: m,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: pt,
      remove: Me,
      removeMany: wt,
      removeAll: Tt,
      restore: xt,
      restoreMany: bt,
      loadNext: xe,
      loadPage: We,
      refreshCurrentPage: ze,
      reset: Et,
      destroy: Lt,
      init: et,
      restoreItems: tt,
      paginationHistory: h,
      cancelLoad: Oe,
      scrollToTop: Ke,
      scrollTo: Mt,
      totalItems: ae(() => i.value.length),
      currentBreakpoint: z
    });
    function Fe(e) {
      const n = aa(e);
      let o = 0;
      if (l.value) {
        const { scrollTop: g, clientHeight: u } = l.value;
        o = g + u + 100;
      }
      W.value = Math.max(n, o);
    }
    let fe = [];
    function J(e) {
      var u, F;
      if (p.value) {
        i.value = e;
        return;
      }
      if (!l.value) return;
      if (B(e, "refreshLayout"), e.length > 1e3 && fe.length > e.length && fe.length - e.length < 100) {
        let S = !0;
        for (let O = 0; O < e.length; O++)
          if (((u = e[O]) == null ? void 0 : u.id) !== ((F = fe[O]) == null ? void 0 : F.id)) {
            S = !1;
            break;
          }
        if (S) {
          const O = e.map((Q, re) => ({
            ...fe[re],
            originalIndex: re
          }));
          Fe(O), i.value = O, fe = O;
          return;
        }
      }
      const o = e.map((S, O) => ({
        ...S,
        originalIndex: O
      })), g = l.value;
      if (M.value && M.value.width !== void 0) {
        const S = g.style.width, O = g.style.boxSizing;
        g.style.boxSizing = "border-box", g.style.width = `${M.value.width}px`, g.offsetWidth;
        const Q = rt(o, g, L.value, w.value);
        g.style.width = S, g.style.boxSizing = O, Fe(Q), i.value = Q, fe = Q;
      } else {
        const S = rt(o, g, L.value, w.value);
        Fe(S), i.value = S, fe = S;
      }
    }
    function Ue(e, n) {
      return new Promise((o) => {
        const g = Math.max(0, e | 0), u = Date.now();
        n(g, g);
        const F = setInterval(() => {
          if (V.value) {
            clearInterval(F), o();
            return;
          }
          const S = Date.now() - u, O = Math.max(0, g - S);
          n(O, g), O <= 0 && (clearInterval(F), o());
        }, 100);
      });
    }
    async function Se(e) {
      try {
        const n = await yt(() => r.getNextPage(e));
        return J([...i.value, ...n.items]), n;
      } catch (n) {
        throw n;
      }
    }
    async function yt(e) {
      let n = 0;
      const o = r.retryMaxAttempts;
      let g = r.retryInitialDelayMs;
      for (; ; )
        try {
          const u = await e();
          return n > 0 && b("retry:stop", { attempt: n, success: !0 }), u;
        } catch (u) {
          if (n++, n > o)
            throw b("retry:stop", { attempt: n - 1, success: !1 }), u;
          b("retry:start", { attempt: n, max: o, totalMs: g }), await Ue(g, (F, S) => {
            b("retry:tick", { attempt: n, remainingMs: F, totalMs: S });
          }), g += r.retryBackoffStepMs;
        }
    }
    async function We(e) {
      if (!P.value) {
        V.value = !1, P.value = !0, I.value = !1, m.value = null;
        try {
          const n = i.value.length;
          if (V.value) return;
          const o = await Se(e);
          return V.value ? void 0 : (m.value = null, k.value = e, h.value.push(o.nextPage), o.nextPage == null && (I.value = !0), await Te(n), o);
        } catch (n) {
          throw m.value = ke(n), n;
        } finally {
          P.value = !1;
        }
      }
    }
    async function xe() {
      if (!P.value && !I.value) {
        V.value = !1, P.value = !0, m.value = null;
        try {
          const e = i.value.length;
          if (V.value) return;
          const n = h.value[h.value.length - 1];
          if (n == null) {
            I.value = !0, P.value = !1;
            return;
          }
          const o = await Se(n);
          return V.value ? void 0 : (m.value = null, k.value = n, h.value.push(o.nextPage), o.nextPage == null && (I.value = !0), await Te(e), o);
        } catch (e) {
          throw m.value = ke(e), e;
        } finally {
          P.value = !1;
        }
      }
    }
    const te = ia({
      useSwipeMode: p,
      masonry: i,
      isLoading: P,
      loadNext: xe,
      loadPage: We,
      paginationHistory: h
    }), pe = te.currentSwipeIndex, be = te.swipeOffset, Pe = te.isDragging, de = te.swipeContainer, _e = te.handleTouchStart, Xe = te.handleTouchMove, Ge = te.handleTouchEnd, Je = te.handleMouseDown, Be = te.handleMouseMove, De = te.handleMouseUp, Ae = te.snapToCurrentItem;
    async function ze() {
      if (!P.value) {
        V.value = !1, P.value = !0;
        try {
          const e = k.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", k.value, "paginationHistory:", h.value);
            return;
          }
          i.value = [], W.value = 0, I.value = !1, m.value = null, h.value = [e], await U();
          const n = await Se(e);
          if (V.value) return;
          m.value = null, k.value = e, h.value.push(n.nextPage), n.nextPage == null && (I.value = !0);
          const o = i.value.length;
          return await Te(o), n;
        } catch (e) {
          throw m.value = ke(e), e;
        } finally {
          P.value = !1;
        }
      }
    }
    async function Me(e) {
      const n = i.value.filter((o) => o.id !== e.id);
      if (i.value = n, await U(), n.length === 0 && h.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await ze();
        else
          try {
            await xe(), await Te(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((o) => requestAnimationFrame(() => o())), requestAnimationFrame(() => {
        J(n);
      });
    }
    async function wt(e) {
      if (!e || e.length === 0) return;
      const n = new Set(e.map((g) => g.id)), o = i.value.filter((g) => !n.has(g.id));
      if (i.value = o, await U(), o.length === 0 && h.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await ze();
        else
          try {
            await xe(), await Te(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((g) => requestAnimationFrame(() => g())), requestAnimationFrame(() => {
        J(o);
      });
    }
    async function xt(e, n) {
      if (!e) return;
      const o = i.value;
      if (o.findIndex((S) => S.id === e.id) !== -1) return;
      const u = [...o], F = Math.min(n, u.length);
      u.splice(F, 0, e), i.value = u, await U(), p.value || (await new Promise((S) => requestAnimationFrame(() => S())), requestAnimationFrame(() => {
        J(u);
      }));
    }
    async function bt(e, n) {
      var at;
      if (!e || e.length === 0) return;
      if (!n || n.length !== e.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      const o = i.value, g = new Set(o.map((Y) => Y.id)), u = [];
      for (let Y = 0; Y < e.length; Y++)
        g.has((at = e[Y]) == null ? void 0 : at.id) || u.push({ item: e[Y], index: n[Y] });
      if (u.length === 0) return;
      const F = /* @__PURE__ */ new Map();
      for (const { item: Y, index: kt } of u)
        F.set(kt, Y);
      const S = u.length > 0 ? Math.max(...u.map(({ index: Y }) => Y)) : -1, O = Math.max(o.length - 1, S), Q = [];
      let re = 0;
      for (let Y = 0; Y <= O; Y++)
        F.has(Y) ? Q.push(F.get(Y)) : re < o.length && (Q.push(o[re]), re++);
      for (; re < o.length; )
        Q.push(o[re]), re++;
      i.value = Q, await U(), p.value || (await new Promise((Y) => requestAnimationFrame(() => Y())), requestAnimationFrame(() => {
        J(Q);
      }));
    }
    function Ke(e) {
      l.value && l.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    function Mt(e) {
      l.value && (l.value.scrollTo({
        top: e.top ?? l.value.scrollTop,
        left: e.left ?? l.value.scrollLeft,
        behavior: e.behavior ?? "auto"
      }), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight || window.innerHeight));
    }
    async function Tt() {
      Ke({ behavior: "smooth" }), i.value = [], x.value = 0, await U(), b("remove-all:complete");
    }
    function It() {
      L.value = we(w.value, f.value), J(i.value), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight);
    }
    let oe = !1;
    const V = H(!1);
    async function Te(e, n = !1) {
      if (!n && !r.backfillEnabled || oe || V.value || I.value) return;
      const o = (e || 0) + (r.pageSize || 0);
      if (!r.pageSize || r.pageSize <= 0) return;
      if (h.value[h.value.length - 1] == null) {
        I.value = !0;
        return;
      }
      if (!(i.value.length >= o)) {
        oe = !0, P.value = !0;
        try {
          let u = 0;
          for (b("backfill:start", { target: o, fetched: i.value.length, calls: u }); i.value.length < o && u < r.backfillMaxCalls && h.value[h.value.length - 1] != null && !V.value && !I.value && oe && (await Ue(r.backfillDelayMs, (S, O) => {
            b("backfill:tick", {
              fetched: i.value.length,
              target: o,
              calls: u,
              remainingMs: S,
              totalMs: O
            });
          }), !(V.value || !oe)); ) {
            const F = h.value[h.value.length - 1];
            if (F == null) {
              I.value = !0;
              break;
            }
            try {
              if (V.value || !oe) break;
              const S = await Se(F);
              if (V.value || !oe) break;
              m.value = null, h.value.push(S.nextPage), S.nextPage == null && (I.value = !0);
            } catch (S) {
              if (V.value || !oe) break;
              m.value = ke(S);
            }
            u++;
          }
          b("backfill:stop", { fetched: i.value.length, calls: u });
        } finally {
          oe = !1, P.value = !1;
        }
      }
    }
    function Oe() {
      const e = oe;
      V.value = !0, P.value = !1, oe = !1, e && b("backfill:stop", { fetched: i.value.length, calls: 0, cancelled: !0 });
    }
    function Et() {
      Oe(), V.value = !1, l.value && l.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), i.value = [], x.value = 0, k.value = r.loadAtPage, h.value = [r.loadAtPage], I.value = !1, m.value = null, ne.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function Lt() {
      Oe(), i.value = [], W.value = 0, k.value = null, h.value = [], I.value = !1, m.value = null, P.value = !1, oe = !1, V.value = !1, pe.value = 0, be.value = 0, Pe.value = !1, a.value = 0, d.value = 0, D.value = !1, ne.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, $.value.clear(), l.value && l.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const he = ct(async () => {
      if (p.value) return;
      if (l.value) {
        const n = l.value.scrollTop, o = l.value.clientHeight || window.innerHeight, g = o > 0 ? o : window.innerHeight;
        a.value = n, d.value = g;
      }
      D.value = !0, await U(), await new Promise((n) => requestAnimationFrame(() => n())), D.value = !1;
      const e = Ye(i.value, L.value);
      le(e), X(e);
    }, 200), Qe = ct(It, 200);
    function Ze() {
      te.handleWindowResize();
    }
    function et(e, n, o) {
      k.value = n, h.value = [n], h.value.push(o), I.value = o == null, B(e, "init"), p.value ? (i.value = [...i.value, ...e], pe.value === 0 && i.value.length > 0 && (be.value = 0)) : (J([...i.value, ...e]), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight || window.innerHeight), U(() => {
        l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight || window.innerHeight, X());
      }));
    }
    async function tt(e, n, o) {
      if (!r.skipInitialLoad) {
        et(e, n, o);
        return;
      }
      k.value = n, h.value = [n], o != null && h.value.push(o), I.value = o == null, m.value = null, B(e, "restoreItems"), p.value ? (i.value = e, pe.value === 0 && i.value.length > 0 && (be.value = 0)) : (J(e), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight || window.innerHeight), await U(), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight || window.innerHeight, X()));
    }
    return se(
      w,
      () => {
        p.value || l.value && (L.value = we(w.value, f.value), J(i.value));
      },
      { deep: !0 }
    ), se(() => r.layoutMode, () => {
      M.value && M.value.width !== void 0 ? f.value = M.value.width : y.value && (f.value = y.value.clientWidth);
    }), se(l, (e) => {
      e && !p.value ? (e.removeEventListener("scroll", he), e.addEventListener("scroll", he, { passive: !0 })) : e && e.removeEventListener("scroll", he);
    }, { immediate: !0 }), se(p, (e, n) => {
      n === void 0 && e === !1 || U(() => {
        e ? (document.addEventListener("mousemove", Be), document.addEventListener("mouseup", De), l.value && l.value.removeEventListener("scroll", he), pe.value = 0, be.value = 0, i.value.length > 0 && Ae()) : (document.removeEventListener("mousemove", Be), document.removeEventListener("mouseup", De), l.value && y.value && (M.value && M.value.width !== void 0 ? f.value = M.value.width : f.value = y.value.clientWidth, l.value.removeEventListener("scroll", he), l.value.addEventListener("scroll", he, { passive: !0 }), i.value.length > 0 && (L.value = we(w.value, f.value), J(i.value), a.value = l.value.scrollTop, d.value = l.value.clientHeight, X())));
      });
    }, { immediate: !0 }), se(de, (e) => {
      e && (e.addEventListener("touchstart", _e, { passive: !1 }), e.addEventListener("touchmove", Xe, { passive: !1 }), e.addEventListener("touchend", Ge), e.addEventListener("mousedown", Je));
    }), se(() => i.value.length, (e, n) => {
      p.value && e > 0 && n === 0 && (pe.value = 0, U(() => Ae()));
    }), se(y, (e) => {
      s && (s.disconnect(), s = null), e && typeof ResizeObserver < "u" ? (s = new ResizeObserver((n) => {
        if (!M.value)
          for (const o of n) {
            const g = o.contentRect.width, u = o.contentRect.height;
            f.value !== g && (f.value = g), x.value !== u && (x.value = u);
          }
      }), s.observe(e), M.value || (f.value = e.clientWidth, x.value = e.clientHeight)) : e && (M.value || (f.value = e.clientWidth, x.value = e.clientHeight));
    }, { immediate: !0 }), se(f, (e, n) => {
      e !== n && e > 0 && !p.value && l.value && i.value.length > 0 && U(() => {
        L.value = we(w.value, e), J(i.value), X();
      });
    }), dt(async () => {
      try {
        await U(), y.value && !s && (f.value = y.value.clientWidth, x.value = y.value.clientHeight), p.value || (L.value = we(w.value, f.value), l.value && (a.value = l.value.scrollTop, d.value = l.value.clientHeight));
        const e = r.loadAtPage;
        if (h.value = [e], !r.skipInitialLoad)
          await We(h.value[0]);
        else if (r.items && r.items.length > 0) {
          const n = r.items[0], o = r.items[r.items.length - 1], g = (n == null ? void 0 : n.page) ?? e ?? 1, u = (o == null ? void 0 : o.next) ?? null;
          await tt(r.items, g, u);
        } else
          k.value = e, h.value = [e];
        p.value ? U(() => Ae()) : X();
      } catch (e) {
        m.value || (console.error("Error during component initialization:", e), m.value = ke(e)), P.value = !1;
      }
      window.addEventListener("resize", Qe), window.addEventListener("resize", Ze);
    }), ht(() => {
      var e;
      s && (s.disconnect(), s = null), (e = l.value) == null || e.removeEventListener("scroll", he), window.removeEventListener("resize", Qe), window.removeEventListener("resize", Ze), de.value && (de.value.removeEventListener("touchstart", _e), de.value.removeEventListener("touchmove", Xe), de.value.removeEventListener("touchend", Ge), de.value.removeEventListener("mousedown", Je)), document.removeEventListener("mousemove", Be), document.removeEventListener("mouseup", De);
    }), (e, n) => (j(), R("div", {
      ref_key: "wrapper",
      ref: y,
      class: "w-full h-full flex flex-col relative"
    }, [
      p.value ? (j(), R("div", {
        key: 0,
        class: me(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": r.forceMotion, "cursor-grab": !ye(Pe), "cursor-grabbing": ye(Pe) }]),
        ref_key: "swipeContainer",
        ref: de,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        q("div", {
          class: "relative w-full",
          style: He({
            transform: `translateY(${ye(be)}px)`,
            transition: ye(Pe) ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${i.value.length * 100}%`
          })
        }, [
          (j(!0), R(lt, null, ot(i.value, (o, g) => (j(), R("div", {
            key: `${o.page}-${o.id}`,
            class: "absolute top-0 left-0 w-full",
            style: He({
              top: `${g * (100 / i.value.length)}%`,
              height: `${100 / i.value.length}%`
            })
          }, [
            q("div", pa, [
              q("div", ya, [
                K(e.$slots, "default", {
                  item: o,
                  remove: Me,
                  index: o.originalIndex ?? r.items.indexOf(o)
                }, () => [
                  Re(Ne, {
                    item: o,
                    remove: Me,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": g === ye(pe),
                    "onPreload:success": n[0] || (n[0] = (u) => b("item:preload:success", u)),
                    "onPreload:error": n[1] || (n[1] = (u) => b("item:preload:error", u)),
                    onMouseEnter: n[2] || (n[2] = (u) => b("item:mouse-enter", u)),
                    onMouseLeave: n[3] || (n[3] = (u) => b("item:mouse-leave", u))
                  }, {
                    header: Ie((u) => [
                      K(e.$slots, "item-header", Ee({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: Ie((u) => [
                      K(e.$slots, "item-footer", Ee({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        I.value && i.value.length > 0 ? (j(), R("div", wa, [
          K(e.$slots, "end-message", {}, () => [
            n[8] || (n[8] = q("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ie("", !0),
        m.value && i.value.length > 0 ? (j(), R("div", xa, [
          K(e.$slots, "error-message", { error: m.value }, () => [
            q("p", ba, "Failed to load content: " + qe(m.value.message), 1)
          ], !0)
        ])) : ie("", !0)
      ], 2)) : (j(), R("div", {
        key: 1,
        class: me(["overflow-auto w-full flex-1 masonry-container", { "force-motion": r.forceMotion }]),
        ref_key: "container",
        ref: l
      }, [
        q("div", {
          class: "relative",
          style: He({ height: `${W.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Re(Ht, {
            name: "masonry",
            css: !1,
            onEnter: G,
            onBeforeEnter: Z,
            onLeave: ee,
            onBeforeLeave: ve
          }, {
            default: Ie(() => [
              (j(!0), R(lt, null, ot(ge.value, (o, g) => (j(), R("div", Ee({
                key: `${o.page}-${o.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, ye(la)(o, g)), [
                K(e.$slots, "default", {
                  item: o,
                  remove: Me,
                  index: o.originalIndex ?? t.items.indexOf(o)
                }, () => [
                  Re(Ne, {
                    item: o,
                    remove: Me,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": n[4] || (n[4] = (u) => b("item:preload:success", u)),
                    "onPreload:error": n[5] || (n[5] = (u) => b("item:preload:error", u)),
                    onMouseEnter: n[6] || (n[6] = (u) => b("item:mouse-enter", u)),
                    onMouseLeave: n[7] || (n[7] = (u) => b("item:mouse-leave", u))
                  }, {
                    header: Ie((u) => [
                      K(e.$slots, "item-header", Ee({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: Ie((u) => [
                      K(e.$slots, "item-footer", Ee({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        I.value && i.value.length > 0 ? (j(), R("div", Ma, [
          K(e.$slots, "end-message", {}, () => [
            n[9] || (n[9] = q("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ie("", !0),
        m.value && i.value.length > 0 ? (j(), R("div", Ta, [
          K(e.$slots, "error-message", { error: m.value }, () => [
            q("p", Ia, "Failed to load content: " + qe(m.value.message), 1)
          ], !0)
        ])) : ie("", !0)
      ], 2))
    ], 512));
  }
}), La = (t, c) => {
  const v = t.__vccOpts || t;
  for (const [r, E] of c)
    v[r] = E;
  return v;
}, vt = /* @__PURE__ */ La(Ea, [["__scopeId", "data-v-a07e2350"]]), Ha = {
  install(t) {
    t.component("WyxosMasonry", vt), t.component("WMasonry", vt), t.component("WyxosMasonryItem", Ne), t.component("WMasonryItem", Ne);
  }
};
export {
  vt as Masonry,
  Ne as MasonryItem,
  Ha as default
};
