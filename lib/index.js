import { nextTick as X, defineComponent as me, computed as ne, ref as D, onMounted as he, onUnmounted as ye, createElementBlock as Y, openBlock as J, normalizeClass as ae, createElementVNode as z, normalizeStyle as ve, createVNode as be, createCommentVNode as xe, TransitionGroup as we, unref as V, withCtx as Me, Fragment as Te, renderList as Se, mergeProps as re, renderSlot as Ie, toDisplayString as oe } from "vue";
let Z = null;
function ke() {
  if (Z != null) return Z;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const a = document.createElement("div");
  a.style.width = "100%", e.appendChild(a);
  const i = e.offsetWidth - a.offsetWidth;
  return document.body.removeChild(e), Z = i, i;
}
function Ee(e, a, i, l = {}) {
  const {
    gutterX: b = 0,
    gutterY: v = 0,
    header: t = 0,
    footer: o = 0,
    paddingLeft: m = 0,
    paddingRight: h = 0,
    sizes: p = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: d = "masonry"
  } = l;
  let w = 0, T = 0;
  try {
    if (a && a.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const u = window.getComputedStyle(a);
      w = parseFloat(u.paddingLeft) || 0, T = parseFloat(u.paddingRight) || 0;
    }
  } catch {
  }
  const A = (m || 0) + w, W = (h || 0) + T, k = a.offsetWidth - a.clientWidth, M = k > 0 ? k + 2 : ke() + 2, I = a.offsetWidth - M - A - W, L = b * (i - 1), E = Math.floor((I - L) / i), g = e.map((u) => {
    const S = u.width, H = u.height;
    return Math.round(E * H / S) + o + t;
  });
  if (d === "sequential-balanced") {
    const u = g.length;
    if (u === 0) return [];
    const S = (n, r, c) => n + (r > 0 ? v : 0) + c;
    let H = Math.max(...g), N = g.reduce((n, r) => n + r, 0) + v * Math.max(0, u - 1);
    const R = (n) => {
      let r = 1, c = 0, f = 0;
      for (let x = 0; x < u; x++) {
        const $ = g[x], P = S(c, f, $);
        if (P <= n)
          c = P, f++;
        else if (r++, c = $, f = 1, $ > n || r > i) return !1;
      }
      return r <= i;
    };
    for (; H < N; ) {
      const n = Math.floor((H + N) / 2);
      R(n) ? N = n : H = n + 1;
    }
    const _ = N, O = new Array(i).fill(0);
    let F = i - 1, C = 0, j = 0;
    for (let n = u - 1; n >= 0; n--) {
      const r = g[n], c = n < F;
      !(S(C, j, r) <= _) || c ? (O[F] = n + 1, F--, C = r, j = 1) : (C = S(C, j, r), j++);
    }
    O[0] = 0;
    const q = [], U = new Array(i).fill(0);
    for (let n = 0; n < i; n++) {
      const r = O[n], c = n + 1 < i ? O[n + 1] : u, f = n * (E + b);
      for (let x = r; x < c; x++) {
        const P = { ...e[x], columnWidth: E, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, B = g[x] - (o + t);
        P.imageHeight = B, P.columnHeight = g[x], P.left = f, P.top = U[n], U[n] += P.columnHeight + (x + 1 < c ? v : 0), q.push(P);
      }
    }
    return q;
  }
  const s = new Array(i).fill(0), y = [];
  for (let u = 0; u < e.length; u++) {
    const S = e[u], H = { ...S, columnWidth: 0, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, N = s.indexOf(Math.min(...s)), R = S.width, _ = S.height;
    H.columnWidth = E, H.left = N * (E + b), H.imageHeight = Math.round(E * _ / R), H.columnHeight = H.imageHeight + o + t, H.top = s[N], s[N] += H.columnHeight + v, y.push(H);
  }
  return y;
}
var He = typeof global == "object" && global && global.Object === Object && global, Pe = typeof self == "object" && self && self.Object === Object && self, de = He || Pe || Function("return this")(), K = de.Symbol, ge = Object.prototype, Le = ge.hasOwnProperty, Ne = ge.toString, G = K ? K.toStringTag : void 0;
function $e(e) {
  var a = Le.call(e, G), i = e[G];
  try {
    e[G] = void 0;
    var l = !0;
  } catch {
  }
  var b = Ne.call(e);
  return l && (a ? e[G] = i : delete e[G]), b;
}
var Ae = Object.prototype, We = Ae.toString;
function Oe(e) {
  return We.call(e);
}
var je = "[object Null]", Be = "[object Undefined]", ie = K ? K.toStringTag : void 0;
function De(e) {
  return e == null ? e === void 0 ? Be : je : ie && ie in Object(e) ? $e(e) : Oe(e);
}
function ze(e) {
  return e != null && typeof e == "object";
}
var Fe = "[object Symbol]";
function Ce(e) {
  return typeof e == "symbol" || ze(e) && De(e) == Fe;
}
var Re = /\s/;
function _e(e) {
  for (var a = e.length; a-- && Re.test(e.charAt(a)); )
    ;
  return a;
}
var qe = /^\s+/;
function Ve(e) {
  return e && e.slice(0, _e(e) + 1).replace(qe, "");
}
function te(e) {
  var a = typeof e;
  return e != null && (a == "object" || a == "function");
}
var se = NaN, Ge = /^[-+]0x[0-9a-f]+$/i, Xe = /^0b[01]+$/i, Ue = /^0o[0-7]+$/i, Ye = parseInt;
function le(e) {
  if (typeof e == "number")
    return e;
  if (Ce(e))
    return se;
  if (te(e)) {
    var a = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = te(a) ? a + "" : a;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Ve(e);
  var i = Xe.test(e);
  return i || Ue.test(e) ? Ye(e.slice(2), i ? 2 : 8) : Ge.test(e) ? se : +e;
}
var ee = function() {
  return de.Date.now();
}, Je = "Expected a function", Ke = Math.max, Qe = Math.min;
function ce(e, a, i) {
  var l, b, v, t, o, m, h = 0, p = !1, d = !1, w = !0;
  if (typeof e != "function")
    throw new TypeError(Je);
  a = le(a) || 0, te(i) && (p = !!i.leading, d = "maxWait" in i, v = d ? Ke(le(i.maxWait) || 0, a) : v, w = "trailing" in i ? !!i.trailing : w);
  function T(s) {
    var y = l, u = b;
    return l = b = void 0, h = s, t = e.apply(u, y), t;
  }
  function A(s) {
    return h = s, o = setTimeout(M, a), p ? T(s) : t;
  }
  function W(s) {
    var y = s - m, u = s - h, S = a - y;
    return d ? Qe(S, v - u) : S;
  }
  function k(s) {
    var y = s - m, u = s - h;
    return m === void 0 || y >= a || y < 0 || d && u >= v;
  }
  function M() {
    var s = ee();
    if (k(s))
      return I(s);
    o = setTimeout(M, W(s));
  }
  function I(s) {
    return o = void 0, w && l ? T(s) : (l = b = void 0, t);
  }
  function L() {
    o !== void 0 && clearTimeout(o), h = 0, l = m = b = o = void 0;
  }
  function E() {
    return o === void 0 ? t : I(ee());
  }
  function g() {
    var s = ee(), y = k(s);
    if (l = arguments, b = this, m = s, y) {
      if (o === void 0)
        return A(m);
      if (d)
        return clearTimeout(o), o = setTimeout(M, a), T(m);
    }
    return o === void 0 && (o = setTimeout(M, a)), t;
  }
  return g.cancel = L, g.flush = E, g;
}
function ue(e) {
  const a = window.innerWidth, i = e.sizes;
  return a >= 1536 && i["2xl"] ? i["2xl"] : a >= 1280 && i.xl ? i.xl : a >= 1024 && i.lg ? i.lg : a >= 768 && i.md ? i.md : a >= 640 && i.sm ? i.sm : i.base;
}
function Ze(e) {
  return e.reduce((i, l) => Math.max(i, l.top + l.columnHeight), 0) + 500;
}
function et(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function tt(e, a = 0) {
  return {
    style: et(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": a
  };
}
function Q(e, a) {
  if (!e.length || a <= 0)
    return new Array(Math.max(1, a)).fill(0);
  const l = Array.from(new Set(e.map((t) => t.left))).sort((t, o) => t - o).slice(0, a), b = /* @__PURE__ */ new Map();
  for (let t = 0; t < l.length; t++) b.set(l[t], t);
  const v = new Array(l.length).fill(0);
  for (const t of e) {
    const o = b.get(t.left);
    o != null && (v[o] = Math.max(v[o], t.top + t.columnHeight));
  }
  for (; v.length < a; ) v.push(0);
  return v;
}
function nt(e, a) {
  function i(t, o) {
    const m = parseInt(t.dataset.left || "0", 10), h = parseInt(t.dataset.top || "0", 10), p = parseInt(t.dataset.index || "0", 10), d = Math.min(p * 20, 160), w = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${d}ms`), requestAnimationFrame(() => {
      t.style.opacity = "1", t.style.transform = `translate3d(${m}px, ${h}px, 0) scale(1)`;
      const T = () => {
        w ? t.style.setProperty("--masonry-opacity-delay", w) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", T), o();
      };
      t.addEventListener("transitionend", T);
    });
  }
  function l(t) {
    const o = parseInt(t.dataset.left || "0", 10), m = parseInt(t.dataset.top || "0", 10);
    t.style.opacity = "0", t.style.transform = `translate3d(${o}px, ${m + 10}px, 0) scale(0.985)`;
  }
  function b(t) {
    const o = parseInt(t.dataset.left || "0", 10), m = parseInt(t.dataset.top || "0", 10);
    t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${o}px, ${m}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      t.style.transition = "";
    });
  }
  function v(t, o) {
    const m = parseInt(t.dataset.left || "0", 10), h = parseInt(t.dataset.top || "0", 10), p = typeof (a == null ? void 0 : a.leaveDurationMs) == "number" ? a.leaveDurationMs : NaN;
    let d = Number.isFinite(p) && p > 0 ? p : NaN;
    if (!Number.isFinite(d)) {
      const M = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", I = parseFloat(M);
      d = Number.isFinite(I) && I > 0 ? I : 200;
    }
    const w = t.style.transitionDuration, T = () => {
      t.removeEventListener("transitionend", A), clearTimeout(W), t.style.transitionDuration = w || "";
    }, A = (k) => {
      (!k || k.target === t) && (T(), o());
    }, W = setTimeout(() => {
      T(), o();
    }, d + 100);
    requestAnimationFrame(() => {
      t.style.transitionDuration = `${d}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${m}px, ${h + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", A);
    });
  }
  return {
    onEnter: i,
    onBeforeEnter: l,
    onBeforeLeave: b,
    onLeave: v
  };
}
function at({
  container: e,
  masonry: a,
  columns: i,
  containerHeight: l,
  isLoading: b,
  maxItems: v,
  pageSize: t,
  refreshLayout: o,
  setItemsRaw: m,
  loadNext: h,
  leaveEstimateMs: p
}) {
  let d = !1, w = 0;
  async function T(k) {
    if (!e.value) return;
    const { scrollTop: M, clientHeight: I } = e.value, L = M + I, E = M > w + 1;
    w = M;
    const g = k ?? Q(a.value, i.value), y = Math.max(...g) + 300 < L - 1, u = M + I >= l.value - 1;
    if ((y || u) && E && !b.value && !d)
      try {
        a.value.length > v && await A(g), await h(), await X();
      } catch (S) {
        console.error("Error in scroll handler:", S);
      }
  }
  async function A(k) {
    if (!a.value.length || a.value.length <= t) return;
    const M = a.value.reduce((s, y) => {
      const u = y.page;
      return s[u] || (s[u] = []), s[u].push(y), s;
    }, {}), I = Object.keys(M).sort((s, y) => parseInt(s) - parseInt(y));
    if (I.length === 0) return;
    let L = 0;
    const E = [];
    for (const s of I)
      if (E.push(s), L += M[s].length, L >= t) break;
    const g = a.value.filter((s) => !E.includes(String(s.page)));
    g.length !== a.value.length && (d = !0, m(g), await X(), await new Promise((s) => requestAnimationFrame(() => s())), o(g), await X(), await W(), d = !1);
  }
  async function W() {
    if (!e.value) return;
    const { scrollTop: k, clientHeight: M } = e.value, I = k + M * 0.4, L = Q(a.value, i.value), E = L.indexOf(Math.max(...L)), g = a.value.filter((u, S) => S % i.value === E);
    if (g.length === 0) return;
    let s = g[0];
    for (const u of g)
      u.top <= I && u.top >= s.top && (s = u);
    const y = Math.max(0, s.top - M * 0.4);
    Math.abs(y - k) > 4 && e.value.scrollTo({ top: y, behavior: "auto" });
  }
  return {
    handleScroll: T
  };
}
const rt = ["src"], ot = ["onClick"], it = /* @__PURE__ */ me({
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
  setup(e, { expose: a, emit: i }) {
    const l = e, b = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, v = ne(() => {
      var n;
      return {
        ...b,
        ...l.layout,
        sizes: {
          ...b.sizes,
          ...((n = l.layout) == null ? void 0 : n.sizes) || {}
        }
      };
    }), t = i, o = ne({
      get: () => l.items,
      set: (n) => t("update:items", n)
    }), m = D(7), h = D(null), p = D([]);
    D(null);
    const d = D(!1), w = D(0), T = D({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), A = (n) => {
      if (!h.value) return;
      const { scrollTop: r, clientHeight: c } = h.value, f = r + c, x = n ?? Q(o.value, m.value), P = Math.max(...x) + 300, B = Math.max(0, P - f), pe = B <= 100;
      T.value = {
        distanceToTrigger: Math.round(B),
        isNearTrigger: pe
      };
    }, { onEnter: W, onBeforeEnter: k, onBeforeLeave: M, onLeave: I } = nt(o, { leaveDurationMs: l.leaveDurationMs }), { handleScroll: L } = at({
      container: h,
      masonry: o,
      columns: m,
      containerHeight: w,
      isLoading: d,
      maxItems: l.maxItems,
      pageSize: l.pageSize,
      refreshLayout: g,
      setItemsRaw: (n) => {
        o.value = n;
      },
      loadNext: H,
      leaveEstimateMs: l.leaveDurationMs
    });
    a({
      isLoading: d,
      refreshLayout: g,
      containerHeight: w,
      remove: N,
      removeMany: R,
      loadNext: H,
      loadPage: S,
      reset: C,
      init: U,
      paginationHistory: p
    });
    function E(n) {
      const r = Ze(n);
      let c = 0;
      if (h.value) {
        const { scrollTop: f, clientHeight: x } = h.value;
        c = f + x + 100;
      }
      w.value = Math.max(r, c);
    }
    function g(n) {
      if (!h.value) return;
      const r = Ee(n, h.value, m.value, v.value);
      E(r), o.value = r;
    }
    function s(n, r) {
      return new Promise((c) => {
        const f = Math.max(0, n | 0), x = Date.now();
        r(f, f);
        const $ = setInterval(() => {
          const P = Date.now() - x, B = Math.max(0, f - P);
          r(B, f), B <= 0 && (clearInterval($), c());
        }, 100);
      });
    }
    async function y(n) {
      try {
        const r = await u(() => l.getNextPage(n));
        return g([...o.value, ...r.items]), r;
      } catch (r) {
        throw console.error("Error in getContent:", r), r;
      }
    }
    async function u(n) {
      let r = 0;
      const c = l.retryMaxAttempts;
      let f = l.retryInitialDelayMs;
      for (; ; )
        try {
          const x = await n();
          return r > 0 && t("retry:stop", { attempt: r, success: !0 }), x;
        } catch (x) {
          if (r++, r > c)
            throw t("retry:stop", { attempt: r - 1, success: !1 }), x;
          t("retry:start", { attempt: r, max: c, totalMs: f }), await s(f, ($, P) => {
            t("retry:tick", { attempt: r, remainingMs: $, totalMs: P });
          }), f += l.retryBackoffStepMs;
        }
    }
    async function S(n) {
      if (!d.value) {
        d.value = !0;
        try {
          const r = o.value.length, c = await y(n);
          return p.value.push(c.nextPage), await F(r), c;
        } catch (r) {
          throw console.error("Error loading page:", r), r;
        } finally {
          d.value = !1;
        }
      }
    }
    async function H() {
      if (!d.value) {
        d.value = !0;
        try {
          const n = o.value.length, r = p.value[p.value.length - 1], c = await y(r);
          return p.value.push(c.nextPage), await F(n), c;
        } catch (n) {
          throw console.error("Error loading next page:", n), n;
        } finally {
          d.value = !1;
        }
      }
    }
    async function N(n) {
      const r = o.value.filter((c) => c.id !== n.id);
      o.value = r, await X(), await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
        g(r);
      });
    }
    async function R(n) {
      if (!n || n.length === 0) return;
      const r = new Set(n.map((f) => f.id)), c = o.value.filter((f) => !r.has(f.id));
      o.value = c, await X(), await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        g(c);
      });
    }
    function _() {
      m.value = ue(v.value), g(o.value);
    }
    let O = !1;
    async function F(n) {
      if (!l.backfillEnabled || O) return;
      const r = (n || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || p.value[p.value.length - 1] == null) && !(o.value.length >= r)) {
        O = !0;
        try {
          let f = 0;
          for (t("backfill:start", { target: r, fetched: o.value.length, calls: f }); o.value.length < r && f < l.backfillMaxCalls && p.value[p.value.length - 1] != null; ) {
            await s(l.backfillDelayMs, ($, P) => {
              t("backfill:tick", {
                fetched: o.value.length,
                target: r,
                calls: f,
                remainingMs: $,
                totalMs: P
              });
            });
            const x = p.value[p.value.length - 1];
            try {
              d.value = !0;
              const $ = await y(x);
              p.value.push($.nextPage);
            } finally {
              d.value = !1;
            }
            f++;
          }
          t("backfill:stop", { fetched: o.value.length, calls: f });
        } finally {
          O = !1;
        }
      }
    }
    function C() {
      h.value && h.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], w.value = 0, p.value = [l.loadAtPage], T.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const j = ce(() => {
      const n = Q(o.value, m.value);
      L(n), A(n);
    }, 200), q = ce(_, 200);
    function U(n, r, c) {
      p.value = [r], p.value.push(c), g([...o.value, ...n]), A();
    }
    return he(async () => {
      var n;
      try {
        m.value = ue(v.value);
        const r = l.loadAtPage;
        p.value = [r], l.skipInitialLoad || await S(p.value[0]), A();
      } catch (r) {
        console.error("Error during component initialization:", r), d.value = !1;
      }
      (n = h.value) == null || n.addEventListener("scroll", j, { passive: !0 }), window.addEventListener("resize", q);
    }), ye(() => {
      var n;
      (n = h.value) == null || n.removeEventListener("scroll", j), window.removeEventListener("resize", q);
    }), (n, r) => (J(), Y("div", {
      class: ae(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
      ref_key: "container",
      ref: h
    }, [
      z("div", {
        class: "relative",
        style: ve({ height: `${w.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        be(we, {
          name: "masonry",
          css: !1,
          onEnter: V(W),
          onBeforeEnter: V(k),
          onLeave: V(I),
          onBeforeLeave: V(M)
        }, {
          default: Me(() => [
            (J(!0), Y(Te, null, Se(o.value, (c, f) => (J(), Y("div", re({
              key: `${c.page}-${c.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, V(tt)(c, f)), [
              Ie(n.$slots, "item", re({ ref_for: !0 }, { item: c, remove: N }), () => [
                z("img", {
                  src: c.src,
                  class: "w-full",
                  loading: "lazy",
                  decoding: "async"
                }, null, 8, rt),
                z("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (x) => N(c)
                }, r[0] || (r[0] = [
                  z("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, ot)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"]),
        w.value > 0 ? (J(), Y("div", {
          key: 0,
          class: ae(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !T.value.isNearTrigger, "opacity-100": T.value.isNearTrigger }])
        }, [
          z("span", null, oe(o.value.length) + " items", 1),
          r[1] || (r[1] = z("span", { class: "mx-2" }, "|", -1)),
          z("span", null, oe(T.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : xe("", !0)
      ], 4)
    ], 2));
  }
}), st = (e, a) => {
  const i = e.__vccOpts || e;
  for (const [l, b] of a)
    i[l] = b;
  return i;
}, fe = /* @__PURE__ */ st(it, [["__scopeId", "data-v-8996f938"]]), ct = {
  install(e) {
    e.component("WyxosMasonry", fe), e.component("WMasonry", fe);
  }
};
export {
  fe as Masonry,
  ct as default
};
