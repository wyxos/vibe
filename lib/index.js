import { nextTick as X, ref as W, computed as K, defineComponent as _e, onMounted as Xe, onUnmounted as Ge, watch as ee, createElementBlock as q, openBlock as Y, createCommentVNode as te, createElementVNode as U, normalizeStyle as he, renderSlot as J, normalizeClass as re, withModifiers as Ae, toDisplayString as Pe, unref as G, Fragment as Re, renderList as Oe, createVNode as Se, withCtx as ve, mergeProps as fe, TransitionGroup as It } from "vue";
let ke = null;
function Lt() {
  if (ke != null) return ke;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const n = document.createElement("div");
  n.style.width = "100%", e.appendChild(n);
  const i = e.offsetWidth - n.offsetWidth;
  return document.body.removeChild(e), ke = i, i;
}
function Ce(e, n, i, a = {}) {
  const {
    gutterX: m = 0,
    gutterY: d = 0,
    header: f = 0,
    footer: o = 0,
    paddingLeft: c = 0,
    paddingRight: y = 0,
    sizes: t = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: w = "masonry"
  } = a;
  let T = 0, p = 0;
  try {
    if (n && n.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const k = window.getComputedStyle(n);
      T = parseFloat(k.paddingLeft) || 0, p = parseFloat(k.paddingRight) || 0;
    }
  } catch {
  }
  const h = (c || 0) + T, I = (y || 0) + p, S = n.offsetWidth - n.clientWidth, v = S > 0 ? S + 2 : Lt() + 2, r = n.offsetWidth - v - h - I, s = m * (i - 1), L = Math.floor((r - s) / i), M = e.map((k) => {
    const N = k.width, A = k.height;
    return Math.round(L * A / N) + o + f;
  });
  if (w === "sequential-balanced") {
    const k = M.length;
    if (k === 0) return [];
    const N = (b, H, R) => b + (H > 0 ? d : 0) + R;
    let A = Math.max(...M), P = M.reduce((b, H) => b + H, 0) + d * Math.max(0, k - 1);
    const z = (b) => {
      let H = 1, R = 0, ne = 0;
      for (let _ = 0; _ < k; _++) {
        const ie = M[_], Q = N(R, ne, ie);
        if (Q <= b)
          R = Q, ne++;
        else if (H++, R = ie, ne = 1, ie > b || H > i) return !1;
      }
      return H <= i;
    };
    for (; A < P; ) {
      const b = Math.floor((A + P) / 2);
      z(b) ? P = b : A = b + 1;
    }
    const F = P, l = new Array(i).fill(0);
    let x = i - 1, E = 0, D = 0;
    for (let b = k - 1; b >= 0; b--) {
      const H = M[b], R = b < x;
      !(N(E, D, H) <= F) || R ? (l[x] = b + 1, x--, E = H, D = 1) : (E = N(E, D, H), D++);
    }
    l[0] = 0;
    const V = [], C = new Array(i).fill(0);
    for (let b = 0; b < i; b++) {
      const H = l[b], R = b + 1 < i ? l[b + 1] : k, ne = b * (L + m);
      for (let _ = H; _ < R; _++) {
        const Q = {
          ...e[_],
          columnWidth: L,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Q.imageHeight = M[_] - (o + f), Q.columnHeight = M[_], Q.left = ne, Q.top = C[b], C[b] += Q.columnHeight + (_ + 1 < R ? d : 0), V.push(Q);
      }
    }
    return V;
  }
  const g = new Array(i).fill(0), $ = [];
  for (let k = 0; k < e.length; k++) {
    const N = e[k], A = {
      ...N,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, P = g.indexOf(Math.min(...g)), z = N.width, F = N.height;
    A.columnWidth = L, A.left = P * (L + m), A.imageHeight = Math.round(L * F / z), A.columnHeight = A.imageHeight + o + f, A.top = g[P], g[P] += A.columnHeight + d, $.push(A);
  }
  return $;
}
var St = typeof global == "object" && global && global.Object === Object && global, kt = typeof self == "object" && self && self.Object === Object && self, Je = St || kt || Function("return this")(), we = Je.Symbol, Ke = Object.prototype, Et = Ke.hasOwnProperty, Pt = Ke.toString, de = we ? we.toStringTag : void 0;
function Ht(e) {
  var n = Et.call(e, de), i = e[de];
  try {
    e[de] = void 0;
    var a = !0;
  } catch {
  }
  var m = Pt.call(e);
  return a && (n ? e[de] = i : delete e[de]), m;
}
var $t = Object.prototype, Ft = $t.toString;
function zt(e) {
  return Ft.call(e);
}
var Dt = "[object Null]", Bt = "[object Undefined]", Ve = we ? we.toStringTag : void 0;
function Nt(e) {
  return e == null ? e === void 0 ? Bt : Dt : Ve && Ve in Object(e) ? Ht(e) : zt(e);
}
function Wt(e) {
  return e != null && typeof e == "object";
}
var At = "[object Symbol]";
function Rt(e) {
  return typeof e == "symbol" || Wt(e) && Nt(e) == At;
}
var Ot = /\s/;
function Ct(e) {
  for (var n = e.length; n-- && Ot.test(e.charAt(n)); )
    ;
  return n;
}
var Vt = /^\s+/;
function jt(e) {
  return e && e.slice(0, Ct(e) + 1).replace(Vt, "");
}
function He(e) {
  var n = typeof e;
  return e != null && (n == "object" || n == "function");
}
var je = NaN, qt = /^[-+]0x[0-9a-f]+$/i, Yt = /^0b[01]+$/i, Ut = /^0o[0-7]+$/i, _t = parseInt;
function qe(e) {
  if (typeof e == "number")
    return e;
  if (Rt(e))
    return je;
  if (He(e)) {
    var n = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = He(n) ? n + "" : n;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var i = Yt.test(e);
  return i || Ut.test(e) ? _t(e.slice(2), i ? 2 : 8) : qt.test(e) ? je : +e;
}
var Ee = function() {
  return Je.Date.now();
}, Xt = "Expected a function", Gt = Math.max, Jt = Math.min;
function Ye(e, n, i) {
  var a, m, d, f, o, c, y = 0, t = !1, w = !1, T = !0;
  if (typeof e != "function")
    throw new TypeError(Xt);
  n = qe(n) || 0, He(i) && (t = !!i.leading, w = "maxWait" in i, d = w ? Gt(qe(i.maxWait) || 0, n) : d, T = "trailing" in i ? !!i.trailing : T);
  function p(g) {
    var $ = a, k = m;
    return a = m = void 0, y = g, f = e.apply(k, $), f;
  }
  function h(g) {
    return y = g, o = setTimeout(v, n), t ? p(g) : f;
  }
  function I(g) {
    var $ = g - c, k = g - y, N = n - $;
    return w ? Jt(N, d - k) : N;
  }
  function S(g) {
    var $ = g - c, k = g - y;
    return c === void 0 || $ >= n || $ < 0 || w && k >= d;
  }
  function v() {
    var g = Ee();
    if (S(g))
      return r(g);
    o = setTimeout(v, I(g));
  }
  function r(g) {
    return o = void 0, T && a ? p(g) : (a = m = void 0, f);
  }
  function s() {
    o !== void 0 && clearTimeout(o), y = 0, a = c = m = o = void 0;
  }
  function L() {
    return o === void 0 ? f : r(Ee());
  }
  function M() {
    var g = Ee(), $ = S(g);
    if (a = arguments, m = this, c = g, $) {
      if (o === void 0)
        return h(c);
      if (w)
        return clearTimeout(o), o = setTimeout(v, n), p(c);
    }
    return o === void 0 && (o = setTimeout(v, n)), f;
  }
  return M.cancel = s, M.flush = L, M;
}
function se(e, n) {
  const i = n ?? (typeof window < "u" ? window.innerWidth : 1024), a = e.sizes;
  return i >= 1536 && a["2xl"] ? a["2xl"] : i >= 1280 && a.xl ? a.xl : i >= 1024 && a.lg ? a.lg : i >= 768 && a.md ? a.md : i >= 640 && a.sm ? a.sm : a.base;
}
function Kt(e) {
  const n = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return n >= 1536 ? "2xl" : n >= 1280 ? "xl" : n >= 1024 ? "lg" : n >= 768 ? "md" : n >= 640 ? "sm" : "base";
}
function Qt(e) {
  return e.reduce((i, a) => Math.max(i, a.top + a.columnHeight), 0) + 500;
}
function Zt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function ea(e, n = 0) {
  return {
    style: Zt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": n
  };
}
function $e(e, n) {
  if (!e.length || n <= 0)
    return new Array(Math.max(1, n)).fill(0);
  const a = Array.from(new Set(e.map((f) => f.left))).sort((f, o) => f - o).slice(0, n), m = /* @__PURE__ */ new Map();
  for (let f = 0; f < a.length; f++) m.set(a[f], f);
  const d = new Array(a.length).fill(0);
  for (const f of e) {
    const o = m.get(f.left);
    o != null && (d[o] = Math.max(d[o], f.top + f.columnHeight));
  }
  for (; d.length < n; ) d.push(0);
  return d;
}
function ta(e, n) {
  let i = 0, a = 0;
  const m = 1e3;
  function d(t, w) {
    var h;
    const T = (h = e.container) == null ? void 0 : h.value;
    if (T) {
      const I = T.scrollTop, S = T.clientHeight;
      i = I - m, a = I + S + m;
    }
    return t + w >= i && t <= a;
  }
  function f(t, w) {
    var r;
    const T = parseInt(t.dataset.left || "0", 10), p = parseInt(t.dataset.top || "0", 10), h = parseInt(t.dataset.index || "0", 10), I = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((r = n == null ? void 0 : n.virtualizing) != null && r.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${p}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "", w();
      });
      return;
    }
    if (!d(p, I)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${p}px, 0) scale(1)`, t.style.transition = "none", w();
      return;
    }
    const S = Math.min(h * 20, 160), v = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${S}ms`), requestAnimationFrame(() => {
      t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${p}px, 0) scale(1)`;
      const s = () => {
        v ? t.style.setProperty("--masonry-opacity-delay", v) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", s), w();
      };
      t.addEventListener("transitionend", s);
    });
  }
  function o(t) {
    var p;
    const w = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10);
    if ((p = n == null ? void 0 : n.virtualizing) != null && p.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${w}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${w}px, ${T + 10}px, 0) scale(0.985)`;
  }
  function c(t) {
    var h;
    const w = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10), p = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((h = n == null ? void 0 : n.virtualizing) != null && h.value)) {
      if (!d(T, p)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${w}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "";
      });
    }
  }
  function y(t, w) {
    var M;
    const T = parseInt(t.dataset.left || "0", 10), p = parseInt(t.dataset.top || "0", 10), h = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((M = n == null ? void 0 : n.virtualizing) != null && M.value) {
      w();
      return;
    }
    if (!d(p, h)) {
      t.style.transition = "none", t.style.opacity = "0", w();
      return;
    }
    const I = typeof (n == null ? void 0 : n.leaveDurationMs) == "number" ? n.leaveDurationMs : Number.NaN;
    let S = Number.isFinite(I) && I > 0 ? I : Number.NaN;
    if (!Number.isFinite(S)) {
      const $ = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", k = parseFloat($);
      S = Number.isFinite(k) && k > 0 ? k : 200;
    }
    const v = t.style.transitionDuration, r = () => {
      t.removeEventListener("transitionend", s), clearTimeout(L), t.style.transitionDuration = v || "";
    }, s = (g) => {
      (!g || g.target === t) && (r(), w());
    }, L = setTimeout(() => {
      r(), w();
    }, S + 100);
    requestAnimationFrame(() => {
      t.style.transitionDuration = `${S}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${T}px, ${p + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", s);
    });
  }
  return {
    onEnter: f,
    onBeforeEnter: o,
    onBeforeLeave: c,
    onLeave: y
  };
}
function aa({
  container: e,
  masonry: n,
  columns: i,
  containerHeight: a,
  isLoading: m,
  pageSize: d,
  refreshLayout: f,
  setItemsRaw: o,
  loadNext: c,
  loadThresholdPx: y
}) {
  let t = 0;
  async function w(T, p = !1) {
    if (!e.value) return;
    const h = T ?? $e(n.value, i.value), I = h.length ? Math.max(...h) : 0, S = e.value.scrollTop + e.value.clientHeight, v = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const r = typeof y == "number" ? y : 200, s = r >= 0 ? Math.max(0, I - r) : Math.max(0, I + r);
    if (S >= s && (v || p) && !m.value) {
      await c(), await X();
      return;
    }
  }
  return {
    handleScroll: w
  };
}
function na(e) {
  const { useSwipeMode: n, masonry: i, isLoading: a, loadNext: m, loadPage: d, paginationHistory: f } = e, o = W(0), c = W(0), y = W(!1), t = W(0), w = W(0), T = W(null), p = K(() => {
    if (!n.value || i.value.length === 0) return null;
    const P = Math.max(0, Math.min(o.value, i.value.length - 1));
    return i.value[P] || null;
  }), h = K(() => {
    if (!n.value || !p.value) return null;
    const P = o.value + 1;
    return P >= i.value.length ? null : i.value[P] || null;
  }), I = K(() => {
    if (!n.value || !p.value) return null;
    const P = o.value - 1;
    return P < 0 ? null : i.value[P] || null;
  });
  function S() {
    if (!T.value) return;
    const P = T.value.clientHeight;
    c.value = -o.value * P;
  }
  function v() {
    if (!h.value) {
      m();
      return;
    }
    o.value++, S(), o.value >= i.value.length - 5 && m();
  }
  function r() {
    I.value && (o.value--, S());
  }
  function s(P) {
    n.value && (y.value = !0, t.value = P.touches[0].clientY, w.value = c.value, P.preventDefault());
  }
  function L(P) {
    if (!n.value || !y.value) return;
    const z = P.touches[0].clientY - t.value;
    c.value = w.value + z, P.preventDefault();
  }
  function M(P) {
    if (!n.value || !y.value) return;
    y.value = !1;
    const z = c.value - w.value;
    Math.abs(z) > 100 ? z > 0 && I.value ? r() : z < 0 && h.value ? v() : S() : S(), P.preventDefault();
  }
  function g(P) {
    n.value && (y.value = !0, t.value = P.clientY, w.value = c.value, P.preventDefault());
  }
  function $(P) {
    if (!n.value || !y.value) return;
    const z = P.clientY - t.value;
    c.value = w.value + z, P.preventDefault();
  }
  function k(P) {
    if (!n.value || !y.value) return;
    y.value = !1;
    const z = c.value - w.value;
    Math.abs(z) > 100 ? z > 0 && I.value ? r() : z < 0 && h.value ? v() : S() : S(), P.preventDefault();
  }
  function N() {
    !n.value && o.value > 0 && (o.value = 0, c.value = 0), n.value && i.value.length === 0 && !a.value && d(f.value[0]), n.value && S();
  }
  function A() {
    o.value = 0, c.value = 0, y.value = !1;
  }
  return {
    // State
    currentSwipeIndex: o,
    swipeOffset: c,
    isDragging: y,
    swipeContainer: T,
    // Computed
    currentItem: p,
    nextItem: h,
    previousItem: I,
    // Functions
    handleTouchStart: s,
    handleTouchMove: L,
    handleTouchEnd: M,
    handleMouseDown: g,
    handleMouseMove: $,
    handleMouseUp: k,
    goToNextItem: v,
    goToPreviousItem: r,
    snapToCurrentItem: S,
    handleWindowResize: N,
    reset: A
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function la(e) {
  const {
    getPage: n,
    context: i,
    masonry: a,
    isLoading: m,
    hasReachedEnd: d,
    loadError: f,
    currentPage: o,
    paginationHistory: c,
    refreshLayout: y,
    retryMaxAttempts: t,
    retryInitialDelayMs: w,
    retryBackoffStepMs: T,
    mode: p,
    backfillDelayMs: h,
    backfillMaxCalls: I,
    pageSize: S,
    emits: v
  } = e, r = W(!1);
  let s = !1;
  function L(F) {
    return a.value.filter((l) => l.page === F).length;
  }
  function M(F, l) {
    return new Promise((x) => {
      const E = Math.max(0, F | 0), D = Date.now();
      l(E, E);
      const V = setInterval(() => {
        if (r.value) {
          clearInterval(V), x();
          return;
        }
        const C = Date.now() - D, b = Math.max(0, E - C);
        l(b, E), b <= 0 && (clearInterval(V), x());
      }, 100);
    });
  }
  async function g(F) {
    let l = 0;
    const x = t;
    let E = w;
    for (; ; )
      try {
        const D = await F();
        return l > 0 && v("retry:stop", { attempt: l, success: !0 }), D;
      } catch (D) {
        if (l++, l > x)
          throw v("retry:stop", { attempt: l - 1, success: !1 }), D;
        v("retry:start", { attempt: l, max: x, totalMs: E }), await M(E, (V, C) => {
          v("retry:tick", { attempt: l, remainingMs: V, totalMs: C });
        }), E += T;
      }
  }
  async function $(F) {
    try {
      const l = await g(() => n(F, i == null ? void 0 : i.value));
      return y([...a.value, ...l.items]), l;
    } catch (l) {
      throw l;
    }
  }
  async function k(F, l = !1) {
    if (!l && p !== "backfill" || s || r.value || d.value) return;
    const x = (F || 0) + (S || 0);
    if (!S || S <= 0) return;
    if (c.value[c.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(a.value.length >= x)) {
      s = !0, m.value || (m.value = !0, v("loading:start"));
      try {
        let D = 0;
        for (v("backfill:start", { target: x, fetched: a.value.length, calls: D }); a.value.length < x && D < I && c.value[c.value.length - 1] != null && !r.value && !d.value && s && (await M(h, (C, b) => {
          v("backfill:tick", {
            fetched: a.value.length,
            target: x,
            calls: D,
            remainingMs: C,
            totalMs: b
          });
        }), !(r.value || !s)); ) {
          const V = c.value[c.value.length - 1];
          if (V == null) {
            d.value = !0;
            break;
          }
          try {
            if (r.value || !s) break;
            const C = await $(V);
            if (r.value || !s) break;
            f.value = null, c.value.push(C.nextPage), C.nextPage == null && (d.value = !0);
          } catch (C) {
            if (r.value || !s) break;
            f.value = me(C);
          }
          D++;
        }
        v("backfill:stop", { fetched: a.value.length, calls: D });
      } finally {
        s = !1, m.value = !1, v("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function N(F) {
    if (!m.value) {
      r.value = !1, m.value || (m.value = !0, v("loading:start")), d.value = !1, f.value = null;
      try {
        const l = a.value.length;
        if (r.value) return;
        const x = await $(F);
        return r.value ? void 0 : (f.value = null, o.value = F, c.value.push(x.nextPage), x.nextPage == null && (d.value = !0), await k(l), x);
      } catch (l) {
        throw f.value = me(l), l;
      } finally {
        m.value = !1;
      }
    }
  }
  async function A() {
    if (!m.value && !d.value) {
      r.value = !1, m.value || (m.value = !0, v("loading:start")), f.value = null;
      try {
        const F = a.value.length;
        if (r.value) return;
        if (p === "refresh" && o.value != null && L(o.value) < S) {
          const D = await g(() => n(o.value, i == null ? void 0 : i.value));
          if (r.value) return;
          const V = [...a.value], C = D.items.filter((H) => !H || H.id == null || H.page == null ? !1 : !V.some((R) => R && R.id === H.id && R.page === H.page));
          if (C.length > 0) {
            const H = [...a.value, ...C];
            y(H), await new Promise((R) => setTimeout(R, 0));
          }
          if (f.value = null, C.length === 0) {
            const H = c.value[c.value.length - 1];
            if (H == null) {
              d.value = !0;
              return;
            }
            const R = await $(H);
            return r.value ? void 0 : (f.value = null, o.value = H, c.value.push(R.nextPage), R.nextPage == null && (d.value = !0), await k(F), R);
          }
          if (L(o.value) >= S) {
            const H = c.value[c.value.length - 1];
            if (H == null) {
              d.value = !0;
              return;
            }
            const R = await $(H);
            return r.value ? void 0 : (f.value = null, o.value = H, c.value.push(R.nextPage), R.nextPage == null && (d.value = !0), await k(F), R);
          } else
            return D;
        }
        const l = c.value[c.value.length - 1];
        if (l == null) {
          d.value = !0;
          return;
        }
        const x = await $(l);
        return r.value ? void 0 : (f.value = null, o.value = l, c.value.push(x.nextPage), x.nextPage == null && (d.value = !0), await k(F), x);
      } catch (F) {
        throw f.value = me(F), F;
      } finally {
        m.value = !1, v("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function P() {
    if (!m.value) {
      r.value = !1, m.value = !0, v("loading:start");
      try {
        const F = o.value;
        if (F == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", o.value, "paginationHistory:", c.value);
          return;
        }
        a.value = [], d.value = !1, f.value = null, c.value = [F];
        const l = await $(F);
        if (r.value) return;
        f.value = null, o.value = F, c.value.push(l.nextPage), l.nextPage == null && (d.value = !0);
        const x = a.value.length;
        return await k(x), l;
      } catch (F) {
        throw f.value = me(F), F;
      } finally {
        m.value = !1, v("loading:stop", { fetched: a.value.length });
      }
    }
  }
  function z() {
    const F = s;
    r.value = !0, m.value = !1, s = !1, F && v("backfill:stop", { fetched: a.value.length, calls: 0, cancelled: !0 }), v("loading:stop", { fetched: a.value.length });
  }
  return {
    loadPage: N,
    loadNext: A,
    refreshCurrentPage: P,
    cancelLoad: z,
    maybeBackfillToTarget: k,
    getContent: $
  };
}
function oa(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    refreshLayout: a,
    loadNext: m,
    maybeBackfillToTarget: d,
    paginationHistory: f
  } = e;
  let o = /* @__PURE__ */ new Set(), c = null, y = !1;
  async function t() {
    if (o.size === 0 || y) return;
    y = !0;
    const v = Array.from(o);
    o.clear(), c = null, await T(v), y = !1;
  }
  async function w(v) {
    o.add(v), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16);
  }
  async function T(v) {
    if (!v || v.length === 0) return;
    const r = new Set(v.map((L) => L.id)), s = n.value.filter((L) => !r.has(L.id));
    if (n.value = s, await X(), s.length === 0 && f.value.length > 0) {
      try {
        await m(), await d(0, !0);
      } catch {
      }
      return;
    }
    await new Promise((L) => requestAnimationFrame(() => L())), requestAnimationFrame(() => {
      a(s);
    });
  }
  async function p(v) {
    !v || v.length === 0 || (v.forEach((r) => o.add(r)), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16));
  }
  async function h(v, r) {
    if (!v) return;
    const s = n.value;
    if (s.findIndex(($) => $.id === v.id) !== -1) return;
    const M = [...s], g = Math.min(r, M.length);
    M.splice(g, 0, v), n.value = M, await X(), i.value || (await new Promise(($) => requestAnimationFrame(() => $())), requestAnimationFrame(() => {
      a(M);
    }));
  }
  async function I(v, r) {
    var P;
    if (!v || v.length === 0) return;
    if (!r || r.length !== v.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const s = n.value, L = new Set(s.map((z) => z.id)), M = [];
    for (let z = 0; z < v.length; z++)
      L.has((P = v[z]) == null ? void 0 : P.id) || M.push({ item: v[z], index: r[z] });
    if (M.length === 0) return;
    const g = /* @__PURE__ */ new Map();
    for (const { item: z, index: F } of M)
      g.set(F, z);
    const $ = M.length > 0 ? Math.max(...M.map(({ index: z }) => z)) : -1, k = Math.max(s.length - 1, $), N = [];
    let A = 0;
    for (let z = 0; z <= k; z++)
      g.has(z) ? N.push(g.get(z)) : A < s.length && (N.push(s[A]), A++);
    for (; A < s.length; )
      N.push(s[A]), A++;
    n.value = N, await X(), i.value || (await new Promise((z) => requestAnimationFrame(() => z())), requestAnimationFrame(() => {
      a(N);
    }));
  }
  async function S() {
    n.value = [];
  }
  return {
    remove: w,
    removeMany: p,
    restore: h,
    restoreMany: I,
    removeAll: S
  };
}
function ra(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    container: a,
    columns: m,
    containerWidth: d,
    masonryContentHeight: f,
    layout: o,
    fixedDimensions: c,
    checkItemDimensions: y
  } = e;
  let t = [];
  function w(I) {
    const S = Qt(I);
    let v = 0;
    if (a.value) {
      const { scrollTop: r, clientHeight: s } = a.value;
      v = r + s + 100;
    }
    f.value = Math.max(S, v);
  }
  function T(I) {
    var s, L;
    if (i.value) {
      n.value = I;
      return;
    }
    if (n.value = I, !a.value) return;
    if (y(I, "refreshLayout"), I.length > 1e3 && t.length > I.length && t.length - I.length < 100) {
      let M = !0;
      for (let g = 0; g < I.length; g++)
        if (((s = I[g]) == null ? void 0 : s.id) !== ((L = t[g]) == null ? void 0 : L.id)) {
          M = !1;
          break;
        }
      if (M) {
        const g = I.map(($, k) => ({
          ...t[k],
          originalIndex: k
        }));
        w(g), n.value = g, t = g;
        return;
      }
    }
    const v = I.map((M, g) => ({
      ...M,
      originalIndex: g
    })), r = a.value;
    if (c.value && c.value.width !== void 0) {
      const M = r.style.width, g = r.style.boxSizing;
      r.style.boxSizing = "border-box", r.style.width = `${c.value.width}px`, r.offsetWidth;
      const $ = Ce(v, r, m.value, o.value);
      r.style.width = M, r.style.boxSizing = g, w($), n.value = $, t = $;
    } else {
      const M = Ce(v, r, m.value, o.value);
      w(M), n.value = M, t = M;
    }
  }
  function p(I, S) {
    c.value = I, I && (I.width !== void 0 && (d.value = I.width), !i.value && a.value && n.value.length > 0 && X(() => {
      m.value = se(o.value, d.value), T(n.value), S && S();
    }));
  }
  function h() {
    m.value = se(o.value, d.value), T(n.value);
  }
  return {
    refreshLayout: T,
    setFixedDimensions: p,
    onResize: h,
    calculateHeight: w
  };
}
function ia(e) {
  const {
    masonry: n,
    container: i,
    columns: a,
    virtualBufferPx: m,
    loadThresholdPx: d
  } = e, f = W(e.handleScroll), o = W(0), c = W(0), y = m, t = W(!1), w = W({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), T = K(() => {
    const S = o.value - y, v = o.value + c.value + y, r = n.value;
    return !r || r.length === 0 ? [] : r.filter((L) => {
      if (typeof L.top != "number" || typeof L.columnHeight != "number")
        return !0;
      const M = L.top;
      return L.top + L.columnHeight >= S && M <= v;
    });
  });
  function p(S) {
    if (!i.value) return;
    const { scrollTop: v, clientHeight: r } = i.value, s = v + r, L = S ?? $e(n.value, a.value), M = L.length ? Math.max(...L) : 0, g = typeof d == "number" ? d : 200, $ = g >= 0 ? Math.max(0, M - g) : Math.max(0, M + g), k = Math.max(0, $ - s), N = k <= 100;
    w.value = {
      distanceToTrigger: Math.round(k),
      isNearTrigger: N
    };
  }
  async function h() {
    if (i.value) {
      const v = i.value.scrollTop, r = i.value.clientHeight || window.innerHeight, s = r > 0 ? r : window.innerHeight;
      o.value = v, c.value = s;
    }
    t.value = !0, await X(), await new Promise((v) => requestAnimationFrame(() => v())), t.value = !1;
    const S = $e(n.value, a.value);
    f.value(S), p(S);
  }
  function I() {
    o.value = 0, c.value = 0, t.value = !1, w.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: o,
    viewportHeight: c,
    virtualizing: t,
    scrollProgress: w,
    visibleMasonry: T,
    updateScrollProgress: p,
    updateViewport: h,
    reset: I,
    handleScroll: f
  };
}
function sa(e) {
  const { masonry: n } = e, i = W(/* @__PURE__ */ new Set());
  function a(f) {
    return typeof f == "number" && f > 0 && Number.isFinite(f);
  }
  function m(f, o) {
    try {
      if (!Array.isArray(f) || f.length === 0) return;
      const c = f.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
      if (c.length === 0) return;
      const y = [];
      for (const t of c) {
        const w = (t == null ? void 0 : t.id) ?? `idx:${n.value.indexOf(t)}`;
        i.value.has(w) || (i.value.add(w), y.push(w));
      }
      if (y.length > 0) {
        const t = y.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: o,
            count: y.length,
            sampleIds: t,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function d() {
    i.value.clear();
  }
  return {
    checkItemDimensions: m,
    invalidDimensionIds: i,
    reset: d
  };
}
const ua = { class: "flex-1 relative min-h-0" }, ca = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, va = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, fa = {
  key: 1,
  class: "relative w-full h-full"
}, da = ["src"], ma = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ga = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, pa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ _e({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 },
    headerHeight: { default: 0 },
    footerHeight: { default: 0 },
    isActive: { type: Boolean, default: !1 },
    inSwipeMode: { type: Boolean, default: !1 },
    preloadThreshold: { default: 1 }
  },
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave", "in-view", "in-view-and-loaded"],
  setup(e, { emit: n }) {
    const i = e, a = n, m = W(!1), d = W(!1), f = W(null), o = W(!1), c = W(!1), y = W(null), t = W(!1), w = W(!1), T = W(!1), p = W(!1), h = W(!1), I = W(null), S = W(null);
    let v = null;
    const r = K(() => {
      var l;
      return i.type ?? ((l = i.item) == null ? void 0 : l.type) ?? "image";
    }), s = K(() => {
      var l;
      return i.notFound ?? ((l = i.item) == null ? void 0 : l.notFound) ?? !1;
    }), L = K(() => !!i.inSwipeMode);
    function M(l, x) {
      const E = l === "image" ? m.value : o.value;
      w.value && E && !T.value && (T.value = !0, a("in-view-and-loaded", { item: i.item, type: l, src: x }));
    }
    function g(l) {
      a("mouse-enter", { item: i.item, type: l });
    }
    function $(l) {
      a("mouse-leave", { item: i.item, type: l });
    }
    function k(l) {
      if (L.value) return;
      const x = l.target;
      x && (x.paused ? x.play() : x.pause());
    }
    function N(l) {
      const x = l.target;
      x && (L.value || x.play(), g("video"));
    }
    function A(l) {
      const x = l.target;
      x && (L.value || x.pause(), $("video"));
    }
    function P(l) {
      return new Promise((x, E) => {
        if (!l) {
          const b = new Error("No image source provided");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), E(b);
          return;
        }
        const D = new Image(), V = Date.now(), C = 300;
        D.onload = () => {
          const b = Date.now() - V, H = Math.max(0, C - b);
          setTimeout(async () => {
            m.value = !0, d.value = !1, p.value = !1, await X(), await new Promise((R) => setTimeout(R, 100)), h.value = !0, a("preload:success", { item: i.item, type: "image", src: l }), M("image", l), x();
          }, H);
        }, D.onerror = () => {
          d.value = !0, m.value = !1, p.value = !1;
          const b = new Error("Failed to load image");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), E(b);
        }, D.src = l;
      });
    }
    function z(l) {
      return new Promise((x, E) => {
        if (!l) {
          const b = new Error("No video source provided");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), E(b);
          return;
        }
        const D = document.createElement("video"), V = Date.now(), C = 300;
        D.preload = "metadata", D.muted = !0, D.onloadedmetadata = () => {
          const b = Date.now() - V, H = Math.max(0, C - b);
          setTimeout(async () => {
            o.value = !0, c.value = !1, p.value = !1, await X(), await new Promise((R) => setTimeout(R, 100)), h.value = !0, a("preload:success", { item: i.item, type: "video", src: l }), M("video", l), x();
          }, H);
        }, D.onerror = () => {
          c.value = !0, o.value = !1, p.value = !1;
          const b = new Error("Failed to load video");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), E(b);
        }, D.src = l;
      });
    }
    async function F() {
      var x;
      if (!t.value || p.value || s.value || r.value === "video" && o.value || r.value === "image" && m.value)
        return;
      const l = (x = i.item) == null ? void 0 : x.src;
      if (l)
        if (p.value = !0, h.value = !1, r.value === "video") {
          y.value = l, o.value = !1, c.value = !1;
          try {
            await z(l);
          } catch {
          }
        } else {
          f.value = l, m.value = !1, d.value = !1;
          try {
            await P(l);
          } catch {
          }
        }
    }
    return Xe(async () => {
      if (!I.value) return;
      const l = [i.preloadThreshold, 1].filter((E, D, V) => V.indexOf(E) === D).sort((E, D) => E - D);
      v = new IntersectionObserver(
        (E) => {
          E.forEach((D) => {
            const V = D.intersectionRatio, C = V >= 1, b = V >= i.preloadThreshold;
            if (C && !w.value) {
              w.value = !0, a("in-view", { item: i.item, type: r.value });
              const H = r.value === "image" ? f.value : y.value, R = r.value === "image" ? m.value : o.value;
              H && R && M(r.value, H);
            }
            b && !t.value ? (t.value = !0, F()) : D.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: l
        }
      ), v.observe(I.value), await X(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          x();
        });
      }), setTimeout(() => {
        x();
      }, 100);
      function x() {
        if (!I.value || w.value) return;
        const E = I.value.getBoundingClientRect(), D = window.innerHeight, V = window.innerWidth;
        if (E.top >= 0 && E.bottom <= D && E.left >= 0 && E.right <= V && E.height > 0 && E.width > 0) {
          w.value = !0, a("in-view", { item: i.item, type: r.value });
          const b = r.value === "image" ? f.value : y.value, H = r.value === "image" ? m.value : o.value;
          b && H && M(r.value, b);
        }
      }
    }), Ge(() => {
      v && (v.disconnect(), v = null);
    }), ee(
      () => {
        var l;
        return (l = i.item) == null ? void 0 : l.src;
      },
      async (l) => {
        if (!(!l || s.value)) {
          if (r.value === "video") {
            if (l !== y.value && (o.value = !1, c.value = !1, y.value = l, t.value)) {
              p.value = !0;
              try {
                await z(l);
              } catch {
              }
            }
          } else if (l !== f.value && (m.value = !1, d.value = !1, f.value = l, t.value)) {
            p.value = !0;
            try {
              await P(l);
            } catch {
            }
          }
        }
      }
    ), ee(
      () => i.isActive,
      (l) => {
        !L.value || !S.value || (l ? S.value.play() : S.value.pause());
      }
    ), (l, x) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: I,
      class: "relative w-full h-full flex flex-col"
    }, [
      l.headerHeight > 0 ? (Y(), q("div", {
        key: 0,
        class: "relative z-10",
        style: he({ height: `${l.headerHeight}px` })
      }, [
        J(l.$slots, "header", {
          item: l.item,
          remove: l.remove,
          imageLoaded: m.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: p.value,
          mediaType: r.value,
          isFullyInView: w.value
        })
      ], 4)) : te("", !0),
      U("div", ua, [
        J(l.$slots, "default", {
          item: l.item,
          remove: l.remove,
          imageLoaded: m.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: p.value,
          mediaType: r.value,
          imageSrc: f.value,
          videoSrc: y.value,
          showMedia: h.value,
          isFullyInView: w.value
        }, () => [
          U("div", ca, [
            s.value ? (Y(), q("div", va, x[3] || (x[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", fa, [
              r.value === "image" && f.value ? (Y(), q("img", {
                key: 0,
                src: f.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  m.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: x[0] || (x[0] = (E) => g("image")),
                onMouseleave: x[1] || (x[1] = (E) => $("image"))
              }, null, 42, da)) : te("", !0),
              r.value === "video" && y.value ? (Y(), q("video", {
                key: 1,
                ref_key: "videoEl",
                ref: S,
                src: y.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  o.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: L.value && i.isActive,
                controls: L.value,
                onClick: Ae(k, ["stop"]),
                onTouchend: Ae(k, ["stop", "prevent"]),
                onMouseenter: N,
                onMouseleave: A,
                onError: x[2] || (x[2] = (E) => c.value = !0)
              }, null, 42, ma)) : te("", !0),
              !m.value && !o.value && !d.value && !c.value ? (Y(), q("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  h.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", ha, [
                  J(l.$slots, "placeholder-icon", { mediaType: r.value }, () => [
                    U("i", {
                      class: re(r.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : te("", !0),
              p.value ? (Y(), q("div", ga, x[4] || (x[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : te("", !0),
              r.value === "image" && d.value || r.value === "video" && c.value ? (Y(), q("div", pa, [
                U("i", {
                  class: re(r.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + Pe(r.value), 1)
              ])) : te("", !0)
            ]))
          ])
        ])
      ]),
      l.footerHeight > 0 ? (Y(), q("div", {
        key: 1,
        class: "relative z-10",
        style: he({ height: `${l.footerHeight}px` })
      }, [
        J(l.$slots, "footer", {
          item: l.item,
          remove: l.remove,
          imageLoaded: m.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: p.value,
          mediaType: r.value,
          isFullyInView: w.value
        })
      ], 4)) : te("", !0)
    ], 512));
  }
}), ya = {
  key: 0,
  class: "w-full h-full flex items-center justify-center"
}, wa = { class: "w-full h-full flex items-center justify-center p-4" }, xa = { class: "w-full h-full max-w-full max-h-full relative" }, ba = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ma = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ta = { class: "text-red-500 dark:text-red-400" }, Ia = {
  key: 0,
  class: "w-full py-8 text-center"
}, La = {
  key: 1,
  class: "w-full py-8 text-center"
}, Sa = { class: "text-red-500 dark:text-red-400" }, ka = /* @__PURE__ */ _e({
  __name: "Masonry",
  props: {
    getPage: {
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
    // Opaque caller-owned context passed through to getPage(page, context).
    // Useful for including filters, service selection, tabId, etc.
    context: {
      type: Object,
      default: null
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
    init: {
      type: String,
      default: "manual",
      validator: (e) => ["auto", "manual"].includes(e)
    },
    pageSize: {
      type: Number,
      default: 40
    },
    // Backfill configuration
    mode: {
      type: String,
      default: "backfill",
      validator: (e) => ["backfill", "none", "refresh"].includes(e)
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
    // Layout mode: 'auto' (detect from screen size), 'masonry', or 'swipe'
    layoutMode: {
      type: String,
      default: "auto",
      validator: (e) => ["auto", "masonry", "swipe"].includes(e)
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
    "loading:start",
    "backfill:start",
    "backfill:tick",
    "backfill:stop",
    "retry:start",
    "retry:tick",
    "retry:stop",
    "loading:stop",
    "remove-all:complete",
    // Re-emit item-level preload events from the default MasonryItem
    "item:preload:success",
    "item:preload:error",
    // Mouse events from MasonryItem content
    "item:mouse-enter",
    "item:mouse-leave",
    "update:context"
  ],
  setup(e, { expose: n, emit: i }) {
    const a = e, m = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, d = K(() => {
      var u;
      return {
        ...m,
        ...a.layout,
        sizes: {
          ...m.sizes,
          ...((u = a.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), f = W(null), o = W(typeof window < "u" ? window.innerWidth : 1024), c = W(typeof window < "u" ? window.innerHeight : 768), y = W(null);
    let t = null;
    function w(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const T = K(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const u = typeof a.mobileBreakpoint == "string" ? w(a.mobileBreakpoint) : a.mobileBreakpoint;
      return o.value < u;
    }), p = i, h = K({
      get: () => a.items,
      set: (u) => p("update:items", u)
    }), I = K({
      get: () => a.context,
      set: (u) => p("update:context", u)
    });
    function S(u) {
      I.value = u;
    }
    const v = K(() => {
      const u = h.value;
      return (u == null ? void 0 : u.length) ?? 0;
    }), r = W(7), s = W(null), L = W([]), M = W(null), g = W(!1), $ = W(0), k = W(!1), N = W(null), A = W(!1), P = K(() => Kt(o.value)), z = sa({
      masonry: h
    }), { checkItemDimensions: F, reset: l } = z, x = ra({
      masonry: h,
      useSwipeMode: T,
      container: s,
      columns: r,
      containerWidth: o,
      masonryContentHeight: $,
      layout: d,
      fixedDimensions: y,
      checkItemDimensions: F
    }), { refreshLayout: E, setFixedDimensions: D, onResize: V } = x, C = ia({
      masonry: h,
      container: s,
      columns: r,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: b, viewportHeight: H, virtualizing: R, visibleMasonry: ne, updateScrollProgress: _, updateViewport: ie, reset: Q } = C, { onEnter: Qe, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = ta(
      { container: s },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: R }
    ), at = Qe, nt = Ze, lt = et, ot = tt, rt = la({
      getPage: a.getPage,
      context: I,
      masonry: h,
      isLoading: g,
      hasReachedEnd: k,
      loadError: N,
      currentPage: M,
      paginationHistory: L,
      refreshLayout: E,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: a.mode,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: p
    }), { loadPage: be, loadNext: ge, refreshCurrentPage: it, cancelLoad: Me, maybeBackfillToTarget: st } = rt, Z = na({
      useSwipeMode: T,
      masonry: h,
      isLoading: g,
      loadNext: ge,
      loadPage: be,
      paginationHistory: L
    }), { handleScroll: ut } = aa({
      container: s,
      masonry: h,
      columns: r,
      containerHeight: $,
      isLoading: g,
      pageSize: a.pageSize,
      refreshLayout: E,
      setItemsRaw: (u) => {
        h.value = u;
      },
      loadNext: ge,
      loadThresholdPx: a.loadThresholdPx
    });
    C.handleScroll.value = ut;
    const ct = oa({
      masonry: h,
      useSwipeMode: T,
      refreshLayout: E,
      loadNext: ge,
      maybeBackfillToTarget: st,
      paginationHistory: L
    }), { remove: ue, removeMany: vt, restore: ft, restoreMany: dt, removeAll: mt } = ct;
    function ht(u) {
      D(u, _), !u && f.value && (o.value = f.value.clientWidth, c.value = f.value.clientHeight);
    }
    n({
      // Cancels any ongoing load operations (page loads, backfills, etc.)
      cancelLoad: Me,
      // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
      context: I,
      // Container height (wrapper element) in pixels
      containerHeight: c,
      // Container width (wrapper element) in pixels
      containerWidth: o,
      // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
      currentBreakpoint: P,
      // Current page number or cursor being displayed
      currentPage: M,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Mt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: k,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: Tt,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: A,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: g,
      // Error object if the last load operation failed, null otherwise
      loadError: N,
      // Loads the next page of items asynchronously
      loadNext: ge,
      // Loads a specific page number or cursor asynchronously
      loadPage: be,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: L,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: it,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: E,
      // Removes a single item from the masonry
      remove: ue,
      // Removes all items from the masonry
      removeAll: mt,
      // Removes multiple items from the masonry in a single operation
      removeMany: vt,
      // Resets the component to initial state (clears items, resets pagination, scrolls to top)
      reset: bt,
      // Restores a single item at its original index (useful for undo operations)
      restore: ft,
      // Restores multiple items at their original indices (useful for undo operations)
      restoreMany: dt,
      // Scrolls the container to a specific position
      scrollTo: wt,
      // Scrolls the container to the top
      scrollToTop: yt,
      // Sets the opaque caller context (alternative to v-model:context)
      setContext: S,
      // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
      setFixedDimensions: ht,
      // Computed property returning the total number of items currently in the masonry
      totalItems: K(() => h.value.length)
    });
    const ce = Z.currentSwipeIndex, pe = Z.swipeOffset, ye = Z.isDragging, le = Z.swipeContainer, Fe = Z.handleTouchStart, ze = Z.handleTouchMove, De = Z.handleTouchEnd, Be = Z.handleMouseDown, Te = Z.handleMouseMove, Ie = Z.handleMouseUp, Le = Z.snapToCurrentItem;
    function gt(u) {
      const B = v.value, j = typeof u == "string" ? parseInt(u, 10) : u;
      return B > 0 ? `${j * (100 / B)}%` : "0%";
    }
    function pt() {
      const u = v.value;
      return u > 0 ? `${100 / u}%` : "0%";
    }
    function yt(u) {
      s.value && s.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function wt(u) {
      s.value && (s.value.scrollTo({
        top: u.top ?? s.value.scrollTop,
        left: u.left ?? s.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), s.value && (b.value = s.value.scrollTop, H.value = s.value.clientHeight || window.innerHeight));
    }
    function xt() {
      V(), s.value && (b.value = s.value.scrollTop, H.value = s.value.clientHeight);
    }
    function bt() {
      Me(), s.value && s.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), h.value = [], c.value = 0, M.value = a.loadAtPage, L.value = [a.loadAtPage], k.value = !1, N.value = null, A.value = !1, Q();
    }
    function Mt() {
      Me(), h.value = [], $.value = 0, M.value = null, L.value = [], k.value = !1, N.value = null, g.value = !1, A.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, Q(), l(), s.value && s.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ye(async () => {
      T.value || await ie();
    }, 200), Ne = Ye(xt, 200);
    function We() {
      Z.handleWindowResize();
    }
    function Tt(u, B, j) {
      M.value = B, L.value = [B], j != null && L.value.push(j), k.value = j === null, F(u, "initialize");
      const ae = h.value, O = ae.length === 0 ? u : [...ae, ...u];
      h.value = O, T.value ? ce.value === 0 && h.value.length > 0 && (pe.value = 0) : (E(O), s.value && (b.value = s.value.scrollTop, H.value = s.value.clientHeight || window.innerHeight), X(() => {
        s.value && (b.value = s.value.scrollTop, H.value = s.value.clientHeight || window.innerHeight, _());
      })), u && u.length > 0 && (A.value = !0);
    }
    return ee(
      d,
      () => {
        T.value || s.value && (r.value = se(d.value, o.value), E(h.value));
      },
      { deep: !0 }
    ), ee(() => a.layoutMode, () => {
      y.value && y.value.width !== void 0 ? o.value = y.value.width : f.value && (o.value = f.value.clientWidth);
    }), ee(s, (u) => {
      u && !T.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 }), ee(
      () => h.value.length,
      (u, B) => {
        a.init === "manual" && !A.value && u > 0 && B === 0 && (A.value = !0);
      },
      { immediate: !1 }
    ), ee(T, (u, B) => {
      B === void 0 && u === !1 || X(() => {
        u ? (document.addEventListener("mousemove", Te), document.addEventListener("mouseup", Ie), s.value && s.value.removeEventListener("scroll", oe), ce.value = 0, pe.value = 0, h.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie), s.value && f.value && (y.value && y.value.width !== void 0 ? o.value = y.value.width : o.value = f.value.clientWidth, s.value.removeEventListener("scroll", oe), s.value.addEventListener("scroll", oe, { passive: !0 }), h.value.length > 0 && (r.value = se(d.value, o.value), E(h.value), b.value = s.value.scrollTop, H.value = s.value.clientHeight, _())));
      });
    }, { immediate: !0 }), ee(le, (u) => {
      u && (u.addEventListener("touchstart", Fe, { passive: !1 }), u.addEventListener("touchmove", ze, { passive: !1 }), u.addEventListener("touchend", De), u.addEventListener("mousedown", Be));
    }), ee(() => h.value.length, (u, B) => {
      T.value && u > 0 && B === 0 && (ce.value = 0, X(() => Le()));
    }), ee(f, (u) => {
      t && (t.disconnect(), t = null), u && typeof ResizeObserver < "u" ? (t = new ResizeObserver((B) => {
        if (!y.value)
          for (const j of B) {
            const ae = j.contentRect.width, O = j.contentRect.height;
            o.value !== ae && (o.value = ae), c.value !== O && (c.value = O);
          }
      }), t.observe(u), y.value || (o.value = u.clientWidth, c.value = u.clientHeight)) : u && (y.value || (o.value = u.clientWidth, c.value = u.clientHeight));
    }, { immediate: !0 }), ee(o, (u, B) => {
      u !== B && u > 0 && !T.value && s.value && h.value.length > 0 && X(() => {
        r.value = se(d.value, u), E(h.value), _();
      });
    }), Xe(async () => {
      try {
        await X(), f.value && !t && (o.value = f.value.clientWidth, c.value = f.value.clientHeight), T.value || (r.value = se(d.value, o.value), s.value && (b.value = s.value.scrollTop, H.value = s.value.clientHeight));
        const u = a.loadAtPage;
        if (L.value = [u], a.init === "auto") {
          A.value = !0, await X();
          try {
            await be(u);
          } catch {
          }
        }
        T.value ? X(() => Le()) : _();
      } catch (u) {
        N.value || (console.error("Error during component initialization:", u), N.value = me(u)), g.value = !1;
      }
      window.addEventListener("resize", Ne), window.addEventListener("resize", We);
    }), Ge(() => {
      var u;
      t && (t.disconnect(), t = null), (u = s.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ne), window.removeEventListener("resize", We), le.value && (le.value.removeEventListener("touchstart", Fe), le.value.removeEventListener("touchmove", ze), le.value.removeEventListener("touchend", De), le.value.removeEventListener("mousedown", Be)), document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie);
    }), (u, B) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: f,
      class: "w-full h-full flex flex-col relative"
    }, [
      A.value ? T.value ? (Y(), q("div", {
        key: 1,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !G(ye), "cursor-grabbing": G(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        U("div", {
          class: "relative w-full",
          style: he({
            transform: `translateY(${G(pe)}px)`,
            transition: G(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${v.value * 100}%`
          })
        }, [
          (Y(!0), q(Re, null, Oe(h.value, (j, ae) => (Y(), q("div", {
            key: `${j.page}-${j.id}`,
            class: "absolute top-0 left-0 w-full",
            style: he({
              top: gt(ae),
              height: pt()
            })
          }, [
            U("div", wa, [
              U("div", xa, [
                J(u.$slots, "default", {
                  item: j,
                  remove: G(ue),
                  index: j.originalIndex ?? h.value.indexOf(j)
                }, () => [
                  Se(xe, {
                    item: j,
                    remove: G(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": ae === G(ce),
                    "onPreload:success": B[0] || (B[0] = (O) => p("item:preload:success", O)),
                    "onPreload:error": B[1] || (B[1] = (O) => p("item:preload:error", O)),
                    onMouseEnter: B[2] || (B[2] = (O) => p("item:mouse-enter", O)),
                    onMouseLeave: B[3] || (B[3] = (O) => p("item:mouse-leave", O))
                  }, {
                    header: ve((O) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: ve((O) => [
                      J(u.$slots, "item-footer", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        k.value && h.value.length > 0 ? (Y(), q("div", ba, [
          J(u.$slots, "end-message", {}, () => [
            B[9] || (B[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        N.value && h.value.length > 0 ? (Y(), q("div", Ma, [
          J(u.$slots, "error-message", { error: N.value }, () => [
            U("p", Ta, "Failed to load content: " + Pe(N.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (Y(), q("div", {
        key: 2,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: s
      }, [
        U("div", {
          class: "relative",
          style: he({ height: `${$.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          Se(It, {
            name: "masonry",
            css: !1,
            onEnter: G(at),
            onBeforeEnter: G(nt),
            onLeave: G(ot),
            onBeforeLeave: G(lt)
          }, {
            default: ve(() => [
              (Y(!0), q(Re, null, Oe(G(ne), (j, ae) => (Y(), q("div", fe({
                key: `${j.page}-${j.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, G(ea)(j, ae)), [
                J(u.$slots, "default", {
                  item: j,
                  remove: G(ue),
                  index: j.originalIndex ?? h.value.indexOf(j)
                }, () => [
                  Se(xe, {
                    item: j,
                    remove: G(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": B[4] || (B[4] = (O) => p("item:preload:success", O)),
                    "onPreload:error": B[5] || (B[5] = (O) => p("item:preload:error", O)),
                    onMouseEnter: B[6] || (B[6] = (O) => p("item:mouse-enter", O)),
                    onMouseLeave: B[7] || (B[7] = (O) => p("item:mouse-leave", O))
                  }, {
                    header: ve((O) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: ve((O) => [
                      J(u.$slots, "item-footer", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        k.value && h.value.length > 0 ? (Y(), q("div", Ia, [
          J(u.$slots, "end-message", {}, () => [
            B[10] || (B[10] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        N.value && h.value.length > 0 ? (Y(), q("div", La, [
          J(u.$slots, "error-message", { error: N.value }, () => [
            U("p", Sa, "Failed to load content: " + Pe(N.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (Y(), q("div", ya, [
        J(u.$slots, "loading-message", {}, () => [
          B[8] || (B[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ea = (e, n) => {
  const i = e.__vccOpts || e;
  for (const [a, m] of n)
    i[a] = m;
  return i;
}, Ue = /* @__PURE__ */ Ea(ka, [["__scopeId", "data-v-ce75570c"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ue), e.component("WMasonry", Ue), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  Ue as Masonry,
  xe as MasonryItem,
  Ha as default
};
