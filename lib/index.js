import { nextTick as X, defineComponent as dt, computed as et, ref as B, onMounted as gt, onUnmounted as pt, createElementBlock as Y, openBlock as J, createElementVNode as C, normalizeStyle as mt, createVNode as ht, createCommentVNode as yt, TransitionGroup as vt, unref as V, withCtx as bt, Fragment as xt, renderList as wt, mergeProps as nt, renderSlot as Tt, normalizeClass as Mt, toDisplayString as at } from "vue";
function It() {
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const a = document.createElement("div");
  a.style.width = "100%", t.appendChild(a);
  const o = t.offsetWidth - a.offsetWidth;
  return document.body.removeChild(t), o;
}
function St(t, a, o, s = {}) {
  const {
    gutterX: b = 0,
    gutterY: r = 0,
    header: d = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: h = 0,
    sizes: m = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: p = "masonry"
  } = s;
  let T = 0, E = 0;
  try {
    if (a && a.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const f = window.getComputedStyle(a);
      T = parseFloat(f.paddingLeft) || 0, E = parseFloat(f.paddingRight) || 0;
    }
  } catch {
  }
  const $ = (w || 0) + T, A = (h || 0) + E, W = a.offsetWidth - a.clientWidth, M = W > 0 ? W + 2 : It() + 2, H = a.offsetWidth - M - $ - A, N = b * (o - 1), I = Math.floor((H - N) / o), y = t.map((f) => {
    const v = f.width, S = f.height;
    return Math.round(I * S / v) + i + d;
  });
  if (p === "sequential-balanced") {
    const f = y.length;
    if (f === 0) return [];
    const v = (e, n, l) => e + (n > 0 ? r : 0) + l;
    let S = Math.max(...y), L = y.reduce((e, n) => e + n, 0) + r * Math.max(0, f - 1);
    const R = (e) => {
      let n = 1, l = 0, g = 0;
      for (let x = 0; x < f; x++) {
        const P = y[x], k = v(l, g, P);
        if (k <= e)
          l = k, g++;
        else if (n++, l = P, g = 1, P > e || n > o) return !1;
      }
      return n <= o;
    };
    for (; S < L; ) {
      const e = Math.floor((S + L) / 2);
      R(e) ? L = e : S = e + 1;
    }
    const _ = L, O = new Array(o).fill(0);
    let z = o - 1, D = 0, j = 0;
    for (let e = f - 1; e >= 0; e--) {
      const n = y[e], l = e < z;
      !(v(D, j, n) <= _) || l ? (O[z] = e + 1, z--, D = n, j = 1) : (D = v(D, j, n), j++);
    }
    O[0] = 0;
    const q = [], U = new Array(o).fill(0);
    for (let e = 0; e < o; e++) {
      const n = O[e], l = e + 1 < o ? O[e + 1] : f, g = e * (I + b);
      for (let x = n; x < l; x++) {
        const k = { ...t[x], columnWidth: I, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, F = y[x] - (i + d);
        k.imageHeight = F, k.columnHeight = y[x], k.left = g, k.top = U[e], U[e] += k.columnHeight + (x + 1 < l ? r : 0), q.push(k);
      }
    }
    return q;
  }
  const c = new Array(o).fill(0), u = [];
  for (let f = 0; f < t.length; f++) {
    const v = t[f], S = { ...v, columnWidth: 0, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, L = c.indexOf(Math.min(...c)), R = v.width, _ = v.height;
    S.columnWidth = I, S.left = L * (I + b), S.imageHeight = Math.round(I * _ / R), S.columnHeight = S.imageHeight + i + d, S.top = c[L], c[L] += S.columnHeight + r, u.push(S);
  }
  return u;
}
var kt = typeof global == "object" && global && global.Object === Object && global, Ht = typeof self == "object" && self && self.Object === Object && self, ut = kt || Ht || Function("return this")(), K = ut.Symbol, ft = Object.prototype, Et = ft.hasOwnProperty, Pt = ft.toString, G = K ? K.toStringTag : void 0;
function Lt(t) {
  var a = Et.call(t, G), o = t[G];
  try {
    t[G] = void 0;
    var s = !0;
  } catch {
  }
  var b = Pt.call(t);
  return s && (a ? t[G] = o : delete t[G]), b;
}
var $t = Object.prototype, Nt = $t.toString;
function Wt(t) {
  return Nt.call(t);
}
var At = "[object Null]", Ot = "[object Undefined]", rt = K ? K.toStringTag : void 0;
function jt(t) {
  return t == null ? t === void 0 ? Ot : At : rt && rt in Object(t) ? Lt(t) : Wt(t);
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
var ot = NaN, qt = /^[-+]0x[0-9a-f]+$/i, Vt = /^0b[01]+$/i, Gt = /^0o[0-7]+$/i, Xt = parseInt;
function it(t) {
  if (typeof t == "number")
    return t;
  if (zt(t))
    return ot;
  if (Z(t)) {
    var a = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Z(a) ? a + "" : a;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = _t(t);
  var o = Vt.test(t);
  return o || Gt.test(t) ? Xt(t.slice(2), o ? 2 : 8) : qt.test(t) ? ot : +t;
}
var Q = function() {
  return ut.Date.now();
}, Ut = "Expected a function", Yt = Math.max, Jt = Math.min;
function st(t, a, o) {
  var s, b, r, d, i, w, h = 0, m = !1, p = !1, T = !0;
  if (typeof t != "function")
    throw new TypeError(Ut);
  a = it(a) || 0, Z(o) && (m = !!o.leading, p = "maxWait" in o, r = p ? Yt(it(o.maxWait) || 0, a) : r, T = "trailing" in o ? !!o.trailing : T);
  function E(c) {
    var u = s, f = b;
    return s = b = void 0, h = c, d = t.apply(f, u), d;
  }
  function $(c) {
    return h = c, i = setTimeout(M, a), m ? E(c) : d;
  }
  function A(c) {
    var u = c - w, f = c - h, v = a - u;
    return p ? Jt(v, r - f) : v;
  }
  function W(c) {
    var u = c - w, f = c - h;
    return w === void 0 || u >= a || u < 0 || p && f >= r;
  }
  function M() {
    var c = Q();
    if (W(c))
      return H(c);
    i = setTimeout(M, A(c));
  }
  function H(c) {
    return i = void 0, T && s ? E(c) : (s = b = void 0, d);
  }
  function N() {
    i !== void 0 && clearTimeout(i), h = 0, s = w = b = i = void 0;
  }
  function I() {
    return i === void 0 ? d : H(Q());
  }
  function y() {
    var c = Q(), u = W(c);
    if (s = arguments, b = this, w = c, u) {
      if (i === void 0)
        return $(w);
      if (p)
        return clearTimeout(i), i = setTimeout(M, a), E(w);
    }
    return i === void 0 && (i = setTimeout(M, a)), d;
  }
  return y.cancel = N, y.flush = I, y;
}
function lt(t) {
  const a = window.innerWidth, o = t.sizes;
  return a >= 1536 && o["2xl"] ? o["2xl"] : a >= 1280 && o.xl ? o.xl : a >= 1024 && o.lg ? o.lg : a >= 768 && o.md ? o.md : a >= 640 && o.sm ? o.sm : o.base;
}
function Kt(t) {
  return t.reduce((o, s) => Math.max(o, s.top + s.columnHeight), 0) + 500;
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
  for (let s = 0; s < t.length; s++) {
    const b = t[s], r = s % a;
    o[r] = Math.max(o[r], b.top + b.columnHeight);
  }
  return o;
}
function te(t) {
  function a(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), h = parseInt(r.dataset.index || "0", 10), m = Math.min(h * 20, 160), p = r.style.getPropertyValue("--masonry-opacity-delay");
    r.style.setProperty("--masonry-opacity-delay", `${m}ms`), requestAnimationFrame(() => {
      r.style.opacity = "1", r.style.transform = `translate3d(${i}px, ${w}px, 0) scale(1)`;
      const T = () => {
        p ? r.style.setProperty("--masonry-opacity-delay", p) : r.style.removeProperty("--masonry-opacity-delay"), r.removeEventListener("transitionend", T), d();
      };
      r.addEventListener("transitionend", T);
    });
  }
  function o(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.opacity = "0", r.style.transform = `translate3d(${d}px, ${i + 10}px, 0) scale(0.985)`;
  }
  function s(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.transition = "none", r.style.opacity = "1", r.style.transform = `translate3d(${d}px, ${i}px, 0) scale(1)`, r.style.removeProperty("--masonry-opacity-delay"), r.offsetWidth, r.style.transition = "";
  }
  function b(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), m = getComputedStyle(r).getPropertyValue("--masonry-leave-duration") || "", p = parseFloat(m), T = Number.isFinite(p) && p > 0 ? p : 200, E = r.style.transitionDuration, $ = () => {
      r.removeEventListener("transitionend", A), clearTimeout(W), r.style.transitionDuration = E || "";
    }, A = (M) => {
      (!M || M.target === r) && ($(), d());
    }, W = setTimeout(() => {
      $(), d();
    }, T + 100);
    requestAnimationFrame(() => {
      r.style.transitionDuration = `${T}ms`, r.style.opacity = "0", r.style.transform = `translate3d(${i}px, ${w + 10}px, 0) scale(0.985)`, r.addEventListener("transitionend", A);
    });
  }
  return {
    onEnter: a,
    onBeforeEnter: o,
    onBeforeLeave: s,
    onLeave: b
  };
}
function ee({
  container: t,
  masonry: a,
  columns: o,
  containerHeight: s,
  isLoading: b,
  maxItems: r,
  pageSize: d,
  refreshLayout: i,
  setItemsRaw: w,
  loadNext: h,
  leaveEstimateMs: m
}) {
  let p = !1;
  async function T() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: H } = t.value, N = M + H, I = tt(a.value, o.value), c = Math.max(...I) + 300 < N - 1, u = M + H >= s.value - 1;
    if ((c || u) && !b.value && !p)
      try {
        a.value.length > r && await E(I), await h(), await X();
      } catch (f) {
        console.error("Error in scroll handler:", f);
      }
  }
  async function E(M) {
    if (!a.value.length || a.value.length <= d) return;
    const H = a.value.reduce((u, f) => {
      const v = f.page;
      return u[v] || (u[v] = []), u[v].push(f), u;
    }, {}), N = Object.keys(H).sort((u, f) => parseInt(u) - parseInt(f));
    if (N.length === 0) return;
    let I = 0;
    const y = [];
    for (const u of N)
      if (y.push(u), I += H[u].length, I >= d) break;
    const c = a.value.filter((u) => !y.includes(String(u.page)));
    c.length !== a.value.length && (p = !0, w(c), await X(), await A($()), i(c), await X(), await W(), p = !1);
  }
  function $() {
    return (typeof m == "number" && m > 0 ? m : 250) + 50;
  }
  function A(M) {
    return new Promise((H) => setTimeout(H, M));
  }
  async function W() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: H } = t.value, N = M + H * 0.4, I = tt(a.value, o.value), y = I.indexOf(Math.max(...I)), c = a.value.filter((v, S) => S % o.value === y);
    if (c.length === 0) return;
    let u = c[0];
    for (const v of c)
      v.top <= N && v.top >= u.top && (u = v);
    const f = Math.max(0, u.top - H * 0.4);
    Math.abs(f - M) > 4 && t.value.scrollTo({ top: f, behavior: "auto" });
  }
  return {
    handleScroll: T
  };
}
const ne = ["src"], ae = ["onClick"], re = /* @__PURE__ */ dt({
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
    const s = t, b = {
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
        ...s.layout,
        sizes: {
          ...b.sizes,
          ...((e = s.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), d = o, i = et({
      get: () => s.items,
      set: (e) => d("update:items", e)
    }), w = B(7), h = B(null), m = B([]);
    B(null);
    const p = B(!1), T = B(0), E = B({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), $ = () => {
      if (!h.value) return;
      const { scrollTop: e, clientHeight: n } = h.value, l = e + n, g = tt(i.value, w.value), P = Math.max(...g) + 300, k = Math.max(0, P - l), F = k <= 100;
      E.value = {
        distanceToTrigger: Math.round(k),
        isNearTrigger: F
      };
    }, { onEnter: A, onBeforeEnter: W, onBeforeLeave: M, onLeave: H } = te(), { handleScroll: N } = ee({
      container: h,
      masonry: i,
      columns: w,
      containerHeight: T,
      isLoading: p,
      maxItems: s.maxItems,
      pageSize: s.pageSize,
      refreshLayout: y,
      setItemsRaw: (e) => {
        i.value = e;
      },
      loadNext: S,
      leaveEstimateMs: s.leaveDurationMs
    });
    a({
      isLoading: p,
      refreshLayout: y,
      containerHeight: T,
      remove: L,
      removeMany: R,
      loadNext: S,
      loadPage: v,
      reset: D,
      init: U,
      paginationHistory: m
    });
    function I(e) {
      const n = Kt(e);
      let l = 0;
      if (h.value) {
        const { scrollTop: g, clientHeight: x } = h.value;
        l = g + x + 100;
      }
      T.value = Math.max(n, l);
    }
    function y(e) {
      if (!h.value) return;
      const n = St(e, h.value, w.value, r.value);
      I(n), i.value = n;
    }
    function c(e, n) {
      return new Promise((l) => {
        const g = Math.max(0, e | 0), x = Date.now();
        n(g, g);
        const P = setInterval(() => {
          const k = Date.now() - x, F = Math.max(0, g - k);
          n(F, g), F <= 0 && (clearInterval(P), l());
        }, 100);
      });
    }
    async function u(e) {
      try {
        const n = await f(() => s.getNextPage(e));
        return y([...i.value, ...n.items]), n;
      } catch (n) {
        throw console.error("Error in getContent:", n), n;
      }
    }
    async function f(e) {
      let n = 0;
      const l = s.retryMaxAttempts;
      let g = s.retryInitialDelayMs;
      for (; ; )
        try {
          const x = await e();
          return n > 0 && d("retry:stop", { attempt: n, success: !0 }), x;
        } catch (x) {
          if (n++, n > l)
            throw d("retry:stop", { attempt: n - 1, success: !1 }), x;
          d("retry:start", { attempt: n, max: l, totalMs: g }), await c(g, (P, k) => {
            d("retry:tick", { attempt: n, remainingMs: P, totalMs: k });
          }), g += s.retryBackoffStepMs;
        }
    }
    async function v(e) {
      if (!p.value) {
        p.value = !0;
        try {
          const n = i.value.length, l = await u(e);
          return m.value.push(l.nextPage), await z(n), l;
        } catch (n) {
          throw console.error("Error loading page:", n), n;
        } finally {
          p.value = !1;
        }
      }
    }
    async function S() {
      if (!p.value) {
        p.value = !0;
        try {
          const e = i.value.length, n = m.value[m.value.length - 1], l = await u(n);
          return m.value.push(l.nextPage), await z(e), l;
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function L(e) {
      const n = i.value.filter((l) => l.id !== e.id);
      i.value = n, await X(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          y(n);
        });
      });
    }
    async function R(e) {
      if (!e || e.length === 0) return;
      const n = new Set(e.map((g) => g.id)), l = i.value.filter((g) => !n.has(g.id));
      i.value = l, await X(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          y(l);
        });
      });
    }
    function _() {
      w.value = lt(r.value), y(i.value);
    }
    let O = !1;
    async function z(e) {
      if (!s.backfillEnabled || O) return;
      const n = (e || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || m.value[m.value.length - 1] == null) && !(i.value.length >= n)) {
        O = !0;
        try {
          let g = 0;
          for (d("backfill:start", { target: n, fetched: i.value.length, calls: g }); i.value.length < n && g < s.backfillMaxCalls && m.value[m.value.length - 1] != null; ) {
            await c(s.backfillDelayMs, (P, k) => {
              d("backfill:tick", {
                fetched: i.value.length,
                target: n,
                calls: g,
                remainingMs: P,
                totalMs: k
              });
            });
            const x = m.value[m.value.length - 1];
            try {
              p.value = !0;
              const P = await u(x);
              m.value.push(P.nextPage);
            } finally {
              p.value = !1;
            }
            g++;
          }
          d("backfill:stop", { fetched: i.value.length, calls: g });
        } finally {
          O = !1;
        }
      }
    }
    function D() {
      h.value && h.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), i.value = [], T.value = 0, m.value = [s.loadAtPage], E.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const j = st(() => {
      N(), $();
    }, 200), q = st(_, 200);
    function U(e, n, l) {
      m.value = [n], m.value.push(l), y([...i.value, ...e]), $();
    }
    return gt(async () => {
      var e;
      try {
        w.value = lt(r.value);
        const n = s.loadAtPage;
        m.value = [n], s.skipInitialLoad || await v(m.value[0]), $();
      } catch (n) {
        console.error("Error during component initialization:", n), p.value = !1;
      }
      (e = h.value) == null || e.addEventListener("scroll", j), window.addEventListener("resize", q);
    }), pt(() => {
      var e;
      (e = h.value) == null || e.removeEventListener("scroll", j), window.removeEventListener("resize", q);
    }), (e, n) => (J(), Y("div", {
      class: "overflow-auto w-full flex-1 masonry-container",
      ref_key: "container",
      ref: h
    }, [
      C("div", {
        class: "relative",
        style: mt({ height: `${T.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
      }, [
        ht(vt, {
          name: "masonry",
          css: !1,
          onEnter: V(A),
          onBeforeEnter: V(W),
          onLeave: V(H),
          onBeforeLeave: V(M)
        }, {
          default: bt(() => [
            (J(!0), Y(xt, null, wt(i.value, (l, g) => (J(), Y("div", nt({
              key: `${l.page}-${l.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, V(Zt)(l, g)), [
              Tt(e.$slots, "item", nt({ ref_for: !0 }, { item: l, remove: L }), () => [
                C("img", {
                  src: l.src,
                  class: "w-full"
                }, null, 8, ne),
                C("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (x) => L(l)
                }, n[0] || (n[0] = [
                  C("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, ae)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"]),
        T.value > 0 ? (J(), Y("div", {
          key: 0,
          class: Mt(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !E.value.isNearTrigger, "opacity-100": E.value.isNearTrigger }])
        }, [
          C("span", null, at(i.value.length) + " items", 1),
          n[1] || (n[1] = C("span", { class: "mx-2" }, "|", -1)),
          C("span", null, at(E.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : yt("", !0)
      ], 4)
    ], 512));
  }
}), oe = (t, a) => {
  const o = t.__vccOpts || t;
  for (const [s, b] of a)
    o[s] = b;
  return o;
}, ct = /* @__PURE__ */ oe(re, [["__scopeId", "data-v-dc6ab8b8"]]), se = {
  install(t) {
    t.component("WyxosMasonry", ct), t.component("WMasonry", ct);
  }
};
export {
  ct as Masonry,
  se as default
};
