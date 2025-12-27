import { nextTick as O, ref as F, computed as K, defineComponent as Xe, onMounted as Ge, onUnmounted as qe, watch as ee, createElementBlock as U, openBlock as _, createCommentVNode as te, createElementVNode as X, normalizeStyle as me, renderSlot as J, normalizeClass as re, withModifiers as Re, toDisplayString as Pe, unref as q, Fragment as Oe, renderList as Ce, createVNode as Se, withCtx as ve, mergeProps as fe, TransitionGroup as It } from "vue";
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
function Ae(e, n, i, a = {}) {
  const {
    gutterX: h = 0,
    gutterY: d = 0,
    header: v = 0,
    footer: o = 0,
    paddingLeft: c = 0,
    paddingRight: w = 0,
    sizes: t = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: x = "masonry"
  } = a;
  let T = 0, y = 0;
  try {
    if (n && n.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const S = window.getComputedStyle(n);
      T = parseFloat(S.paddingLeft) || 0, y = parseFloat(S.paddingRight) || 0;
    }
  } catch {
  }
  const m = (c || 0) + T, I = (w || 0) + y, L = n.offsetWidth - n.clientWidth, f = L > 0 ? L + 2 : Lt() + 2, r = n.offsetWidth - f - m - I, s = h * (i - 1), k = Math.floor((r - s) / i), M = e.map((S) => {
    const N = S.width, R = S.height;
    return Math.round(k * R / N) + o + v;
  });
  if (x === "sequential-balanced") {
    const S = M.length;
    if (S === 0) return [];
    const N = (b, P, C) => b + (P > 0 ? d : 0) + C;
    let R = Math.max(...M), H = M.reduce((b, P) => b + P, 0) + d * Math.max(0, S - 1);
    const W = (b) => {
      let P = 1, C = 0, ne = 0;
      for (let G = 0; G < S; G++) {
        const ie = M[G], Q = N(C, ne, ie);
        if (Q <= b)
          C = Q, ne++;
        else if (P++, C = ie, ne = 1, ie > b || P > i) return !1;
      }
      return P <= i;
    };
    for (; R < H; ) {
      const b = Math.floor((R + H) / 2);
      W(b) ? H = b : R = b + 1;
    }
    const z = H, l = new Array(i).fill(0);
    let p = i - 1, E = 0, D = 0;
    for (let b = S - 1; b >= 0; b--) {
      const P = M[b], C = b < p;
      !(N(E, D, P) <= z) || C ? (l[p] = b + 1, p--, E = P, D = 1) : (E = N(E, D, P), D++);
    }
    l[0] = 0;
    const j = [], V = new Array(i).fill(0);
    for (let b = 0; b < i; b++) {
      const P = l[b], C = b + 1 < i ? l[b + 1] : S, ne = b * (k + h);
      for (let G = P; G < C; G++) {
        const Q = {
          ...e[G],
          columnWidth: k,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Q.imageHeight = M[G] - (o + v), Q.columnHeight = M[G], Q.left = ne, Q.top = V[b], V[b] += Q.columnHeight + (G + 1 < C ? d : 0), j.push(Q);
      }
    }
    return j;
  }
  const g = new Array(i).fill(0), $ = [];
  for (let S = 0; S < e.length; S++) {
    const N = e[S], R = {
      ...N,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, H = g.indexOf(Math.min(...g)), W = N.width, z = N.height;
    R.columnWidth = k, R.left = H * (k + h), R.imageHeight = Math.round(k * z / W), R.columnHeight = R.imageHeight + o + v, R.top = g[H], g[H] += R.columnHeight + d, $.push(R);
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
  var h = Pt.call(e);
  return a && (n ? e[de] = i : delete e[de]), h;
}
var $t = Object.prototype, zt = $t.toString;
function Dt(e) {
  return zt.call(e);
}
var Bt = "[object Null]", Nt = "[object Undefined]", Ve = we ? we.toStringTag : void 0;
function Wt(e) {
  return e == null ? e === void 0 ? Nt : Bt : Ve && Ve in Object(e) ? Ht(e) : Dt(e);
}
function Ft(e) {
  return e != null && typeof e == "object";
}
var Rt = "[object Symbol]";
function Ot(e) {
  return typeof e == "symbol" || Ft(e) && Wt(e) == Rt;
}
var Ct = /\s/;
function At(e) {
  for (var n = e.length; n-- && Ct.test(e.charAt(n)); )
    ;
  return n;
}
var Vt = /^\s+/;
function jt(e) {
  return e && e.slice(0, At(e) + 1).replace(Vt, "");
}
function He(e) {
  var n = typeof e;
  return e != null && (n == "object" || n == "function");
}
var je = NaN, Yt = /^[-+]0x[0-9a-f]+$/i, Ut = /^0b[01]+$/i, _t = /^0o[0-7]+$/i, Xt = parseInt;
function Ye(e) {
  if (typeof e == "number")
    return e;
  if (Ot(e))
    return je;
  if (He(e)) {
    var n = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = He(n) ? n + "" : n;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var i = Ut.test(e);
  return i || _t.test(e) ? Xt(e.slice(2), i ? 2 : 8) : Yt.test(e) ? je : +e;
}
var Ee = function() {
  return Je.Date.now();
}, Gt = "Expected a function", qt = Math.max, Jt = Math.min;
function Ue(e, n, i) {
  var a, h, d, v, o, c, w = 0, t = !1, x = !1, T = !0;
  if (typeof e != "function")
    throw new TypeError(Gt);
  n = Ye(n) || 0, He(i) && (t = !!i.leading, x = "maxWait" in i, d = x ? qt(Ye(i.maxWait) || 0, n) : d, T = "trailing" in i ? !!i.trailing : T);
  function y(g) {
    var $ = a, S = h;
    return a = h = void 0, w = g, v = e.apply(S, $), v;
  }
  function m(g) {
    return w = g, o = setTimeout(f, n), t ? y(g) : v;
  }
  function I(g) {
    var $ = g - c, S = g - w, N = n - $;
    return x ? Jt(N, d - S) : N;
  }
  function L(g) {
    var $ = g - c, S = g - w;
    return c === void 0 || $ >= n || $ < 0 || x && S >= d;
  }
  function f() {
    var g = Ee();
    if (L(g))
      return r(g);
    o = setTimeout(f, I(g));
  }
  function r(g) {
    return o = void 0, T && a ? y(g) : (a = h = void 0, v);
  }
  function s() {
    o !== void 0 && clearTimeout(o), w = 0, a = c = h = o = void 0;
  }
  function k() {
    return o === void 0 ? v : r(Ee());
  }
  function M() {
    var g = Ee(), $ = L(g);
    if (a = arguments, h = this, c = g, $) {
      if (o === void 0)
        return m(c);
      if (x)
        return clearTimeout(o), o = setTimeout(f, n), y(c);
    }
    return o === void 0 && (o = setTimeout(f, n)), v;
  }
  return M.cancel = s, M.flush = k, M;
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
  const a = Array.from(new Set(e.map((v) => v.left))).sort((v, o) => v - o).slice(0, n), h = /* @__PURE__ */ new Map();
  for (let v = 0; v < a.length; v++) h.set(a[v], v);
  const d = new Array(a.length).fill(0);
  for (const v of e) {
    const o = h.get(v.left);
    o != null && (d[o] = Math.max(d[o], v.top + v.columnHeight));
  }
  for (; d.length < n; ) d.push(0);
  return d;
}
function ta(e, n) {
  let i = 0, a = 0;
  const h = 1e3;
  function d(t, x) {
    var m;
    const T = (m = e.container) == null ? void 0 : m.value;
    if (T) {
      const I = T.scrollTop, L = T.clientHeight;
      i = I - h, a = I + L + h;
    }
    return t + x >= i && t <= a;
  }
  function v(t, x) {
    var s;
    const T = parseInt(t.dataset.left || "0", 10), y = parseInt(t.dataset.top || "0", 10), m = parseInt(t.dataset.index || "0", 10), I = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((s = n == null ? void 0 : n.virtualizing) != null && s.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "", x();
      return;
    }
    if (!d(y, I)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`, t.style.transition = "none", x();
      return;
    }
    const L = Math.min(m * 20, 160), f = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${L}ms`), t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`;
    const r = () => {
      f ? t.style.setProperty("--masonry-opacity-delay", f) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", r), x();
    };
    t.addEventListener("transitionend", r);
  }
  function o(t) {
    var y;
    const x = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10);
    if ((y = n == null ? void 0 : n.virtualizing) != null && y.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${x}px, ${T + 10}px, 0) scale(0.985)`;
  }
  function c(t) {
    var m;
    const x = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10), y = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((m = n == null ? void 0 : n.virtualizing) != null && m.value)) {
      if (!d(T, y)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "";
    }
  }
  function w(t, x) {
    var M;
    const T = parseInt(t.dataset.left || "0", 10), y = parseInt(t.dataset.top || "0", 10), m = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((M = n == null ? void 0 : n.virtualizing) != null && M.value) {
      x();
      return;
    }
    if (!d(y, m)) {
      t.style.transition = "none", t.style.opacity = "0", x();
      return;
    }
    const I = typeof (n == null ? void 0 : n.leaveDurationMs) == "number" ? n.leaveDurationMs : Number.NaN;
    let L = Number.isFinite(I) && I > 0 ? I : Number.NaN;
    if (!Number.isFinite(L)) {
      const $ = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", S = parseFloat($);
      L = Number.isFinite(S) && S > 0 ? S : 200;
    }
    const f = t.style.transitionDuration, r = () => {
      t.removeEventListener("transitionend", s), clearTimeout(k), t.style.transitionDuration = f || "";
    }, s = (g) => {
      (!g || g.target === t) && (r(), x());
    }, k = setTimeout(() => {
      r(), x();
    }, L + 100);
    t.style.transitionDuration = `${L}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${T}px, ${y + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", s);
  }
  return {
    onEnter: v,
    onBeforeEnter: o,
    onBeforeLeave: c,
    onLeave: w
  };
}
function aa({
  container: e,
  masonry: n,
  columns: i,
  containerHeight: a,
  isLoading: h,
  pageSize: d,
  refreshLayout: v,
  setItemsRaw: o,
  loadNext: c,
  loadThresholdPx: w
}) {
  let t = 0;
  async function x(T, y = !1) {
    if (!e.value) return;
    const m = T ?? $e(n.value, i.value), I = m.length ? Math.max(...m) : 0, L = e.value.scrollTop + e.value.clientHeight, f = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const r = typeof w == "number" ? w : 200, s = r >= 0 ? Math.max(0, I - r) : Math.max(0, I + r);
    if (L >= s && (f || y) && !h.value) {
      await c(), await O();
      return;
    }
  }
  return {
    handleScroll: x
  };
}
function na(e) {
  const { useSwipeMode: n, masonry: i, isLoading: a, loadNext: h, loadPage: d, paginationHistory: v } = e, o = F(0), c = F(0), w = F(!1), t = F(0), x = F(0), T = F(null), y = K(() => {
    if (!n.value || i.value.length === 0) return null;
    const H = Math.max(0, Math.min(o.value, i.value.length - 1));
    return i.value[H] || null;
  }), m = K(() => {
    if (!n.value || !y.value) return null;
    const H = o.value + 1;
    return H >= i.value.length ? null : i.value[H] || null;
  }), I = K(() => {
    if (!n.value || !y.value) return null;
    const H = o.value - 1;
    return H < 0 ? null : i.value[H] || null;
  });
  function L() {
    if (!T.value) return;
    const H = T.value.clientHeight;
    c.value = -o.value * H;
  }
  function f() {
    if (!m.value) {
      h();
      return;
    }
    o.value++, L(), o.value >= i.value.length - 5 && h();
  }
  function r() {
    I.value && (o.value--, L());
  }
  function s(H) {
    n.value && (w.value = !0, t.value = H.touches[0].clientY, x.value = c.value, H.preventDefault());
  }
  function k(H) {
    if (!n.value || !w.value) return;
    const W = H.touches[0].clientY - t.value;
    c.value = x.value + W, H.preventDefault();
  }
  function M(H) {
    if (!n.value || !w.value) return;
    w.value = !1;
    const W = c.value - x.value;
    Math.abs(W) > 100 ? W > 0 && I.value ? r() : W < 0 && m.value ? f() : L() : L(), H.preventDefault();
  }
  function g(H) {
    n.value && (w.value = !0, t.value = H.clientY, x.value = c.value, H.preventDefault());
  }
  function $(H) {
    if (!n.value || !w.value) return;
    const W = H.clientY - t.value;
    c.value = x.value + W, H.preventDefault();
  }
  function S(H) {
    if (!n.value || !w.value) return;
    w.value = !1;
    const W = c.value - x.value;
    Math.abs(W) > 100 ? W > 0 && I.value ? r() : W < 0 && m.value ? f() : L() : L(), H.preventDefault();
  }
  function N() {
    !n.value && o.value > 0 && (o.value = 0, c.value = 0), n.value && i.value.length === 0 && !a.value && d(v.value[0]), n.value && L();
  }
  function R() {
    o.value = 0, c.value = 0, w.value = !1;
  }
  return {
    // State
    currentSwipeIndex: o,
    swipeOffset: c,
    isDragging: w,
    swipeContainer: T,
    // Computed
    currentItem: y,
    nextItem: m,
    previousItem: I,
    // Functions
    handleTouchStart: s,
    handleTouchMove: k,
    handleTouchEnd: M,
    handleMouseDown: g,
    handleMouseMove: $,
    handleMouseUp: S,
    goToNextItem: f,
    goToPreviousItem: r,
    snapToCurrentItem: L,
    handleWindowResize: N,
    reset: R
  };
}
function he(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function la(e) {
  const {
    getPage: n,
    context: i,
    masonry: a,
    isLoading: h,
    hasReachedEnd: d,
    loadError: v,
    currentPage: o,
    paginationHistory: c,
    refreshLayout: w,
    retryMaxAttempts: t,
    retryInitialDelayMs: x,
    retryBackoffStepMs: T,
    mode: y,
    backfillDelayMs: m,
    backfillMaxCalls: I,
    pageSize: L,
    emits: f
  } = e, r = F(!1);
  let s = !1;
  function k(z) {
    return a.value.filter((l) => l.page === z).length;
  }
  function M(z, l) {
    return new Promise((p) => {
      const E = Math.max(0, z | 0), D = Date.now();
      l(E, E);
      const j = setInterval(() => {
        if (r.value) {
          clearInterval(j), p();
          return;
        }
        const V = Date.now() - D, b = Math.max(0, E - V);
        l(b, E), b <= 0 && (clearInterval(j), p());
      }, 100);
    });
  }
  async function g(z) {
    let l = 0;
    const p = t;
    let E = x;
    for (; ; )
      try {
        const D = await z();
        return l > 0 && f("retry:stop", { attempt: l, success: !0 }), D;
      } catch (D) {
        if (l++, l > p)
          throw f("retry:stop", { attempt: l - 1, success: !1 }), D;
        f("retry:start", { attempt: l, max: p, totalMs: E }), await M(E, (j, V) => {
          f("retry:tick", { attempt: l, remainingMs: j, totalMs: V });
        }), E += T;
      }
  }
  async function $(z) {
    try {
      const l = await g(() => n(z, i == null ? void 0 : i.value)), p = [...a.value, ...l.items];
      return a.value = p, await O(), await O(), await O(), w(p), l;
    } catch (l) {
      throw l;
    }
  }
  async function S(z, l = !1) {
    if (!l && y !== "backfill" || s || r.value || d.value) return;
    const p = (z || 0) + (L || 0);
    if (!L || L <= 0) return;
    if (c.value[c.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(a.value.length >= p)) {
      s = !0, h.value || (h.value = !0, f("loading:start"));
      try {
        let D = 0;
        for (f("backfill:start", { target: p, fetched: a.value.length, calls: D }); a.value.length < p && D < I && c.value[c.value.length - 1] != null && !r.value && !d.value && s && (await M(m, (V, b) => {
          f("backfill:tick", {
            fetched: a.value.length,
            target: p,
            calls: D,
            remainingMs: V,
            totalMs: b
          });
        }), !(r.value || !s)); ) {
          const j = c.value[c.value.length - 1];
          if (j == null) {
            d.value = !0;
            break;
          }
          try {
            if (r.value || !s) break;
            const V = await $(j);
            if (r.value || !s) break;
            v.value = null, c.value.push(V.nextPage), V.nextPage == null && (d.value = !0);
          } catch (V) {
            if (r.value || !s) break;
            v.value = he(V);
          }
          D++;
        }
        f("backfill:stop", { fetched: a.value.length, calls: D });
      } finally {
        s = !1, h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function N(z) {
    if (!h.value) {
      r.value = !1, h.value || (h.value = !0, f("loading:start")), d.value = !1, v.value = null;
      try {
        const l = a.value.length;
        if (r.value) return;
        const p = await $(z);
        return r.value ? void 0 : (v.value = null, o.value = z, c.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await S(l), p);
      } catch (l) {
        throw v.value = he(l), l;
      } finally {
        h.value = !1;
      }
    }
  }
  async function R() {
    if (!h.value && !d.value) {
      r.value = !1, h.value || (h.value = !0, f("loading:start")), v.value = null;
      try {
        const z = a.value.length;
        if (r.value) return;
        if (y === "refresh" && o.value != null && k(o.value) < L) {
          const D = await g(() => n(o.value, i == null ? void 0 : i.value));
          if (r.value) return;
          const j = [...a.value], V = D.items.filter((P) => !P || P.id == null || P.page == null ? !1 : !j.some((C) => C && C.id === P.id && C.page === P.page));
          if (V.length > 0) {
            const P = [...a.value, ...V];
            a.value = P, await O(), await O(), await O(), w(P);
          }
          if (v.value = null, V.length === 0) {
            const P = c.value[c.value.length - 1];
            if (P == null) {
              d.value = !0;
              return;
            }
            const C = await $(P);
            return r.value ? void 0 : (v.value = null, o.value = P, c.value.push(C.nextPage), C.nextPage == null && (d.value = !0), await S(z), C);
          }
          if (k(o.value) >= L) {
            const P = c.value[c.value.length - 1];
            if (P == null) {
              d.value = !0;
              return;
            }
            const C = await $(P);
            return r.value ? void 0 : (v.value = null, o.value = P, c.value.push(C.nextPage), C.nextPage == null && (d.value = !0), await S(z), C);
          } else
            return D;
        }
        const l = c.value[c.value.length - 1];
        if (l == null) {
          d.value = !0;
          return;
        }
        const p = await $(l);
        return r.value ? void 0 : (v.value = null, o.value = l, c.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await S(z), p);
      } catch (z) {
        throw v.value = he(z), z;
      } finally {
        h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function H() {
    if (!h.value) {
      r.value = !1, h.value = !0, f("loading:start");
      try {
        const z = o.value;
        if (z == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", o.value, "paginationHistory:", c.value);
          return;
        }
        a.value = [], d.value = !1, v.value = null, c.value = [z];
        const l = await $(z);
        if (r.value) return;
        v.value = null, o.value = z, c.value.push(l.nextPage), l.nextPage == null && (d.value = !0);
        const p = a.value.length;
        return await S(p), l;
      } catch (z) {
        throw v.value = he(z), z;
      } finally {
        h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  function W() {
    const z = s;
    r.value = !0, h.value = !1, s = !1, z && f("backfill:stop", { fetched: a.value.length, calls: 0, cancelled: !0 }), f("loading:stop", { fetched: a.value.length });
  }
  return {
    loadPage: N,
    loadNext: R,
    refreshCurrentPage: H,
    cancelLoad: W,
    maybeBackfillToTarget: S,
    getContent: $
  };
}
function oa(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    refreshLayout: a,
    loadNext: h,
    maybeBackfillToTarget: d,
    paginationHistory: v
  } = e;
  let o = /* @__PURE__ */ new Set(), c = null, w = !1;
  async function t() {
    if (o.size === 0 || w) return;
    w = !0;
    const f = Array.from(o);
    o.clear(), c = null, await T(f), w = !1;
  }
  async function x(f) {
    o.add(f), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16);
  }
  async function T(f) {
    if (!f || f.length === 0) return;
    const r = new Set(f.map((k) => k.id)), s = n.value.filter((k) => !r.has(k.id));
    if (n.value = s, await O(), s.length === 0 && v.value.length > 0) {
      try {
        await h(), await d(0, !0);
      } catch {
      }
      return;
    }
    await O(), await O(), a(s);
  }
  async function y(f) {
    !f || f.length === 0 || (f.forEach((r) => o.add(r)), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16));
  }
  async function m(f, r) {
    if (!f) return;
    const s = n.value;
    if (s.findIndex(($) => $.id === f.id) !== -1) return;
    const M = [...s], g = Math.min(r, M.length);
    M.splice(g, 0, f), n.value = M, await O(), i.value || (await O(), await O(), a(M));
  }
  async function I(f, r) {
    var H;
    if (!f || f.length === 0) return;
    if (!r || r.length !== f.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const s = n.value, k = new Set(s.map((W) => W.id)), M = [];
    for (let W = 0; W < f.length; W++)
      k.has((H = f[W]) == null ? void 0 : H.id) || M.push({ item: f[W], index: r[W] });
    if (M.length === 0) return;
    const g = /* @__PURE__ */ new Map();
    for (const { item: W, index: z } of M)
      g.set(z, W);
    const $ = M.length > 0 ? Math.max(...M.map(({ index: W }) => W)) : -1, S = Math.max(s.length - 1, $), N = [];
    let R = 0;
    for (let W = 0; W <= S; W++)
      g.has(W) ? N.push(g.get(W)) : R < s.length && (N.push(s[R]), R++);
    for (; R < s.length; )
      N.push(s[R]), R++;
    n.value = N, await O(), i.value || (await O(), await O(), a(N));
  }
  async function L() {
    n.value = [];
  }
  return {
    remove: x,
    removeMany: y,
    restore: m,
    restoreMany: I,
    removeAll: L
  };
}
function ra(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    container: a,
    columns: h,
    containerWidth: d,
    masonryContentHeight: v,
    layout: o,
    fixedDimensions: c,
    checkItemDimensions: w
  } = e;
  let t = [];
  function x(I) {
    const L = Qt(I);
    let f = 0;
    if (a.value) {
      const { scrollTop: r, clientHeight: s } = a.value;
      f = r + s + 100;
    }
    v.value = Math.max(L, f);
  }
  function T(I) {
    var s, k;
    if (i.value) {
      n.value = I;
      return;
    }
    if (n.value = I, !a.value) return;
    if (w(I, "refreshLayout"), I.length > 1e3 && t.length > I.length && t.length - I.length < 100) {
      let M = !0;
      for (let g = 0; g < I.length; g++)
        if (((s = I[g]) == null ? void 0 : s.id) !== ((k = t[g]) == null ? void 0 : k.id)) {
          M = !1;
          break;
        }
      if (M) {
        const g = I.map(($, S) => ({
          ...t[S],
          originalIndex: S
        }));
        x(g), n.value = g, t = g;
        return;
      }
    }
    const f = I.map((M, g) => ({
      ...M,
      originalIndex: g
    })), r = a.value;
    if (c.value && c.value.width !== void 0) {
      const M = r.style.width, g = r.style.boxSizing;
      r.style.boxSizing = "border-box", r.style.width = `${c.value.width}px`, r.offsetWidth;
      const $ = Ae(f, r, h.value, o.value);
      r.style.width = M, r.style.boxSizing = g, x($), n.value = $, t = $;
    } else {
      const M = Ae(f, r, h.value, o.value);
      x(M), n.value = M, t = M;
    }
  }
  function y(I, L) {
    c.value = I, I && (I.width !== void 0 && (d.value = I.width), !i.value && a.value && n.value.length > 0 && O(() => {
      h.value = se(o.value, d.value), T(n.value), L && L();
    }));
  }
  function m() {
    h.value = se(o.value, d.value), T(n.value);
  }
  return {
    refreshLayout: T,
    setFixedDimensions: y,
    onResize: m,
    calculateHeight: x
  };
}
function ia(e) {
  const {
    masonry: n,
    container: i,
    columns: a,
    virtualBufferPx: h,
    loadThresholdPx: d
  } = e, v = F(e.handleScroll), o = F(0), c = F(0), w = h, t = F(!1), x = F({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), T = K(() => {
    const L = o.value - w, f = o.value + c.value + w, r = n.value;
    return !r || r.length === 0 ? [] : r.filter((k) => {
      if (typeof k.top != "number" || typeof k.columnHeight != "number")
        return !0;
      const M = k.top;
      return k.top + k.columnHeight >= L && M <= f;
    });
  });
  function y(L) {
    if (!i.value) return;
    const { scrollTop: f, clientHeight: r } = i.value, s = f + r, k = L ?? $e(n.value, a.value), M = k.length ? Math.max(...k) : 0, g = typeof d == "number" ? d : 200, $ = g >= 0 ? Math.max(0, M - g) : Math.max(0, M + g), S = Math.max(0, $ - s), N = S <= 100;
    x.value = {
      distanceToTrigger: Math.round(S),
      isNearTrigger: N
    };
  }
  async function m() {
    if (i.value) {
      const f = i.value.scrollTop, r = i.value.clientHeight || window.innerHeight, s = r > 0 ? r : window.innerHeight;
      o.value = f, c.value = s;
    }
    t.value = !0, await O(), await O(), t.value = !1;
    const L = $e(n.value, a.value);
    v.value(L), y(L);
  }
  function I() {
    o.value = 0, c.value = 0, t.value = !1, x.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: o,
    viewportHeight: c,
    virtualizing: t,
    scrollProgress: x,
    visibleMasonry: T,
    updateScrollProgress: y,
    updateViewport: m,
    reset: I,
    handleScroll: v
  };
}
function sa(e) {
  const { masonry: n } = e, i = F(/* @__PURE__ */ new Set());
  function a(v) {
    return typeof v == "number" && v > 0 && Number.isFinite(v);
  }
  function h(v, o) {
    try {
      if (!Array.isArray(v) || v.length === 0) return;
      const c = v.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
      if (c.length === 0) return;
      const w = [];
      for (const t of c) {
        const x = (t == null ? void 0 : t.id) ?? `idx:${n.value.indexOf(t)}`;
        i.value.has(x) || (i.value.add(x), w.push(x));
      }
      if (w.length > 0) {
        const t = w.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: o,
            count: w.length,
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
    checkItemDimensions: h,
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
}, da = ["src"], ha = ["src", "autoplay", "controls"], ma = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ga = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, pa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ Xe({
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
    const i = e, a = n, h = F(!1), d = F(!1), v = F(null), o = F(!1), c = F(!1), w = F(null), t = F(!1), x = F(!1), T = F(!1), y = F(!1), m = F(!1), I = F(null), L = F(null);
    let f = null;
    const r = K(() => {
      var l;
      return i.type ?? ((l = i.item) == null ? void 0 : l.type) ?? "image";
    }), s = K(() => {
      var l;
      return i.notFound ?? ((l = i.item) == null ? void 0 : l.notFound) ?? !1;
    }), k = K(() => !!i.inSwipeMode);
    function M(l, p) {
      const E = l === "image" ? h.value : o.value;
      x.value && E && !T.value && (T.value = !0, a("in-view-and-loaded", { item: i.item, type: l, src: p }));
    }
    function g(l) {
      a("mouse-enter", { item: i.item, type: l });
    }
    function $(l) {
      a("mouse-leave", { item: i.item, type: l });
    }
    function S(l) {
      if (k.value) return;
      const p = l.target;
      p && (p.paused ? p.play() : p.pause());
    }
    function N(l) {
      const p = l.target;
      p && (k.value || p.play(), g("video"));
    }
    function R(l) {
      const p = l.target;
      p && (k.value || p.pause(), $("video"));
    }
    function H(l) {
      return new Promise((p, E) => {
        if (!l) {
          const b = new Error("No image source provided");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), E(b);
          return;
        }
        const D = new Image(), j = Date.now(), V = 300;
        D.onload = () => {
          const b = Date.now() - j, P = Math.max(0, V - b);
          setTimeout(async () => {
            h.value = !0, d.value = !1, y.value = !1, await O(), await new Promise((C) => setTimeout(C, 100)), m.value = !0, a("preload:success", { item: i.item, type: "image", src: l }), M("image", l), p();
          }, P);
        }, D.onerror = () => {
          d.value = !0, h.value = !1, y.value = !1;
          const b = new Error("Failed to load image");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), E(b);
        }, D.src = l;
      });
    }
    function W(l) {
      return new Promise((p, E) => {
        if (!l) {
          const b = new Error("No video source provided");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), E(b);
          return;
        }
        const D = document.createElement("video"), j = Date.now(), V = 300;
        D.preload = "metadata", D.muted = !0, D.onloadedmetadata = () => {
          const b = Date.now() - j, P = Math.max(0, V - b);
          setTimeout(async () => {
            o.value = !0, c.value = !1, y.value = !1, await O(), await new Promise((C) => setTimeout(C, 100)), m.value = !0, a("preload:success", { item: i.item, type: "video", src: l }), M("video", l), p();
          }, P);
        }, D.onerror = () => {
          c.value = !0, o.value = !1, y.value = !1;
          const b = new Error("Failed to load video");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), E(b);
        }, D.src = l;
      });
    }
    async function z() {
      var p;
      if (!t.value || y.value || s.value || r.value === "video" && o.value || r.value === "image" && h.value)
        return;
      const l = (p = i.item) == null ? void 0 : p.src;
      if (l)
        if (y.value = !0, m.value = !1, r.value === "video") {
          w.value = l, o.value = !1, c.value = !1;
          try {
            await W(l);
          } catch {
          }
        } else {
          v.value = l, h.value = !1, d.value = !1;
          try {
            await H(l);
          } catch {
          }
        }
    }
    return Ge(async () => {
      if (!I.value) return;
      const l = [i.preloadThreshold, 1].filter((E, D, j) => j.indexOf(E) === D).sort((E, D) => E - D);
      f = new IntersectionObserver(
        (E) => {
          E.forEach((D) => {
            const j = D.intersectionRatio, V = j >= 1, b = j >= i.preloadThreshold;
            if (V && !x.value) {
              x.value = !0, a("in-view", { item: i.item, type: r.value });
              const P = r.value === "image" ? v.value : w.value, C = r.value === "image" ? h.value : o.value;
              P && C && M(r.value, P);
            }
            b && !t.value ? (t.value = !0, z()) : D.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: l
        }
      ), f.observe(I.value), await O(), await O(), await O(), p(), setTimeout(() => {
        p();
      }, 100);
      function p() {
        if (!I.value || x.value) return;
        const E = I.value.getBoundingClientRect(), D = window.innerHeight, j = window.innerWidth;
        if (E.top >= 0 && E.bottom <= D && E.left >= 0 && E.right <= j && E.height > 0 && E.width > 0) {
          x.value = !0, a("in-view", { item: i.item, type: r.value });
          const b = r.value === "image" ? v.value : w.value, P = r.value === "image" ? h.value : o.value;
          b && P && M(r.value, b);
        }
      }
    }), qe(() => {
      f && (f.disconnect(), f = null);
    }), ee(
      () => {
        var l;
        return (l = i.item) == null ? void 0 : l.src;
      },
      async (l) => {
        if (!(!l || s.value)) {
          if (r.value === "video") {
            if (l !== w.value && (o.value = !1, c.value = !1, w.value = l, t.value)) {
              y.value = !0;
              try {
                await W(l);
              } catch {
              }
            }
          } else if (l !== v.value && (h.value = !1, d.value = !1, v.value = l, t.value)) {
            y.value = !0;
            try {
              await H(l);
            } catch {
            }
          }
        }
      }
    ), ee(
      () => i.isActive,
      (l) => {
        !k.value || !L.value || (l ? L.value.play() : L.value.pause());
      }
    ), (l, p) => (_(), U("div", {
      ref_key: "containerRef",
      ref: I,
      class: "relative w-full h-full flex flex-col"
    }, [
      l.headerHeight > 0 ? (_(), U("div", {
        key: 0,
        class: "relative z-10",
        style: me({ height: `${l.headerHeight}px` })
      }, [
        J(l.$slots, "header", {
          item: l.item,
          remove: l.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: y.value,
          mediaType: r.value,
          isFullyInView: x.value
        })
      ], 4)) : te("", !0),
      X("div", ua, [
        J(l.$slots, "default", {
          item: l.item,
          remove: l.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: y.value,
          mediaType: r.value,
          imageSrc: v.value,
          videoSrc: w.value,
          showMedia: m.value,
          isFullyInView: x.value
        }, () => [
          X("div", ca, [
            s.value ? (_(), U("div", va, p[3] || (p[3] = [
              X("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              X("span", { class: "font-medium" }, "Not Found", -1),
              X("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (_(), U("div", fa, [
              r.value === "image" && v.value ? (_(), U("img", {
                key: 0,
                src: v.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  h.value && m.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: p[0] || (p[0] = (E) => g("image")),
                onMouseleave: p[1] || (p[1] = (E) => $("image"))
              }, null, 42, da)) : te("", !0),
              r.value === "video" && w.value ? (_(), U("video", {
                key: 1,
                ref_key: "videoEl",
                ref: L,
                src: w.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  o.value && m.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: k.value && i.isActive,
                controls: k.value,
                onClick: Re(S, ["stop"]),
                onTouchend: Re(S, ["stop", "prevent"]),
                onMouseenter: N,
                onMouseleave: R,
                onError: p[2] || (p[2] = (E) => c.value = !0)
              }, null, 42, ha)) : te("", !0),
              !h.value && !o.value && !d.value && !c.value ? (_(), U("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  m.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                X("div", ma, [
                  J(l.$slots, "placeholder-icon", { mediaType: r.value }, () => [
                    X("i", {
                      class: re(r.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : te("", !0),
              y.value ? (_(), U("div", ga, p[4] || (p[4] = [
                X("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  X("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : te("", !0),
              r.value === "image" && d.value || r.value === "video" && c.value ? (_(), U("div", pa, [
                X("i", {
                  class: re(r.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                X("span", null, "Failed to load " + Pe(r.value), 1)
              ])) : te("", !0)
            ]))
          ])
        ])
      ]),
      l.footerHeight > 0 ? (_(), U("div", {
        key: 1,
        class: "relative z-10",
        style: me({ height: `${l.footerHeight}px` })
      }, [
        J(l.$slots, "footer", {
          item: l.item,
          remove: l.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: c.value,
          showNotFound: s.value,
          isLoading: y.value,
          mediaType: r.value,
          isFullyInView: x.value
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
}, Sa = { class: "text-red-500 dark:text-red-400" }, ka = /* @__PURE__ */ Xe({
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
    const a = e, h = {
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
        ...h,
        ...a.layout,
        sizes: {
          ...h.sizes,
          ...((u = a.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), v = F(null), o = F(typeof window < "u" ? window.innerWidth : 1024), c = F(typeof window < "u" ? window.innerHeight : 768), w = F(null);
    let t = null;
    function x(u) {
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
      const u = typeof a.mobileBreakpoint == "string" ? x(a.mobileBreakpoint) : a.mobileBreakpoint;
      return o.value < u;
    }), y = i, m = K({
      get: () => a.items,
      set: (u) => y("update:items", u)
    }), I = K({
      get: () => a.context,
      set: (u) => y("update:context", u)
    });
    function L(u) {
      I.value = u;
    }
    const f = K(() => {
      const u = m.value;
      return (u == null ? void 0 : u.length) ?? 0;
    }), r = F(7), s = F(null), k = F([]), M = F(null), g = F(!1), $ = F(0), S = F(!1), N = F(null), R = F(!1), H = K(() => Kt(o.value)), W = sa({
      masonry: m
    }), { checkItemDimensions: z, reset: l } = W, p = ra({
      masonry: m,
      useSwipeMode: T,
      container: s,
      columns: r,
      containerWidth: o,
      masonryContentHeight: $,
      layout: d,
      fixedDimensions: w,
      checkItemDimensions: z
    }), { refreshLayout: E, setFixedDimensions: D, onResize: j } = p, V = ia({
      masonry: m,
      container: s,
      columns: r,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: b, viewportHeight: P, virtualizing: C, visibleMasonry: ne, updateScrollProgress: G, updateViewport: ie, reset: Q } = V, { onEnter: Qe, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = ta(
      { container: s },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: C }
    ), at = Qe, nt = Ze, lt = et, ot = tt, rt = la({
      getPage: a.getPage,
      context: I,
      masonry: m,
      isLoading: g,
      hasReachedEnd: S,
      loadError: N,
      currentPage: M,
      paginationHistory: k,
      refreshLayout: E,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: a.mode,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: y
    }), { loadPage: be, loadNext: ge, refreshCurrentPage: it, cancelLoad: Me, maybeBackfillToTarget: st } = rt, Z = na({
      useSwipeMode: T,
      masonry: m,
      isLoading: g,
      loadNext: ge,
      loadPage: be,
      paginationHistory: k
    }), { handleScroll: ut } = aa({
      container: s,
      masonry: m,
      columns: r,
      containerHeight: $,
      isLoading: g,
      pageSize: a.pageSize,
      refreshLayout: E,
      setItemsRaw: (u) => {
        m.value = u;
      },
      loadNext: ge,
      loadThresholdPx: a.loadThresholdPx
    });
    V.handleScroll.value = ut;
    const ct = oa({
      masonry: m,
      useSwipeMode: T,
      refreshLayout: E,
      loadNext: ge,
      maybeBackfillToTarget: st,
      paginationHistory: k
    }), { remove: ue, removeMany: vt, restore: ft, restoreMany: dt, removeAll: ht } = ct;
    function mt(u) {
      D(u, G), !u && v.value && (o.value = v.value.clientWidth, c.value = v.value.clientHeight);
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
      currentBreakpoint: H,
      // Current page number or cursor being displayed
      currentPage: M,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Mt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: S,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: Tt,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: R,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: g,
      // Error object if the last load operation failed, null otherwise
      loadError: N,
      // Loads the next page of items asynchronously
      loadNext: ge,
      // Loads a specific page number or cursor asynchronously
      loadPage: be,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: k,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: it,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: E,
      // Removes a single item from the masonry
      remove: ue,
      // Removes all items from the masonry
      removeAll: ht,
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
      setContext: L,
      // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
      setFixedDimensions: mt,
      // Computed property returning the total number of items currently in the masonry
      totalItems: K(() => m.value.length)
    });
    const ce = Z.currentSwipeIndex, pe = Z.swipeOffset, ye = Z.isDragging, le = Z.swipeContainer, ze = Z.handleTouchStart, De = Z.handleTouchMove, Be = Z.handleTouchEnd, Ne = Z.handleMouseDown, Te = Z.handleMouseMove, Ie = Z.handleMouseUp, Le = Z.snapToCurrentItem;
    function gt(u) {
      const B = f.value, Y = typeof u == "string" ? parseInt(u, 10) : u;
      return B > 0 ? `${Y * (100 / B)}%` : "0%";
    }
    function pt() {
      const u = f.value;
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
      }), s.value && (b.value = s.value.scrollTop, P.value = s.value.clientHeight || window.innerHeight));
    }
    function xt() {
      j(), s.value && (b.value = s.value.scrollTop, P.value = s.value.clientHeight);
    }
    function bt() {
      Me(), s.value && s.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), m.value = [], c.value = 0, M.value = a.loadAtPage, k.value = [a.loadAtPage], S.value = !1, N.value = null, R.value = !1, Q();
    }
    function Mt() {
      Me(), m.value = [], $.value = 0, M.value = null, k.value = [], S.value = !1, N.value = null, g.value = !1, R.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, Q(), l(), s.value && s.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ue(async () => {
      T.value || await ie();
    }, 200), We = Ue(xt, 200);
    function Fe() {
      Z.handleWindowResize();
    }
    function Tt(u, B, Y) {
      M.value = B, k.value = [B], Y != null && k.value.push(Y), S.value = Y === null, z(u, "initialize");
      const ae = m.value, A = ae.length === 0 ? u : [...ae, ...u];
      m.value = A, T.value ? ce.value === 0 && m.value.length > 0 && (pe.value = 0) : (E(A), s.value && (b.value = s.value.scrollTop, P.value = s.value.clientHeight || window.innerHeight), O(() => {
        s.value && (b.value = s.value.scrollTop, P.value = s.value.clientHeight || window.innerHeight, G());
      })), u && u.length > 0 && (R.value = !0);
    }
    return ee(
      d,
      () => {
        T.value || s.value && (r.value = se(d.value, o.value), E(m.value));
      },
      { deep: !0 }
    ), ee(() => a.layoutMode, () => {
      w.value && w.value.width !== void 0 ? o.value = w.value.width : v.value && (o.value = v.value.clientWidth);
    }), ee(s, (u) => {
      u && !T.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 }), ee(
      () => m.value.length,
      (u, B) => {
        a.init === "manual" && !R.value && u > 0 && B === 0 && (R.value = !0);
      },
      { immediate: !1 }
    ), ee(T, (u, B) => {
      B === void 0 && u === !1 || O(() => {
        u ? (document.addEventListener("mousemove", Te), document.addEventListener("mouseup", Ie), s.value && s.value.removeEventListener("scroll", oe), ce.value = 0, pe.value = 0, m.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie), s.value && v.value && (w.value && w.value.width !== void 0 ? o.value = w.value.width : o.value = v.value.clientWidth, s.value.removeEventListener("scroll", oe), s.value.addEventListener("scroll", oe, { passive: !0 }), m.value.length > 0 && (r.value = se(d.value, o.value), E(m.value), b.value = s.value.scrollTop, P.value = s.value.clientHeight, G())));
      });
    }, { immediate: !0 }), ee(le, (u) => {
      u && (u.addEventListener("touchstart", ze, { passive: !1 }), u.addEventListener("touchmove", De, { passive: !1 }), u.addEventListener("touchend", Be), u.addEventListener("mousedown", Ne));
    }), ee(() => m.value.length, (u, B) => {
      T.value && u > 0 && B === 0 && (ce.value = 0, O(() => Le()));
    }), ee(v, (u) => {
      t && (t.disconnect(), t = null), u && typeof ResizeObserver < "u" ? (t = new ResizeObserver((B) => {
        if (!w.value)
          for (const Y of B) {
            const ae = Y.contentRect.width, A = Y.contentRect.height;
            o.value !== ae && (o.value = ae), c.value !== A && (c.value = A);
          }
      }), t.observe(u), w.value || (o.value = u.clientWidth, c.value = u.clientHeight)) : u && (w.value || (o.value = u.clientWidth, c.value = u.clientHeight));
    }, { immediate: !0 }), ee(o, (u, B) => {
      u !== B && u > 0 && !T.value && s.value && m.value.length > 0 && O(() => {
        r.value = se(d.value, u), E(m.value), G();
      });
    }), Ge(async () => {
      try {
        await O(), v.value && !t && (o.value = v.value.clientWidth, c.value = v.value.clientHeight), T.value || (r.value = se(d.value, o.value), s.value && (b.value = s.value.scrollTop, P.value = s.value.clientHeight));
        const u = a.loadAtPage;
        if (k.value = [u], a.init === "auto") {
          R.value = !0, await O();
          try {
            await be(u);
          } catch {
          }
        }
        T.value ? O(() => Le()) : G();
      } catch (u) {
        N.value || (console.error("Error during component initialization:", u), N.value = he(u)), g.value = !1;
      }
      window.addEventListener("resize", We), window.addEventListener("resize", Fe);
    }), qe(() => {
      var u;
      t && (t.disconnect(), t = null), (u = s.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", We), window.removeEventListener("resize", Fe), le.value && (le.value.removeEventListener("touchstart", ze), le.value.removeEventListener("touchmove", De), le.value.removeEventListener("touchend", Be), le.value.removeEventListener("mousedown", Ne)), document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie);
    }), (u, B) => (_(), U("div", {
      ref_key: "wrapper",
      ref: v,
      class: "w-full h-full flex flex-col relative"
    }, [
      R.value ? T.value ? (_(), U("div", {
        key: 1,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !q(ye), "cursor-grabbing": q(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        X("div", {
          class: "relative w-full",
          style: me({
            transform: `translateY(${q(pe)}px)`,
            transition: q(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${f.value * 100}%`
          })
        }, [
          (_(!0), U(Oe, null, Ce(m.value, (Y, ae) => (_(), U("div", {
            key: `${Y.page}-${Y.id}`,
            class: "absolute top-0 left-0 w-full",
            style: me({
              top: gt(ae),
              height: pt()
            })
          }, [
            X("div", wa, [
              X("div", xa, [
                J(u.$slots, "default", {
                  item: Y,
                  remove: q(ue),
                  index: Y.originalIndex ?? m.value.indexOf(Y)
                }, () => [
                  Se(xe, {
                    item: Y,
                    remove: q(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": ae === q(ce),
                    "onPreload:success": B[0] || (B[0] = (A) => y("item:preload:success", A)),
                    "onPreload:error": B[1] || (B[1] = (A) => y("item:preload:error", A)),
                    onMouseEnter: B[2] || (B[2] = (A) => y("item:mouse-enter", A)),
                    onMouseLeave: B[3] || (B[3] = (A) => y("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      J(u.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        S.value && m.value.length > 0 ? (_(), U("div", ba, [
          J(u.$slots, "end-message", {}, () => [
            B[9] || (B[9] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        N.value && m.value.length > 0 ? (_(), U("div", Ma, [
          J(u.$slots, "error-message", { error: N.value }, () => [
            X("p", Ta, "Failed to load content: " + Pe(N.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (_(), U("div", {
        key: 2,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: s
      }, [
        X("div", {
          class: "relative",
          style: me({ height: `${$.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          Se(It, {
            name: "masonry",
            css: !1,
            onEnter: q(at),
            onBeforeEnter: q(nt),
            onLeave: q(ot),
            onBeforeLeave: q(lt)
          }, {
            default: ve(() => [
              (_(!0), U(Oe, null, Ce(q(ne), (Y, ae) => (_(), U("div", fe({
                key: `${Y.page}-${Y.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, q(ea)(Y, ae)), [
                J(u.$slots, "default", {
                  item: Y,
                  remove: q(ue),
                  index: Y.originalIndex ?? m.value.indexOf(Y)
                }, () => [
                  Se(xe, {
                    item: Y,
                    remove: q(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": B[4] || (B[4] = (A) => y("item:preload:success", A)),
                    "onPreload:error": B[5] || (B[5] = (A) => y("item:preload:error", A)),
                    onMouseEnter: B[6] || (B[6] = (A) => y("item:mouse-enter", A)),
                    onMouseLeave: B[7] || (B[7] = (A) => y("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      J(u.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        S.value && m.value.length > 0 ? (_(), U("div", Ia, [
          J(u.$slots, "end-message", {}, () => [
            B[10] || (B[10] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        N.value && m.value.length > 0 ? (_(), U("div", La, [
          J(u.$slots, "error-message", { error: N.value }, () => [
            X("p", Sa, "Failed to load content: " + Pe(N.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (_(), U("div", ya, [
        J(u.$slots, "loading-message", {}, () => [
          B[8] || (B[8] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ea = (e, n) => {
  const i = e.__vccOpts || e;
  for (const [a, h] of n)
    i[a] = h;
  return i;
}, _e = /* @__PURE__ */ Ea(ka, [["__scopeId", "data-v-56ba77e1"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", _e), e.component("WMasonry", _e), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  _e as Masonry,
  xe as MasonryItem,
  Ha as default
};
