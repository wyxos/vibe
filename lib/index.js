import { nextTick as X, defineComponent as pt, computed as nt, ref as B, onMounted as mt, onUnmounted as ht, createElementBlock as Y, openBlock as J, normalizeClass as at, createElementVNode as C, normalizeStyle as yt, createVNode as vt, createCommentVNode as bt, TransitionGroup as xt, unref as V, withCtx as wt, Fragment as Tt, renderList as Mt, mergeProps as rt, renderSlot as St, toDisplayString as ot } from "vue";
let Q = null;
function It() {
  if (Q != null) return Q;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const a = document.createElement("div");
  a.style.width = "100%", t.appendChild(a);
  const o = t.offsetWidth - a.offsetWidth;
  return document.body.removeChild(t), Q = o, o;
}
function kt(t, a, o, l = {}) {
  const {
    gutterX: v = 0,
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
    placement: g = "masonry"
  } = l;
  let b = 0, H = 0;
  try {
    if (a && a.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const u = window.getComputedStyle(a);
      b = parseFloat(u.paddingLeft) || 0, H = parseFloat(u.paddingRight) || 0;
    }
  } catch {
  }
  const W = (w || 0) + b, A = (h || 0) + H, M = a.offsetWidth - a.clientWidth, T = M > 0 ? M + 2 : It() + 2, L = a.offsetWidth - T - W - A, $ = v * (o - 1), S = Math.floor((L - $) / o), p = t.map((u) => {
    const k = u.width, E = u.height;
    return Math.round(S * E / k) + i + d;
  });
  if (g === "sequential-balanced") {
    const u = p.length;
    if (u === 0) return [];
    const k = (e, n, c) => e + (n > 0 ? r : 0) + c;
    let E = Math.max(...p), N = p.reduce((e, n) => e + n, 0) + r * Math.max(0, u - 1);
    const R = (e) => {
      let n = 1, c = 0, f = 0;
      for (let x = 0; x < u; x++) {
        const P = p[x], I = k(c, f, P);
        if (I <= e)
          c = I, f++;
        else if (n++, c = P, f = 1, P > e || n > o) return !1;
      }
      return n <= o;
    };
    for (; E < N; ) {
      const e = Math.floor((E + N) / 2);
      R(e) ? N = e : E = e + 1;
    }
    const _ = N, O = new Array(o).fill(0);
    let z = o - 1, D = 0, j = 0;
    for (let e = u - 1; e >= 0; e--) {
      const n = p[e], c = e < z;
      !(k(D, j, n) <= _) || c ? (O[z] = e + 1, z--, D = n, j = 1) : (D = k(D, j, n), j++);
    }
    O[0] = 0;
    const q = [], U = new Array(o).fill(0);
    for (let e = 0; e < o; e++) {
      const n = O[e], c = e + 1 < o ? O[e + 1] : u, f = e * (S + v);
      for (let x = n; x < c; x++) {
        const I = { ...t[x], columnWidth: S, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, F = p[x] - (i + d);
        I.imageHeight = F, I.columnHeight = p[x], I.left = f, I.top = U[e], U[e] += I.columnHeight + (x + 1 < c ? r : 0), q.push(I);
      }
    }
    return q;
  }
  const s = new Array(o).fill(0), y = [];
  for (let u = 0; u < t.length; u++) {
    const k = t[u], E = { ...k, columnWidth: 0, imageHeight: 0, columnHeight: 0, left: 0, top: 0 }, N = s.indexOf(Math.min(...s)), R = k.width, _ = k.height;
    E.columnWidth = S, E.left = N * (S + v), E.imageHeight = Math.round(S * _ / R), E.columnHeight = E.imageHeight + i + d, E.top = s[N], s[N] += E.columnHeight + r, y.push(E);
  }
  return y;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Ht = typeof self == "object" && self && self.Object === Object && self, dt = Et || Ht || Function("return this")(), K = dt.Symbol, gt = Object.prototype, Pt = gt.hasOwnProperty, Lt = gt.toString, G = K ? K.toStringTag : void 0;
function $t(t) {
  var a = Pt.call(t, G), o = t[G];
  try {
    t[G] = void 0;
    var l = !0;
  } catch {
  }
  var v = Lt.call(t);
  return l && (a ? t[G] = o : delete t[G]), v;
}
var Nt = Object.prototype, Wt = Nt.toString;
function At(t) {
  return Wt.call(t);
}
var Ot = "[object Null]", jt = "[object Undefined]", it = K ? K.toStringTag : void 0;
function Bt(t) {
  return t == null ? t === void 0 ? jt : Ot : it && it in Object(t) ? $t(t) : At(t);
}
function Ct(t) {
  return t != null && typeof t == "object";
}
var zt = "[object Symbol]";
function Dt(t) {
  return typeof t == "symbol" || Ct(t) && Bt(t) == zt;
}
var Ft = /\s/;
function Rt(t) {
  for (var a = t.length; a-- && Ft.test(t.charAt(a)); )
    ;
  return a;
}
var _t = /^\s+/;
function qt(t) {
  return t && t.slice(0, Rt(t) + 1).replace(_t, "");
}
function tt(t) {
  var a = typeof t;
  return t != null && (a == "object" || a == "function");
}
var st = NaN, Vt = /^[-+]0x[0-9a-f]+$/i, Gt = /^0b[01]+$/i, Xt = /^0o[0-7]+$/i, Ut = parseInt;
function lt(t) {
  if (typeof t == "number")
    return t;
  if (Dt(t))
    return st;
  if (tt(t)) {
    var a = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = tt(a) ? a + "" : a;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = qt(t);
  var o = Gt.test(t);
  return o || Xt.test(t) ? Ut(t.slice(2), o ? 2 : 8) : Vt.test(t) ? st : +t;
}
var Z = function() {
  return dt.Date.now();
}, Yt = "Expected a function", Jt = Math.max, Kt = Math.min;
function ct(t, a, o) {
  var l, v, r, d, i, w, h = 0, m = !1, g = !1, b = !0;
  if (typeof t != "function")
    throw new TypeError(Yt);
  a = lt(a) || 0, tt(o) && (m = !!o.leading, g = "maxWait" in o, r = g ? Jt(lt(o.maxWait) || 0, a) : r, b = "trailing" in o ? !!o.trailing : b);
  function H(s) {
    var y = l, u = v;
    return l = v = void 0, h = s, d = t.apply(u, y), d;
  }
  function W(s) {
    return h = s, i = setTimeout(T, a), m ? H(s) : d;
  }
  function A(s) {
    var y = s - w, u = s - h, k = a - y;
    return g ? Kt(k, r - u) : k;
  }
  function M(s) {
    var y = s - w, u = s - h;
    return w === void 0 || y >= a || y < 0 || g && u >= r;
  }
  function T() {
    var s = Z();
    if (M(s))
      return L(s);
    i = setTimeout(T, A(s));
  }
  function L(s) {
    return i = void 0, b && l ? H(s) : (l = v = void 0, d);
  }
  function $() {
    i !== void 0 && clearTimeout(i), h = 0, l = w = v = i = void 0;
  }
  function S() {
    return i === void 0 ? d : L(Z());
  }
  function p() {
    var s = Z(), y = M(s);
    if (l = arguments, v = this, w = s, y) {
      if (i === void 0)
        return W(w);
      if (g)
        return clearTimeout(i), i = setTimeout(T, a), H(w);
    }
    return i === void 0 && (i = setTimeout(T, a)), d;
  }
  return p.cancel = $, p.flush = S, p;
}
function ut(t) {
  const a = window.innerWidth, o = t.sizes;
  return a >= 1536 && o["2xl"] ? o["2xl"] : a >= 1280 && o.xl ? o.xl : a >= 1024 && o.lg ? o.lg : a >= 768 && o.md ? o.md : a >= 640 && o.sm ? o.sm : o.base;
}
function Qt(t) {
  return t.reduce((o, l) => Math.max(o, l.top + l.columnHeight), 0) + 500;
}
function Zt(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function te(t, a = 0) {
  return {
    style: Zt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": a
  };
}
function et(t, a) {
  const o = new Array(a).fill(0);
  for (let l = 0; l < t.length; l++) {
    const v = t[l], r = l % a;
    o[r] = Math.max(o[r], v.top + v.columnHeight);
  }
  return o;
}
function ee(t) {
  function a(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), h = parseInt(r.dataset.index || "0", 10), m = Math.min(h * 20, 160), g = r.style.getPropertyValue("--masonry-opacity-delay");
    r.style.setProperty("--masonry-opacity-delay", `${m}ms`), requestAnimationFrame(() => {
      r.style.opacity = "1", r.style.transform = `translate3d(${i}px, ${w}px, 0) scale(1)`;
      const b = () => {
        g ? r.style.setProperty("--masonry-opacity-delay", g) : r.style.removeProperty("--masonry-opacity-delay"), r.removeEventListener("transitionend", b), d();
      };
      r.addEventListener("transitionend", b);
    });
  }
  function o(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.opacity = "0", r.style.transform = `translate3d(${d}px, ${i + 10}px, 0) scale(0.985)`;
  }
  function l(r) {
    const d = parseInt(r.dataset.left || "0", 10), i = parseInt(r.dataset.top || "0", 10);
    r.style.transition = "none", r.style.opacity = "1", r.style.transform = `translate3d(${d}px, ${i}px, 0) scale(1)`, r.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      r.style.transition = "";
    });
  }
  function v(r, d) {
    const i = parseInt(r.dataset.left || "0", 10), w = parseInt(r.dataset.top || "0", 10), m = getComputedStyle(r).getPropertyValue("--masonry-leave-duration") || "", g = parseFloat(m), b = Number.isFinite(g) && g > 0 ? g : 200, H = r.style.transitionDuration, W = () => {
      r.removeEventListener("transitionend", A), clearTimeout(M), r.style.transitionDuration = H || "";
    }, A = (T) => {
      (!T || T.target === r) && (W(), d());
    }, M = setTimeout(() => {
      W(), d();
    }, b + 100);
    requestAnimationFrame(() => {
      r.style.transitionDuration = `${b}ms`, r.style.opacity = "0", r.style.transform = `translate3d(${i}px, ${w + 10}px, 0) scale(0.985)`, r.addEventListener("transitionend", A);
    });
  }
  return {
    onEnter: a,
    onBeforeEnter: o,
    onBeforeLeave: l,
    onLeave: v
  };
}
function ne({
  container: t,
  masonry: a,
  columns: o,
  containerHeight: l,
  isLoading: v,
  maxItems: r,
  pageSize: d,
  refreshLayout: i,
  setItemsRaw: w,
  loadNext: h,
  leaveEstimateMs: m
}) {
  let g = !1, b = 0;
  async function H() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: T } = t.value, L = M + T, $ = M > b + 1;
    b = M;
    const S = et(a.value, o.value), s = Math.max(...S) + 300 < L - 1, y = M + T >= l.value - 1;
    if ((s || y) && $ && !v.value && !g)
      try {
        a.value.length > r && await W(S), await h(), await X();
      } catch (u) {
        console.error("Error in scroll handler:", u);
      }
  }
  async function W(M) {
    if (!a.value.length || a.value.length <= d) return;
    const T = a.value.reduce((s, y) => {
      const u = y.page;
      return s[u] || (s[u] = []), s[u].push(y), s;
    }, {}), L = Object.keys(T).sort((s, y) => parseInt(s) - parseInt(y));
    if (L.length === 0) return;
    let $ = 0;
    const S = [];
    for (const s of L)
      if (S.push(s), $ += T[s].length, $ >= d) break;
    const p = a.value.filter((s) => !S.includes(String(s.page)));
    p.length !== a.value.length && (g = !0, w(p), await X(), await new Promise((s) => requestAnimationFrame(() => s())), i(p), await X(), await A(), g = !1);
  }
  async function A() {
    if (!t.value) return;
    const { scrollTop: M, clientHeight: T } = t.value, L = M + T * 0.4, $ = et(a.value, o.value), S = $.indexOf(Math.max(...$)), p = a.value.filter((u, k) => k % o.value === S);
    if (p.length === 0) return;
    let s = p[0];
    for (const u of p)
      u.top <= L && u.top >= s.top && (s = u);
    const y = Math.max(0, s.top - T * 0.4);
    Math.abs(y - M) > 4 && t.value.scrollTo({ top: y, behavior: "auto" });
  }
  return {
    handleScroll: H
  };
}
const ae = ["src"], re = ["onClick"], oe = /* @__PURE__ */ pt({
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
    const l = t, v = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, r = nt(() => {
      var e;
      return {
        ...v,
        ...l.layout,
        sizes: {
          ...v.sizes,
          ...((e = l.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), d = o, i = nt({
      get: () => l.items,
      set: (e) => d("update:items", e)
    }), w = B(7), h = B(null), m = B([]);
    B(null);
    const g = B(!1), b = B(0), H = B({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), W = () => {
      if (!h.value) return;
      const { scrollTop: e, clientHeight: n } = h.value, c = e + n, f = et(i.value, w.value), P = Math.max(...f) + 300, I = Math.max(0, P - c), F = I <= 100;
      H.value = {
        distanceToTrigger: Math.round(I),
        isNearTrigger: F
      };
    }, { onEnter: A, onBeforeEnter: M, onBeforeLeave: T, onLeave: L } = ee(), { handleScroll: $ } = ne({
      container: h,
      masonry: i,
      columns: w,
      containerHeight: b,
      isLoading: g,
      maxItems: l.maxItems,
      pageSize: l.pageSize,
      refreshLayout: p,
      setItemsRaw: (e) => {
        i.value = e;
      },
      loadNext: E,
      leaveEstimateMs: l.leaveDurationMs
    });
    a({
      isLoading: g,
      refreshLayout: p,
      containerHeight: b,
      remove: N,
      removeMany: R,
      loadNext: E,
      loadPage: k,
      reset: D,
      init: U,
      paginationHistory: m
    });
    function S(e) {
      const n = Qt(e);
      let c = 0;
      if (h.value) {
        const { scrollTop: f, clientHeight: x } = h.value;
        c = f + x + 100;
      }
      b.value = Math.max(n, c);
    }
    function p(e) {
      if (!h.value) return;
      const n = kt(e, h.value, w.value, r.value);
      S(n), i.value = n;
    }
    function s(e, n) {
      return new Promise((c) => {
        const f = Math.max(0, e | 0), x = Date.now();
        n(f, f);
        const P = setInterval(() => {
          const I = Date.now() - x, F = Math.max(0, f - I);
          n(F, f), F <= 0 && (clearInterval(P), c());
        }, 100);
      });
    }
    async function y(e) {
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
          const x = await e();
          return n > 0 && d("retry:stop", { attempt: n, success: !0 }), x;
        } catch (x) {
          if (n++, n > c)
            throw d("retry:stop", { attempt: n - 1, success: !1 }), x;
          d("retry:start", { attempt: n, max: c, totalMs: f }), await s(f, (P, I) => {
            d("retry:tick", { attempt: n, remainingMs: P, totalMs: I });
          }), f += l.retryBackoffStepMs;
        }
    }
    async function k(e) {
      if (!g.value) {
        g.value = !0;
        try {
          const n = i.value.length, c = await y(e);
          return m.value.push(c.nextPage), await z(n), c;
        } catch (n) {
          throw console.error("Error loading page:", n), n;
        } finally {
          g.value = !1;
        }
      }
    }
    async function E() {
      if (!g.value) {
        g.value = !0;
        try {
          const e = i.value.length, n = m.value[m.value.length - 1], c = await y(n);
          return m.value.push(c.nextPage), await z(e), c;
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function N(e) {
      const n = i.value.filter((c) => c.id !== e.id);
      i.value = n, await X(), await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
        p(n);
      });
    }
    async function R(e) {
      if (!e || e.length === 0) return;
      const n = new Set(e.map((f) => f.id)), c = i.value.filter((f) => !n.has(f.id));
      i.value = c, await X(), await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        p(c);
      });
    }
    function _() {
      w.value = ut(r.value), p(i.value);
    }
    let O = !1;
    async function z(e) {
      if (!l.backfillEnabled || O) return;
      const n = (e || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || m.value[m.value.length - 1] == null) && !(i.value.length >= n)) {
        O = !0;
        try {
          let f = 0;
          for (d("backfill:start", { target: n, fetched: i.value.length, calls: f }); i.value.length < n && f < l.backfillMaxCalls && m.value[m.value.length - 1] != null; ) {
            await s(l.backfillDelayMs, (P, I) => {
              d("backfill:tick", {
                fetched: i.value.length,
                target: n,
                calls: f,
                remainingMs: P,
                totalMs: I
              });
            });
            const x = m.value[m.value.length - 1];
            try {
              g.value = !0;
              const P = await y(x);
              m.value.push(P.nextPage);
            } finally {
              g.value = !1;
            }
            f++;
          }
          d("backfill:stop", { fetched: i.value.length, calls: f });
        } finally {
          O = !1;
        }
      }
    }
    function D() {
      h.value && h.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), i.value = [], b.value = 0, m.value = [l.loadAtPage], H.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const j = ct(() => {
      $(), W();
    }, 200), q = ct(_, 200);
    function U(e, n, c) {
      m.value = [n], m.value.push(c), p([...i.value, ...e]), W();
    }
    return mt(async () => {
      var e;
      try {
        w.value = ut(r.value);
        const n = l.loadAtPage;
        m.value = [n], l.skipInitialLoad || await k(m.value[0]), W();
      } catch (n) {
        console.error("Error during component initialization:", n), g.value = !1;
      }
      (e = h.value) == null || e.addEventListener("scroll", j, { passive: !0 }), window.addEventListener("resize", q);
    }), ht(() => {
      var e;
      (e = h.value) == null || e.removeEventListener("scroll", j), window.removeEventListener("resize", q);
    }), (e, n) => (J(), Y("div", {
      class: at(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
      ref_key: "container",
      ref: h
    }, [
      C("div", {
        class: "relative",
        style: yt({ height: `${b.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
      }, [
        vt(xt, {
          name: "masonry",
          css: !1,
          onEnter: V(A),
          onBeforeEnter: V(M),
          onLeave: V(L),
          onBeforeLeave: V(T)
        }, {
          default: wt(() => [
            (J(!0), Y(Tt, null, Mt(i.value, (c, f) => (J(), Y("div", rt({
              key: `${c.page}-${c.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, V(te)(c, f)), [
              St(e.$slots, "item", rt({ ref_for: !0 }, { item: c, remove: N }), () => [
                C("img", {
                  src: c.src,
                  class: "w-full"
                }, null, 8, ae),
                C("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (x) => N(c)
                }, n[0] || (n[0] = [
                  C("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, re)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"]),
        b.value > 0 ? (J(), Y("div", {
          key: 0,
          class: at(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !H.value.isNearTrigger, "opacity-100": H.value.isNearTrigger }])
        }, [
          C("span", null, ot(i.value.length) + " items", 1),
          n[1] || (n[1] = C("span", { class: "mx-2" }, "|", -1)),
          C("span", null, ot(H.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : bt("", !0)
      ], 4)
    ], 2));
  }
}), ie = (t, a) => {
  const o = t.__vccOpts || t;
  for (const [l, v] of a)
    o[l] = v;
  return o;
}, ft = /* @__PURE__ */ ie(oe, [["__scopeId", "data-v-305bfd32"]]), le = {
  install(t) {
    t.component("WyxosMasonry", ft), t.component("WMasonry", ft);
  }
};
export {
  ft as Masonry,
  le as default
};
