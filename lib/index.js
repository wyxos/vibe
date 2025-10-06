import { nextTick as nt, defineComponent as Mt, computed as rt, ref as D, onMounted as St, onUnmounted as It, createElementBlock as tt, openBlock as et, normalizeClass as ut, createElementVNode as C, normalizeStyle as Pt, createVNode as Ht, createCommentVNode as kt, TransitionGroup as Lt, withCtx as Et, Fragment as Nt, renderList as $t, mergeProps as ft, unref as At, renderSlot as Wt, toDisplayString as dt } from "vue";
let ot = null;
function Bt() {
  if (ot != null) return ot;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const r = document.createElement("div");
  r.style.width = "100%", t.appendChild(r);
  const i = t.offsetWidth - r.offsetWidth;
  return document.body.removeChild(t), ot = i, i;
}
function zt(t, r, i, s = {}) {
  const {
    gutterX: y = 0,
    gutterY: h = 0,
    header: e = 0,
    footer: o = 0,
    paddingLeft: m = 0,
    paddingRight: c = 0,
    sizes: f = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: d = "masonry"
  } = s;
  let b = 0, x = 0;
  try {
    if (r && r.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const v = window.getComputedStyle(r);
      b = parseFloat(v.paddingLeft) || 0, x = parseFloat(v.paddingRight) || 0;
    }
  } catch {
  }
  const P = (m || 0) + b, z = (c || 0) + x, w = r.offsetWidth - r.clientWidth, T = w > 0 ? w + 2 : Bt() + 2, k = r.offsetWidth - T - P - z, q = y * (i - 1), F = Math.floor((k - q) / i), L = t.map((v) => {
    const H = v.width, M = v.height;
    return Math.round(F * M / H) + o + e;
  });
  if (d === "sequential-balanced") {
    const v = L.length;
    if (v === 0) return [];
    const H = (g, S, A) => g + (S > 0 ? h : 0) + A;
    let M = Math.max(...L), B = L.reduce((g, S) => g + S, 0) + h * Math.max(0, v - 1);
    const X = (g) => {
      let S = 1, A = 0, O = 0;
      for (let N = 0; N < v; N++) {
        const U = L[N], W = H(A, O, U);
        if (W <= g)
          A = W, O++;
        else if (S++, A = U, O = 1, U > g || S > i) return !1;
      }
      return S <= i;
    };
    for (; M < B; ) {
      const g = Math.floor((M + B) / 2);
      X(g) ? B = g : M = g + 1;
    }
    const Y = B, $ = new Array(i).fill(0);
    let V = i - 1, R = 0, G = 0;
    for (let g = v - 1; g >= 0; g--) {
      const S = L[g], A = g < V;
      !(H(R, G, S) <= Y) || A ? ($[V] = g + 1, V--, R = S, G = 1) : (R = H(R, G, S), G++);
    }
    $[0] = 0;
    const J = [], K = new Array(i).fill(0);
    for (let g = 0; g < i; g++) {
      const S = $[g], A = g + 1 < i ? $[g + 1] : v, O = g * (F + y);
      for (let N = S; N < A; N++) {
        const W = {
          ...t[N],
          columnWidth: F,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        W.imageHeight = L[N] - (o + e), W.columnHeight = L[N], W.left = O, W.top = K[g], K[g] += W.columnHeight + (N + 1 < A ? h : 0), J.push(W);
      }
    }
    return J;
  }
  const p = new Array(i).fill(0), E = [];
  for (let v = 0; v < t.length; v++) {
    const H = t[v], M = {
      ...H,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, B = p.indexOf(Math.min(...p)), X = H.width, Y = H.height;
    M.columnWidth = F, M.left = B * (F + y), M.imageHeight = Math.round(F * Y / X), M.columnHeight = M.imageHeight + o + e, M.top = p[B], p[B] += M.columnHeight + h, E.push(M);
  }
  return E;
}
var Ft = typeof global == "object" && global && global.Object === Object && global, Ot = typeof self == "object" && self && self.Object === Object && self, bt = Ft || Ot || Function("return this")(), at = bt.Symbol, xt = Object.prototype, jt = xt.hasOwnProperty, Dt = xt.toString, Z = at ? at.toStringTag : void 0;
function Rt(t) {
  var r = jt.call(t, Z), i = t[Z];
  try {
    t[Z] = void 0;
    var s = !0;
  } catch {
  }
  var y = Dt.call(t);
  return s && (r ? t[Z] = i : delete t[Z]), y;
}
var _t = Object.prototype, Ct = _t.toString;
function qt(t) {
  return Ct.call(t);
}
var Vt = "[object Null]", Gt = "[object Undefined]", gt = at ? at.toStringTag : void 0;
function Ut(t) {
  return t == null ? t === void 0 ? Gt : Vt : gt && gt in Object(t) ? Rt(t) : qt(t);
}
function Xt(t) {
  return t != null && typeof t == "object";
}
var Yt = "[object Symbol]";
function Jt(t) {
  return typeof t == "symbol" || Xt(t) && Ut(t) == Yt;
}
var Kt = /\s/;
function Qt(t) {
  for (var r = t.length; r-- && Kt.test(t.charAt(r)); )
    ;
  return r;
}
var Zt = /^\s+/;
function te(t) {
  return t && t.slice(0, Qt(t) + 1).replace(Zt, "");
}
function st(t) {
  var r = typeof t;
  return t != null && (r == "object" || r == "function");
}
var pt = NaN, ee = /^[-+]0x[0-9a-f]+$/i, ne = /^0b[01]+$/i, ae = /^0o[0-7]+$/i, re = parseInt;
function mt(t) {
  if (typeof t == "number")
    return t;
  if (Jt(t))
    return pt;
  if (st(t)) {
    var r = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = st(r) ? r + "" : r;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = te(t);
  var i = ne.test(t);
  return i || ae.test(t) ? re(t.slice(2), i ? 2 : 8) : ee.test(t) ? pt : +t;
}
var it = function() {
  return bt.Date.now();
}, oe = "Expected a function", ie = Math.max, se = Math.min;
function yt(t, r, i) {
  var s, y, h, e, o, m, c = 0, f = !1, d = !1, b = !0;
  if (typeof t != "function")
    throw new TypeError(oe);
  r = mt(r) || 0, st(i) && (f = !!i.leading, d = "maxWait" in i, h = d ? ie(mt(i.maxWait) || 0, r) : h, b = "trailing" in i ? !!i.trailing : b);
  function x(p) {
    var E = s, v = y;
    return s = y = void 0, c = p, e = t.apply(v, E), e;
  }
  function P(p) {
    return c = p, o = setTimeout(T, r), f ? x(p) : e;
  }
  function z(p) {
    var E = p - m, v = p - c, H = r - E;
    return d ? se(H, h - v) : H;
  }
  function w(p) {
    var E = p - m, v = p - c;
    return m === void 0 || E >= r || E < 0 || d && v >= h;
  }
  function T() {
    var p = it();
    if (w(p))
      return k(p);
    o = setTimeout(T, z(p));
  }
  function k(p) {
    return o = void 0, b && s ? x(p) : (s = y = void 0, e);
  }
  function q() {
    o !== void 0 && clearTimeout(o), c = 0, s = m = y = o = void 0;
  }
  function F() {
    return o === void 0 ? e : k(it());
  }
  function L() {
    var p = it(), E = w(p);
    if (s = arguments, y = this, m = p, E) {
      if (o === void 0)
        return P(m);
      if (d)
        return clearTimeout(o), o = setTimeout(T, r), x(m);
    }
    return o === void 0 && (o = setTimeout(T, r)), e;
  }
  return L.cancel = q, L.flush = F, L;
}
function ht(t) {
  const r = window.innerWidth, i = t.sizes;
  return r >= 1536 && i["2xl"] ? i["2xl"] : r >= 1280 && i.xl ? i.xl : r >= 1024 && i.lg ? i.lg : r >= 768 && i.md ? i.md : r >= 640 && i.sm ? i.sm : i.base;
}
function le(t) {
  return t.reduce((i, s) => Math.max(i, s.top + s.columnHeight), 0) + 500;
}
function ce(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function ue(t, r = 0) {
  return {
    style: ce(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": r
  };
}
function lt(t, r) {
  if (!t.length || r <= 0)
    return new Array(Math.max(1, r)).fill(0);
  const s = Array.from(new Set(t.map((e) => e.left))).sort((e, o) => e - o).slice(0, r), y = /* @__PURE__ */ new Map();
  for (let e = 0; e < s.length; e++) y.set(s[e], e);
  const h = new Array(s.length).fill(0);
  for (const e of t) {
    const o = y.get(e.left);
    o != null && (h[o] = Math.max(h[o], e.top + e.columnHeight));
  }
  for (; h.length < r; ) h.push(0);
  return h;
}
function fe(t, r) {
  function i(e, o) {
    const m = parseInt(e.dataset.left || "0", 10), c = parseInt(e.dataset.top || "0", 10), f = parseInt(e.dataset.index || "0", 10), d = Math.min(f * 20, 160), b = e.style.getPropertyValue("--masonry-opacity-delay");
    e.style.setProperty("--masonry-opacity-delay", `${d}ms`), requestAnimationFrame(() => {
      e.style.opacity = "1", e.style.transform = `translate3d(${m}px, ${c}px, 0) scale(1)`;
      const x = () => {
        b ? e.style.setProperty("--masonry-opacity-delay", b) : e.style.removeProperty("--masonry-opacity-delay"), e.removeEventListener("transitionend", x), o();
      };
      e.addEventListener("transitionend", x);
    });
  }
  function s(e) {
    const o = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
    e.style.opacity = "0", e.style.transform = `translate3d(${o}px, ${m + 10}px, 0) scale(0.985)`;
  }
  function y(e) {
    const o = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
    e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${o}px, ${m}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      e.style.transition = "";
    });
  }
  function h(e, o) {
    const m = parseInt(e.dataset.left || "0", 10), c = parseInt(e.dataset.top || "0", 10), f = typeof (r == null ? void 0 : r.leaveDurationMs) == "number" ? r.leaveDurationMs : NaN;
    let d = Number.isFinite(f) && f > 0 ? f : NaN;
    if (!Number.isFinite(d)) {
      const T = getComputedStyle(e).getPropertyValue("--masonry-leave-duration") || "", k = parseFloat(T);
      d = Number.isFinite(k) && k > 0 ? k : 200;
    }
    const b = e.style.transitionDuration, x = () => {
      e.removeEventListener("transitionend", P), clearTimeout(z), e.style.transitionDuration = b || "";
    }, P = (w) => {
      (!w || w.target === e) && (x(), o());
    }, z = setTimeout(() => {
      x(), o();
    }, d + 100);
    requestAnimationFrame(() => {
      e.style.transitionDuration = `${d}ms`, e.style.opacity = "0", e.style.transform = `translate3d(${m}px, ${c + 10}px, 0) scale(0.985)`, e.addEventListener("transitionend", P);
    });
  }
  return {
    onEnter: i,
    onBeforeEnter: s,
    onBeforeLeave: y,
    onLeave: h
  };
}
function de({
  container: t,
  masonry: r,
  columns: i,
  containerHeight: s,
  isLoading: y,
  maxItems: h,
  pageSize: e,
  refreshLayout: o,
  setItemsRaw: m,
  loadNext: c,
  loadThresholdPx: f
}) {
  let d = 0;
  async function b(x) {
    if (!t.value) return;
    const P = x ?? lt(r.value, i.value), z = P.length ? Math.max(...P) : 0, w = t.value.scrollTop + t.value.clientHeight, T = t.value.scrollTop > d + 1;
    if (d = t.value.scrollTop, w >= Math.max(0, z - (typeof f == "number" ? f : 200)) && T && !y.value) {
      await c(), await nt();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
const ge = ["src"], pe = ["onClick"], me = /* @__PURE__ */ Mt({
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
    maxItems: {
      type: Number,
      default: 100
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
    }
  },
  emits: [
    "update:items",
    "backfill:start",
    "backfill:tick",
    "backfill:stop",
    "retry:start",
    "retry:tick",
    "retry:stop"
  ],
  setup(t, { expose: r, emit: i }) {
    const s = t, y = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = rt(() => {
      var n;
      return {
        ...y,
        ...s.layout,
        sizes: {
          ...y.sizes,
          ...((n = s.layout) == null ? void 0 : n.sizes) || {}
        }
      };
    }), e = i, o = rt({
      get: () => s.items,
      set: (n) => e("update:items", n)
    }), m = D(7), c = D(null), f = D([]), d = D(!1), b = D(0), x = D(0), P = D(0), z = s.virtualBufferPx, w = D(!1), T = D({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), k = (n) => {
      if (!c.value) return;
      const { scrollTop: a, clientHeight: l } = c.value, u = a + l, I = n ?? lt(o.value, m.value), j = I.length ? Math.max(...I) : 0, _ = Math.max(0, j - s.loadThresholdPx), Q = Math.max(0, _ - u), Tt = Q <= 100;
      T.value = {
        distanceToTrigger: Math.round(Q),
        isNearTrigger: Tt
      };
    }, { onEnter: q, onBeforeEnter: F, onBeforeLeave: L, onLeave: p } = fe(o, { leaveDurationMs: s.leaveDurationMs });
    function E(n, a) {
      if (w.value) {
        const l = parseInt(n.dataset.left || "0", 10), u = parseInt(n.dataset.top || "0", 10);
        n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${l}px, ${u}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          n.style.transition = "", a();
        });
      } else
        q(n, a);
    }
    function v(n) {
      if (w.value) {
        const a = parseInt(n.dataset.left || "0", 10), l = parseInt(n.dataset.top || "0", 10);
        n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${a}px, ${l}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay");
      } else
        F(n);
    }
    function H(n) {
      w.value || L(n);
    }
    function M(n, a) {
      w.value ? a() : p(n, a);
    }
    const B = rt(() => {
      const n = x.value - z, a = x.value + P.value + z, l = o.value;
      return !l || l.length === 0 ? [] : l.filter((u) => {
        const I = u.top;
        return u.top + u.columnHeight >= n && I <= a;
      });
    }), { handleScroll: X } = de({
      container: c,
      masonry: o,
      columns: m,
      containerHeight: b,
      isLoading: d,
      maxItems: s.maxItems,
      pageSize: s.pageSize,
      refreshLayout: $,
      setItemsRaw: (n) => {
        o.value = n;
      },
      loadNext: K,
      loadThresholdPx: s.loadThresholdPx
    });
    r({
      isLoading: d,
      refreshLayout: $,
      containerHeight: b,
      remove: g,
      removeMany: S,
      loadNext: K,
      loadPage: J,
      reset: U,
      init: wt,
      paginationHistory: f
    });
    function Y(n) {
      const a = le(n);
      let l = 0;
      if (c.value) {
        const { scrollTop: u, clientHeight: I } = c.value;
        l = u + I + 100;
      }
      b.value = Math.max(a, l);
    }
    function $(n) {
      if (!c.value) return;
      const a = zt(n, c.value, m.value, h.value);
      Y(a), o.value = a;
    }
    function V(n, a) {
      return new Promise((l) => {
        const u = Math.max(0, n | 0), I = Date.now();
        a(u, u);
        const j = setInterval(() => {
          const _ = Date.now() - I, Q = Math.max(0, u - _);
          a(Q, u), Q <= 0 && (clearInterval(j), l());
        }, 100);
      });
    }
    async function R(n) {
      try {
        const a = await G(() => s.getNextPage(n));
        return $([...o.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function G(n) {
      let a = 0;
      const l = s.retryMaxAttempts;
      let u = s.retryInitialDelayMs;
      for (; ; )
        try {
          const I = await n();
          return a > 0 && e("retry:stop", { attempt: a, success: !0 }), I;
        } catch (I) {
          if (a++, a > l)
            throw e("retry:stop", { attempt: a - 1, success: !1 }), I;
          e("retry:start", { attempt: a, max: l, totalMs: u }), await V(u, (j, _) => {
            e("retry:tick", { attempt: a, remainingMs: j, totalMs: _ });
          }), u += s.retryBackoffStepMs;
        }
    }
    async function J(n) {
      if (!d.value) {
        d.value = !0;
        try {
          const a = o.value.length, l = await R(n);
          return f.value.push(l.nextPage), await N(a), l;
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          d.value = !1;
        }
      }
    }
    async function K() {
      if (!d.value) {
        d.value = !0;
        try {
          const n = o.value.length, a = f.value[f.value.length - 1], l = await R(a);
          return f.value.push(l.nextPage), await N(n), l;
        } catch (n) {
          throw console.error("Error loading next page:", n), n;
        } finally {
          d.value = !1;
        }
      }
    }
    async function g(n) {
      const a = o.value.filter((l) => l.id !== n.id);
      o.value = a, await nt(), await new Promise((l) => requestAnimationFrame(() => l())), requestAnimationFrame(() => {
        $(a);
      });
    }
    async function S(n) {
      if (!n || n.length === 0) return;
      const a = new Set(n.map((u) => u.id)), l = o.value.filter((u) => !a.has(u.id));
      o.value = l, await nt(), await new Promise((u) => requestAnimationFrame(() => u())), requestAnimationFrame(() => {
        $(l);
      });
    }
    function A() {
      m.value = ht(h.value), $(o.value), c.value && (x.value = c.value.scrollTop, P.value = c.value.clientHeight);
    }
    let O = !1;
    async function N(n) {
      if (!s.backfillEnabled || O) return;
      const a = (n || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || f.value[f.value.length - 1] == null) && !(o.value.length >= a)) {
        O = !0;
        try {
          let u = 0;
          for (e("backfill:start", { target: a, fetched: o.value.length, calls: u }); o.value.length < a && u < s.backfillMaxCalls && f.value[f.value.length - 1] != null; ) {
            await V(s.backfillDelayMs, (j, _) => {
              e("backfill:tick", {
                fetched: o.value.length,
                target: a,
                calls: u,
                remainingMs: j,
                totalMs: _
              });
            });
            const I = f.value[f.value.length - 1];
            try {
              d.value = !0;
              const j = await R(I);
              f.value.push(j.nextPage);
            } finally {
              d.value = !1;
            }
            u++;
          }
          e("backfill:stop", { fetched: o.value.length, calls: u });
        } finally {
          O = !1;
        }
      }
    }
    function U() {
      c.value && c.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], b.value = 0, f.value = [s.loadAtPage], T.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const W = yt(async () => {
      c.value && (x.value = c.value.scrollTop, P.value = c.value.clientHeight), w.value = !0, await nt(), await new Promise((a) => requestAnimationFrame(() => a())), w.value = !1;
      const n = lt(o.value, m.value);
      X(n), k(n);
    }, 200), ct = yt(A, 200);
    function wt(n, a, l) {
      f.value = [a], f.value.push(l), $([...o.value, ...n]), k();
    }
    return St(async () => {
      var n;
      try {
        m.value = ht(h.value), c.value && (x.value = c.value.scrollTop, P.value = c.value.clientHeight);
        const a = s.loadAtPage;
        f.value = [a], s.skipInitialLoad || await J(f.value[0]), k();
      } catch (a) {
        console.error("Error during component initialization:", a), d.value = !1;
      }
      (n = c.value) == null || n.addEventListener("scroll", W, { passive: !0 }), window.addEventListener("resize", ct);
    }), It(() => {
      var n;
      (n = c.value) == null || n.removeEventListener("scroll", W), window.removeEventListener("resize", ct);
    }), (n, a) => (et(), tt("div", {
      class: ut(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: c
    }, [
      C("div", {
        class: "relative",
        style: Pt({ height: `${b.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
      }, [
        Ht(Lt, {
          name: "masonry",
          css: !1,
          onEnter: E,
          onBeforeEnter: v,
          onLeave: M,
          onBeforeLeave: H
        }, {
          default: Et(() => [
            (et(!0), tt(Nt, null, $t(B.value, (l, u) => (et(), tt("div", ft({
              key: `${l.page}-${l.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, At(ue)(l, u)), [
              Wt(n.$slots, "item", ft({ ref_for: !0 }, { item: l, remove: g }), () => [
                C("img", {
                  src: l.src,
                  class: "w-full",
                  loading: "lazy",
                  decoding: "async"
                }, null, 8, ge),
                C("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (I) => g(l)
                }, a[0] || (a[0] = [
                  C("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, pe)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }),
        b.value > 0 ? (et(), tt("div", {
          key: 0,
          class: ut(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !T.value.isNearTrigger, "opacity-100": T.value.isNearTrigger }])
        }, [
          C("span", null, dt(o.value.length) + " items", 1),
          a[1] || (a[1] = C("span", { class: "mx-2" }, "|", -1)),
          C("span", null, dt(T.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : kt("", !0)
      ], 4)
    ], 2));
  }
}), ye = (t, r) => {
  const i = t.__vccOpts || t;
  for (const [s, y] of r)
    i[s] = y;
  return i;
}, vt = /* @__PURE__ */ ye(me, [["__scopeId", "data-v-bcc10466"]]), ve = {
  install(t) {
    t.component("WyxosMasonry", vt), t.component("WMasonry", vt);
  }
};
export {
  vt as Masonry,
  ve as default
};
