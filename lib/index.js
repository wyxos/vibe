import { nextTick as X, defineComponent as gt, computed as et, ref as B, onMounted as pt, onUnmounted as mt, createElementBlock as Y, openBlock as J, normalizeClass as nt, createElementVNode as C, normalizeStyle as ht, createVNode as yt, createCommentVNode as vt, TransitionGroup as bt, unref as q, withCtx as xt, Fragment as wt, renderList as Tt, mergeProps as at, renderSlot as Mt, toDisplayString as rt } from "vue";
function It() {
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const a = document.createElement("div");
  a.style.width = "100%", t.appendChild(a);
  const o = t.offsetWidth - a.offsetWidth;
  return document.body.removeChild(t), o;
}
function St(t, a, o, l = {}) {
  const {
    gutterX: b = 0,
    gutterY: r = 0,
    header: d = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: m = 0,
    sizes: h = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: g = "masonry"
  } = l;
  let x = 0, E = 0;
  try {
    if (a && a.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const u = window.getComputedStyle(a);
      x = parseFloat(u.paddingLeft) || 0, E = parseFloat(u.paddingRight) || 0;
    }
  } catch {
  }
  const W = (w || 0) + x, O = (m || 0) + E, M = a.offsetWidth - a.clientWidth, T = M > 0 ? M + 2 : It() + 2, L = a.offsetWidth - T - W - O, $ = b * (o - 1), I = Math.floor((L - $) / o), p = t.map((u) => {
    const k = u.width, H = u.height;
    return Math.round(I * H / k) + i + d;
  });
  if (g === "sequential-balanced") {
    const u = p.length;
    if (u === 0) return [];
    const k = (e, n, c) => e + (n > 0 ? r : 0) + c;
    let H = Math.max(...p), N = p.reduce((e, n) => e + n, 0) + r * Math.max(0, u - 1);
    const R = (e) => {
      let n = 1, c = 0, f = 0;
      for (let y = 0; y < u; y++) {
        const P = p[y], S = k(c, f, P);
        if (S <= e)
          c = S, f++;
        else if (n++, c = P, f = 1, P > e || n > o) return !1;
      }
      return n <= o;
    };
    for (; H < N; ) {
      const e = Math.floor((H + N) / 2);
      R(e) ? N = e : H = e + 1;
    }
    const _ = N, A = new Array(o).fill(0);
    let z = o - 1, D = 0, j = 0;
    for (let e = u - 1; e >= 0; e--) {
      const n = p[e], c = e < z;
      !(k(D, j, n) <= _) || c ? (A[z] = e + 1, z--, D = n, j = 1) : (D = k(D, j, n), j++);
    }
    A[0] = 0;
    const V = [], U = new Array(o).fill(0);
    for (let e = 0; e < o; e++) {
      const n = A[e], c = e + 1 < o ? A[e + 1] : u, f = e * (I + b);
      for (let y = n; y < c; y++) {
        const S = { ...t[y], columnWidth: I, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, F = p[y] - (i + d);
        S.imageHeight = F, S.columnHeight = p[y], S.left = f, S.top = U[e], U[e] += S.columnHeight + (y + 1 < c ? r : 0), V.push(S);
      }
    }
    return V;
  }
  const s = new Array(o).fill(0), v = [];
  for (let u = 0; u < t.length; u++) {
    const k = t[u], H = { ...k, columnWidth: 0, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, N = s.indexOf(Math.min(...s)), R = k.width, _ = k.height;
    H.columnWidth = I, H.left = N * (I + b), H.imageHeight = Math.round(I * _ / R), H.columnHeight = H.imageHeight + i + d, H.top = s[N], s[N] += H.columnHeight + r, v.push(H);
  }
  return v;
}
var kt = typeof global == "object" && global && global.Object === Object && global, Ht = typeof self == "object" && self && self.Object === Object && self, ft = kt || Ht || Function("return this")(), K = ft.Symbol, dt = Object.prototype, Et = dt.hasOwnProperty, Pt = dt.toString, G = K ? K.toStringTag : void 0;
function Lt(t) {
  var a = Et.call(t, G), o = t[G];
  try {
    t[G] = void 0;
    var l = !0;
  } catch {
  }
  var b = Pt.call(t);
  return l && (a ? t[G] = o : delete t[G]), b;
}
var $t = Object.prototype, Nt = $t.toString;
function Wt(t) {
  return Nt.call(t);
}
var Ot = "[object Null]", At = "[object Undefined]", ot = K ? K.toStringTag : void 0;
function jt(t) {
  return t == null ? t === void 0 ? At : Ot : ot && ot in Object(t) ? Lt(t) : Wt(t);
}
function Bt(t) {
  return t != null && typeof t == "object";
}
var Ct = "[object Symbol]";
function zt(t) {
  return typeof t == "symbol" || Bt(t) && jt(t) == Ct;
}
var Dt = /\s/;
function Ft(t) {
  for (var a = t.length; a-- && Dt.test(t.charAt(a)); )
    ;
  return a;
}
var Rt = /^\s+/;
function _t(t) {
  return t && t.slice(0, Ft(t) + 1).replace(Rt, "");
}
function Z(t) {
  var a = typeof t;
  return t != null && (a == "object" || a == "function");
}
var it = NaN, Vt = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Gt = /^0o[0-7]+$/i, Xt = parseInt;
function st(t) {
  if (typeof t == "number")
    return t;
  if (zt(t))
    return it;
  if (Z(t)) {
    var a = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Z(a) ? a + "" : a;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = _t(t);
  var o = qt.test(t);
  return o || Gt.test(t) ? Xt(t.slice(2), o ? 2 : 8) : Vt.test(t) ? it : +t;
}
var Q = function() {
  return ft.Date.now();
}, Ut = "Expected a function", Yt = Math.max, Jt = Math.min;
function lt(t, a, o) {
  var l, b, r, d, i, w, m = 0, h = !1, g = !1, x = !0;
  if (typeof t != "function")
    throw new TypeError(Ut);
  a = st(a) || 0, Z(o) && (h = !!o.leading, g = "maxWait" in o, r = g ? Yt(st(o.maxWait) || 0, a) : r, x = "trailing" in o ? !!o.trailing : x);
  function E(s) {
    var v = l, u = b;
    return l = b = void 0, m = s, d = t.apply(u, v), d;
  }
  function W(s) {
    return m = s, i = setTimeout(T, a), h ? E(s) : d;
  }
  function O(s) {
    var v = s - w, u = s - m, k = a - v;
    return g ? Jt(k, r - u) : k;
  }
  function M(s) {
    var v = s - w, u = s - m;
    return w === void 0 || v >= a || v < 0 || g && u >= r;
  }
  function T() {
    var s = Q();
    if (M(s))
      return L(s);
    i = setTimeout(T, O(s));
  }
  function L(s) {
    return i = void 0, x && l ? E(s) : (l = b = void 0, d);
  }
  function $() {
    i !== void 0 && clearTimeout(i), m = 0, l = w = b = i = void 0;
  }
  function I() {
    return i === void 0 ? d : L(Q());
  }
  function p() {
    var s = Q(), v = M(s);
    if (l = arguments, b = this, w = s, v) {
      if (i === void 0)
        return W(w);
      if (g)
        return clearTimeout(i), i = setTimeout(T, a), E(w);
    }
    return i === void 0 && (i = setTimeout(T, a)), d;
  }
  return p.cancel = $, p.flush = I, p;
}
function ct(t) {
  const a = window.innerWidth, o = t.sizes;
  return a >= 1536 && o["2xl"] ? o["2xl"] : a >= 1280 && o.xl ? o.xl : a >= 1024 && o.lg ? o.lg : a >= 768 && o.md ? o.md : a >= 640 && o.sm ? o.sm : o.base;
}
function Kt(t) {
  return t.reduce((o, l) => Math.max(o, l.top + l.columnHeight), 0) + 500;
}
function Qt(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function Zt(t, a = 0) {
  return {
    style: Qt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": a
  };
}
function tt(t, a) {
  const o = new Array(a).fill(0);
  for (let l = 0; l < t.length; l++) {
    const b = t[l], r = l % a;
    o[r] = Math.max(o[r], b.top + b.columnHeight);
  }
  return o;
}
function te(t) {
  function a(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), m = parseInt(r.dataset.index || "0", 10), h = Math.min(m * 20, 160), g = r.style.getPropertyValue("--masonry-opacity-delay");
    r.style.setProperty("--masonry-opacity-delay", `${h}ms`), requestAnimationFrame(() => {
      r.style.opacity = "1", r.style.transform = `translate3d(${i}px, ${w}px, 0) scale(1)`;
      const x = () => {
        g ? r.style.setProperty("--masonry-opacity-delay", g) : r.style.removeProperty("--masonry-opacity-delay"), r.removeEventListener("transitionend", x), d();
      };
      r.addEventListener("transitionend", x);
    });
  }
  function o(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.opacity = "0", r.style.transform = `translate3d(${d}px, ${i + 10}px, 0) scale(0.985)`;
  }
  function l(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.transition = "none", r.style.opacity = "1", r.style.transform = `translate3d(${d}px, ${i}px, 0) scale(1)`, r.style.removeProperty("--masonry-opacity-delay"), r.offsetWidth, r.style.transition = "";
  }
  function b(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), h = getComputedStyle(r).getPropertyValue("--masonry-leave-duration") || "", g = parseFloat(h), x = Number.isFinite(g) && g > 0 ? g : 200, E = r.style.transitionDuration, W = () => {
      r.removeEventListener("transitionend", O), clearTimeout(M), r.style.transitionDuration = E || "";
    }, O = (T) => {
      (!T || T.target === r) && (W(), d());
    }, M = setTimeout(() => {
      W(), d();
    }, x + 100);
    requestAnimationFrame(() => {
      r.style.transitionDuration = `${x}ms`, r.style.opacity = "0", r.style.transform = `translate3d(${i}px, ${w + 10}px, 0) scale(0.985)`, r.addEventListener("transitionend", O);
    });
  }
  return {
    onEnter: a,
    onBeforeEnter: o,
    onBeforeLeave: l,
    onLeave: b
  };
}
function ee({
  container: t,
  masonry: a,
  columns: o,
  containerHeight: l,
  isLoading: b,
  maxItems: r,
  pageSize: d,
  refreshLayout: i,
  setItemsRaw: w,
  loadNext: m,
  leaveEstimateMs: h
}) {
  let g = !1, x = 0;
  async function E() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: T } = t.value, L = M + T, $ = M > x + 1;
    x = M;
    const I = tt(a.value, o.value), s = Math.max(...I) + 300 < L - 1, v = M + T >= l.value - 1;
    if ((s || v) && $ && !b.value && !g)
      try {
        a.value.length > r && await W(I), await m(), await X();
      } catch (u) {
        console.error("Error in scroll handler:", u);
      }
  }
  async function W(M) {
    if (!a.value.length || a.value.length <= d) return;
    const T = a.value.reduce((s, v) => {
      const u = v.page;
      return s[u] || (s[u] = []), s[u].push(v), s;
    }, {}), L = Object.keys(T).sort((s, v) => parseInt(s) - parseInt(v));
    if (L.length === 0) return;
    let $ = 0;
    const I = [];
    for (const s of L)
      if (I.push(s), $ += T[s].length, $ >= d) break;
    const p = a.value.filter((s) => !I.includes(String(s.page)));
    p.length !== a.value.length && (g = !0, w(p), await X(), await new Promise((s) => requestAnimationFrame(() => s())), i(p), await X(), await O(), g = !1);
  }
  async function O() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: T } = t.value, L = M + T * 0.4, $ = tt(a.value, o.value), I = $.indexOf(Math.max(...$)), p = a.value.filter((u, k) => k % o.value === I);
    if (p.length === 0) return;
    let s = p[0];
    for (const u of p)
      u.top <= L && u.top >= s.top && (s = u);
    const v = Math.max(0, s.top - T * 0.4);
    Math.abs(v - M) > 4 && t.value.scrollTo({ top: v, behavior: "auto" });
  }
  return {
    handleScroll: E
  };
}
const ne = ["src"], ae = ["onClick"], re = /* @__PURE__ */ gt({
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
  setup(t, { expose: a, emit: o }) {
    const l = t, b = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, r = et(() => {
      var e;
      return {
        ...b,
        ...l.layout,
        sizes: {
          ...b.sizes,
          ...((e = l.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), d = o, i = et({
      get: () => l.items,
      set: (e) => d("update:items", e)
    }), w = B(7), m = B(null), h = B([]);
    B(null);
    const g = B(!1), x = B(0), E = B({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), W = () => {
      if (!m.value) return;
      const { scrollTop: e, clientHeight: n } = m.value, c = e + n, f = tt(i.value, w.value), P = Math.max(...f) + 300, S = Math.max(0, P - c), F = S <= 100;
      E.value = {
        distanceToTrigger: Math.round(S),
        isNearTrigger: F
      };
    }, { onEnter: O, onBeforeEnter: M, onBeforeLeave: T, onLeave: L } = te(), { handleScroll: $ } = ee({
      container: m,
      masonry: i,
      columns: w,
      containerHeight: x,
      isLoading: g,
      maxItems: l.maxItems,
      pageSize: l.pageSize,
      refreshLayout: p,
      setItemsRaw: (e) => {
        i.value = e;
      },
      loadNext: H,
      leaveEstimateMs: l.leaveDurationMs
    });
    a({
      isLoading: g,
      refreshLayout: p,
      containerHeight: x,
      remove: N,
      removeMany: R,
      loadNext: H,
      loadPage: k,
      reset: D,
      init: U,
      paginationHistory: h
    });
    function I(e) {
      const n = Kt(e);
      let c = 0;
      if (m.value) {
        const { scrollTop: f, clientHeight: y } = m.value;
        c = f + y + 100;
      }
      x.value = Math.max(n, c);
    }
    function p(e) {
      if (!m.value) return;
      const n = St(e, m.value, w.value, r.value);
      I(n), i.value = n;
    }
    function s(e, n) {
      return new Promise((c) => {
        const f = Math.max(0, e | 0), y = Date.now();
        n(f, f);
        const P = setInterval(() => {
          const S = Date.now() - y, F = Math.max(0, f - S);
          n(F, f), F <= 0 && (clearInterval(P), c());
        }, 100);
      });
    }
    async function v(e) {
      try {
        const n = await u(() => l.getNextPage(e));
        return p([...i.value, ...n.items]), n;
      } catch (n) {
        throw console.error("Error in getContent:", n), n;
      }
    }
    async function u(e) {
      let n = 0;
      const c = l.retryMaxAttempts;
      let f = l.retryInitialDelayMs;
      for (; ; )
        try {
          const y = await e();
          return n > 0 && d("retry:stop", { attempt: n, success: !0 }), y;
        } catch (y) {
          if (n++, n > c)
            throw d("retry:stop", { attempt: n - 1, success: !1 }), y;
          d("retry:start", { attempt: n, max: c, totalMs: f }), await s(f, (P, S) => {
            d("retry:tick", { attempt: n, remainingMs: P, totalMs: S });
          }), f += l.retryBackoffStepMs;
        }
    }
    async function k(e) {
      if (!g.value) {
        g.value = !0;
        try {
          const n = i.value.length, c = await v(e);
          return h.value.push(c.nextPage), await z(n), c;
        } catch (n) {
          throw console.error("Error loading page:", n), n;
        } finally {
          g.value = !1;
        }
      }
    }
    async function H() {
      if (!g.value) {
        g.value = !0;
        try {
          const e = i.value.length, n = h.value[h.value.length - 1], c = await v(n);
          return h.value.push(c.nextPage), await z(e), c;
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function N(e) {
      var c;
      const n = i.value.filter((f) => f.id !== e.id);
      i.value = n, await X(), (c = m.value) == null || c.offsetHeight, requestAnimationFrame(() => {
        p(n);
      });
    }
    async function R(e) {
      var f;
      if (!e || e.length === 0) return;
      const n = new Set(e.map((y) => y.id)), c = i.value.filter((y) => !n.has(y.id));
      i.value = c, await X(), (f = m.value) == null || f.offsetHeight, requestAnimationFrame(() => {
        p(c);
      });
    }
    function _() {
      w.value = ct(r.value), p(i.value);
    }
    let A = !1;
    async function z(e) {
      if (!l.backfillEnabled || A) return;
      const n = (e || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || h.value[h.value.length - 1] == null) && !(i.value.length >= n)) {
        A = !0;
        try {
          let f = 0;
          for (d("backfill:start", { target: n, fetched: i.value.length, calls: f }); i.value.length < n && f < l.backfillMaxCalls && h.value[h.value.length - 1] != null; ) {
            await s(l.backfillDelayMs, (P, S) => {
              d("backfill:tick", {
                fetched: i.value.length,
                target: n,
                calls: f,
                remainingMs: P,
                totalMs: S
              });
            });
            const y = h.value[h.value.length - 1];
            try {
              g.value = !0;
              const P = await v(y);
              h.value.push(P.nextPage);
            } finally {
              g.value = !1;
            }
            f++;
          }
          d("backfill:stop", { fetched: i.value.length, calls: f });
        } finally {
          A = !1;
        }
      }
    }
    function D() {
      m.value && m.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), i.value = [], x.value = 0, h.value = [l.loadAtPage], E.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const j = lt(() => {
      $(), W();
    }, 200), V = lt(_, 200);
    function U(e, n, c) {
      h.value = [n], h.value.push(c), p([...i.value, ...e]), W();
    }
    return pt(async () => {
      var e;
      try {
        w.value = ct(r.value);
        const n = l.loadAtPage;
        h.value = [n], l.skipInitialLoad || await k(h.value[0]), W();
      } catch (n) {
        console.error("Error during component initialization:", n), g.value = !1;
      }
      (e = m.value) == null || e.addEventListener("scroll", j), window.addEventListener("resize", V);
    }), mt(() => {
      var e;
      (e = m.value) == null || e.removeEventListener("scroll", j), window.removeEventListener("resize", V);
    }), (e, n) => (J(), Y("div", {
      class: nt(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
      ref_key: "container",
      ref: m
    }, [
      C("div", {
        class: "relative",
        style: ht({ height: `${x.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
      }, [
        yt(bt, {
          name: "masonry",
          css: !1,
          onEnter: q(O),
          onBeforeEnter: q(M),
          onLeave: q(L),
          onBeforeLeave: q(T)
        }, {
          default: xt(() => [
            (J(!0), Y(wt, null, Tt(i.value, (c, f) => (J(), Y("div", at({
              key: `${c.page}-${c.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, q(Zt)(c, f)), [
              Mt(e.$slots, "item", at({ ref_for: !0 }, { item: c, remove: N }), () => [
                C("img", {
                  src: c.src,
                  class: "w-full"
                }, null, 8, ne),
                C("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (y) => N(c)
                }, n[0] || (n[0] = [
                  C("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, ae)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"]),
        x.value > 0 ? (J(), Y("div", {
          key: 0,
          class: nt(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !E.value.isNearTrigger, "opacity-100": E.value.isNearTrigger }])
        }, [
          C("span", null, rt(i.value.length) + " items", 1),
          n[1] || (n[1] = C("span", { class: "mx-2" }, "|", -1)),
          C("span", null, rt(E.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : vt("", !0)
      ], 4)
    ], 2));
  }
}), oe = (t, a) => {
  const o = t.__vccOpts || t;
  for (const [l, b] of a)
    o[l] = b;
  return o;
}, ut = /* @__PURE__ */ oe(re, [["__scopeId", "data-v-a75cd886"]]), se = {
  install(t) {
    t.component("WyxosMasonry", ut), t.component("WMasonry", ut);
  }
};
export {
  ut as Masonry,
  se as default
};
