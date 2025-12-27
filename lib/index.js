import { nextTick as _, ref as N, computed as K, defineComponent as _e, onMounted as Xe, onUnmounted as Ge, watch as ee, createElementBlock as q, openBlock as Y, createCommentVNode as te, createElementVNode as U, normalizeStyle as he, renderSlot as J, normalizeClass as re, withModifiers as Ae, toDisplayString as Pe, unref as G, Fragment as Re, renderList as Oe, createVNode as Se, withCtx as ve, mergeProps as fe, TransitionGroup as It } from "vue";
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
    gutterX: h = 0,
    gutterY: d = 0,
    header: v = 0,
    footer: r = 0,
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
  let M = 0, p = 0;
  try {
    if (n && n.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const S = window.getComputedStyle(n);
      M = parseFloat(S.paddingLeft) || 0, p = parseFloat(S.paddingRight) || 0;
    }
  } catch {
  }
  const g = (c || 0) + M, T = (y || 0) + p, I = n.offsetWidth - n.clientWidth, f = I > 0 ? I + 2 : Lt() + 2, u = n.offsetWidth - f - g - T, o = h * (i - 1), k = Math.floor((u - o) / i), E = e.map((S) => {
    const F = S.width, A = S.height;
    return Math.round(k * A / F) + r + v;
  });
  if (w === "sequential-balanced") {
    const S = E.length;
    if (S === 0) return [];
    const F = (b, $, R) => b + ($ > 0 ? d : 0) + R;
    let A = Math.max(...E), H = E.reduce((b, $) => b + $, 0) + d * Math.max(0, S - 1);
    const D = (b) => {
      let $ = 1, R = 0, ne = 0;
      for (let X = 0; X < S; X++) {
        const ie = E[X], Q = F(R, ne, ie);
        if (Q <= b)
          R = Q, ne++;
        else if ($++, R = ie, ne = 1, ie > b || $ > i) return !1;
      }
      return $ <= i;
    };
    for (; A < H; ) {
      const b = Math.floor((A + H) / 2);
      D(b) ? H = b : A = b + 1;
    }
    const z = H, l = new Array(i).fill(0);
    let x = i - 1, P = 0, W = 0;
    for (let b = S - 1; b >= 0; b--) {
      const $ = E[b], R = b < x;
      !(F(P, W, $) <= z) || R ? (l[x] = b + 1, x--, P = $, W = 1) : (P = F(P, W, $), W++);
    }
    l[0] = 0;
    const V = [], C = new Array(i).fill(0);
    for (let b = 0; b < i; b++) {
      const $ = l[b], R = b + 1 < i ? l[b + 1] : S, ne = b * (k + h);
      for (let X = $; X < R; X++) {
        const Q = {
          ...e[X],
          columnWidth: k,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Q.imageHeight = E[X] - (r + v), Q.columnHeight = E[X], Q.left = ne, Q.top = C[b], C[b] += Q.columnHeight + (X + 1 < R ? d : 0), V.push(Q);
      }
    }
    return V;
  }
  const m = new Array(i).fill(0), L = [];
  for (let S = 0; S < e.length; S++) {
    const F = e[S], A = {
      ...F,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, H = m.indexOf(Math.min(...m)), D = F.width, z = F.height;
    A.columnWidth = k, A.left = H * (k + h), A.imageHeight = Math.round(k * z / D), A.columnHeight = A.imageHeight + r + v, A.top = m[H], m[H] += A.columnHeight + d, L.push(A);
  }
  return L;
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
var $t = Object.prototype, Ft = $t.toString;
function zt(e) {
  return Ft.call(e);
}
var Dt = "[object Null]", Wt = "[object Undefined]", Ve = we ? we.toStringTag : void 0;
function Bt(e) {
  return e == null ? e === void 0 ? Wt : Dt : Ve && Ve in Object(e) ? Ht(e) : zt(e);
}
function Nt(e) {
  return e != null && typeof e == "object";
}
var At = "[object Symbol]";
function Rt(e) {
  return typeof e == "symbol" || Nt(e) && Bt(e) == At;
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
  var a, h, d, v, r, c, y = 0, t = !1, w = !1, M = !0;
  if (typeof e != "function")
    throw new TypeError(Xt);
  n = qe(n) || 0, He(i) && (t = !!i.leading, w = "maxWait" in i, d = w ? Gt(qe(i.maxWait) || 0, n) : d, M = "trailing" in i ? !!i.trailing : M);
  function p(m) {
    var L = a, S = h;
    return a = h = void 0, y = m, v = e.apply(S, L), v;
  }
  function g(m) {
    return y = m, r = setTimeout(f, n), t ? p(m) : v;
  }
  function T(m) {
    var L = m - c, S = m - y, F = n - L;
    return w ? Jt(F, d - S) : F;
  }
  function I(m) {
    var L = m - c, S = m - y;
    return c === void 0 || L >= n || L < 0 || w && S >= d;
  }
  function f() {
    var m = Ee();
    if (I(m))
      return u(m);
    r = setTimeout(f, T(m));
  }
  function u(m) {
    return r = void 0, M && a ? p(m) : (a = h = void 0, v);
  }
  function o() {
    r !== void 0 && clearTimeout(r), y = 0, a = c = h = r = void 0;
  }
  function k() {
    return r === void 0 ? v : u(Ee());
  }
  function E() {
    var m = Ee(), L = I(m);
    if (a = arguments, h = this, c = m, L) {
      if (r === void 0)
        return g(c);
      if (w)
        return clearTimeout(r), r = setTimeout(f, n), p(c);
    }
    return r === void 0 && (r = setTimeout(f, n)), v;
  }
  return E.cancel = o, E.flush = k, E;
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
  const a = Array.from(new Set(e.map((v) => v.left))).sort((v, r) => v - r).slice(0, n), h = /* @__PURE__ */ new Map();
  for (let v = 0; v < a.length; v++) h.set(a[v], v);
  const d = new Array(a.length).fill(0);
  for (const v of e) {
    const r = h.get(v.left);
    r != null && (d[r] = Math.max(d[r], v.top + v.columnHeight));
  }
  for (; d.length < n; ) d.push(0);
  return d;
}
function ta(e, n) {
  let i = 0, a = 0;
  const h = 1e3;
  function d(t, w) {
    var g;
    const M = (g = e.container) == null ? void 0 : g.value;
    if (M) {
      const T = M.scrollTop, I = M.clientHeight;
      i = T - h, a = T + I + h;
    }
    return t + w >= i && t <= a;
  }
  function v(t, w) {
    var u;
    const M = parseInt(t.dataset.left || "0", 10), p = parseInt(t.dataset.top || "0", 10), g = parseInt(t.dataset.index || "0", 10), T = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((u = n == null ? void 0 : n.virtualizing) != null && u.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${M}px, ${p}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "", w();
      });
      return;
    }
    if (!d(p, T)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${M}px, ${p}px, 0) scale(1)`, t.style.transition = "none", w();
      return;
    }
    const I = Math.min(g * 20, 160), f = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${I}ms`), requestAnimationFrame(() => {
      t.style.opacity = "1", t.style.transform = `translate3d(${M}px, ${p}px, 0) scale(1)`;
      const o = () => {
        f ? t.style.setProperty("--masonry-opacity-delay", f) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", o), w();
      };
      t.addEventListener("transitionend", o);
    });
  }
  function r(t) {
    var p;
    const w = parseInt(t.dataset.left || "0", 10), M = parseInt(t.dataset.top || "0", 10);
    if ((p = n == null ? void 0 : n.virtualizing) != null && p.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${w}px, ${M}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${w}px, ${M + 10}px, 0) scale(0.985)`;
  }
  function c(t) {
    var g;
    const w = parseInt(t.dataset.left || "0", 10), M = parseInt(t.dataset.top || "0", 10), p = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((g = n == null ? void 0 : n.virtualizing) != null && g.value)) {
      if (!d(M, p)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${w}px, ${M}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "";
      });
    }
  }
  function y(t, w) {
    var E;
    const M = parseInt(t.dataset.left || "0", 10), p = parseInt(t.dataset.top || "0", 10), g = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((E = n == null ? void 0 : n.virtualizing) != null && E.value) {
      w();
      return;
    }
    if (!d(p, g)) {
      t.style.transition = "none", t.style.opacity = "0", w();
      return;
    }
    const T = typeof (n == null ? void 0 : n.leaveDurationMs) == "number" ? n.leaveDurationMs : Number.NaN;
    let I = Number.isFinite(T) && T > 0 ? T : Number.NaN;
    if (!Number.isFinite(I)) {
      const L = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", S = parseFloat(L);
      I = Number.isFinite(S) && S > 0 ? S : 200;
    }
    const f = t.style.transitionDuration, u = () => {
      t.removeEventListener("transitionend", o), clearTimeout(k), t.style.transitionDuration = f || "";
    }, o = (m) => {
      (!m || m.target === t) && (u(), w());
    }, k = setTimeout(() => {
      u(), w();
    }, I + 100);
    requestAnimationFrame(() => {
      t.style.transitionDuration = `${I}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${M}px, ${p + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", o);
    });
  }
  return {
    onEnter: v,
    onBeforeEnter: r,
    onBeforeLeave: c,
    onLeave: y
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
  setItemsRaw: r,
  loadNext: c,
  loadThresholdPx: y
}) {
  let t = 0;
  async function w(M, p = !1) {
    if (!e.value) return;
    const g = M ?? $e(n.value, i.value), T = g.length ? Math.max(...g) : 0, I = e.value.scrollTop + e.value.clientHeight, f = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const u = typeof y == "number" ? y : 200, o = u >= 0 ? Math.max(0, T - u) : Math.max(0, T + u);
    if (I >= o && (f || p) && !h.value) {
      await c(), await _();
      return;
    }
  }
  return {
    handleScroll: w
  };
}
function na(e) {
  const { useSwipeMode: n, masonry: i, isLoading: a, loadNext: h, loadPage: d, paginationHistory: v } = e, r = N(0), c = N(0), y = N(!1), t = N(0), w = N(0), M = N(null), p = K(() => {
    if (!n.value || i.value.length === 0) return null;
    const H = Math.max(0, Math.min(r.value, i.value.length - 1));
    return i.value[H] || null;
  }), g = K(() => {
    if (!n.value || !p.value) return null;
    const H = r.value + 1;
    return H >= i.value.length ? null : i.value[H] || null;
  }), T = K(() => {
    if (!n.value || !p.value) return null;
    const H = r.value - 1;
    return H < 0 ? null : i.value[H] || null;
  });
  function I() {
    if (!M.value) return;
    const H = M.value.clientHeight;
    c.value = -r.value * H;
  }
  function f() {
    if (!g.value) {
      h();
      return;
    }
    r.value++, I(), r.value >= i.value.length - 5 && h();
  }
  function u() {
    T.value && (r.value--, I());
  }
  function o(H) {
    n.value && (y.value = !0, t.value = H.touches[0].clientY, w.value = c.value, H.preventDefault());
  }
  function k(H) {
    if (!n.value || !y.value) return;
    const D = H.touches[0].clientY - t.value;
    c.value = w.value + D, H.preventDefault();
  }
  function E(H) {
    if (!n.value || !y.value) return;
    y.value = !1;
    const D = c.value - w.value;
    Math.abs(D) > 100 ? D > 0 && T.value ? u() : D < 0 && g.value ? f() : I() : I(), H.preventDefault();
  }
  function m(H) {
    n.value && (y.value = !0, t.value = H.clientY, w.value = c.value, H.preventDefault());
  }
  function L(H) {
    if (!n.value || !y.value) return;
    const D = H.clientY - t.value;
    c.value = w.value + D, H.preventDefault();
  }
  function S(H) {
    if (!n.value || !y.value) return;
    y.value = !1;
    const D = c.value - w.value;
    Math.abs(D) > 100 ? D > 0 && T.value ? u() : D < 0 && g.value ? f() : I() : I(), H.preventDefault();
  }
  function F() {
    !n.value && r.value > 0 && (r.value = 0, c.value = 0), n.value && i.value.length === 0 && !a.value && d(v.value[0]), n.value && I();
  }
  function A() {
    r.value = 0, c.value = 0, y.value = !1;
  }
  return {
    // State
    currentSwipeIndex: r,
    swipeOffset: c,
    isDragging: y,
    swipeContainer: M,
    // Computed
    currentItem: p,
    nextItem: g,
    previousItem: T,
    // Functions
    handleTouchStart: o,
    handleTouchMove: k,
    handleTouchEnd: E,
    handleMouseDown: m,
    handleMouseMove: L,
    handleMouseUp: S,
    goToNextItem: f,
    goToPreviousItem: u,
    snapToCurrentItem: I,
    handleWindowResize: F,
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
    isLoading: h,
    hasReachedEnd: d,
    loadError: v,
    currentPage: r,
    paginationHistory: c,
    refreshLayout: y,
    retryMaxAttempts: t,
    retryInitialDelayMs: w,
    retryBackoffStepMs: M,
    mode: p,
    backfillDelayMs: g,
    backfillMaxCalls: T,
    pageSize: I,
    emits: f
  } = e, u = N(!1);
  let o = !1;
  function k(z) {
    return a.value.filter((l) => l.page === z).length;
  }
  function E(z, l) {
    return new Promise((x) => {
      const P = Math.max(0, z | 0), W = Date.now();
      l(P, P);
      const V = setInterval(() => {
        if (u.value) {
          clearInterval(V), x();
          return;
        }
        const C = Date.now() - W, b = Math.max(0, P - C);
        l(b, P), b <= 0 && (clearInterval(V), x());
      }, 100);
    });
  }
  async function m(z) {
    let l = 0;
    const x = t;
    let P = w;
    for (; ; )
      try {
        const W = await z();
        return l > 0 && f("retry:stop", { attempt: l, success: !0 }), W;
      } catch (W) {
        if (l++, l > x)
          throw f("retry:stop", { attempt: l - 1, success: !1 }), W;
        f("retry:start", { attempt: l, max: x, totalMs: P }), await E(P, (V, C) => {
          f("retry:tick", { attempt: l, remainingMs: V, totalMs: C });
        }), P += M;
      }
  }
  async function L(z) {
    try {
      const l = await m(() => n(z, i == null ? void 0 : i.value));
      return y([...a.value, ...l.items]), l;
    } catch (l) {
      throw l;
    }
  }
  async function S(z, l = !1) {
    if (!l && p !== "backfill" || o || u.value || d.value) return;
    const x = (z || 0) + (I || 0);
    if (!I || I <= 0) return;
    if (c.value[c.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(a.value.length >= x)) {
      o = !0, h.value || (h.value = !0, f("loading:start"));
      try {
        let W = 0;
        for (f("backfill:start", { target: x, fetched: a.value.length, calls: W }); a.value.length < x && W < T && c.value[c.value.length - 1] != null && !u.value && !d.value && o && (await E(g, (C, b) => {
          f("backfill:tick", {
            fetched: a.value.length,
            target: x,
            calls: W,
            remainingMs: C,
            totalMs: b
          });
        }), !(u.value || !o)); ) {
          const V = c.value[c.value.length - 1];
          if (V == null) {
            d.value = !0;
            break;
          }
          try {
            if (u.value || !o) break;
            const C = await L(V);
            if (u.value || !o) break;
            v.value = null, c.value.push(C.nextPage), C.nextPage == null && (d.value = !0);
          } catch (C) {
            if (u.value || !o) break;
            v.value = me(C);
          }
          W++;
        }
        f("backfill:stop", { fetched: a.value.length, calls: W });
      } finally {
        o = !1, h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function F(z) {
    if (!h.value) {
      u.value = !1, h.value || (h.value = !0, f("loading:start")), d.value = !1, v.value = null;
      try {
        const l = a.value.length;
        if (u.value) return;
        const x = await L(z);
        return u.value ? void 0 : (v.value = null, r.value = z, c.value.push(x.nextPage), x.nextPage == null && (d.value = !0), await S(l), x);
      } catch (l) {
        throw v.value = me(l), l;
      } finally {
        h.value = !1;
      }
    }
  }
  async function A() {
    if (!h.value && !d.value) {
      u.value = !1, h.value || (h.value = !0, f("loading:start")), v.value = null;
      try {
        const z = a.value.length;
        if (u.value) return;
        if (p === "refresh" && r.value != null && k(r.value) < I) {
          const W = await m(() => n(r.value, i == null ? void 0 : i.value));
          if (u.value) return;
          const V = [...a.value], C = W.items.filter(($) => !$ || $.id == null || $.page == null ? !1 : !V.some((R) => R && R.id === $.id && R.page === $.page));
          if (C.length > 0) {
            const $ = [...a.value, ...C];
            y($), await new Promise((R) => setTimeout(R, 0));
          }
          if (v.value = null, C.length === 0) {
            const $ = c.value[c.value.length - 1];
            if ($ == null) {
              d.value = !0;
              return;
            }
            const R = await L($);
            return u.value ? void 0 : (v.value = null, r.value = $, c.value.push(R.nextPage), R.nextPage == null && (d.value = !0), await S(z), R);
          }
          if (k(r.value) >= I) {
            const $ = c.value[c.value.length - 1];
            if ($ == null) {
              d.value = !0;
              return;
            }
            const R = await L($);
            return u.value ? void 0 : (v.value = null, r.value = $, c.value.push(R.nextPage), R.nextPage == null && (d.value = !0), await S(z), R);
          } else
            return W;
        }
        const l = c.value[c.value.length - 1];
        if (l == null) {
          d.value = !0;
          return;
        }
        const x = await L(l);
        return u.value ? void 0 : (v.value = null, r.value = l, c.value.push(x.nextPage), x.nextPage == null && (d.value = !0), await S(z), x);
      } catch (z) {
        throw v.value = me(z), z;
      } finally {
        h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  async function H() {
    if (!h.value) {
      u.value = !1, h.value = !0, f("loading:start");
      try {
        const z = r.value;
        if (z == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", r.value, "paginationHistory:", c.value);
          return;
        }
        a.value = [], d.value = !1, v.value = null, c.value = [z];
        const l = await L(z);
        if (u.value) return;
        v.value = null, r.value = z, c.value.push(l.nextPage), l.nextPage == null && (d.value = !0);
        const x = a.value.length;
        return await S(x), l;
      } catch (z) {
        throw v.value = me(z), z;
      } finally {
        h.value = !1, f("loading:stop", { fetched: a.value.length });
      }
    }
  }
  function D() {
    const z = o;
    u.value = !0, h.value = !1, o = !1, z && f("backfill:stop", { fetched: a.value.length, calls: 0, cancelled: !0 }), f("loading:stop", { fetched: a.value.length });
  }
  return {
    loadPage: F,
    loadNext: A,
    refreshCurrentPage: H,
    cancelLoad: D,
    maybeBackfillToTarget: S,
    getContent: L
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
  let r = /* @__PURE__ */ new Set(), c = null, y = !1;
  async function t() {
    if (r.size === 0 || y) return;
    y = !0;
    const f = Array.from(r);
    r.clear(), c = null, await M(f), y = !1;
  }
  async function w(f) {
    r.add(f), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16);
  }
  async function M(f) {
    if (!f || f.length === 0) return;
    const u = new Set(f.map((k) => k.id)), o = n.value.filter((k) => !u.has(k.id));
    if (n.value = o, await _(), o.length === 0 && v.value.length > 0) {
      try {
        await h(), await d(0, !0);
      } catch {
      }
      return;
    }
    await new Promise((k) => requestAnimationFrame(() => k())), requestAnimationFrame(() => {
      a(o);
    });
  }
  async function p(f) {
    !f || f.length === 0 || (f.forEach((u) => r.add(u)), c && clearTimeout(c), c = setTimeout(() => {
      t();
    }, 16));
  }
  async function g(f, u) {
    if (!f) return;
    const o = n.value;
    if (o.findIndex((L) => L.id === f.id) !== -1) return;
    const E = [...o], m = Math.min(u, E.length);
    E.splice(m, 0, f), n.value = E, await _(), i.value || (await new Promise((L) => requestAnimationFrame(() => L())), requestAnimationFrame(() => {
      a(E);
    }));
  }
  async function T(f, u) {
    var H;
    if (!f || f.length === 0) return;
    if (!u || u.length !== f.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const o = n.value, k = new Set(o.map((D) => D.id)), E = [];
    for (let D = 0; D < f.length; D++)
      k.has((H = f[D]) == null ? void 0 : H.id) || E.push({ item: f[D], index: u[D] });
    if (E.length === 0) return;
    const m = /* @__PURE__ */ new Map();
    for (const { item: D, index: z } of E)
      m.set(z, D);
    const L = E.length > 0 ? Math.max(...E.map(({ index: D }) => D)) : -1, S = Math.max(o.length - 1, L), F = [];
    let A = 0;
    for (let D = 0; D <= S; D++)
      m.has(D) ? F.push(m.get(D)) : A < o.length && (F.push(o[A]), A++);
    for (; A < o.length; )
      F.push(o[A]), A++;
    n.value = F, await _(), i.value || (await new Promise((D) => requestAnimationFrame(() => D())), requestAnimationFrame(() => {
      a(F);
    }));
  }
  async function I() {
    n.value = [];
  }
  return {
    remove: w,
    removeMany: p,
    restore: g,
    restoreMany: T,
    removeAll: I
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
    layout: r,
    fixedDimensions: c,
    checkItemDimensions: y
  } = e;
  let t = [];
  function w(T) {
    const I = Qt(T);
    let f = 0;
    if (a.value) {
      const { scrollTop: u, clientHeight: o } = a.value;
      f = u + o + 100;
    }
    v.value = Math.max(I, f);
  }
  function M(T) {
    var k, E;
    if (i.value) {
      n.value = T;
      return;
    }
    if (!a.value) {
      n.value = T;
      return;
    }
    const I = a.value.clientWidth || d.value;
    if (I <= 0) {
      _(() => {
        var L;
        const m = ((L = a.value) == null ? void 0 : L.clientWidth) || d.value;
        if (m <= 0) {
          n.value = T;
          return;
        }
        d.value !== m && (d.value = m), M(T);
      });
      return;
    }
    if (d.value !== I && (d.value = I), y(T, "refreshLayout"), T.length > 1e3 && t.length > T.length && t.length - T.length < 100) {
      let m = !0;
      for (let L = 0; L < T.length; L++)
        if (((k = T[L]) == null ? void 0 : k.id) !== ((E = t[L]) == null ? void 0 : E.id)) {
          m = !1;
          break;
        }
      if (m) {
        const L = T.map((S, F) => ({
          ...t[F],
          originalIndex: F
        }));
        w(L), n.value = L, t = L;
        return;
      }
    }
    const u = T.map((m, L) => ({
      ...m,
      originalIndex: L
    })), o = a.value;
    if (c.value && c.value.width !== void 0) {
      const m = o.style.width, L = o.style.boxSizing;
      o.style.boxSizing = "border-box", o.style.width = `${c.value.width}px`, o.offsetWidth;
      const S = Ce(u, o, h.value, r.value);
      o.style.width = m, o.style.boxSizing = L, w(S), n.value = S, t = S;
    } else {
      const m = Ce(u, o, h.value, r.value);
      w(m), n.value = m, t = m;
    }
  }
  function p(T, I) {
    c.value = T, T && (T.width !== void 0 && (d.value = T.width), !i.value && a.value && n.value.length > 0 && _(() => {
      h.value = se(r.value, d.value), M(n.value), I && I();
    }));
  }
  function g() {
    h.value = se(r.value, d.value), M(n.value);
  }
  return {
    refreshLayout: M,
    setFixedDimensions: p,
    onResize: g,
    calculateHeight: w
  };
}
function ia(e) {
  const {
    masonry: n,
    container: i,
    columns: a,
    virtualBufferPx: h,
    loadThresholdPx: d
  } = e, v = N(e.handleScroll), r = N(0), c = N(0), y = h, t = N(!1), w = N({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), M = K(() => {
    const I = r.value - y, f = r.value + c.value + y, u = n.value;
    return !u || u.length === 0 ? [] : u.filter((k) => {
      if (typeof k.top != "number" || typeof k.columnHeight != "number")
        return !0;
      const E = k.top;
      return k.top + k.columnHeight >= I && E <= f;
    });
  });
  function p(I) {
    if (!i.value) return;
    const { scrollTop: f, clientHeight: u } = i.value, o = f + u, k = I ?? $e(n.value, a.value), E = k.length ? Math.max(...k) : 0, m = typeof d == "number" ? d : 200, L = m >= 0 ? Math.max(0, E - m) : Math.max(0, E + m), S = Math.max(0, L - o), F = S <= 100;
    w.value = {
      distanceToTrigger: Math.round(S),
      isNearTrigger: F
    };
  }
  async function g() {
    if (i.value) {
      const f = i.value.scrollTop, u = i.value.clientHeight || window.innerHeight, o = u > 0 ? u : window.innerHeight;
      r.value = f, c.value = o;
    }
    t.value = !0, await _(), await new Promise((f) => requestAnimationFrame(() => f())), t.value = !1;
    const I = $e(n.value, a.value);
    v.value(I), p(I);
  }
  function T() {
    r.value = 0, c.value = 0, t.value = !1, w.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: r,
    viewportHeight: c,
    virtualizing: t,
    scrollProgress: w,
    visibleMasonry: M,
    updateScrollProgress: p,
    updateViewport: g,
    reset: T,
    handleScroll: v
  };
}
function sa(e) {
  const { masonry: n } = e, i = N(/* @__PURE__ */ new Set());
  function a(v) {
    return typeof v == "number" && v > 0 && Number.isFinite(v);
  }
  function h(v, r) {
    try {
      if (!Array.isArray(v) || v.length === 0) return;
      const c = v.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
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
            context: r,
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
    const i = e, a = n, h = N(!1), d = N(!1), v = N(null), r = N(!1), c = N(!1), y = N(null), t = N(!1), w = N(!1), M = N(!1), p = N(!1), g = N(!1), T = N(null), I = N(null);
    let f = null;
    const u = K(() => {
      var l;
      return i.type ?? ((l = i.item) == null ? void 0 : l.type) ?? "image";
    }), o = K(() => {
      var l;
      return i.notFound ?? ((l = i.item) == null ? void 0 : l.notFound) ?? !1;
    }), k = K(() => !!i.inSwipeMode);
    function E(l, x) {
      const P = l === "image" ? h.value : r.value;
      w.value && P && !M.value && (M.value = !0, a("in-view-and-loaded", { item: i.item, type: l, src: x }));
    }
    function m(l) {
      a("mouse-enter", { item: i.item, type: l });
    }
    function L(l) {
      a("mouse-leave", { item: i.item, type: l });
    }
    function S(l) {
      if (k.value) return;
      const x = l.target;
      x && (x.paused ? x.play() : x.pause());
    }
    function F(l) {
      const x = l.target;
      x && (k.value || x.play(), m("video"));
    }
    function A(l) {
      const x = l.target;
      x && (k.value || x.pause(), L("video"));
    }
    function H(l) {
      return new Promise((x, P) => {
        if (!l) {
          const b = new Error("No image source provided");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), P(b);
          return;
        }
        const W = new Image(), V = Date.now(), C = 300;
        W.onload = () => {
          const b = Date.now() - V, $ = Math.max(0, C - b);
          setTimeout(async () => {
            h.value = !0, d.value = !1, p.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), g.value = !0, a("preload:success", { item: i.item, type: "image", src: l }), E("image", l), x();
          }, $);
        }, W.onerror = () => {
          d.value = !0, h.value = !1, p.value = !1;
          const b = new Error("Failed to load image");
          a("preload:error", { item: i.item, type: "image", src: l, error: b }), P(b);
        }, W.src = l;
      });
    }
    function D(l) {
      return new Promise((x, P) => {
        if (!l) {
          const b = new Error("No video source provided");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), P(b);
          return;
        }
        const W = document.createElement("video"), V = Date.now(), C = 300;
        W.preload = "metadata", W.muted = !0, W.onloadedmetadata = () => {
          const b = Date.now() - V, $ = Math.max(0, C - b);
          setTimeout(async () => {
            r.value = !0, c.value = !1, p.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), g.value = !0, a("preload:success", { item: i.item, type: "video", src: l }), E("video", l), x();
          }, $);
        }, W.onerror = () => {
          c.value = !0, r.value = !1, p.value = !1;
          const b = new Error("Failed to load video");
          a("preload:error", { item: i.item, type: "video", src: l, error: b }), P(b);
        }, W.src = l;
      });
    }
    async function z() {
      var x;
      if (!t.value || p.value || o.value || u.value === "video" && r.value || u.value === "image" && h.value)
        return;
      const l = (x = i.item) == null ? void 0 : x.src;
      if (l)
        if (p.value = !0, g.value = !1, u.value === "video") {
          y.value = l, r.value = !1, c.value = !1;
          try {
            await D(l);
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
    return Xe(async () => {
      if (!T.value) return;
      const l = [i.preloadThreshold, 1].filter((P, W, V) => V.indexOf(P) === W).sort((P, W) => P - W);
      f = new IntersectionObserver(
        (P) => {
          P.forEach((W) => {
            const V = W.intersectionRatio, C = V >= 1, b = V >= i.preloadThreshold;
            if (C && !w.value) {
              w.value = !0, a("in-view", { item: i.item, type: u.value });
              const $ = u.value === "image" ? v.value : y.value, R = u.value === "image" ? h.value : r.value;
              $ && R && E(u.value, $);
            }
            b && !t.value ? (t.value = !0, z()) : W.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: l
        }
      ), f.observe(T.value), await _(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          x();
        });
      }), setTimeout(() => {
        x();
      }, 100);
      function x() {
        if (!T.value || w.value) return;
        const P = T.value.getBoundingClientRect(), W = window.innerHeight, V = window.innerWidth;
        if (P.top >= 0 && P.bottom <= W && P.left >= 0 && P.right <= V && P.height > 0 && P.width > 0) {
          w.value = !0, a("in-view", { item: i.item, type: u.value });
          const b = u.value === "image" ? v.value : y.value, $ = u.value === "image" ? h.value : r.value;
          b && $ && E(u.value, b);
        }
      }
    }), Ge(() => {
      f && (f.disconnect(), f = null);
    }), ee(
      () => {
        var l;
        return (l = i.item) == null ? void 0 : l.src;
      },
      async (l) => {
        if (!(!l || o.value)) {
          if (u.value === "video") {
            if (l !== y.value && (r.value = !1, c.value = !1, y.value = l, t.value)) {
              p.value = !0;
              try {
                await D(l);
              } catch {
              }
            }
          } else if (l !== v.value && (h.value = !1, d.value = !1, v.value = l, t.value)) {
            p.value = !0;
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
        !k.value || !I.value || (l ? I.value.play() : I.value.pause());
      }
    ), (l, x) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: T,
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
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: r.value,
          videoError: c.value,
          showNotFound: o.value,
          isLoading: p.value,
          mediaType: u.value,
          isFullyInView: w.value
        })
      ], 4)) : te("", !0),
      U("div", ua, [
        J(l.$slots, "default", {
          item: l.item,
          remove: l.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: r.value,
          videoError: c.value,
          showNotFound: o.value,
          isLoading: p.value,
          mediaType: u.value,
          imageSrc: v.value,
          videoSrc: y.value,
          showMedia: g.value,
          isFullyInView: w.value
        }, () => [
          U("div", ca, [
            o.value ? (Y(), q("div", va, x[3] || (x[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", fa, [
              u.value === "image" && v.value ? (Y(), q("img", {
                key: 0,
                src: v.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  h.value && g.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: x[0] || (x[0] = (P) => m("image")),
                onMouseleave: x[1] || (x[1] = (P) => L("image"))
              }, null, 42, da)) : te("", !0),
              u.value === "video" && y.value ? (Y(), q("video", {
                key: 1,
                ref_key: "videoEl",
                ref: I,
                src: y.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  r.value && g.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: k.value && i.isActive,
                controls: k.value,
                onClick: Ae(S, ["stop"]),
                onTouchend: Ae(S, ["stop", "prevent"]),
                onMouseenter: F,
                onMouseleave: A,
                onError: x[2] || (x[2] = (P) => c.value = !0)
              }, null, 42, ma)) : te("", !0),
              !h.value && !r.value && !d.value && !c.value ? (Y(), q("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  g.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", ha, [
                  J(l.$slots, "placeholder-icon", { mediaType: u.value }, () => [
                    U("i", {
                      class: re(u.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : te("", !0),
              p.value ? (Y(), q("div", ga, x[4] || (x[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : te("", !0),
              u.value === "image" && d.value || u.value === "video" && c.value ? (Y(), q("div", pa, [
                U("i", {
                  class: re(u.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + Pe(u.value), 1)
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
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: r.value,
          videoError: c.value,
          showNotFound: o.value,
          isLoading: p.value,
          mediaType: u.value,
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
      var s;
      return {
        ...h,
        ...a.layout,
        sizes: {
          ...h.sizes,
          ...((s = a.layout) == null ? void 0 : s.sizes) || {}
        }
      };
    }), v = N(null), r = N(typeof window < "u" ? window.innerWidth : 1024), c = N(typeof window < "u" ? window.innerHeight : 768), y = N(null);
    let t = null;
    function w(s) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[s] || 768;
    }
    const M = K(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const s = typeof a.mobileBreakpoint == "string" ? w(a.mobileBreakpoint) : a.mobileBreakpoint;
      return r.value < s;
    }), p = i, g = K({
      get: () => a.items,
      set: (s) => p("update:items", s)
    }), T = K({
      get: () => a.context,
      set: (s) => p("update:context", s)
    });
    function I(s) {
      T.value = s;
    }
    const f = K(() => {
      const s = g.value;
      return (s == null ? void 0 : s.length) ?? 0;
    }), u = N(7), o = N(null), k = N([]), E = N(null), m = N(!1), L = N(0), S = N(!1), F = N(null), A = N(!1), H = K(() => Kt(r.value)), D = sa({
      masonry: g
    }), { checkItemDimensions: z, reset: l } = D, x = ra({
      masonry: g,
      useSwipeMode: M,
      container: o,
      columns: u,
      containerWidth: r,
      masonryContentHeight: L,
      layout: d,
      fixedDimensions: y,
      checkItemDimensions: z
    }), { refreshLayout: P, setFixedDimensions: W, onResize: V } = x, C = ia({
      masonry: g,
      container: o,
      columns: u,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: b, viewportHeight: $, virtualizing: R, visibleMasonry: ne, updateScrollProgress: X, updateViewport: ie, reset: Q } = C, { onEnter: Qe, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = ta(
      { container: o },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: R }
    ), at = Qe, nt = Ze, lt = et, ot = tt, rt = la({
      getPage: a.getPage,
      context: T,
      masonry: g,
      isLoading: m,
      hasReachedEnd: S,
      loadError: F,
      currentPage: E,
      paginationHistory: k,
      refreshLayout: P,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: a.mode,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: p
    }), { loadPage: be, loadNext: ge, refreshCurrentPage: it, cancelLoad: Me, maybeBackfillToTarget: st } = rt, Z = na({
      useSwipeMode: M,
      masonry: g,
      isLoading: m,
      loadNext: ge,
      loadPage: be,
      paginationHistory: k
    }), { handleScroll: ut } = aa({
      container: o,
      masonry: g,
      columns: u,
      containerHeight: L,
      isLoading: m,
      pageSize: a.pageSize,
      refreshLayout: P,
      setItemsRaw: (s) => {
        g.value = s;
      },
      loadNext: ge,
      loadThresholdPx: a.loadThresholdPx
    });
    C.handleScroll.value = ut;
    const ct = oa({
      masonry: g,
      useSwipeMode: M,
      refreshLayout: P,
      loadNext: ge,
      maybeBackfillToTarget: st,
      paginationHistory: k
    }), { remove: ue, removeMany: vt, restore: ft, restoreMany: dt, removeAll: mt } = ct;
    function ht(s) {
      W(s, X), !s && v.value && (r.value = v.value.clientWidth, c.value = v.value.clientHeight);
    }
    n({
      // Cancels any ongoing load operations (page loads, backfills, etc.)
      cancelLoad: Me,
      // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
      context: T,
      // Container height (wrapper element) in pixels
      containerHeight: c,
      // Container width (wrapper element) in pixels
      containerWidth: r,
      // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
      currentBreakpoint: H,
      // Current page number or cursor being displayed
      currentPage: E,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Mt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: S,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: Tt,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: A,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: m,
      // Error object if the last load operation failed, null otherwise
      loadError: F,
      // Loads the next page of items asynchronously
      loadNext: ge,
      // Loads a specific page number or cursor asynchronously
      loadPage: be,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: k,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: it,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: P,
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
      setContext: I,
      // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
      setFixedDimensions: ht,
      // Computed property returning the total number of items currently in the masonry
      totalItems: K(() => g.value.length)
    });
    const ce = Z.currentSwipeIndex, pe = Z.swipeOffset, ye = Z.isDragging, le = Z.swipeContainer, Fe = Z.handleTouchStart, ze = Z.handleTouchMove, De = Z.handleTouchEnd, We = Z.handleMouseDown, Te = Z.handleMouseMove, Ie = Z.handleMouseUp, Le = Z.snapToCurrentItem;
    function gt(s) {
      const B = f.value, j = typeof s == "string" ? parseInt(s, 10) : s;
      return B > 0 ? `${j * (100 / B)}%` : "0%";
    }
    function pt() {
      const s = f.value;
      return s > 0 ? `${100 / s}%` : "0%";
    }
    function yt(s) {
      o.value && o.value.scrollTo({
        top: 0,
        behavior: (s == null ? void 0 : s.behavior) ?? "smooth",
        ...s
      });
    }
    function wt(s) {
      o.value && (o.value.scrollTo({
        top: s.top ?? o.value.scrollTop,
        left: s.left ?? o.value.scrollLeft,
        behavior: s.behavior ?? "auto"
      }), o.value && (b.value = o.value.scrollTop, $.value = o.value.clientHeight || window.innerHeight));
    }
    function xt() {
      V(), o.value && (b.value = o.value.scrollTop, $.value = o.value.clientHeight);
    }
    function bt() {
      Me(), o.value && o.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), g.value = [], c.value = 0, E.value = a.loadAtPage, k.value = [a.loadAtPage], S.value = !1, F.value = null, A.value = !1, Q();
    }
    function Mt() {
      Me(), g.value = [], L.value = 0, E.value = null, k.value = [], S.value = !1, F.value = null, m.value = !1, A.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, Q(), l(), o.value && o.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ye(async () => {
      M.value || await ie();
    }, 200), Be = Ye(xt, 200);
    function Ne() {
      Z.handleWindowResize();
    }
    function Tt(s, B, j) {
      E.value = B, k.value = [B], j != null && k.value.push(j), S.value = j === null, z(s, "initialize");
      const ae = g.value, O = ae.length === 0 ? s : [...ae, ...s];
      M.value ? (g.value = O, ce.value === 0 && g.value.length > 0 && (pe.value = 0)) : (P(O), o.value && (b.value = o.value.scrollTop, $.value = o.value.clientHeight || window.innerHeight), _(() => {
        o.value && (b.value = o.value.scrollTop, $.value = o.value.clientHeight || window.innerHeight, X());
      })), s && s.length > 0 && (A.value = !0);
    }
    return ee(
      d,
      () => {
        M.value || o.value && (u.value = se(d.value, r.value), P(g.value));
      },
      { deep: !0 }
    ), ee(() => a.layoutMode, () => {
      y.value && y.value.width !== void 0 ? r.value = y.value.width : v.value && (r.value = v.value.clientWidth);
    }), ee(o, (s) => {
      s && !M.value ? (s.removeEventListener("scroll", oe), s.addEventListener("scroll", oe, { passive: !0 })) : s && s.removeEventListener("scroll", oe);
    }, { immediate: !0 }), ee(
      () => g.value.length,
      (s, B) => {
        a.init === "manual" && !A.value && s > 0 && B === 0 && (A.value = !0);
      },
      { immediate: !1 }
    ), ee(M, (s, B) => {
      B === void 0 && s === !1 || _(() => {
        s ? (document.addEventListener("mousemove", Te), document.addEventListener("mouseup", Ie), o.value && o.value.removeEventListener("scroll", oe), ce.value = 0, pe.value = 0, g.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie), o.value && v.value && (y.value && y.value.width !== void 0 ? r.value = y.value.width : r.value = v.value.clientWidth, o.value.removeEventListener("scroll", oe), o.value.addEventListener("scroll", oe, { passive: !0 }), g.value.length > 0 && (u.value = se(d.value, r.value), P(g.value), b.value = o.value.scrollTop, $.value = o.value.clientHeight, X())));
      });
    }, { immediate: !0 }), ee(le, (s) => {
      s && (s.addEventListener("touchstart", Fe, { passive: !1 }), s.addEventListener("touchmove", ze, { passive: !1 }), s.addEventListener("touchend", De), s.addEventListener("mousedown", We));
    }), ee(() => g.value.length, (s, B) => {
      M.value && s > 0 && B === 0 && (ce.value = 0, _(() => Le()));
    }), ee(v, (s) => {
      t && (t.disconnect(), t = null), s && typeof ResizeObserver < "u" ? (t = new ResizeObserver((B) => {
        if (!y.value)
          for (const j of B) {
            const ae = j.contentRect.width, O = j.contentRect.height;
            r.value !== ae && (r.value = ae), c.value !== O && (c.value = O);
          }
      }), t.observe(s), y.value || (r.value = s.clientWidth, c.value = s.clientHeight)) : s && (y.value || (r.value = s.clientWidth, c.value = s.clientHeight));
    }, { immediate: !0 }), ee(r, (s, B) => {
      s !== B && s > 0 && !M.value && o.value && g.value.length > 0 && _(() => {
        u.value = se(d.value, s), P(g.value), X();
      });
    }), Xe(async () => {
      try {
        await _(), v.value && !t && (r.value = v.value.clientWidth, c.value = v.value.clientHeight), M.value || (u.value = se(d.value, r.value), o.value && (b.value = o.value.scrollTop, $.value = o.value.clientHeight));
        const s = a.loadAtPage;
        if (k.value = [s], a.init === "auto") {
          A.value = !0, await _();
          try {
            await be(s);
          } catch {
          }
        }
        M.value ? _(() => Le()) : X();
      } catch (s) {
        F.value || (console.error("Error during component initialization:", s), F.value = me(s)), m.value = !1;
      }
      window.addEventListener("resize", Be), window.addEventListener("resize", Ne);
    }), Ge(() => {
      var s;
      t && (t.disconnect(), t = null), (s = o.value) == null || s.removeEventListener("scroll", oe), window.removeEventListener("resize", Be), window.removeEventListener("resize", Ne), le.value && (le.value.removeEventListener("touchstart", Fe), le.value.removeEventListener("touchmove", ze), le.value.removeEventListener("touchend", De), le.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ie);
    }), (s, B) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: v,
      class: "w-full h-full flex flex-col relative"
    }, [
      A.value ? M.value ? (Y(), q("div", {
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
            height: `${f.value * 100}%`
          })
        }, [
          (Y(!0), q(Re, null, Oe(g.value, (j, ae) => (Y(), q("div", {
            key: `${j.page}-${j.id}`,
            class: "absolute top-0 left-0 w-full",
            style: he({
              top: gt(ae),
              height: pt()
            })
          }, [
            U("div", wa, [
              U("div", xa, [
                J(s.$slots, "default", {
                  item: j,
                  remove: G(ue),
                  index: j.originalIndex ?? g.value.indexOf(j)
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
                      J(s.$slots, "item-header", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: ve((O) => [
                      J(s.$slots, "item-footer", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        S.value && g.value.length > 0 ? (Y(), q("div", ba, [
          J(s.$slots, "end-message", {}, () => [
            B[9] || (B[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        F.value && g.value.length > 0 ? (Y(), q("div", Ma, [
          J(s.$slots, "error-message", { error: F.value }, () => [
            U("p", Ta, "Failed to load content: " + Pe(F.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (Y(), q("div", {
        key: 2,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: o
      }, [
        U("div", {
          class: "relative",
          style: he({ height: `${L.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
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
                J(s.$slots, "default", {
                  item: j,
                  remove: G(ue),
                  index: j.originalIndex ?? g.value.indexOf(j)
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
                      J(s.$slots, "item-header", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: ve((O) => [
                      J(s.$slots, "item-footer", fe({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        S.value && g.value.length > 0 ? (Y(), q("div", Ia, [
          J(s.$slots, "end-message", {}, () => [
            B[10] || (B[10] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        F.value && g.value.length > 0 ? (Y(), q("div", La, [
          J(s.$slots, "error-message", { error: F.value }, () => [
            U("p", Sa, "Failed to load content: " + Pe(F.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2)) : (Y(), q("div", ya, [
        J(s.$slots, "loading-message", {}, () => [
          B[8] || (B[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ea = (e, n) => {
  const i = e.__vccOpts || e;
  for (const [a, h] of n)
    i[a] = h;
  return i;
}, Ue = /* @__PURE__ */ Ea(ka, [["__scopeId", "data-v-1eeaca5b"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ue), e.component("WMasonry", Ue), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  Ue as Masonry,
  xe as MasonryItem,
  Ha as default
};
