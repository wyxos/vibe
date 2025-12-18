import { nextTick as q, ref as z, computed as Q, defineComponent as Je, onMounted as Ke, onUnmounted as Qe, watch as te, createElementBlock as R, openBlock as O, createCommentVNode as ee, createElementVNode as V, normalizeStyle as ge, renderSlot as _, normalizeClass as re, withModifiers as Ce, toDisplayString as He, unref as U, Fragment as je, renderList as Ve, createVNode as ke, withCtx as fe, mergeProps as de, TransitionGroup as wt } from "vue";
let Le = null;
function xt() {
  if (Le != null) return Le;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const r = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), Le = r, r;
}
function qe(e, l, r, n = {}) {
  const {
    gutterX: y = 0,
    gutterY: h = 0,
    header: m = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: b = 0,
    sizes: a = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: p = "masonry"
  } = n;
  let x = 0, M = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(l);
      x = parseFloat(L.paddingLeft) || 0, M = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const s = (w || 0) + x, g = (b || 0) + M, t = l.offsetWidth - l.clientWidth, d = t > 0 ? t + 2 : xt() + 2, v = l.offsetWidth - d - s - g, T = y * (r - 1), S = Math.floor((v - T) / r), E = e.map((L) => {
    const k = L.width, W = L.height;
    return Math.round(S * W / k) + i + m;
  });
  if (p === "sequential-balanced") {
    const L = E.length;
    if (L === 0) return [];
    const k = (B, Y, G) => B + (Y > 0 ? h : 0) + G;
    let W = Math.max(...E), o = E.reduce((B, Y) => B + Y, 0) + h * Math.max(0, L - 1);
    const u = (B) => {
      let Y = 1, G = 0, ne = 0;
      for (let J = 0; J < L; J++) {
        const ie = E[J], Z = k(G, ne, ie);
        if (Z <= B)
          G = Z, ne++;
        else if (Y++, G = ie, ne = 1, ie > B || Y > r) return !1;
      }
      return Y <= r;
    };
    for (; W < o; ) {
      const B = Math.floor((W + o) / 2);
      u(B) ? o = B : W = B + 1;
    }
    const I = o, $ = new Array(r).fill(0);
    let C = r - 1, F = 0, D = 0;
    for (let B = L - 1; B >= 0; B--) {
      const Y = E[B], G = B < C;
      !(k(F, D, Y) <= I) || G ? ($[C] = B + 1, C--, F = Y, D = 1) : (F = k(F, D, Y), D++);
    }
    $[0] = 0;
    const j = [], X = new Array(r).fill(0);
    for (let B = 0; B < r; B++) {
      const Y = $[B], G = B + 1 < r ? $[B + 1] : L, ne = B * (S + y);
      for (let J = Y; J < G; J++) {
        const Z = {
          ...e[J],
          columnWidth: S,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = E[J] - (i + m), Z.columnHeight = E[J], Z.left = ne, Z.top = X[B], X[B] += Z.columnHeight + (J + 1 < G ? h : 0), j.push(Z);
      }
    }
    return j;
  }
  const f = new Array(r).fill(0), P = [];
  for (let L = 0; L < e.length; L++) {
    const k = e[L], W = {
      ...k,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, o = f.indexOf(Math.min(...f)), u = k.width, I = k.height;
    W.columnWidth = S, W.left = o * (S + y), W.imageHeight = Math.round(S * I / u), W.columnHeight = W.imageHeight + i + m, W.top = f[o], f[o] += W.columnHeight + h, P.push(W);
  }
  return P;
}
var bt = typeof global == "object" && global && global.Object === Object && global, Mt = typeof self == "object" && self && self.Object === Object && self, Ze = bt || Mt || Function("return this")(), we = Ze.Symbol, et = Object.prototype, Tt = et.hasOwnProperty, Et = et.toString, me = we ? we.toStringTag : void 0;
function It(e) {
  var l = Tt.call(e, me), r = e[me];
  try {
    e[me] = void 0;
    var n = !0;
  } catch {
  }
  var y = Et.call(e);
  return n && (l ? e[me] = r : delete e[me]), y;
}
var kt = Object.prototype, Lt = kt.toString;
function St(e) {
  return Lt.call(e);
}
var Ht = "[object Null]", Pt = "[object Undefined]", Ye = we ? we.toStringTag : void 0;
function $t(e) {
  return e == null ? e === void 0 ? Pt : Ht : Ye && Ye in Object(e) ? It(e) : St(e);
}
function Dt(e) {
  return e != null && typeof e == "object";
}
var zt = "[object Symbol]";
function Bt(e) {
  return typeof e == "symbol" || Dt(e) && $t(e) == zt;
}
var Nt = /\s/;
function Ft(e) {
  for (var l = e.length; l-- && Nt.test(e.charAt(l)); )
    ;
  return l;
}
var At = /^\s+/;
function Wt(e) {
  return e && e.slice(0, Ft(e) + 1).replace(At, "");
}
function Pe(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var Ue = NaN, Rt = /^[-+]0x[0-9a-f]+$/i, Ot = /^0b[01]+$/i, Ct = /^0o[0-7]+$/i, jt = parseInt;
function _e(e) {
  if (typeof e == "number")
    return e;
  if (Bt(e))
    return Ue;
  if (Pe(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Pe(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Wt(e);
  var r = Ot.test(e);
  return r || Ct.test(e) ? jt(e.slice(2), r ? 2 : 8) : Rt.test(e) ? Ue : +e;
}
var Se = function() {
  return Ze.Date.now();
}, Vt = "Expected a function", qt = Math.max, Yt = Math.min;
function Xe(e, l, r) {
  var n, y, h, m, i, w, b = 0, a = !1, p = !1, x = !0;
  if (typeof e != "function")
    throw new TypeError(Vt);
  l = _e(l) || 0, Pe(r) && (a = !!r.leading, p = "maxWait" in r, h = p ? qt(_e(r.maxWait) || 0, l) : h, x = "trailing" in r ? !!r.trailing : x);
  function M(f) {
    var P = n, L = y;
    return n = y = void 0, b = f, m = e.apply(L, P), m;
  }
  function s(f) {
    return b = f, i = setTimeout(d, l), a ? M(f) : m;
  }
  function g(f) {
    var P = f - w, L = f - b, k = l - P;
    return p ? Yt(k, h - L) : k;
  }
  function t(f) {
    var P = f - w, L = f - b;
    return w === void 0 || P >= l || P < 0 || p && L >= h;
  }
  function d() {
    var f = Se();
    if (t(f))
      return v(f);
    i = setTimeout(d, g(f));
  }
  function v(f) {
    return i = void 0, x && n ? M(f) : (n = y = void 0, m);
  }
  function T() {
    i !== void 0 && clearTimeout(i), b = 0, n = w = y = i = void 0;
  }
  function S() {
    return i === void 0 ? m : v(Se());
  }
  function E() {
    var f = Se(), P = t(f);
    if (n = arguments, y = this, w = f, P) {
      if (i === void 0)
        return s(w);
      if (p)
        return clearTimeout(i), i = setTimeout(d, l), M(w);
    }
    return i === void 0 && (i = setTimeout(d, l)), m;
  }
  return E.cancel = T, E.flush = S, E;
}
function ue(e, l) {
  const r = l ?? (typeof window < "u" ? window.innerWidth : 1024), n = e.sizes;
  return r >= 1536 && n["2xl"] ? n["2xl"] : r >= 1280 && n.xl ? n.xl : r >= 1024 && n.lg ? n.lg : r >= 768 && n.md ? n.md : r >= 640 && n.sm ? n.sm : n.base;
}
function Ut(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function _t(e) {
  return e.reduce((r, n) => Math.max(r, n.top + n.columnHeight), 0) + 500;
}
function Xt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function Gt(e, l = 0) {
  return {
    style: Xt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function $e(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const n = Array.from(new Set(e.map((m) => m.left))).sort((m, i) => m - i).slice(0, l), y = /* @__PURE__ */ new Map();
  for (let m = 0; m < n.length; m++) y.set(n[m], m);
  const h = new Array(n.length).fill(0);
  for (const m of e) {
    const i = y.get(m.left);
    i != null && (h[i] = Math.max(h[i], m.top + m.columnHeight));
  }
  for (; h.length < l; ) h.push(0);
  return h;
}
function Jt(e, l) {
  let r = 0, n = 0;
  const y = 1e3;
  function h(a, p) {
    var s;
    const x = (s = e.container) == null ? void 0 : s.value;
    if (x) {
      const g = x.scrollTop, t = x.clientHeight;
      r = g - y, n = g + t + y;
    }
    return a + p >= r && a <= n;
  }
  function m(a, p) {
    var v;
    const x = parseInt(a.dataset.left || "0", 10), M = parseInt(a.dataset.top || "0", 10), s = parseInt(a.dataset.index || "0", 10), g = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((v = l == null ? void 0 : l.virtualizing) != null && v.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "", p();
      });
      return;
    }
    if (!h(M, g)) {
      a.style.opacity = "1", a.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`, a.style.transition = "none", p();
      return;
    }
    const t = Math.min(s * 20, 160), d = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${t}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`;
      const T = () => {
        d ? a.style.setProperty("--masonry-opacity-delay", d) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", T), p();
      };
      a.addEventListener("transitionend", T);
    });
  }
  function i(a) {
    var M;
    const p = parseInt(a.dataset.left || "0", 10), x = parseInt(a.dataset.top || "0", 10);
    if ((M = l == null ? void 0 : l.virtualizing) != null && M.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${x}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    a.style.opacity = "0", a.style.transform = `translate3d(${p}px, ${x + 10}px, 0) scale(0.985)`;
  }
  function w(a) {
    var s;
    const p = parseInt(a.dataset.left || "0", 10), x = parseInt(a.dataset.top || "0", 10), M = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if (!((s = l == null ? void 0 : l.virtualizing) != null && s.value)) {
      if (!h(x, M)) {
        a.style.transition = "none";
        return;
      }
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${x}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "";
      });
    }
  }
  function b(a, p) {
    var E;
    const x = parseInt(a.dataset.left || "0", 10), M = parseInt(a.dataset.top || "0", 10), s = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((E = l == null ? void 0 : l.virtualizing) != null && E.value) {
      p();
      return;
    }
    if (!h(M, s)) {
      a.style.transition = "none", a.style.opacity = "0", p();
      return;
    }
    const g = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let t = Number.isFinite(g) && g > 0 ? g : NaN;
    if (!Number.isFinite(t)) {
      const P = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(P);
      t = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const d = a.style.transitionDuration, v = () => {
      a.removeEventListener("transitionend", T), clearTimeout(S), a.style.transitionDuration = d || "";
    }, T = (f) => {
      (!f || f.target === a) && (v(), p());
    }, S = setTimeout(() => {
      v(), p();
    }, t + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${t}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${x}px, ${M + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", T);
    });
  }
  return {
    onEnter: m,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: b
  };
}
function Kt({
  container: e,
  masonry: l,
  columns: r,
  containerHeight: n,
  isLoading: y,
  pageSize: h,
  refreshLayout: m,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: b
}) {
  let a = 0;
  async function p(x) {
    if (!e.value) return;
    const M = x ?? $e(l.value, r.value), s = M.length ? Math.max(...M) : 0, g = e.value.scrollTop + e.value.clientHeight, t = e.value.scrollTop > a + 1;
    a = e.value.scrollTop;
    const d = typeof b == "number" ? b : 200, v = d >= 0 ? Math.max(0, s - d) : Math.max(0, s + d);
    if (g >= v && t && !y.value) {
      await w(), await q();
      return;
    }
  }
  return {
    handleScroll: p
  };
}
function Qt(e) {
  const { useSwipeMode: l, masonry: r, isLoading: n, loadNext: y, loadPage: h, paginationHistory: m } = e, i = z(0), w = z(0), b = z(!1), a = z(0), p = z(0), x = z(null), M = Q(() => {
    if (!l.value || r.value.length === 0) return null;
    const o = Math.max(0, Math.min(i.value, r.value.length - 1));
    return r.value[o] || null;
  }), s = Q(() => {
    if (!l.value || !M.value) return null;
    const o = i.value + 1;
    return o >= r.value.length ? null : r.value[o] || null;
  }), g = Q(() => {
    if (!l.value || !M.value) return null;
    const o = i.value - 1;
    return o < 0 ? null : r.value[o] || null;
  });
  function t() {
    if (!x.value) return;
    const o = x.value.clientHeight;
    w.value = -i.value * o;
  }
  function d() {
    if (!s.value) {
      y();
      return;
    }
    i.value++, t(), i.value >= r.value.length - 5 && y();
  }
  function v() {
    g.value && (i.value--, t());
  }
  function T(o) {
    l.value && (b.value = !0, a.value = o.touches[0].clientY, p.value = w.value, o.preventDefault());
  }
  function S(o) {
    if (!l.value || !b.value) return;
    const u = o.touches[0].clientY - a.value;
    w.value = p.value + u, o.preventDefault();
  }
  function E(o) {
    if (!l.value || !b.value) return;
    b.value = !1;
    const u = w.value - p.value;
    Math.abs(u) > 100 ? u > 0 && g.value ? v() : u < 0 && s.value ? d() : t() : t(), o.preventDefault();
  }
  function f(o) {
    l.value && (b.value = !0, a.value = o.clientY, p.value = w.value, o.preventDefault());
  }
  function P(o) {
    if (!l.value || !b.value) return;
    const u = o.clientY - a.value;
    w.value = p.value + u, o.preventDefault();
  }
  function L(o) {
    if (!l.value || !b.value) return;
    b.value = !1;
    const u = w.value - p.value;
    Math.abs(u) > 100 ? u > 0 && g.value ? v() : u < 0 && s.value ? d() : t() : t(), o.preventDefault();
  }
  function k() {
    !l.value && i.value > 0 && (i.value = 0, w.value = 0), l.value && r.value.length === 0 && !n.value && h(m.value[0]), l.value && t();
  }
  function W() {
    i.value = 0, w.value = 0, b.value = !1;
  }
  return {
    // State
    currentSwipeIndex: i,
    swipeOffset: w,
    isDragging: b,
    swipeContainer: x,
    // Computed
    currentItem: M,
    nextItem: s,
    previousItem: g,
    // Functions
    handleTouchStart: T,
    handleTouchMove: S,
    handleTouchEnd: E,
    handleMouseDown: f,
    handleMouseMove: P,
    handleMouseUp: L,
    goToNextItem: d,
    goToPreviousItem: v,
    snapToCurrentItem: t,
    handleWindowResize: k,
    reset: W
  };
}
function he(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function Zt(e) {
  const {
    getNextPage: l,
    masonry: r,
    isLoading: n,
    hasReachedEnd: y,
    loadError: h,
    currentPage: m,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: b,
    retryInitialDelayMs: a,
    retryBackoffStepMs: p,
    backfillEnabled: x,
    backfillDelayMs: M,
    backfillMaxCalls: s,
    pageSize: g,
    autoRefreshOnEmpty: t,
    emits: d
  } = e, v = z(!1);
  let T = !1;
  function S(u, I) {
    return new Promise(($) => {
      const C = Math.max(0, u | 0), F = Date.now();
      I(C, C);
      const D = setInterval(() => {
        if (v.value) {
          clearInterval(D), $();
          return;
        }
        const j = Date.now() - F, X = Math.max(0, C - j);
        I(X, C), X <= 0 && (clearInterval(D), $());
      }, 100);
    });
  }
  async function E(u) {
    let I = 0;
    const $ = b;
    let C = a;
    for (; ; )
      try {
        const F = await u();
        return I > 0 && d("retry:stop", { attempt: I, success: !0 }), F;
      } catch (F) {
        if (I++, I > $)
          throw d("retry:stop", { attempt: I - 1, success: !1 }), F;
        d("retry:start", { attempt: I, max: $, totalMs: C }), await S(C, (D, j) => {
          d("retry:tick", { attempt: I, remainingMs: D, totalMs: j });
        }), C += p;
      }
  }
  async function f(u) {
    try {
      const I = await E(() => l(u));
      return w([...r.value, ...I.items]), I;
    } catch (I) {
      throw I;
    }
  }
  async function P(u, I = !1) {
    if (!I && !x || T || v.value || y.value) return;
    const $ = (u || 0) + (g || 0);
    if (!g || g <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      y.value = !0;
      return;
    }
    if (!(r.value.length >= $)) {
      T = !0, n.value = !0;
      try {
        let F = 0;
        for (d("backfill:start", { target: $, fetched: r.value.length, calls: F }); r.value.length < $ && F < s && i.value[i.value.length - 1] != null && !v.value && !y.value && T && (await S(M, (j, X) => {
          d("backfill:tick", {
            fetched: r.value.length,
            target: $,
            calls: F,
            remainingMs: j,
            totalMs: X
          });
        }), !(v.value || !T)); ) {
          const D = i.value[i.value.length - 1];
          if (D == null) {
            y.value = !0;
            break;
          }
          try {
            if (v.value || !T) break;
            const j = await f(D);
            if (v.value || !T) break;
            h.value = null, i.value.push(j.nextPage), j.nextPage == null && (y.value = !0);
          } catch (j) {
            if (v.value || !T) break;
            h.value = he(j);
          }
          F++;
        }
        d("backfill:stop", { fetched: r.value.length, calls: F });
      } finally {
        T = !1, n.value = !1;
      }
    }
  }
  async function L(u) {
    if (!n.value) {
      v.value = !1, n.value = !0, y.value = !1, h.value = null;
      try {
        const I = r.value.length;
        if (v.value) return;
        const $ = await f(u);
        return v.value ? void 0 : (h.value = null, m.value = u, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await P(I), $);
      } catch (I) {
        throw h.value = he(I), I;
      } finally {
        n.value = !1;
      }
    }
  }
  async function k() {
    if (!n.value && !y.value) {
      v.value = !1, n.value = !0, h.value = null;
      try {
        const u = r.value.length;
        if (v.value) return;
        const I = i.value[i.value.length - 1];
        if (I == null) {
          y.value = !0, n.value = !1;
          return;
        }
        const $ = await f(I);
        return v.value ? void 0 : (h.value = null, m.value = I, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await P(u), $);
      } catch (u) {
        throw h.value = he(u), u;
      } finally {
        n.value = !1;
      }
    }
  }
  async function W() {
    if (!n.value) {
      v.value = !1, n.value = !0;
      try {
        const u = m.value;
        if (u == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", m.value, "paginationHistory:", i.value);
          return;
        }
        r.value = [], y.value = !1, h.value = null, i.value = [u];
        const I = await f(u);
        if (v.value) return;
        h.value = null, m.value = u, i.value.push(I.nextPage), I.nextPage == null && (y.value = !0);
        const $ = r.value.length;
        return await P($), I;
      } catch (u) {
        throw h.value = he(u), u;
      } finally {
        n.value = !1;
      }
    }
  }
  function o() {
    const u = T;
    v.value = !0, n.value = !1, T = !1, u && d("backfill:stop", { fetched: r.value.length, calls: 0, cancelled: !0 });
  }
  return {
    loadPage: L,
    loadNext: k,
    refreshCurrentPage: W,
    cancelLoad: o,
    maybeBackfillToTarget: P,
    getContent: f
  };
}
function ea(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    refreshLayout: n,
    refreshCurrentPage: y,
    loadNext: h,
    maybeBackfillToTarget: m,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  async function b(s) {
    const g = l.value.filter((t) => t.id !== s.id);
    if (l.value = g, await q(), g.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await h(), await m(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((t) => requestAnimationFrame(() => t())), requestAnimationFrame(() => {
      n(g);
    });
  }
  async function a(s) {
    if (!s || s.length === 0) return;
    const g = new Set(s.map((d) => d.id)), t = l.value.filter((d) => !g.has(d.id));
    if (l.value = t, await q(), t.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await h(), await m(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((d) => requestAnimationFrame(() => d())), requestAnimationFrame(() => {
      n(t);
    });
  }
  async function p(s, g) {
    if (!s) return;
    const t = l.value;
    if (t.findIndex((S) => S.id === s.id) !== -1) return;
    const v = [...t], T = Math.min(g, v.length);
    v.splice(T, 0, s), l.value = v, await q(), r.value || (await new Promise((S) => requestAnimationFrame(() => S())), requestAnimationFrame(() => {
      n(v);
    }));
  }
  async function x(s, g) {
    var L;
    if (!s || s.length === 0) return;
    if (!g || g.length !== s.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const t = l.value, d = new Set(t.map((k) => k.id)), v = [];
    for (let k = 0; k < s.length; k++)
      d.has((L = s[k]) == null ? void 0 : L.id) || v.push({ item: s[k], index: g[k] });
    if (v.length === 0) return;
    const T = /* @__PURE__ */ new Map();
    for (const { item: k, index: W } of v)
      T.set(W, k);
    const S = v.length > 0 ? Math.max(...v.map(({ index: k }) => k)) : -1, E = Math.max(t.length - 1, S), f = [];
    let P = 0;
    for (let k = 0; k <= E; k++)
      T.has(k) ? f.push(T.get(k)) : P < t.length && (f.push(t[P]), P++);
    for (; P < t.length; )
      f.push(t[P]), P++;
    l.value = f, await q(), r.value || (await new Promise((k) => requestAnimationFrame(() => k())), requestAnimationFrame(() => {
      n(f);
    }));
  }
  async function M() {
    l.value = [];
  }
  return {
    remove: b,
    removeMany: a,
    restore: p,
    restoreMany: x,
    removeAll: M
  };
}
function ta(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    container: n,
    columns: y,
    containerWidth: h,
    masonryContentHeight: m,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: b
  } = e;
  let a = [];
  function p(g) {
    const t = _t(g);
    let d = 0;
    if (n.value) {
      const { scrollTop: v, clientHeight: T } = n.value;
      d = v + T + 100;
    }
    m.value = Math.max(t, d);
  }
  function x(g) {
    var T, S;
    if (r.value) {
      l.value = g;
      return;
    }
    if (!n.value) return;
    if (b(g, "refreshLayout"), g.length > 1e3 && a.length > g.length && a.length - g.length < 100) {
      let E = !0;
      for (let f = 0; f < g.length; f++)
        if (((T = g[f]) == null ? void 0 : T.id) !== ((S = a[f]) == null ? void 0 : S.id)) {
          E = !1;
          break;
        }
      if (E) {
        const f = g.map((P, L) => ({
          ...a[L],
          originalIndex: L
        }));
        p(f), l.value = f, a = f;
        return;
      }
    }
    const d = g.map((E, f) => ({
      ...E,
      originalIndex: f
    })), v = n.value;
    if (w.value && w.value.width !== void 0) {
      const E = v.style.width, f = v.style.boxSizing;
      v.style.boxSizing = "border-box", v.style.width = `${w.value.width}px`, v.offsetWidth;
      const P = qe(d, v, y.value, i.value);
      v.style.width = E, v.style.boxSizing = f, p(P), l.value = P, a = P;
    } else {
      const E = qe(d, v, y.value, i.value);
      p(E), l.value = E, a = E;
    }
  }
  function M(g, t) {
    w.value = g, g && (g.width !== void 0 && (h.value = g.width), !r.value && n.value && l.value.length > 0 && q(() => {
      y.value = ue(i.value, h.value), x(l.value), t && t();
    }));
  }
  function s() {
    y.value = ue(i.value, h.value), x(l.value);
  }
  return {
    refreshLayout: x,
    setFixedDimensions: M,
    onResize: s,
    calculateHeight: p
  };
}
function aa(e) {
  const {
    masonry: l,
    container: r,
    columns: n,
    virtualBufferPx: y,
    loadThresholdPx: h
  } = e, m = z(e.handleScroll), i = z(0), w = z(0), b = y, a = z(!1), p = z({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), x = Q(() => {
    const t = i.value - b, d = i.value + w.value + b, v = l.value;
    return !v || v.length === 0 ? [] : v.filter((S) => {
      if (typeof S.top != "number" || typeof S.columnHeight != "number")
        return !0;
      const E = S.top;
      return S.top + S.columnHeight >= t && E <= d;
    });
  });
  function M(t) {
    if (!r.value) return;
    const { scrollTop: d, clientHeight: v } = r.value, T = d + v, S = t ?? $e(l.value, n.value), E = S.length ? Math.max(...S) : 0, f = typeof h == "number" ? h : 200, P = f >= 0 ? Math.max(0, E - f) : Math.max(0, E + f), L = Math.max(0, P - T), k = L <= 100;
    p.value = {
      distanceToTrigger: Math.round(L),
      isNearTrigger: k
    };
  }
  async function s() {
    if (r.value) {
      const d = r.value.scrollTop, v = r.value.clientHeight || window.innerHeight, T = v > 0 ? v : window.innerHeight;
      i.value = d, w.value = T;
    }
    a.value = !0, await q(), await new Promise((d) => requestAnimationFrame(() => d())), a.value = !1;
    const t = $e(l.value, n.value);
    m.value(t), M(t);
  }
  function g() {
    i.value = 0, w.value = 0, a.value = !1, p.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: w,
    virtualizing: a,
    scrollProgress: p,
    visibleMasonry: x,
    updateScrollProgress: M,
    updateViewport: s,
    reset: g,
    handleScroll: m
  };
}
function na(e) {
  const { masonry: l } = e, r = z(/* @__PURE__ */ new Set());
  function n(m) {
    return typeof m == "number" && m > 0 && Number.isFinite(m);
  }
  function y(m, i) {
    try {
      if (!Array.isArray(m) || m.length === 0) return;
      const w = m.filter((a) => !n(a == null ? void 0 : a.width) || !n(a == null ? void 0 : a.height));
      if (w.length === 0) return;
      const b = [];
      for (const a of w) {
        const p = (a == null ? void 0 : a.id) ?? `idx:${l.value.indexOf(a)}`;
        r.value.has(p) || (r.value.add(p), b.push(p));
      }
      if (b.length > 0) {
        const a = b.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: i,
            count: b.length,
            sampleIds: a,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function h() {
    r.value.clear();
  }
  return {
    checkItemDimensions: y,
    invalidDimensionIds: r,
    reset: h
  };
}
const la = { class: "flex-1 relative min-h-0" }, oa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ra = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ia = {
  key: 1,
  class: "relative w-full h-full"
}, sa = ["src"], ua = ["src", "autoplay", "controls"], ca = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, va = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, fa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ Je({
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
  setup(e, { emit: l }) {
    const r = e, n = l, y = z(!1), h = z(!1), m = z(null), i = z(!1), w = z(!1), b = z(null), a = z(!1), p = z(!1), x = z(!1), M = z(null), s = z(null);
    let g = null;
    const t = Q(() => {
      var o;
      return r.type ?? ((o = r.item) == null ? void 0 : o.type) ?? "image";
    }), d = Q(() => {
      var o;
      return r.notFound ?? ((o = r.item) == null ? void 0 : o.notFound) ?? !1;
    }), v = Q(() => !!r.inSwipeMode);
    function T(o) {
      n("mouse-enter", { item: r.item, type: o });
    }
    function S(o) {
      n("mouse-leave", { item: r.item, type: o });
    }
    function E(o) {
      if (v.value) return;
      const u = o.target;
      u && (u.paused ? u.play() : u.pause());
    }
    function f(o) {
      const u = o.target;
      u && (v.value || u.play(), T("video"));
    }
    function P(o) {
      const u = o.target;
      u && (v.value || u.pause(), S("video"));
    }
    function L(o) {
      return new Promise((u, I) => {
        if (!o) {
          const D = new Error("No image source provided");
          n("preload:error", { item: r.item, type: "image", src: o, error: D }), I(D);
          return;
        }
        const $ = new Image(), C = Date.now(), F = 300;
        $.onload = () => {
          const D = Date.now() - C, j = Math.max(0, F - D);
          setTimeout(async () => {
            y.value = !0, h.value = !1, p.value = !1, await q(), await new Promise((X) => setTimeout(X, 100)), x.value = !0, n("preload:success", { item: r.item, type: "image", src: o }), u();
          }, j);
        }, $.onerror = () => {
          h.value = !0, y.value = !1, p.value = !1;
          const D = new Error("Failed to load image");
          n("preload:error", { item: r.item, type: "image", src: o, error: D }), I(D);
        }, $.src = o;
      });
    }
    function k(o) {
      return new Promise((u, I) => {
        if (!o) {
          const D = new Error("No video source provided");
          n("preload:error", { item: r.item, type: "video", src: o, error: D }), I(D);
          return;
        }
        const $ = document.createElement("video"), C = Date.now(), F = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const D = Date.now() - C, j = Math.max(0, F - D);
          setTimeout(async () => {
            i.value = !0, w.value = !1, p.value = !1, await q(), await new Promise((X) => setTimeout(X, 100)), x.value = !0, n("preload:success", { item: r.item, type: "video", src: o }), u();
          }, j);
        }, $.onerror = () => {
          w.value = !0, i.value = !1, p.value = !1;
          const D = new Error("Failed to load video");
          n("preload:error", { item: r.item, type: "video", src: o, error: D }), I(D);
        }, $.src = o;
      });
    }
    async function W() {
      var u;
      if (!a.value || p.value || d.value || t.value === "video" && i.value || t.value === "image" && y.value)
        return;
      const o = (u = r.item) == null ? void 0 : u.src;
      if (o)
        if (p.value = !0, x.value = !1, t.value === "video") {
          b.value = o, i.value = !1, w.value = !1;
          try {
            await k(o);
          } catch {
          }
        } else {
          m.value = o, y.value = !1, h.value = !1;
          try {
            await L(o);
          } catch {
          }
        }
    }
    return Ke(() => {
      M.value && (g = new IntersectionObserver(
        (o) => {
          o.forEach((u) => {
            u.isIntersecting && u.intersectionRatio >= 1 ? a.value || (a.value = !0, W()) : u.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), g.observe(M.value));
    }), Qe(() => {
      g && (g.disconnect(), g = null);
    }), te(
      () => {
        var o;
        return (o = r.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || d.value)) {
          if (t.value === "video") {
            if (o !== b.value && (i.value = !1, w.value = !1, b.value = o, a.value)) {
              p.value = !0;
              try {
                await k(o);
              } catch {
              }
            }
          } else if (o !== m.value && (y.value = !1, h.value = !1, m.value = o, a.value)) {
            p.value = !0;
            try {
              await L(o);
            } catch {
            }
          }
        }
      }
    ), te(
      () => r.isActive,
      (o) => {
        !v.value || !s.value || (o ? s.value.play() : s.value.pause());
      }
    ), (o, u) => (O(), R("div", {
      ref_key: "containerRef",
      ref: M,
      class: "relative w-full h-full flex flex-col"
    }, [
      o.headerHeight > 0 ? (O(), R("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${o.headerHeight}px` })
      }, [
        _(o.$slots, "header", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: t.value
        })
      ], 4)) : ee("", !0),
      V("div", la, [
        _(o.$slots, "default", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: t.value,
          imageSrc: m.value,
          videoSrc: b.value,
          showMedia: x.value
        }, () => [
          V("div", oa, [
            d.value ? (O(), R("div", ra, u[3] || (u[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (O(), R("div", ia, [
              t.value === "image" && m.value ? (O(), R("img", {
                key: 0,
                src: m.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  y.value && x.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: u[0] || (u[0] = (I) => T("image")),
                onMouseleave: u[1] || (u[1] = (I) => S("image"))
              }, null, 42, sa)) : ee("", !0),
              t.value === "video" && b.value ? (O(), R("video", {
                key: 1,
                ref_key: "videoEl",
                ref: s,
                src: b.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  i.value && x.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: v.value && r.isActive,
                controls: v.value,
                onClick: Ce(E, ["stop"]),
                onTouchend: Ce(E, ["stop", "prevent"]),
                onMouseenter: f,
                onMouseleave: P,
                onError: u[2] || (u[2] = (I) => w.value = !0)
              }, null, 42, ua)) : ee("", !0),
              !y.value && !i.value && !h.value && !w.value ? (O(), R("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  x.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ca, [
                  _(o.$slots, "placeholder-icon", { mediaType: t.value }, () => [
                    V("i", {
                      class: re(t.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ee("", !0),
              p.value ? (O(), R("div", va, u[4] || (u[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ee("", !0),
              t.value === "image" && h.value || t.value === "video" && w.value ? (O(), R("div", fa, [
                V("i", {
                  class: re(t.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + He(t.value), 1)
              ])) : ee("", !0)
            ]))
          ])
        ])
      ]),
      o.footerHeight > 0 ? (O(), R("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${o.footerHeight}px` })
      }, [
        _(o.$slots, "footer", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: t.value
        })
      ], 4)) : ee("", !0)
    ], 512));
  }
}), da = { class: "w-full h-full flex items-center justify-center p-4" }, ma = { class: "w-full h-full max-w-full max-h-full relative" }, ha = {
  key: 0,
  class: "w-full py-8 text-center"
}, ga = {
  key: 1,
  class: "w-full py-8 text-center"
}, pa = { class: "text-red-500 dark:text-red-400" }, ya = {
  key: 0,
  class: "w-full py-8 text-center"
}, wa = {
  key: 1,
  class: "w-full py-8 text-center"
}, xa = { class: "text-red-500 dark:text-red-400" }, ba = /* @__PURE__ */ Je({
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
  setup(e, { expose: l, emit: r }) {
    const n = e, y = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = Q(() => {
      var c;
      return {
        ...y,
        ...n.layout,
        sizes: {
          ...y.sizes,
          ...((c = n.layout) == null ? void 0 : c.sizes) || {}
        }
      };
    }), m = z(null), i = z(typeof window < "u" ? window.innerWidth : 1024), w = z(typeof window < "u" ? window.innerHeight : 768), b = z(null);
    let a = null;
    function p(c) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[c] || 768;
    }
    const x = Q(() => {
      if (n.layoutMode === "masonry") return !1;
      if (n.layoutMode === "swipe") return !0;
      const c = typeof n.mobileBreakpoint == "string" ? p(n.mobileBreakpoint) : n.mobileBreakpoint;
      return i.value < c;
    }), M = r, s = Q({
      get: () => n.items,
      set: (c) => M("update:items", c)
    }), g = z(7), t = z(null), d = z([]), v = z(null), T = z(!1), S = z(0), E = z(!1), f = z(null), P = Q(() => Ut(i.value)), L = na({
      masonry: s
    }), { checkItemDimensions: k, reset: W } = L, o = ta({
      masonry: s,
      useSwipeMode: x,
      container: t,
      columns: g,
      containerWidth: i,
      masonryContentHeight: S,
      layout: h,
      fixedDimensions: b,
      checkItemDimensions: k
    }), { refreshLayout: u, setFixedDimensions: I, onResize: $ } = o, C = aa({
      masonry: s,
      container: t,
      columns: g,
      virtualBufferPx: n.virtualBufferPx,
      loadThresholdPx: n.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: F, viewportHeight: D, virtualizing: j, visibleMasonry: X, updateScrollProgress: B, updateViewport: Y, reset: G } = C, { onEnter: ne, onBeforeEnter: J, onBeforeLeave: ie, onLeave: Z } = Jt(
      { container: t },
      { leaveDurationMs: n.leaveDurationMs, virtualizing: j }
    ), tt = ne, at = J, nt = ie, lt = Z, ot = Zt({
      getNextPage: n.getNextPage,
      masonry: s,
      isLoading: T,
      hasReachedEnd: E,
      loadError: f,
      currentPage: v,
      paginationHistory: d,
      refreshLayout: u,
      retryMaxAttempts: n.retryMaxAttempts,
      retryInitialDelayMs: n.retryInitialDelayMs,
      retryBackoffStepMs: n.retryBackoffStepMs,
      backfillEnabled: n.backfillEnabled,
      backfillDelayMs: n.backfillDelayMs,
      backfillMaxCalls: n.backfillMaxCalls,
      pageSize: n.pageSize,
      autoRefreshOnEmpty: n.autoRefreshOnEmpty,
      emits: M
    }), { loadPage: be, loadNext: pe, refreshCurrentPage: De, cancelLoad: Me, maybeBackfillToTarget: rt } = ot, K = Qt({
      useSwipeMode: x,
      masonry: s,
      isLoading: T,
      loadNext: pe,
      loadPage: be,
      paginationHistory: d
    }), { handleScroll: it } = Kt({
      container: t,
      masonry: s,
      columns: g,
      containerHeight: S,
      isLoading: T,
      pageSize: n.pageSize,
      refreshLayout: u,
      setItemsRaw: (c) => {
        s.value = c;
      },
      loadNext: pe,
      loadThresholdPx: n.loadThresholdPx
    });
    C.handleScroll.value = it;
    const st = ea({
      masonry: s,
      useSwipeMode: x,
      refreshLayout: u,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: rt,
      autoRefreshOnEmpty: n.autoRefreshOnEmpty,
      paginationHistory: d
    }), { remove: ce, removeMany: ut, restore: ct, restoreMany: vt, removeAll: ft } = st;
    function dt(c) {
      I(c, B), !c && m.value && (i.value = m.value.clientWidth, w.value = m.value.clientHeight);
    }
    l({
      isLoading: T,
      refreshLayout: u,
      // Container dimensions (wrapper element)
      containerWidth: i,
      containerHeight: w,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: S,
      // Current page
      currentPage: v,
      // End of list tracking
      hasReachedEnd: E,
      // Load error tracking
      loadError: f,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: dt,
      remove: ce,
      removeMany: ut,
      removeAll: ft,
      restore: ct,
      restoreMany: vt,
      loadNext: pe,
      loadPage: be,
      refreshCurrentPage: De,
      reset: pt,
      destroy: yt,
      init: Re,
      restoreItems: Oe,
      paginationHistory: d,
      cancelLoad: Me,
      scrollToTop: mt,
      scrollTo: ht,
      totalItems: Q(() => s.value.length),
      currentBreakpoint: P
    });
    const se = K.currentSwipeIndex, ve = K.swipeOffset, ye = K.isDragging, le = K.swipeContainer, ze = K.handleTouchStart, Be = K.handleTouchMove, Ne = K.handleTouchEnd, Fe = K.handleMouseDown, Te = K.handleMouseMove, Ee = K.handleMouseUp, Ie = K.snapToCurrentItem;
    function mt(c) {
      t.value && t.value.scrollTo({
        top: 0,
        behavior: (c == null ? void 0 : c.behavior) ?? "smooth",
        ...c
      });
    }
    function ht(c) {
      t.value && (t.value.scrollTo({
        top: c.top ?? t.value.scrollTop,
        left: c.left ?? t.value.scrollLeft,
        behavior: c.behavior ?? "auto"
      }), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight || window.innerHeight));
    }
    function gt() {
      $(), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight);
    }
    function pt() {
      Me(), t.value && t.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), s.value = [], w.value = 0, v.value = n.loadAtPage, d.value = [n.loadAtPage], E.value = !1, f.value = null, G();
    }
    function yt() {
      Me(), s.value = [], S.value = 0, v.value = null, d.value = [], E.value = !1, f.value = null, T.value = !1, se.value = 0, ve.value = 0, ye.value = !1, G(), W(), t.value && t.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Xe(async () => {
      x.value || await Y();
    }, 200), Ae = Xe(gt, 200);
    function We() {
      K.handleWindowResize();
    }
    function Re(c, H, N) {
      v.value = H, d.value = [H], d.value.push(N), E.value = N == null, k(c, "init"), x.value ? (s.value = [...s.value, ...c], se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (u([...s.value, ...c]), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight || window.innerHeight), q(() => {
        t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight || window.innerHeight, B());
      }));
    }
    async function Oe(c, H, N) {
      if (!n.skipInitialLoad) {
        Re(c, H, N);
        return;
      }
      v.value = H, d.value = [H], N != null && d.value.push(N), E.value = N == null, f.value = null, k(c, "restoreItems"), x.value ? (s.value = c, se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (u(c), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight || window.innerHeight), await q(), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight || window.innerHeight, B()));
    }
    return te(
      h,
      () => {
        x.value || t.value && (g.value = ue(h.value, i.value), u(s.value));
      },
      { deep: !0 }
    ), te(() => n.layoutMode, () => {
      b.value && b.value.width !== void 0 ? i.value = b.value.width : m.value && (i.value = m.value.clientWidth);
    }), te(t, (c) => {
      c && !x.value ? (c.removeEventListener("scroll", oe), c.addEventListener("scroll", oe, { passive: !0 })) : c && c.removeEventListener("scroll", oe);
    }, { immediate: !0 }), te(x, (c, H) => {
      H === void 0 && c === !1 || q(() => {
        c ? (document.addEventListener("mousemove", Te), document.addEventListener("mouseup", Ee), t.value && t.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, s.value.length > 0 && Ie()) : (document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ee), t.value && m.value && (b.value && b.value.width !== void 0 ? i.value = b.value.width : i.value = m.value.clientWidth, t.value.removeEventListener("scroll", oe), t.value.addEventListener("scroll", oe, { passive: !0 }), s.value.length > 0 && (g.value = ue(h.value, i.value), u(s.value), F.value = t.value.scrollTop, D.value = t.value.clientHeight, B())));
      });
    }, { immediate: !0 }), te(le, (c) => {
      c && (c.addEventListener("touchstart", ze, { passive: !1 }), c.addEventListener("touchmove", Be, { passive: !1 }), c.addEventListener("touchend", Ne), c.addEventListener("mousedown", Fe));
    }), te(() => s.value.length, (c, H) => {
      x.value && c > 0 && H === 0 && (se.value = 0, q(() => Ie()));
    }), te(m, (c) => {
      a && (a.disconnect(), a = null), c && typeof ResizeObserver < "u" ? (a = new ResizeObserver((H) => {
        if (!b.value)
          for (const N of H) {
            const ae = N.contentRect.width, A = N.contentRect.height;
            i.value !== ae && (i.value = ae), w.value !== A && (w.value = A);
          }
      }), a.observe(c), b.value || (i.value = c.clientWidth, w.value = c.clientHeight)) : c && (b.value || (i.value = c.clientWidth, w.value = c.clientHeight));
    }, { immediate: !0 }), te(i, (c, H) => {
      c !== H && c > 0 && !x.value && t.value && s.value.length > 0 && q(() => {
        g.value = ue(h.value, c), u(s.value), B();
      });
    }), Ke(async () => {
      try {
        await q(), m.value && !a && (i.value = m.value.clientWidth, w.value = m.value.clientHeight), x.value || (g.value = ue(h.value, i.value), t.value && (F.value = t.value.scrollTop, D.value = t.value.clientHeight));
        const c = n.loadAtPage;
        if (d.value = [c], !n.skipInitialLoad)
          await be(d.value[0]);
        else if (n.items && n.items.length > 0) {
          const H = n.items[0], N = n.items[n.items.length - 1], ae = (H == null ? void 0 : H.page) ?? c ?? 1, A = (N == null ? void 0 : N.next) ?? null;
          await Oe(n.items, ae, A);
        } else
          v.value = c, d.value = [c];
        x.value ? q(() => Ie()) : B();
      } catch (c) {
        f.value || (console.error("Error during component initialization:", c), f.value = he(c)), T.value = !1;
      }
      window.addEventListener("resize", Ae), window.addEventListener("resize", We);
    }), Qe(() => {
      var c;
      a && (a.disconnect(), a = null), (c = t.value) == null || c.removeEventListener("scroll", oe), window.removeEventListener("resize", Ae), window.removeEventListener("resize", We), le.value && (le.value.removeEventListener("touchstart", ze), le.value.removeEventListener("touchmove", Be), le.value.removeEventListener("touchend", Ne), le.value.removeEventListener("mousedown", Fe)), document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Ee);
    }), (c, H) => (O(), R("div", {
      ref_key: "wrapper",
      ref: m,
      class: "w-full h-full flex flex-col relative"
    }, [
      x.value ? (O(), R("div", {
        key: 0,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": n.forceMotion, "cursor-grab": !U(ye), "cursor-grabbing": U(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${U(ve)}px)`,
            transition: U(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${s.value.length * 100}%`
          })
        }, [
          (O(!0), R(je, null, Ve(s.value, (N, ae) => (O(), R("div", {
            key: `${N.page}-${N.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${ae * (100 / s.value.length)}%`,
              height: `${100 / s.value.length}%`
            })
          }, [
            V("div", da, [
              V("div", ma, [
                _(c.$slots, "default", {
                  item: N,
                  remove: U(ce),
                  index: N.originalIndex ?? s.value.indexOf(N)
                }, () => [
                  ke(xe, {
                    item: N,
                    remove: U(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": ae === U(se),
                    "onPreload:success": H[0] || (H[0] = (A) => M("item:preload:success", A)),
                    "onPreload:error": H[1] || (H[1] = (A) => M("item:preload:error", A)),
                    onMouseEnter: H[2] || (H[2] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: H[3] || (H[3] = (A) => M("item:mouse-leave", A))
                  }, {
                    header: fe((A) => [
                      _(c.$slots, "item-header", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: fe((A) => [
                      _(c.$slots, "item-footer", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        E.value && s.value.length > 0 ? (O(), R("div", ha, [
          _(c.$slots, "end-message", {}, () => [
            H[8] || (H[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ee("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", ga, [
          _(c.$slots, "error-message", { error: f.value }, () => [
            V("p", pa, "Failed to load content: " + He(f.value.message), 1)
          ], !0)
        ])) : ee("", !0)
      ], 2)) : (O(), R("div", {
        key: 1,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": n.forceMotion }]),
        ref_key: "container",
        ref: t
      }, [
        V("div", {
          class: "relative",
          style: ge({ height: `${S.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          ke(wt, {
            name: "masonry",
            css: !1,
            onEnter: U(tt),
            onBeforeEnter: U(at),
            onLeave: U(lt),
            onBeforeLeave: U(nt)
          }, {
            default: fe(() => [
              (O(!0), R(je, null, Ve(U(X), (N, ae) => (O(), R("div", de({
                key: `${N.page}-${N.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, U(Gt)(N, ae)), [
                _(c.$slots, "default", {
                  item: N,
                  remove: U(ce),
                  index: N.originalIndex ?? s.value.indexOf(N)
                }, () => [
                  ke(xe, {
                    item: N,
                    remove: U(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": H[4] || (H[4] = (A) => M("item:preload:success", A)),
                    "onPreload:error": H[5] || (H[5] = (A) => M("item:preload:error", A)),
                    onMouseEnter: H[6] || (H[6] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: H[7] || (H[7] = (A) => M("item:mouse-leave", A))
                  }, {
                    header: fe((A) => [
                      _(c.$slots, "item-header", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: fe((A) => [
                      _(c.$slots, "item-footer", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        E.value && s.value.length > 0 ? (O(), R("div", ya, [
          _(c.$slots, "end-message", {}, () => [
            H[9] || (H[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ee("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", wa, [
          _(c.$slots, "error-message", { error: f.value }, () => [
            V("p", xa, "Failed to load content: " + He(f.value.message), 1)
          ], !0)
        ])) : ee("", !0)
      ], 2))
    ], 512));
  }
}), Ma = (e, l) => {
  const r = e.__vccOpts || e;
  for (const [n, y] of l)
    r[n] = y;
  return r;
}, Ge = /* @__PURE__ */ Ma(ba, [["__scopeId", "data-v-9de56a55"]]), Ea = {
  install(e) {
    e.component("WyxosMasonry", Ge), e.component("WMasonry", Ge), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  Ge as Masonry,
  xe as MasonryItem,
  Ea as default
};
