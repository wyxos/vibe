import { nextTick as U, ref as D, computed as Z, defineComponent as et, onMounted as tt, onUnmounted as at, watch as te, createElementBlock as V, openBlock as j, createCommentVNode as ae, createElementVNode as Y, normalizeStyle as ge, renderSlot as J, normalizeClass as ie, withModifiers as Ye, toDisplayString as Ne, unref as X, Fragment as Ue, renderList as _e, createVNode as He, withCtx as de, mergeProps as fe, TransitionGroup as Tt } from "vue";
let $e = null;
function It() {
  if ($e != null) return $e;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const o = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), $e = o, o;
}
function Xe(e, l, o, t = {}) {
  const {
    gutterX: g = 0,
    gutterY: m = 0,
    header: f = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: x = 0,
    sizes: a = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: y = "masonry"
  } = t;
  let I = 0, T = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const H = window.getComputedStyle(l);
      I = parseFloat(H.paddingLeft) || 0, T = parseFloat(H.paddingRight) || 0;
    }
  } catch {
  }
  const v = (w || 0) + I, M = (x || 0) + T, r = l.offsetWidth - l.clientWidth, h = r > 0 ? r + 2 : It() + 2, s = l.offsetWidth - h - v - M, d = g * (o - 1), k = Math.floor((s - d) / o), p = e.map((H) => {
    const R = H.width, O = H.height;
    return Math.round(k * O / R) + i + f;
  });
  if (y === "sequential-balanced") {
    const H = p.length;
    if (H === 0) return [];
    const R = (E, C, q) => E + (C > 0 ? m : 0) + q;
    let O = Math.max(...p), S = p.reduce((E, C) => E + C, 0) + m * Math.max(0, H - 1);
    const b = (E) => {
      let C = 1, q = 0, ne = 0;
      for (let K = 0; K < H; K++) {
        const re = p[K], ee = R(q, ne, re);
        if (ee <= E)
          q = ee, ne++;
        else if (C++, q = re, ne = 1, re > E || C > o) return !1;
      }
      return C <= o;
    };
    for (; O < S; ) {
      const E = Math.floor((O + S) / 2);
      b(E) ? S = E : O = E + 1;
    }
    const F = S, n = new Array(o).fill(0);
    let L = o - 1, P = 0, N = 0;
    for (let E = H - 1; E >= 0; E--) {
      const C = p[E], q = E < L;
      !(R(P, N, C) <= F) || q ? (n[L] = E + 1, L--, P = C, N = 1) : (P = R(P, N, C), N++);
    }
    n[0] = 0;
    const W = [], _ = new Array(o).fill(0);
    for (let E = 0; E < o; E++) {
      const C = n[E], q = E + 1 < o ? n[E + 1] : H, ne = E * (k + g);
      for (let K = C; K < q; K++) {
        const ee = {
          ...e[K],
          columnWidth: k,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ee.imageHeight = p[K] - (i + f), ee.columnHeight = p[K], ee.left = ne, ee.top = _[E], _[E] += ee.columnHeight + (K + 1 < q ? m : 0), W.push(ee);
      }
    }
    return W;
  }
  const c = new Array(o).fill(0), $ = [];
  for (let H = 0; H < e.length; H++) {
    const R = e[H], O = {
      ...R,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, S = c.indexOf(Math.min(...c)), b = R.width, F = R.height;
    O.columnWidth = k, O.left = S * (k + g), O.imageHeight = Math.round(k * F / b), O.columnHeight = O.imageHeight + i + f, O.top = c[S], c[S] += O.columnHeight + m, $.push(O);
  }
  return $;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Lt = typeof self == "object" && self && self.Object === Object && self, nt = Et || Lt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, kt = lt.hasOwnProperty, Pt = lt.toString, he = xe ? xe.toStringTag : void 0;
function St(e) {
  var l = kt.call(e, he), o = e[he];
  try {
    e[he] = void 0;
    var t = !0;
  } catch {
  }
  var g = Pt.call(e);
  return t && (l ? e[he] = o : delete e[he]), g;
}
var Ht = Object.prototype, $t = Ht.toString;
function Ft(e) {
  return $t.call(e);
}
var Nt = "[object Null]", Bt = "[object Undefined]", Ge = xe ? xe.toStringTag : void 0;
function Dt(e) {
  return e == null ? e === void 0 ? Bt : Nt : Ge && Ge in Object(e) ? St(e) : Ft(e);
}
function zt(e) {
  return e != null && typeof e == "object";
}
var At = "[object Symbol]";
function Rt(e) {
  return typeof e == "symbol" || zt(e) && Dt(e) == At;
}
var Wt = /\s/;
function Ot(e) {
  for (var l = e.length; l-- && Wt.test(e.charAt(l)); )
    ;
  return l;
}
var Ct = /^\s+/;
function Vt(e) {
  return e && e.slice(0, Ot(e) + 1).replace(Ct, "");
}
function Be(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var Je = NaN, jt = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Yt = /^0o[0-7]+$/i, Ut = parseInt;
function Ke(e) {
  if (typeof e == "number")
    return e;
  if (Rt(e))
    return Je;
  if (Be(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Be(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Vt(e);
  var o = qt.test(e);
  return o || Yt.test(e) ? Ut(e.slice(2), o ? 2 : 8) : jt.test(e) ? Je : +e;
}
var Fe = function() {
  return nt.Date.now();
}, _t = "Expected a function", Xt = Math.max, Gt = Math.min;
function Qe(e, l, o) {
  var t, g, m, f, i, w, x = 0, a = !1, y = !1, I = !0;
  if (typeof e != "function")
    throw new TypeError(_t);
  l = Ke(l) || 0, Be(o) && (a = !!o.leading, y = "maxWait" in o, m = y ? Xt(Ke(o.maxWait) || 0, l) : m, I = "trailing" in o ? !!o.trailing : I);
  function T(c) {
    var $ = t, H = g;
    return t = g = void 0, x = c, f = e.apply(H, $), f;
  }
  function v(c) {
    return x = c, i = setTimeout(h, l), a ? T(c) : f;
  }
  function M(c) {
    var $ = c - w, H = c - x, R = l - $;
    return y ? Gt(R, m - H) : R;
  }
  function r(c) {
    var $ = c - w, H = c - x;
    return w === void 0 || $ >= l || $ < 0 || y && H >= m;
  }
  function h() {
    var c = Fe();
    if (r(c))
      return s(c);
    i = setTimeout(h, M(c));
  }
  function s(c) {
    return i = void 0, I && t ? T(c) : (t = g = void 0, f);
  }
  function d() {
    i !== void 0 && clearTimeout(i), x = 0, t = w = g = i = void 0;
  }
  function k() {
    return i === void 0 ? f : s(Fe());
  }
  function p() {
    var c = Fe(), $ = r(c);
    if (t = arguments, g = this, w = c, $) {
      if (i === void 0)
        return v(w);
      if (y)
        return clearTimeout(i), i = setTimeout(h, l), T(w);
    }
    return i === void 0 && (i = setTimeout(h, l)), f;
  }
  return p.cancel = d, p.flush = k, p;
}
function ue(e, l) {
  const o = l ?? (typeof window < "u" ? window.innerWidth : 1024), t = e.sizes;
  return o >= 1536 && t["2xl"] ? t["2xl"] : o >= 1280 && t.xl ? t.xl : o >= 1024 && t.lg ? t.lg : o >= 768 && t.md ? t.md : o >= 640 && t.sm ? t.sm : t.base;
}
function Jt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Kt(e) {
  return e.reduce((o, t) => Math.max(o, t.top + t.columnHeight), 0) + 500;
}
function Qt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function Zt(e, l = 0) {
  return {
    style: Qt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function be(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const t = Array.from(new Set(e.map((f) => f.left))).sort((f, i) => f - i).slice(0, l), g = /* @__PURE__ */ new Map();
  for (let f = 0; f < t.length; f++) g.set(t[f], f);
  const m = new Array(t.length).fill(0);
  for (const f of e) {
    const i = g.get(f.left);
    i != null && (m[i] = Math.max(m[i], f.top + f.columnHeight));
  }
  for (; m.length < l; ) m.push(0);
  return m;
}
function ea(e, l) {
  let o = 0, t = 0;
  const g = 1e3;
  function m(a, y) {
    var v;
    const I = (v = e.container) == null ? void 0 : v.value;
    if (I) {
      const M = I.scrollTop, r = I.clientHeight;
      o = M - g, t = M + r + g;
    }
    return a + y >= o && a <= t;
  }
  function f(a, y) {
    var s;
    const I = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10), v = parseInt(a.dataset.index || "0", 10), M = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((s = l == null ? void 0 : l.virtualizing) != null && s.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "", y();
      });
      return;
    }
    if (!m(T, M)) {
      a.style.opacity = "1", a.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`, a.style.transition = "none", y();
      return;
    }
    const r = Math.min(v * 20, 160), h = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${r}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`;
      const d = () => {
        h ? a.style.setProperty("--masonry-opacity-delay", h) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", d), y();
      };
      a.addEventListener("transitionend", d);
    });
  }
  function i(a) {
    var T;
    const y = parseInt(a.dataset.left || "0", 10), I = parseInt(a.dataset.top || "0", 10);
    if ((T = l == null ? void 0 : l.virtualizing) != null && T.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${y}px, ${I}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    a.style.opacity = "0", a.style.transform = `translate3d(${y}px, ${I + 10}px, 0) scale(0.985)`;
  }
  function w(a) {
    var v;
    const y = parseInt(a.dataset.left || "0", 10), I = parseInt(a.dataset.top || "0", 10), T = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if (!((v = l == null ? void 0 : l.virtualizing) != null && v.value)) {
      if (!m(I, T)) {
        a.style.transition = "none";
        return;
      }
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${y}px, ${I}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "";
      });
    }
  }
  function x(a, y) {
    var p;
    const I = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10), v = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((p = l == null ? void 0 : l.virtualizing) != null && p.value) {
      y();
      return;
    }
    if (!m(T, v)) {
      a.style.transition = "none", a.style.opacity = "0", y();
      return;
    }
    const M = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let r = Number.isFinite(M) && M > 0 ? M : NaN;
    if (!Number.isFinite(r)) {
      const $ = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", H = parseFloat($);
      r = Number.isFinite(H) && H > 0 ? H : 200;
    }
    const h = a.style.transitionDuration, s = () => {
      a.removeEventListener("transitionend", d), clearTimeout(k), a.style.transitionDuration = h || "";
    }, d = (c) => {
      (!c || c.target === a) && (s(), y());
    }, k = setTimeout(() => {
      s(), y();
    }, r + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${r}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${I}px, ${T + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", d);
    });
  }
  return {
    onEnter: f,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: x
  };
}
function ta({
  container: e,
  masonry: l,
  columns: o,
  containerHeight: t,
  isLoading: g,
  pageSize: m,
  refreshLayout: f,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: x
}) {
  let a = 0;
  async function y(I, T = !1) {
    if (!e.value) return;
    const v = I ?? be(l.value, o.value), M = v.length ? Math.max(...v) : 0, r = e.value.scrollTop + e.value.clientHeight, h = e.value.scrollTop > a + 1;
    a = e.value.scrollTop;
    const s = typeof x == "number" ? x : 200, d = s >= 0 ? Math.max(0, M - s) : Math.max(0, M + s);
    if (r >= d && (h || T) && !g.value) {
      await w(), await U();
      return;
    }
  }
  return {
    handleScroll: y
  };
}
function aa(e) {
  const { useSwipeMode: l, masonry: o, isLoading: t, loadNext: g, loadPage: m, paginationHistory: f } = e, i = D(0), w = D(0), x = D(!1), a = D(0), y = D(0), I = D(null), T = Z(() => {
    if (!l.value || o.value.length === 0) return null;
    const S = Math.max(0, Math.min(i.value, o.value.length - 1));
    return o.value[S] || null;
  }), v = Z(() => {
    if (!l.value || !T.value) return null;
    const S = i.value + 1;
    return S >= o.value.length ? null : o.value[S] || null;
  }), M = Z(() => {
    if (!l.value || !T.value) return null;
    const S = i.value - 1;
    return S < 0 ? null : o.value[S] || null;
  });
  function r() {
    if (!I.value) return;
    const S = I.value.clientHeight;
    w.value = -i.value * S;
  }
  function h() {
    if (!v.value) {
      g();
      return;
    }
    i.value++, r(), i.value >= o.value.length - 5 && g();
  }
  function s() {
    M.value && (i.value--, r());
  }
  function d(S) {
    l.value && (x.value = !0, a.value = S.touches[0].clientY, y.value = w.value, S.preventDefault());
  }
  function k(S) {
    if (!l.value || !x.value) return;
    const b = S.touches[0].clientY - a.value;
    w.value = y.value + b, S.preventDefault();
  }
  function p(S) {
    if (!l.value || !x.value) return;
    x.value = !1;
    const b = w.value - y.value;
    Math.abs(b) > 100 ? b > 0 && M.value ? s() : b < 0 && v.value ? h() : r() : r(), S.preventDefault();
  }
  function c(S) {
    l.value && (x.value = !0, a.value = S.clientY, y.value = w.value, S.preventDefault());
  }
  function $(S) {
    if (!l.value || !x.value) return;
    const b = S.clientY - a.value;
    w.value = y.value + b, S.preventDefault();
  }
  function H(S) {
    if (!l.value || !x.value) return;
    x.value = !1;
    const b = w.value - y.value;
    Math.abs(b) > 100 ? b > 0 && M.value ? s() : b < 0 && v.value ? h() : r() : r(), S.preventDefault();
  }
  function R() {
    !l.value && i.value > 0 && (i.value = 0, w.value = 0), l.value && o.value.length === 0 && !t.value && m(f.value[0]), l.value && r();
  }
  function O() {
    i.value = 0, w.value = 0, x.value = !1;
  }
  return {
    // State
    currentSwipeIndex: i,
    swipeOffset: w,
    isDragging: x,
    swipeContainer: I,
    // Computed
    currentItem: T,
    nextItem: v,
    previousItem: M,
    // Functions
    handleTouchStart: d,
    handleTouchMove: k,
    handleTouchEnd: p,
    handleMouseDown: c,
    handleMouseMove: $,
    handleMouseUp: H,
    goToNextItem: h,
    goToPreviousItem: s,
    snapToCurrentItem: r,
    handleWindowResize: R,
    reset: O
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function na(e) {
  const {
    getNextPage: l,
    masonry: o,
    isLoading: t,
    hasReachedEnd: g,
    loadError: m,
    currentPage: f,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: x,
    retryInitialDelayMs: a,
    retryBackoffStepMs: y,
    backfillEnabled: I,
    backfillDelayMs: T,
    backfillMaxCalls: v,
    pageSize: M,
    autoRefreshOnEmpty: r,
    emits: h
  } = e, s = D(!1);
  let d = !1;
  function k(b, F) {
    return new Promise((n) => {
      const L = Math.max(0, b | 0), P = Date.now();
      F(L, L);
      const N = setInterval(() => {
        if (s.value) {
          clearInterval(N), n();
          return;
        }
        const W = Date.now() - P, _ = Math.max(0, L - W);
        F(_, L), _ <= 0 && (clearInterval(N), n());
      }, 100);
    });
  }
  async function p(b) {
    let F = 0;
    const n = x;
    let L = a;
    for (; ; )
      try {
        const P = await b();
        return F > 0 && h("retry:stop", { attempt: F, success: !0 }), P;
      } catch (P) {
        if (F++, F > n)
          throw h("retry:stop", { attempt: F - 1, success: !1 }), P;
        h("retry:start", { attempt: F, max: n, totalMs: L }), await k(L, (N, W) => {
          h("retry:tick", { attempt: F, remainingMs: N, totalMs: W });
        }), L += y;
      }
  }
  async function c(b) {
    try {
      const F = await p(() => l(b));
      return w([...o.value, ...F.items]), F;
    } catch (F) {
      throw F;
    }
  }
  async function $(b, F = !1) {
    if (!F && !I || d || s.value || g.value) return;
    const n = (b || 0) + (M || 0);
    if (!M || M <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      g.value = !0;
      return;
    }
    if (!(o.value.length >= n)) {
      d = !0, t.value = !0;
      try {
        let P = 0;
        for (h("backfill:start", { target: n, fetched: o.value.length, calls: P }); o.value.length < n && P < v && i.value[i.value.length - 1] != null && !s.value && !g.value && d && (await k(T, (W, _) => {
          h("backfill:tick", {
            fetched: o.value.length,
            target: n,
            calls: P,
            remainingMs: W,
            totalMs: _
          });
        }), !(s.value || !d)); ) {
          const N = i.value[i.value.length - 1];
          if (N == null) {
            g.value = !0;
            break;
          }
          try {
            if (s.value || !d) break;
            const W = await c(N);
            if (s.value || !d) break;
            m.value = null, i.value.push(W.nextPage), W.nextPage == null && (g.value = !0);
          } catch (W) {
            if (s.value || !d) break;
            m.value = me(W);
          }
          P++;
        }
        h("backfill:stop", { fetched: o.value.length, calls: P });
      } finally {
        d = !1, t.value = !1, h("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function H(b) {
    if (!t.value) {
      s.value = !1, t.value = !0, g.value = !1, m.value = null;
      try {
        const F = o.value.length;
        if (s.value) return;
        const n = await c(b);
        return s.value ? void 0 : (m.value = null, f.value = b, i.value.push(n.nextPage), n.nextPage == null && (g.value = !0), await $(F), n);
      } catch (F) {
        throw m.value = me(F), F;
      } finally {
        t.value = !1;
      }
    }
  }
  async function R() {
    if (!t.value && !g.value) {
      s.value = !1, t.value = !0, m.value = null;
      try {
        const b = o.value.length;
        if (s.value) return;
        const F = i.value[i.value.length - 1];
        if (F == null) {
          g.value = !0, t.value = !1, h("loading:stop", { fetched: o.value.length });
          return;
        }
        const n = await c(F);
        return s.value ? void 0 : (m.value = null, f.value = F, i.value.push(n.nextPage), n.nextPage == null && (g.value = !0), await $(b), n);
      } catch (b) {
        throw m.value = me(b), b;
      } finally {
        t.value = !1, h("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function O() {
    if (!t.value) {
      s.value = !1, t.value = !0;
      try {
        const b = f.value;
        if (b == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", f.value, "paginationHistory:", i.value);
          return;
        }
        o.value = [], g.value = !1, m.value = null, i.value = [b];
        const F = await c(b);
        if (s.value) return;
        m.value = null, f.value = b, i.value.push(F.nextPage), F.nextPage == null && (g.value = !0);
        const n = o.value.length;
        return await $(n), F;
      } catch (b) {
        throw m.value = me(b), b;
      } finally {
        t.value = !1, h("loading:stop", { fetched: o.value.length });
      }
    }
  }
  function S() {
    const b = d;
    s.value = !0, t.value = !1, d = !1, b && h("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 }), h("loading:stop", { fetched: o.value.length });
  }
  return {
    loadPage: H,
    loadNext: R,
    refreshCurrentPage: O,
    cancelLoad: S,
    maybeBackfillToTarget: $,
    getContent: c
  };
}
function la(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    refreshLayout: t,
    refreshCurrentPage: g,
    loadNext: m,
    maybeBackfillToTarget: f,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  let x = /* @__PURE__ */ new Set(), a = null, y = !1;
  async function I() {
    if (x.size === 0 || y) return;
    y = !0;
    const d = Array.from(x);
    x.clear(), a = null, await v(d), y = !1;
  }
  async function T(d) {
    x.add(d), a && clearTimeout(a), a = setTimeout(() => {
      I();
    }, 16);
  }
  async function v(d) {
    if (!d || d.length === 0) return;
    const k = new Set(d.map((c) => c.id)), p = l.value.filter((c) => !k.has(c.id));
    if (l.value = p, await U(), p.length === 0 && w.value.length > 0) {
      if (i)
        await g();
      else
        try {
          await m(), await f(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
      t(p);
    });
  }
  async function M(d) {
    !d || d.length === 0 || (d.forEach((k) => x.add(k)), a && clearTimeout(a), a = setTimeout(() => {
      I();
    }, 16));
  }
  async function r(d, k) {
    if (!d) return;
    const p = l.value;
    if (p.findIndex((R) => R.id === d.id) !== -1) return;
    const $ = [...p], H = Math.min(k, $.length);
    $.splice(H, 0, d), l.value = $, await U(), o.value || (await new Promise((R) => requestAnimationFrame(() => R())), requestAnimationFrame(() => {
      t($);
    }));
  }
  async function h(d, k) {
    var F;
    if (!d || d.length === 0) return;
    if (!k || k.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const p = l.value, c = new Set(p.map((n) => n.id)), $ = [];
    for (let n = 0; n < d.length; n++)
      c.has((F = d[n]) == null ? void 0 : F.id) || $.push({ item: d[n], index: k[n] });
    if ($.length === 0) return;
    const H = /* @__PURE__ */ new Map();
    for (const { item: n, index: L } of $)
      H.set(L, n);
    const R = $.length > 0 ? Math.max(...$.map(({ index: n }) => n)) : -1, O = Math.max(p.length - 1, R), S = [];
    let b = 0;
    for (let n = 0; n <= O; n++)
      H.has(n) ? S.push(H.get(n)) : b < p.length && (S.push(p[b]), b++);
    for (; b < p.length; )
      S.push(p[b]), b++;
    l.value = S, await U(), o.value || (await new Promise((n) => requestAnimationFrame(() => n())), requestAnimationFrame(() => {
      t(S);
    }));
  }
  async function s() {
    l.value = [];
  }
  return {
    remove: T,
    removeMany: M,
    restore: r,
    restoreMany: h,
    removeAll: s
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    container: t,
    columns: g,
    containerWidth: m,
    masonryContentHeight: f,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: x
  } = e;
  let a = [];
  function y(M) {
    const r = Kt(M);
    let h = 0;
    if (t.value) {
      const { scrollTop: s, clientHeight: d } = t.value;
      h = s + d + 100;
    }
    f.value = Math.max(r, h);
  }
  function I(M) {
    var d, k;
    if (o.value) {
      l.value = M;
      return;
    }
    if (!t.value) return;
    if (x(M, "refreshLayout"), M.length > 1e3 && a.length > M.length && a.length - M.length < 100) {
      let p = !0;
      for (let c = 0; c < M.length; c++)
        if (((d = M[c]) == null ? void 0 : d.id) !== ((k = a[c]) == null ? void 0 : k.id)) {
          p = !1;
          break;
        }
      if (p) {
        const c = M.map(($, H) => ({
          ...a[H],
          originalIndex: H
        }));
        y(c), l.value = c, a = c;
        return;
      }
    }
    const h = M.map((p, c) => ({
      ...p,
      originalIndex: c
    })), s = t.value;
    if (w.value && w.value.width !== void 0) {
      const p = s.style.width, c = s.style.boxSizing;
      s.style.boxSizing = "border-box", s.style.width = `${w.value.width}px`, s.offsetWidth;
      const $ = Xe(h, s, g.value, i.value);
      s.style.width = p, s.style.boxSizing = c, y($), l.value = $, a = $;
    } else {
      const p = Xe(h, s, g.value, i.value);
      y(p), l.value = p, a = p;
    }
  }
  function T(M, r) {
    w.value = M, M && (M.width !== void 0 && (m.value = M.width), !o.value && t.value && l.value.length > 0 && U(() => {
      g.value = ue(i.value, m.value), I(l.value), r && r();
    }));
  }
  function v() {
    g.value = ue(i.value, m.value), I(l.value);
  }
  return {
    refreshLayout: I,
    setFixedDimensions: T,
    onResize: v,
    calculateHeight: y
  };
}
function ia(e) {
  const {
    masonry: l,
    container: o,
    columns: t,
    virtualBufferPx: g,
    loadThresholdPx: m
  } = e, f = D(e.handleScroll), i = D(0), w = D(0), x = g, a = D(!1), y = D({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), I = Z(() => {
    const r = i.value - x, h = i.value + w.value + x, s = l.value;
    return !s || s.length === 0 ? [] : s.filter((k) => {
      if (typeof k.top != "number" || typeof k.columnHeight != "number")
        return !0;
      const p = k.top;
      return k.top + k.columnHeight >= r && p <= h;
    });
  });
  function T(r) {
    if (!o.value) return;
    const { scrollTop: h, clientHeight: s } = o.value, d = h + s, k = r ?? be(l.value, t.value), p = k.length ? Math.max(...k) : 0, c = typeof m == "number" ? m : 200, $ = c >= 0 ? Math.max(0, p - c) : Math.max(0, p + c), H = Math.max(0, $ - d), R = H <= 100;
    y.value = {
      distanceToTrigger: Math.round(H),
      isNearTrigger: R
    };
  }
  async function v() {
    if (o.value) {
      const h = o.value.scrollTop, s = o.value.clientHeight || window.innerHeight, d = s > 0 ? s : window.innerHeight;
      i.value = h, w.value = d;
    }
    a.value = !0, await U(), await new Promise((h) => requestAnimationFrame(() => h())), a.value = !1;
    const r = be(l.value, t.value);
    f.value(r), T(r);
  }
  function M() {
    i.value = 0, w.value = 0, a.value = !1, y.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: w,
    virtualizing: a,
    scrollProgress: y,
    visibleMasonry: I,
    updateScrollProgress: T,
    updateViewport: v,
    reset: M,
    handleScroll: f
  };
}
function ra(e) {
  const { masonry: l } = e, o = D(/* @__PURE__ */ new Set());
  function t(f) {
    return typeof f == "number" && f > 0 && Number.isFinite(f);
  }
  function g(f, i) {
    try {
      if (!Array.isArray(f) || f.length === 0) return;
      const w = f.filter((a) => !t(a == null ? void 0 : a.width) || !t(a == null ? void 0 : a.height));
      if (w.length === 0) return;
      const x = [];
      for (const a of w) {
        const y = (a == null ? void 0 : a.id) ?? `idx:${l.value.indexOf(a)}`;
        o.value.has(y) || (o.value.add(y), x.push(y));
      }
      if (x.length > 0) {
        const a = x.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: i,
            count: x.length,
            sampleIds: a,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function m() {
    o.value.clear();
  }
  return {
    checkItemDimensions: g,
    invalidDimensionIds: o,
    reset: m
  };
}
const sa = { class: "flex-1 relative min-h-0" }, ua = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ca = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, va = {
  key: 1,
  class: "relative w-full h-full"
}, da = ["src"], fa = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ma = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ga = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Me = /* @__PURE__ */ et({
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
  setup(e, { emit: l }) {
    const o = e, t = l, g = D(!1), m = D(!1), f = D(null), i = D(!1), w = D(!1), x = D(null), a = D(!1), y = D(!1), I = D(!1), T = D(!1), v = D(!1), M = D(null), r = D(null);
    let h = null;
    const s = Z(() => {
      var n;
      return o.type ?? ((n = o.item) == null ? void 0 : n.type) ?? "image";
    }), d = Z(() => {
      var n;
      return o.notFound ?? ((n = o.item) == null ? void 0 : n.notFound) ?? !1;
    }), k = Z(() => !!o.inSwipeMode);
    function p(n, L) {
      const P = n === "image" ? g.value : i.value;
      y.value && P && !I.value && (I.value = !0, t("in-view-and-loaded", { item: o.item, type: n, src: L }));
    }
    function c(n) {
      t("mouse-enter", { item: o.item, type: n });
    }
    function $(n) {
      t("mouse-leave", { item: o.item, type: n });
    }
    function H(n) {
      if (k.value) return;
      const L = n.target;
      L && (L.paused ? L.play() : L.pause());
    }
    function R(n) {
      const L = n.target;
      L && (k.value || L.play(), c("video"));
    }
    function O(n) {
      const L = n.target;
      L && (k.value || L.pause(), $("video"));
    }
    function S(n) {
      return new Promise((L, P) => {
        if (!n) {
          const E = new Error("No image source provided");
          t("preload:error", { item: o.item, type: "image", src: n, error: E }), P(E);
          return;
        }
        const N = new Image(), W = Date.now(), _ = 300;
        N.onload = () => {
          const E = Date.now() - W, C = Math.max(0, _ - E);
          setTimeout(async () => {
            g.value = !0, m.value = !1, T.value = !1, await U(), await new Promise((q) => setTimeout(q, 100)), v.value = !0, t("preload:success", { item: o.item, type: "image", src: n }), p("image", n), L();
          }, C);
        }, N.onerror = () => {
          m.value = !0, g.value = !1, T.value = !1;
          const E = new Error("Failed to load image");
          t("preload:error", { item: o.item, type: "image", src: n, error: E }), P(E);
        }, N.src = n;
      });
    }
    function b(n) {
      return new Promise((L, P) => {
        if (!n) {
          const E = new Error("No video source provided");
          t("preload:error", { item: o.item, type: "video", src: n, error: E }), P(E);
          return;
        }
        const N = document.createElement("video"), W = Date.now(), _ = 300;
        N.preload = "metadata", N.muted = !0, N.onloadedmetadata = () => {
          const E = Date.now() - W, C = Math.max(0, _ - E);
          setTimeout(async () => {
            i.value = !0, w.value = !1, T.value = !1, await U(), await new Promise((q) => setTimeout(q, 100)), v.value = !0, t("preload:success", { item: o.item, type: "video", src: n }), p("video", n), L();
          }, C);
        }, N.onerror = () => {
          w.value = !0, i.value = !1, T.value = !1;
          const E = new Error("Failed to load video");
          t("preload:error", { item: o.item, type: "video", src: n, error: E }), P(E);
        }, N.src = n;
      });
    }
    async function F() {
      var L;
      if (!a.value || T.value || d.value || s.value === "video" && i.value || s.value === "image" && g.value)
        return;
      const n = (L = o.item) == null ? void 0 : L.src;
      if (n)
        if (T.value = !0, v.value = !1, s.value === "video") {
          x.value = n, i.value = !1, w.value = !1;
          try {
            await b(n);
          } catch {
          }
        } else {
          f.value = n, g.value = !1, m.value = !1;
          try {
            await S(n);
          } catch {
          }
        }
    }
    return tt(async () => {
      if (!M.value) return;
      const n = [o.preloadThreshold, 1].filter((P, N, W) => W.indexOf(P) === N).sort((P, N) => P - N);
      h = new IntersectionObserver(
        (P) => {
          P.forEach((N) => {
            const W = N.intersectionRatio, _ = W >= 1, E = W >= o.preloadThreshold;
            if (_ && !y.value) {
              y.value = !0, t("in-view", { item: o.item, type: s.value });
              const C = s.value === "image" ? f.value : x.value, q = s.value === "image" ? g.value : i.value;
              C && q && p(s.value, C);
            }
            E && !a.value ? (a.value = !0, F()) : N.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: n
        }
      ), h.observe(M.value), await U(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          L();
        });
      }), setTimeout(() => {
        L();
      }, 100);
      function L() {
        if (!M.value || y.value) return;
        const P = M.value.getBoundingClientRect(), N = window.innerHeight, W = window.innerWidth;
        if (P.top >= 0 && P.bottom <= N && P.left >= 0 && P.right <= W && P.height > 0 && P.width > 0) {
          y.value = !0, t("in-view", { item: o.item, type: s.value });
          const E = s.value === "image" ? f.value : x.value, C = s.value === "image" ? g.value : i.value;
          E && C && p(s.value, E);
        }
      }
    }), at(() => {
      h && (h.disconnect(), h = null);
    }), te(
      () => {
        var n;
        return (n = o.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || d.value)) {
          if (s.value === "video") {
            if (n !== x.value && (i.value = !1, w.value = !1, x.value = n, a.value)) {
              T.value = !0;
              try {
                await b(n);
              } catch {
              }
            }
          } else if (n !== f.value && (g.value = !1, m.value = !1, f.value = n, a.value)) {
            T.value = !0;
            try {
              await S(n);
            } catch {
            }
          }
        }
      }
    ), te(
      () => o.isActive,
      (n) => {
        !k.value || !r.value || (n ? r.value.play() : r.value.pause());
      }
    ), (n, L) => (j(), V("div", {
      ref_key: "containerRef",
      ref: M,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (j(), V("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${n.headerHeight}px` })
      }, [
        J(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: m.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: y.value
        })
      ], 4)) : ae("", !0),
      Y("div", sa, [
        J(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: m.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          imageSrc: f.value,
          videoSrc: x.value,
          showMedia: v.value,
          isFullyInView: y.value
        }, () => [
          Y("div", ua, [
            d.value ? (j(), V("div", ca, L[3] || (L[3] = [
              Y("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              Y("span", { class: "font-medium" }, "Not Found", -1),
              Y("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), V("div", va, [
              s.value === "image" && f.value ? (j(), V("img", {
                key: 0,
                src: f.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  g.value && v.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: L[0] || (L[0] = (P) => c("image")),
                onMouseleave: L[1] || (L[1] = (P) => $("image"))
              }, null, 42, da)) : ae("", !0),
              s.value === "video" && x.value ? (j(), V("video", {
                key: 1,
                ref_key: "videoEl",
                ref: r,
                src: x.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  i.value && v.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: k.value && o.isActive,
                controls: k.value,
                onClick: Ye(H, ["stop"]),
                onTouchend: Ye(H, ["stop", "prevent"]),
                onMouseenter: R,
                onMouseleave: O,
                onError: L[2] || (L[2] = (P) => w.value = !0)
              }, null, 42, fa)) : ae("", !0),
              !g.value && !i.value && !m.value && !w.value ? (j(), V("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  v.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                Y("div", ha, [
                  J(n.$slots, "placeholder-icon", { mediaType: s.value }, () => [
                    Y("i", {
                      class: ie(s.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              T.value ? (j(), V("div", ma, L[4] || (L[4] = [
                Y("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  Y("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              s.value === "image" && m.value || s.value === "video" && w.value ? (j(), V("div", ga, [
                Y("i", {
                  class: ie(s.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                Y("span", null, "Failed to load " + Ne(s.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (j(), V("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${n.footerHeight}px` })
      }, [
        J(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: m.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: y.value
        })
      ], 4)) : ae("", !0)
    ], 512));
  }
}), pa = { class: "w-full h-full flex items-center justify-center p-4" }, ya = { class: "w-full h-full max-w-full max-h-full relative" }, wa = {
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
}, Ia = { class: "text-red-500 dark:text-red-400" }, Ea = /* @__PURE__ */ et({
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
    // Initial pagination state when skipInitialLoad is true and items are provided
    initialPage: {
      type: [Number, String],
      default: null
    },
    initialNextPage: {
      type: [Number, String],
      default: null
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
    "loading:stop",
    "remove-all:complete",
    // Re-emit item-level preload events from the default MasonryItem
    "item:preload:success",
    "item:preload:error",
    // Mouse events from MasonryItem content
    "item:mouse-enter",
    "item:mouse-leave"
  ],
  setup(e, { expose: l, emit: o }) {
    const t = e, g = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, m = Z(() => {
      var u;
      return {
        ...g,
        ...t.layout,
        sizes: {
          ...g.sizes,
          ...((u = t.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), f = D(null), i = D(typeof window < "u" ? window.innerWidth : 1024), w = D(typeof window < "u" ? window.innerHeight : 768), x = D(null);
    let a = null;
    function y(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const I = Z(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const u = typeof t.mobileBreakpoint == "string" ? y(t.mobileBreakpoint) : t.mobileBreakpoint;
      return i.value < u;
    }), T = o, v = Z({
      get: () => t.items,
      set: (u) => T("update:items", u)
    }), M = D(7), r = D(null), h = D([]), s = D(null), d = D(!1), k = D(0), p = D(!1), c = D(null), $ = Z(() => Jt(i.value)), H = ra({
      masonry: v
    }), { checkItemDimensions: R, reset: O } = H, S = oa({
      masonry: v,
      useSwipeMode: I,
      container: r,
      columns: M,
      containerWidth: i,
      masonryContentHeight: k,
      layout: m,
      fixedDimensions: x,
      checkItemDimensions: R
    }), { refreshLayout: b, setFixedDimensions: F, onResize: n } = S, L = ia({
      masonry: v,
      container: r,
      columns: M,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: P, viewportHeight: N, virtualizing: W, visibleMasonry: _, updateScrollProgress: E, updateViewport: C, reset: q } = L, { onEnter: ne, onBeforeEnter: K, onBeforeLeave: re, onLeave: ee } = ea(
      { container: r },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: W }
    ), ot = ne, it = K, rt = re, st = ee, ut = na({
      getNextPage: t.getNextPage,
      masonry: v,
      isLoading: d,
      hasReachedEnd: p,
      loadError: c,
      currentPage: s,
      paginationHistory: h,
      refreshLayout: b,
      retryMaxAttempts: t.retryMaxAttempts,
      retryInitialDelayMs: t.retryInitialDelayMs,
      retryBackoffStepMs: t.retryBackoffStepMs,
      backfillEnabled: t.backfillEnabled,
      backfillDelayMs: t.backfillDelayMs,
      backfillMaxCalls: t.backfillMaxCalls,
      pageSize: t.pageSize,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      emits: T
    }), { loadPage: Te, loadNext: pe, refreshCurrentPage: De, cancelLoad: Ie, maybeBackfillToTarget: ct } = ut, Q = aa({
      useSwipeMode: I,
      masonry: v,
      isLoading: d,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: h
    }), { handleScroll: ze } = ta({
      container: r,
      masonry: v,
      columns: M,
      containerHeight: k,
      isLoading: d,
      pageSize: t.pageSize,
      refreshLayout: b,
      setItemsRaw: (u) => {
        v.value = u;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    L.handleScroll.value = ze;
    const vt = la({
      masonry: v,
      useSwipeMode: I,
      refreshLayout: b,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: ct,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: h
    }), { remove: ce, removeMany: dt, restore: ft, restoreMany: ht, removeAll: mt } = vt;
    function gt(u) {
      F(u, E), !u && f.value && (i.value = f.value.clientWidth, w.value = f.value.clientHeight);
    }
    l({
      isLoading: d,
      refreshLayout: b,
      // Container dimensions (wrapper element)
      containerWidth: i,
      containerHeight: w,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: k,
      // Current page
      currentPage: s,
      // End of list tracking
      hasReachedEnd: p,
      // Load error tracking
      loadError: c,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: gt,
      remove: ce,
      removeMany: dt,
      removeAll: mt,
      restore: ft,
      restoreMany: ht,
      loadNext: pe,
      loadPage: Te,
      refreshCurrentPage: De,
      reset: xt,
      destroy: bt,
      init: je,
      restoreItems: Pe,
      paginationHistory: h,
      cancelLoad: Ie,
      scrollToTop: pt,
      scrollTo: yt,
      totalItems: Z(() => v.value.length),
      currentBreakpoint: $
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Ae = Q.handleTouchStart, Re = Q.handleTouchMove, We = Q.handleTouchEnd, Oe = Q.handleMouseDown, Ee = Q.handleMouseMove, Le = Q.handleMouseUp, ke = Q.snapToCurrentItem;
    function pt(u) {
      r.value && r.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function yt(u) {
      r.value && (r.value.scrollTo({
        top: u.top ?? r.value.scrollTop,
        left: u.left ?? r.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight || window.innerHeight));
    }
    function wt() {
      n(), r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight);
    }
    function xt() {
      Ie(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), v.value = [], w.value = 0, s.value = t.loadAtPage, h.value = [t.loadAtPage], p.value = !1, c.value = null, q(), we = !1;
    }
    function bt() {
      Ie(), v.value = [], k.value = 0, s.value = null, h.value = [], p.value = !1, c.value = null, d.value = !1, se.value = 0, ve.value = 0, ye.value = !1, q(), O(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Qe(async () => {
      I.value || await C();
    }, 200), Ce = Qe(wt, 200);
    function Ve() {
      Q.handleWindowResize();
    }
    function je(u, B, z) {
      s.value = B, h.value = [B], h.value.push(z), p.value = z == null, R(u, "init"), I.value ? (v.value = [...v.value, ...u], se.value === 0 && v.value.length > 0 && (ve.value = 0)) : (b([...v.value, ...u]), r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight || window.innerHeight), U(() => {
        r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight || window.innerHeight, E());
      }));
    }
    async function Pe(u, B, z) {
      if (!t.skipInitialLoad) {
        je(u, B, z);
        return;
      }
      if (s.value = B, h.value = [B], z != null && h.value.push(z), p.value = z === null, c.value = null, R(u, "restoreItems"), I.value)
        v.value = u, se.value === 0 && v.value.length > 0 && (ve.value = 0);
      else if (b(u), r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight || window.innerHeight), await U(), r.value) {
        P.value = r.value.scrollTop, N.value = r.value.clientHeight || window.innerHeight, E(), await U();
        const G = be(v.value, M.value), A = G.length ? Math.max(...G) : 0, qe = r.value.scrollTop + r.value.clientHeight, Se = typeof t.loadThresholdPx == "number" ? t.loadThresholdPx : 200, Mt = Se >= 0 ? Math.max(0, A - Se) : Math.max(0, A + Se);
        qe >= Mt && !p.value && !d.value && h.value.length > 0 && h.value[h.value.length - 1] != null && await ze(G, !0);
      }
    }
    te(
      m,
      () => {
        I.value || r.value && (M.value = ue(m.value, i.value), b(v.value));
      },
      { deep: !0 }
    ), te(() => t.layoutMode, () => {
      x.value && x.value.width !== void 0 ? i.value = x.value.width : f.value && (i.value = f.value.clientWidth);
    }), te(r, (u) => {
      u && !I.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return te(
      () => [t.items, t.skipInitialLoad, t.initialPage, t.initialNextPage],
      ([u, B, z, G]) => {
        if (B && u && u.length > 0 && !we) {
          we = !0;
          const A = z ?? t.loadAtPage;
          Pe(u, A, G !== void 0 ? G : void 0);
        }
      },
      { immediate: !1 }
    ), te(I, (u, B) => {
      B === void 0 && u === !1 || U(() => {
        u ? (document.addEventListener("mousemove", Ee), document.addEventListener("mouseup", Le), r.value && r.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, v.value.length > 0 && ke()) : (document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Le), r.value && f.value && (x.value && x.value.width !== void 0 ? i.value = x.value.width : i.value = f.value.clientWidth, r.value.removeEventListener("scroll", oe), r.value.addEventListener("scroll", oe, { passive: !0 }), v.value.length > 0 && (M.value = ue(m.value, i.value), b(v.value), P.value = r.value.scrollTop, N.value = r.value.clientHeight, E())));
      });
    }, { immediate: !0 }), te(le, (u) => {
      u && (u.addEventListener("touchstart", Ae, { passive: !1 }), u.addEventListener("touchmove", Re, { passive: !1 }), u.addEventListener("touchend", We), u.addEventListener("mousedown", Oe));
    }), te(() => v.value.length, (u, B) => {
      I.value && u > 0 && B === 0 && (se.value = 0, U(() => ke()));
    }), te(f, (u) => {
      a && (a.disconnect(), a = null), u && typeof ResizeObserver < "u" ? (a = new ResizeObserver((B) => {
        if (!x.value)
          for (const z of B) {
            const G = z.contentRect.width, A = z.contentRect.height;
            i.value !== G && (i.value = G), w.value !== A && (w.value = A);
          }
      }), a.observe(u), x.value || (i.value = u.clientWidth, w.value = u.clientHeight)) : u && (x.value || (i.value = u.clientWidth, w.value = u.clientHeight));
    }, { immediate: !0 }), te(i, (u, B) => {
      u !== B && u > 0 && !I.value && r.value && v.value.length > 0 && U(() => {
        M.value = ue(m.value, u), b(v.value), E();
      });
    }), tt(async () => {
      try {
        await U(), f.value && !a && (i.value = f.value.clientWidth, w.value = f.value.clientHeight), I.value || (M.value = ue(m.value, i.value), r.value && (P.value = r.value.scrollTop, N.value = r.value.clientHeight));
        const u = t.loadAtPage;
        if (h.value = [u], !t.skipInitialLoad)
          await Te(h.value[0]);
        else if (t.items && t.items.length > 0) {
          const B = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, z = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Pe(t.items, B, z), we = !0;
        }
        I.value ? U(() => ke()) : E();
      } catch (u) {
        c.value || (console.error("Error during component initialization:", u), c.value = me(u)), d.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", Ve);
    }), at(() => {
      var u;
      a && (a.disconnect(), a = null), (u = r.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", Ve), le.value && (le.value.removeEventListener("touchstart", Ae), le.value.removeEventListener("touchmove", Re), le.value.removeEventListener("touchend", We), le.value.removeEventListener("mousedown", Oe)), document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Le);
    }), (u, B) => (j(), V("div", {
      ref_key: "wrapper",
      ref: f,
      class: "w-full h-full flex flex-col relative"
    }, [
      I.value ? (j(), V("div", {
        key: 0,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": t.forceMotion, "cursor-grab": !X(ye), "cursor-grabbing": X(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        Y("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${X(ve)}px)`,
            transition: X(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${v.value.length * 100}%`
          })
        }, [
          (j(!0), V(Ue, null, _e(v.value, (z, G) => (j(), V("div", {
            key: `${z.page}-${z.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${G * (100 / v.value.length)}%`,
              height: `${100 / v.value.length}%`
            })
          }, [
            Y("div", pa, [
              Y("div", ya, [
                J(u.$slots, "default", {
                  item: z,
                  remove: X(ce),
                  index: z.originalIndex ?? v.value.indexOf(z)
                }, () => [
                  He(Me, {
                    item: z,
                    remove: X(ce),
                    "header-height": m.value.header,
                    "footer-height": m.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": G === X(se),
                    "onPreload:success": B[0] || (B[0] = (A) => T("item:preload:success", A)),
                    "onPreload:error": B[1] || (B[1] = (A) => T("item:preload:error", A)),
                    onMouseEnter: B[2] || (B[2] = (A) => T("item:mouse-enter", A)),
                    onMouseLeave: B[3] || (B[3] = (A) => T("item:mouse-leave", A))
                  }, {
                    header: de((A) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: de((A) => [
                      J(u.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        p.value && v.value.length > 0 ? (j(), V("div", wa, [
          J(u.$slots, "end-message", {}, () => [
            B[8] || (B[8] = Y("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        c.value && v.value.length > 0 ? (j(), V("div", xa, [
          J(u.$slots, "error-message", { error: c.value }, () => [
            Y("p", ba, "Failed to load content: " + Ne(c.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (j(), V("div", {
        key: 1,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": t.forceMotion }]),
        ref_key: "container",
        ref: r
      }, [
        Y("div", {
          class: "relative",
          style: ge({ height: `${k.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          He(Tt, {
            name: "masonry",
            css: !1,
            onEnter: X(ot),
            onBeforeEnter: X(it),
            onLeave: X(st),
            onBeforeLeave: X(rt)
          }, {
            default: de(() => [
              (j(!0), V(Ue, null, _e(X(_), (z, G) => (j(), V("div", fe({
                key: `${z.page}-${z.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, X(Zt)(z, G)), [
                J(u.$slots, "default", {
                  item: z,
                  remove: X(ce),
                  index: z.originalIndex ?? v.value.indexOf(z)
                }, () => [
                  He(Me, {
                    item: z,
                    remove: X(ce),
                    "header-height": m.value.header,
                    "footer-height": m.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": B[4] || (B[4] = (A) => T("item:preload:success", A)),
                    "onPreload:error": B[5] || (B[5] = (A) => T("item:preload:error", A)),
                    onMouseEnter: B[6] || (B[6] = (A) => T("item:mouse-enter", A)),
                    onMouseLeave: B[7] || (B[7] = (A) => T("item:mouse-leave", A))
                  }, {
                    header: de((A) => [
                      J(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: de((A) => [
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
        p.value && v.value.length > 0 ? (j(), V("div", Ma, [
          J(u.$slots, "end-message", {}, () => [
            B[9] || (B[9] = Y("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        c.value && v.value.length > 0 ? (j(), V("div", Ta, [
          J(u.$slots, "error-message", { error: c.value }, () => [
            Y("p", Ia, "Failed to load content: " + Ne(c.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2))
    ], 512));
  }
}), La = (e, l) => {
  const o = e.__vccOpts || e;
  for (const [t, g] of l)
    o[t] = g;
  return o;
}, Ze = /* @__PURE__ */ La(Ea, [["__scopeId", "data-v-c0458ed8"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Ha as default
};
