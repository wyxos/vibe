import { nextTick as _, ref as B, computed as K, defineComponent as Ke, onMounted as Qe, onUnmounted as Ze, watch as te, createElementBlock as q, openBlock as Y, createCommentVNode as ae, createElementVNode as U, normalizeStyle as ge, renderSlot as G, normalizeClass as re, withModifiers as Ve, toDisplayString as $e, unref as X, Fragment as je, renderList as qe, createVNode as Se, withCtx as fe, mergeProps as de, TransitionGroup as Pt } from "vue";
let ke = null;
function Lt() {
  if (ke != null) return ke;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const o = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), ke = o, o;
}
function Ye(e, l, o, n = {}) {
  const {
    gutterX: m = 0,
    gutterY: h = 0,
    header: c = 0,
    footer: r = 0,
    paddingLeft: g = 0,
    paddingRight: w = 0,
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
  let T = 0, b = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const M = window.getComputedStyle(l);
      T = parseFloat(M.paddingLeft) || 0, b = parseFloat(M.paddingRight) || 0;
    }
  } catch {
  }
  const f = (g || 0) + T, I = (w || 0) + b, P = l.offsetWidth - l.clientWidth, i = P > 0 ? P + 2 : Lt() + 2, s = l.offsetWidth - i - f - I, d = m * (o - 1), S = Math.floor((s - d) / o), x = e.map((M) => {
    const C = M.width, j = M.height;
    return Math.round(S * j / C) + r + c;
  });
  if (p === "sequential-balanced") {
    const M = x.length;
    if (M === 0) return [];
    const C = (L, z, R) => L + (z > 0 ? h : 0) + R;
    let j = Math.max(...x), k = x.reduce((L, z) => L + z, 0) + h * Math.max(0, M - 1);
    const N = (L) => {
      let z = 1, R = 0, ne = 0;
      for (let J = 0; J < M; J++) {
        const ie = x[J], Z = C(R, ne, ie);
        if (Z <= L)
          R = Z, ne++;
        else if (z++, R = ie, ne = 1, ie > L || z > o) return !1;
      }
      return z <= o;
    };
    for (; j < k; ) {
      const L = Math.floor((j + k) / 2);
      N(L) ? k = L : j = L + 1;
    }
    const $ = k, t = new Array(o).fill(0);
    let y = o - 1, F = 0, D = 0;
    for (let L = M - 1; L >= 0; L--) {
      const z = x[L], R = L < y;
      !(C(F, D, z) <= $) || R ? (t[y] = L + 1, y--, F = z, D = 1) : (F = C(F, D, z), D++);
    }
    t[0] = 0;
    const W = [], A = new Array(o).fill(0);
    for (let L = 0; L < o; L++) {
      const z = t[L], R = L + 1 < o ? t[L + 1] : M, ne = L * (S + m);
      for (let J = z; J < R; J++) {
        const Z = {
          ...e[J],
          columnWidth: S,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = x[J] - (r + c), Z.columnHeight = x[J], Z.left = ne, Z.top = A[L], A[L] += Z.columnHeight + (J + 1 < R ? h : 0), W.push(Z);
      }
    }
    return W;
  }
  const v = new Array(o).fill(0), E = [];
  for (let M = 0; M < e.length; M++) {
    const C = e[M], j = {
      ...C,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, k = v.indexOf(Math.min(...v)), N = C.width, $ = C.height;
    j.columnWidth = S, j.left = k * (S + m), j.imageHeight = Math.round(S * $ / N), j.columnHeight = j.imageHeight + r + c, j.top = v[k], v[k] += j.columnHeight + h, E.push(j);
  }
  return E;
}
var St = typeof global == "object" && global && global.Object === Object && global, kt = typeof self == "object" && self && self.Object === Object && self, et = St || kt || Function("return this")(), we = et.Symbol, tt = Object.prototype, Ht = tt.hasOwnProperty, $t = tt.toString, he = we ? we.toStringTag : void 0;
function Ft(e) {
  var l = Ht.call(e, he), o = e[he];
  try {
    e[he] = void 0;
    var n = !0;
  } catch {
  }
  var m = $t.call(e);
  return n && (l ? e[he] = o : delete e[he]), m;
}
var Dt = Object.prototype, zt = Dt.toString;
function Bt(e) {
  return zt.call(e);
}
var Rt = "[object Null]", At = "[object Undefined]", Ue = we ? we.toStringTag : void 0;
function Wt(e) {
  return e == null ? e === void 0 ? At : Rt : Ue && Ue in Object(e) ? Ft(e) : Bt(e);
}
function Nt(e) {
  return e != null && typeof e == "object";
}
var Ot = "[object Symbol]";
function Ct(e) {
  return typeof e == "symbol" || Nt(e) && Wt(e) == Ot;
}
var Vt = /\s/;
function jt(e) {
  for (var l = e.length; l-- && Vt.test(e.charAt(l)); )
    ;
  return l;
}
var qt = /^\s+/;
function Yt(e) {
  return e && e.slice(0, jt(e) + 1).replace(qt, "");
}
function Fe(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var _e = NaN, Ut = /^[-+]0x[0-9a-f]+$/i, _t = /^0b[01]+$/i, Xt = /^0o[0-7]+$/i, Gt = parseInt;
function Xe(e) {
  if (typeof e == "number")
    return e;
  if (Ct(e))
    return _e;
  if (Fe(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Fe(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Yt(e);
  var o = _t.test(e);
  return o || Xt.test(e) ? Gt(e.slice(2), o ? 2 : 8) : Ut.test(e) ? _e : +e;
}
var He = function() {
  return et.Date.now();
}, Jt = "Expected a function", Kt = Math.max, Qt = Math.min;
function Ge(e, l, o) {
  var n, m, h, c, r, g, w = 0, a = !1, p = !1, T = !0;
  if (typeof e != "function")
    throw new TypeError(Jt);
  l = Xe(l) || 0, Fe(o) && (a = !!o.leading, p = "maxWait" in o, h = p ? Kt(Xe(o.maxWait) || 0, l) : h, T = "trailing" in o ? !!o.trailing : T);
  function b(v) {
    var E = n, M = m;
    return n = m = void 0, w = v, c = e.apply(M, E), c;
  }
  function f(v) {
    return w = v, r = setTimeout(i, l), a ? b(v) : c;
  }
  function I(v) {
    var E = v - g, M = v - w, C = l - E;
    return p ? Qt(C, h - M) : C;
  }
  function P(v) {
    var E = v - g, M = v - w;
    return g === void 0 || E >= l || E < 0 || p && M >= h;
  }
  function i() {
    var v = He();
    if (P(v))
      return s(v);
    r = setTimeout(i, I(v));
  }
  function s(v) {
    return r = void 0, T && n ? b(v) : (n = m = void 0, c);
  }
  function d() {
    r !== void 0 && clearTimeout(r), w = 0, n = g = m = r = void 0;
  }
  function S() {
    return r === void 0 ? c : s(He());
  }
  function x() {
    var v = He(), E = P(v);
    if (n = arguments, m = this, g = v, E) {
      if (r === void 0)
        return f(g);
      if (p)
        return clearTimeout(r), r = setTimeout(i, l), b(g);
    }
    return r === void 0 && (r = setTimeout(i, l)), c;
  }
  return x.cancel = d, x.flush = S, x;
}
function ue(e, l) {
  const o = l ?? (typeof window < "u" ? window.innerWidth : 1024), n = e.sizes;
  return o >= 1536 && n["2xl"] ? n["2xl"] : o >= 1280 && n.xl ? n.xl : o >= 1024 && n.lg ? n.lg : o >= 768 && n.md ? n.md : o >= 640 && n.sm ? n.sm : n.base;
}
function Zt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function ea(e) {
  return e.reduce((o, n) => Math.max(o, n.top + n.columnHeight), 0) + 500;
}
function ta(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function aa(e, l = 0) {
  return {
    style: ta(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function xe(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const n = Array.from(new Set(e.map((c) => c.left))).sort((c, r) => c - r).slice(0, l), m = /* @__PURE__ */ new Map();
  for (let c = 0; c < n.length; c++) m.set(n[c], c);
  const h = new Array(n.length).fill(0);
  for (const c of e) {
    const r = m.get(c.left);
    r != null && (h[r] = Math.max(h[r], c.top + c.columnHeight));
  }
  for (; h.length < l; ) h.push(0);
  return h;
}
function na(e, l) {
  let o = 0, n = 0;
  const m = 1e3;
  function h(a, p) {
    var f;
    const T = (f = e.container) == null ? void 0 : f.value;
    if (T) {
      const I = T.scrollTop, P = T.clientHeight;
      o = I - m, n = I + P + m;
    }
    return a + p >= o && a <= n;
  }
  function c(a, p) {
    var s;
    const T = parseInt(a.dataset.left || "0", 10), b = parseInt(a.dataset.top || "0", 10), f = parseInt(a.dataset.index || "0", 10), I = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((s = l == null ? void 0 : l.virtualizing) != null && s.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${T}px, ${b}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "", p();
      });
      return;
    }
    if (!h(b, I)) {
      a.style.opacity = "1", a.style.transform = `translate3d(${T}px, ${b}px, 0) scale(1)`, a.style.transition = "none", p();
      return;
    }
    const P = Math.min(f * 20, 160), i = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${P}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${T}px, ${b}px, 0) scale(1)`;
      const d = () => {
        i ? a.style.setProperty("--masonry-opacity-delay", i) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", d), p();
      };
      a.addEventListener("transitionend", d);
    });
  }
  function r(a) {
    var b;
    const p = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10);
    if ((b = l == null ? void 0 : l.virtualizing) != null && b.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${T}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    a.style.opacity = "0", a.style.transform = `translate3d(${p}px, ${T + 10}px, 0) scale(0.985)`;
  }
  function g(a) {
    var f;
    const p = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10), b = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if (!((f = l == null ? void 0 : l.virtualizing) != null && f.value)) {
      if (!h(T, b)) {
        a.style.transition = "none";
        return;
      }
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${T}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "";
      });
    }
  }
  function w(a, p) {
    var x;
    const T = parseInt(a.dataset.left || "0", 10), b = parseInt(a.dataset.top || "0", 10), f = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((x = l == null ? void 0 : l.virtualizing) != null && x.value) {
      p();
      return;
    }
    if (!h(b, f)) {
      a.style.transition = "none", a.style.opacity = "0", p();
      return;
    }
    const I = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let P = Number.isFinite(I) && I > 0 ? I : NaN;
    if (!Number.isFinite(P)) {
      const E = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", M = parseFloat(E);
      P = Number.isFinite(M) && M > 0 ? M : 200;
    }
    const i = a.style.transitionDuration, s = () => {
      a.removeEventListener("transitionend", d), clearTimeout(S), a.style.transitionDuration = i || "";
    }, d = (v) => {
      (!v || v.target === a) && (s(), p());
    }, S = setTimeout(() => {
      s(), p();
    }, P + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${P}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${T}px, ${b + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", d);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: r,
    onBeforeLeave: g,
    onLeave: w
  };
}
function la({
  container: e,
  masonry: l,
  columns: o,
  containerHeight: n,
  isLoading: m,
  pageSize: h,
  refreshLayout: c,
  setItemsRaw: r,
  loadNext: g,
  loadThresholdPx: w
}) {
  let a = 0;
  async function p(T, b = !1) {
    if (!e.value) return;
    const f = T ?? xe(l.value, o.value), I = f.length ? Math.max(...f) : 0, P = e.value.scrollTop + e.value.clientHeight, i = e.value.scrollTop > a + 1;
    a = e.value.scrollTop;
    const s = typeof w == "number" ? w : 200, d = s >= 0 ? Math.max(0, I - s) : Math.max(0, I + s);
    if (P >= d && (i || b) && !m.value) {
      await g(), await _();
      return;
    }
  }
  return {
    handleScroll: p
  };
}
function oa(e) {
  const { useSwipeMode: l, masonry: o, isLoading: n, loadNext: m, loadPage: h, paginationHistory: c } = e, r = B(0), g = B(0), w = B(!1), a = B(0), p = B(0), T = B(null), b = K(() => {
    if (!l.value || o.value.length === 0) return null;
    const k = Math.max(0, Math.min(r.value, o.value.length - 1));
    return o.value[k] || null;
  }), f = K(() => {
    if (!l.value || !b.value) return null;
    const k = r.value + 1;
    return k >= o.value.length ? null : o.value[k] || null;
  }), I = K(() => {
    if (!l.value || !b.value) return null;
    const k = r.value - 1;
    return k < 0 ? null : o.value[k] || null;
  });
  function P() {
    if (!T.value) return;
    const k = T.value.clientHeight;
    g.value = -r.value * k;
  }
  function i() {
    if (!f.value) {
      m();
      return;
    }
    r.value++, P(), r.value >= o.value.length - 5 && m();
  }
  function s() {
    I.value && (r.value--, P());
  }
  function d(k) {
    l.value && (w.value = !0, a.value = k.touches[0].clientY, p.value = g.value, k.preventDefault());
  }
  function S(k) {
    if (!l.value || !w.value) return;
    const N = k.touches[0].clientY - a.value;
    g.value = p.value + N, k.preventDefault();
  }
  function x(k) {
    if (!l.value || !w.value) return;
    w.value = !1;
    const N = g.value - p.value;
    Math.abs(N) > 100 ? N > 0 && I.value ? s() : N < 0 && f.value ? i() : P() : P(), k.preventDefault();
  }
  function v(k) {
    l.value && (w.value = !0, a.value = k.clientY, p.value = g.value, k.preventDefault());
  }
  function E(k) {
    if (!l.value || !w.value) return;
    const N = k.clientY - a.value;
    g.value = p.value + N, k.preventDefault();
  }
  function M(k) {
    if (!l.value || !w.value) return;
    w.value = !1;
    const N = g.value - p.value;
    Math.abs(N) > 100 ? N > 0 && I.value ? s() : N < 0 && f.value ? i() : P() : P(), k.preventDefault();
  }
  function C() {
    !l.value && r.value > 0 && (r.value = 0, g.value = 0), l.value && o.value.length === 0 && !n.value && h(c.value[0]), l.value && P();
  }
  function j() {
    r.value = 0, g.value = 0, w.value = !1;
  }
  return {
    // State
    currentSwipeIndex: r,
    swipeOffset: g,
    isDragging: w,
    swipeContainer: T,
    // Computed
    currentItem: b,
    nextItem: f,
    previousItem: I,
    // Functions
    handleTouchStart: d,
    handleTouchMove: S,
    handleTouchEnd: x,
    handleMouseDown: v,
    handleMouseMove: E,
    handleMouseUp: M,
    goToNextItem: i,
    goToPreviousItem: s,
    snapToCurrentItem: P,
    handleWindowResize: C,
    reset: j
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function ra(e) {
  const {
    getPage: l,
    masonry: o,
    isLoading: n,
    hasReachedEnd: m,
    loadError: h,
    currentPage: c,
    paginationHistory: r,
    refreshLayout: g,
    retryMaxAttempts: w,
    retryInitialDelayMs: a,
    retryBackoffStepMs: p,
    mode: T,
    backfillDelayMs: b,
    backfillMaxCalls: f,
    pageSize: I,
    autoRefreshOnEmpty: P,
    emits: i
  } = e, s = B(!1);
  let d = !1;
  function S($) {
    return o.value.filter((t) => t.page === $).length;
  }
  function x($, t) {
    return new Promise((y) => {
      const F = Math.max(0, $ | 0), D = Date.now();
      t(F, F);
      const W = setInterval(() => {
        if (s.value) {
          clearInterval(W), y();
          return;
        }
        const A = Date.now() - D, L = Math.max(0, F - A);
        t(L, F), L <= 0 && (clearInterval(W), y());
      }, 100);
    });
  }
  async function v($) {
    let t = 0;
    const y = w;
    let F = a;
    for (; ; )
      try {
        const D = await $();
        return t > 0 && i("retry:stop", { attempt: t, success: !0 }), D;
      } catch (D) {
        if (t++, t > y)
          throw i("retry:stop", { attempt: t - 1, success: !1 }), D;
        i("retry:start", { attempt: t, max: y, totalMs: F }), await x(F, (W, A) => {
          i("retry:tick", { attempt: t, remainingMs: W, totalMs: A });
        }), F += p;
      }
  }
  async function E($) {
    try {
      const t = await v(() => l($));
      return g([...o.value, ...t.items]), t;
    } catch (t) {
      throw t;
    }
  }
  async function M($, t = !1) {
    if (!t && T !== "backfill" || d || s.value || m.value) return;
    const y = ($ || 0) + (I || 0);
    if (!I || I <= 0) return;
    if (r.value[r.value.length - 1] == null) {
      m.value = !0;
      return;
    }
    if (!(o.value.length >= y)) {
      d = !0, n.value = !0;
      try {
        let D = 0;
        for (i("backfill:start", { target: y, fetched: o.value.length, calls: D }); o.value.length < y && D < f && r.value[r.value.length - 1] != null && !s.value && !m.value && d && (await x(b, (A, L) => {
          i("backfill:tick", {
            fetched: o.value.length,
            target: y,
            calls: D,
            remainingMs: A,
            totalMs: L
          });
        }), !(s.value || !d)); ) {
          const W = r.value[r.value.length - 1];
          if (W == null) {
            m.value = !0;
            break;
          }
          try {
            if (s.value || !d) break;
            const A = await E(W);
            if (s.value || !d) break;
            h.value = null, r.value.push(A.nextPage), A.nextPage == null && (m.value = !0);
          } catch (A) {
            if (s.value || !d) break;
            h.value = me(A);
          }
          D++;
        }
        i("backfill:stop", { fetched: o.value.length, calls: D });
      } finally {
        d = !1, n.value = !1, i("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function C($) {
    if (!n.value) {
      s.value = !1, n.value = !0, m.value = !1, h.value = null;
      try {
        const t = o.value.length;
        if (s.value) return;
        const y = await E($);
        return s.value ? void 0 : (h.value = null, c.value = $, r.value.push(y.nextPage), y.nextPage == null && (m.value = !0), await M(t), y);
      } catch (t) {
        throw h.value = me(t), t;
      } finally {
        n.value = !1;
      }
    }
  }
  async function j() {
    if (!n.value && !m.value) {
      s.value = !1, n.value = !0, h.value = null;
      try {
        const $ = o.value.length;
        if (s.value) return;
        if (T === "refresh" && c.value != null && S(c.value) < I) {
          const D = await v(() => l(c.value));
          if (s.value) return;
          const W = [...o.value], A = D.items.filter((z) => !z || z.id == null || z.page == null ? !1 : !W.some((R) => R && R.id === z.id && R.page === z.page));
          if (A.length > 0) {
            const z = [...o.value, ...A];
            g(z), await new Promise((R) => setTimeout(R, 0));
          }
          if (h.value = null, A.length === 0) {
            const z = r.value[r.value.length - 1];
            if (z == null) {
              m.value = !0;
              return;
            }
            const R = await E(z);
            return s.value ? void 0 : (h.value = null, c.value = z, r.value.push(R.nextPage), R.nextPage == null && (m.value = !0), await M($), R);
          }
          if (S(c.value) >= I) {
            const z = r.value[r.value.length - 1];
            if (z == null) {
              m.value = !0;
              return;
            }
            const R = await E(z);
            return s.value ? void 0 : (h.value = null, c.value = z, r.value.push(R.nextPage), R.nextPage == null && (m.value = !0), await M($), R);
          } else
            return D;
        }
        const t = r.value[r.value.length - 1];
        if (t == null) {
          m.value = !0;
          return;
        }
        const y = await E(t);
        return s.value ? void 0 : (h.value = null, c.value = t, r.value.push(y.nextPage), y.nextPage == null && (m.value = !0), await M($), y);
      } catch ($) {
        throw h.value = me($), $;
      } finally {
        n.value = !1, i("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function k() {
    if (!n.value) {
      s.value = !1, n.value = !0;
      try {
        const $ = c.value;
        if ($ == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", c.value, "paginationHistory:", r.value);
          return;
        }
        o.value = [], m.value = !1, h.value = null, r.value = [$];
        const t = await E($);
        if (s.value) return;
        h.value = null, c.value = $, r.value.push(t.nextPage), t.nextPage == null && (m.value = !0);
        const y = o.value.length;
        return await M(y), t;
      } catch ($) {
        throw h.value = me($), $;
      } finally {
        n.value = !1, i("loading:stop", { fetched: o.value.length });
      }
    }
  }
  function N() {
    const $ = d;
    s.value = !0, n.value = !1, d = !1, $ && i("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 }), i("loading:stop", { fetched: o.value.length });
  }
  return {
    loadPage: C,
    loadNext: j,
    refreshCurrentPage: k,
    cancelLoad: N,
    maybeBackfillToTarget: M,
    getContent: E
  };
}
function ia(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    refreshLayout: n,
    refreshCurrentPage: m,
    loadNext: h,
    maybeBackfillToTarget: c,
    autoRefreshOnEmpty: r,
    paginationHistory: g
  } = e;
  let w = /* @__PURE__ */ new Set(), a = null, p = !1;
  async function T() {
    if (w.size === 0 || p) return;
    p = !0;
    const d = Array.from(w);
    w.clear(), a = null, await f(d), p = !1;
  }
  async function b(d) {
    w.add(d), a && clearTimeout(a), a = setTimeout(() => {
      T();
    }, 16);
  }
  async function f(d) {
    if (!d || d.length === 0) return;
    const S = new Set(d.map((v) => v.id)), x = l.value.filter((v) => !S.has(v.id));
    if (l.value = x, await _(), x.length === 0 && g.value.length > 0) {
      if (r)
        await m();
      else
        try {
          await h(), await c(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((v) => requestAnimationFrame(() => v())), requestAnimationFrame(() => {
      n(x);
    });
  }
  async function I(d) {
    !d || d.length === 0 || (d.forEach((S) => w.add(S)), a && clearTimeout(a), a = setTimeout(() => {
      T();
    }, 16));
  }
  async function P(d, S) {
    if (!d) return;
    const x = l.value;
    if (x.findIndex((C) => C.id === d.id) !== -1) return;
    const E = [...x], M = Math.min(S, E.length);
    E.splice(M, 0, d), l.value = E, await _(), o.value || (await new Promise((C) => requestAnimationFrame(() => C())), requestAnimationFrame(() => {
      n(E);
    }));
  }
  async function i(d, S) {
    var $;
    if (!d || d.length === 0) return;
    if (!S || S.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const x = l.value, v = new Set(x.map((t) => t.id)), E = [];
    for (let t = 0; t < d.length; t++)
      v.has(($ = d[t]) == null ? void 0 : $.id) || E.push({ item: d[t], index: S[t] });
    if (E.length === 0) return;
    const M = /* @__PURE__ */ new Map();
    for (const { item: t, index: y } of E)
      M.set(y, t);
    const C = E.length > 0 ? Math.max(...E.map(({ index: t }) => t)) : -1, j = Math.max(x.length - 1, C), k = [];
    let N = 0;
    for (let t = 0; t <= j; t++)
      M.has(t) ? k.push(M.get(t)) : N < x.length && (k.push(x[N]), N++);
    for (; N < x.length; )
      k.push(x[N]), N++;
    l.value = k, await _(), o.value || (await new Promise((t) => requestAnimationFrame(() => t())), requestAnimationFrame(() => {
      n(k);
    }));
  }
  async function s() {
    l.value = [];
  }
  return {
    remove: b,
    removeMany: I,
    restore: P,
    restoreMany: i,
    removeAll: s
  };
}
function sa(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    container: n,
    columns: m,
    containerWidth: h,
    masonryContentHeight: c,
    layout: r,
    fixedDimensions: g,
    checkItemDimensions: w
  } = e;
  let a = [];
  function p(I) {
    const P = ea(I);
    let i = 0;
    if (n.value) {
      const { scrollTop: s, clientHeight: d } = n.value;
      i = s + d + 100;
    }
    c.value = Math.max(P, i);
  }
  function T(I) {
    var d, S;
    if (o.value) {
      l.value = I;
      return;
    }
    if (l.value = I, !n.value) return;
    if (w(I, "refreshLayout"), I.length > 1e3 && a.length > I.length && a.length - I.length < 100) {
      let x = !0;
      for (let v = 0; v < I.length; v++)
        if (((d = I[v]) == null ? void 0 : d.id) !== ((S = a[v]) == null ? void 0 : S.id)) {
          x = !1;
          break;
        }
      if (x) {
        const v = I.map((E, M) => ({
          ...a[M],
          originalIndex: M
        }));
        p(v), l.value = v, a = v;
        return;
      }
    }
    const i = I.map((x, v) => ({
      ...x,
      originalIndex: v
    })), s = n.value;
    if (g.value && g.value.width !== void 0) {
      const x = s.style.width, v = s.style.boxSizing;
      s.style.boxSizing = "border-box", s.style.width = `${g.value.width}px`, s.offsetWidth;
      const E = Ye(i, s, m.value, r.value);
      s.style.width = x, s.style.boxSizing = v, p(E), l.value = E, a = E;
    } else {
      const x = Ye(i, s, m.value, r.value);
      p(x), l.value = x, a = x;
    }
  }
  function b(I, P) {
    g.value = I, I && (I.width !== void 0 && (h.value = I.width), !o.value && n.value && l.value.length > 0 && _(() => {
      m.value = ue(r.value, h.value), T(l.value), P && P();
    }));
  }
  function f() {
    m.value = ue(r.value, h.value), T(l.value);
  }
  return {
    refreshLayout: T,
    setFixedDimensions: b,
    onResize: f,
    calculateHeight: p
  };
}
function ua(e) {
  const {
    masonry: l,
    container: o,
    columns: n,
    virtualBufferPx: m,
    loadThresholdPx: h
  } = e, c = B(e.handleScroll), r = B(0), g = B(0), w = m, a = B(!1), p = B({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), T = K(() => {
    const P = r.value - w, i = r.value + g.value + w, s = l.value;
    return !s || s.length === 0 ? [] : s.filter((S) => {
      if (typeof S.top != "number" || typeof S.columnHeight != "number")
        return !0;
      const x = S.top;
      return S.top + S.columnHeight >= P && x <= i;
    });
  });
  function b(P) {
    if (!o.value) return;
    const { scrollTop: i, clientHeight: s } = o.value, d = i + s, S = P ?? xe(l.value, n.value), x = S.length ? Math.max(...S) : 0, v = typeof h == "number" ? h : 200, E = v >= 0 ? Math.max(0, x - v) : Math.max(0, x + v), M = Math.max(0, E - d), C = M <= 100;
    p.value = {
      distanceToTrigger: Math.round(M),
      isNearTrigger: C
    };
  }
  async function f() {
    if (o.value) {
      const i = o.value.scrollTop, s = o.value.clientHeight || window.innerHeight, d = s > 0 ? s : window.innerHeight;
      r.value = i, g.value = d;
    }
    a.value = !0, await _(), await new Promise((i) => requestAnimationFrame(() => i())), a.value = !1;
    const P = xe(l.value, n.value);
    c.value(P), b(P);
  }
  function I() {
    r.value = 0, g.value = 0, a.value = !1, p.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: r,
    viewportHeight: g,
    virtualizing: a,
    scrollProgress: p,
    visibleMasonry: T,
    updateScrollProgress: b,
    updateViewport: f,
    reset: I,
    handleScroll: c
  };
}
function ca(e) {
  const { masonry: l } = e, o = B(/* @__PURE__ */ new Set());
  function n(c) {
    return typeof c == "number" && c > 0 && Number.isFinite(c);
  }
  function m(c, r) {
    try {
      if (!Array.isArray(c) || c.length === 0) return;
      const g = c.filter((a) => !n(a == null ? void 0 : a.width) || !n(a == null ? void 0 : a.height));
      if (g.length === 0) return;
      const w = [];
      for (const a of g) {
        const p = (a == null ? void 0 : a.id) ?? `idx:${l.value.indexOf(a)}`;
        o.value.has(p) || (o.value.add(p), w.push(p));
      }
      if (w.length > 0) {
        const a = w.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: r,
            count: w.length,
            sampleIds: a,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function h() {
    o.value.clear();
  }
  return {
    checkItemDimensions: m,
    invalidDimensionIds: o,
    reset: h
  };
}
const va = { class: "flex-1 relative min-h-0" }, fa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, da = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ha = {
  key: 1,
  class: "relative w-full h-full"
}, ma = ["src"], ga = ["src", "autoplay", "controls"], pa = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ya = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, wa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, be = /* @__PURE__ */ Ke({
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
    const o = e, n = l, m = B(!1), h = B(!1), c = B(null), r = B(!1), g = B(!1), w = B(null), a = B(!1), p = B(!1), T = B(!1), b = B(!1), f = B(!1), I = B(null), P = B(null);
    let i = null;
    const s = K(() => {
      var t;
      return o.type ?? ((t = o.item) == null ? void 0 : t.type) ?? "image";
    }), d = K(() => {
      var t;
      return o.notFound ?? ((t = o.item) == null ? void 0 : t.notFound) ?? !1;
    }), S = K(() => !!o.inSwipeMode);
    function x(t, y) {
      const F = t === "image" ? m.value : r.value;
      p.value && F && !T.value && (T.value = !0, n("in-view-and-loaded", { item: o.item, type: t, src: y }));
    }
    function v(t) {
      n("mouse-enter", { item: o.item, type: t });
    }
    function E(t) {
      n("mouse-leave", { item: o.item, type: t });
    }
    function M(t) {
      if (S.value) return;
      const y = t.target;
      y && (y.paused ? y.play() : y.pause());
    }
    function C(t) {
      const y = t.target;
      y && (S.value || y.play(), v("video"));
    }
    function j(t) {
      const y = t.target;
      y && (S.value || y.pause(), E("video"));
    }
    function k(t) {
      return new Promise((y, F) => {
        if (!t) {
          const L = new Error("No image source provided");
          n("preload:error", { item: o.item, type: "image", src: t, error: L }), F(L);
          return;
        }
        const D = new Image(), W = Date.now(), A = 300;
        D.onload = () => {
          const L = Date.now() - W, z = Math.max(0, A - L);
          setTimeout(async () => {
            m.value = !0, h.value = !1, b.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), f.value = !0, n("preload:success", { item: o.item, type: "image", src: t }), x("image", t), y();
          }, z);
        }, D.onerror = () => {
          h.value = !0, m.value = !1, b.value = !1;
          const L = new Error("Failed to load image");
          n("preload:error", { item: o.item, type: "image", src: t, error: L }), F(L);
        }, D.src = t;
      });
    }
    function N(t) {
      return new Promise((y, F) => {
        if (!t) {
          const L = new Error("No video source provided");
          n("preload:error", { item: o.item, type: "video", src: t, error: L }), F(L);
          return;
        }
        const D = document.createElement("video"), W = Date.now(), A = 300;
        D.preload = "metadata", D.muted = !0, D.onloadedmetadata = () => {
          const L = Date.now() - W, z = Math.max(0, A - L);
          setTimeout(async () => {
            r.value = !0, g.value = !1, b.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), f.value = !0, n("preload:success", { item: o.item, type: "video", src: t }), x("video", t), y();
          }, z);
        }, D.onerror = () => {
          g.value = !0, r.value = !1, b.value = !1;
          const L = new Error("Failed to load video");
          n("preload:error", { item: o.item, type: "video", src: t, error: L }), F(L);
        }, D.src = t;
      });
    }
    async function $() {
      var y;
      if (!a.value || b.value || d.value || s.value === "video" && r.value || s.value === "image" && m.value)
        return;
      const t = (y = o.item) == null ? void 0 : y.src;
      if (t)
        if (b.value = !0, f.value = !1, s.value === "video") {
          w.value = t, r.value = !1, g.value = !1;
          try {
            await N(t);
          } catch {
          }
        } else {
          c.value = t, m.value = !1, h.value = !1;
          try {
            await k(t);
          } catch {
          }
        }
    }
    return Qe(async () => {
      if (!I.value) return;
      const t = [o.preloadThreshold, 1].filter((F, D, W) => W.indexOf(F) === D).sort((F, D) => F - D);
      i = new IntersectionObserver(
        (F) => {
          F.forEach((D) => {
            const W = D.intersectionRatio, A = W >= 1, L = W >= o.preloadThreshold;
            if (A && !p.value) {
              p.value = !0, n("in-view", { item: o.item, type: s.value });
              const z = s.value === "image" ? c.value : w.value, R = s.value === "image" ? m.value : r.value;
              z && R && x(s.value, z);
            }
            L && !a.value ? (a.value = !0, $()) : D.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: t
        }
      ), i.observe(I.value), await _(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          y();
        });
      }), setTimeout(() => {
        y();
      }, 100);
      function y() {
        if (!I.value || p.value) return;
        const F = I.value.getBoundingClientRect(), D = window.innerHeight, W = window.innerWidth;
        if (F.top >= 0 && F.bottom <= D && F.left >= 0 && F.right <= W && F.height > 0 && F.width > 0) {
          p.value = !0, n("in-view", { item: o.item, type: s.value });
          const L = s.value === "image" ? c.value : w.value, z = s.value === "image" ? m.value : r.value;
          L && z && x(s.value, L);
        }
      }
    }), Ze(() => {
      i && (i.disconnect(), i = null);
    }), te(
      () => {
        var t;
        return (t = o.item) == null ? void 0 : t.src;
      },
      async (t) => {
        if (!(!t || d.value)) {
          if (s.value === "video") {
            if (t !== w.value && (r.value = !1, g.value = !1, w.value = t, a.value)) {
              b.value = !0;
              try {
                await N(t);
              } catch {
              }
            }
          } else if (t !== c.value && (m.value = !1, h.value = !1, c.value = t, a.value)) {
            b.value = !0;
            try {
              await k(t);
            } catch {
            }
          }
        }
      }
    ), te(
      () => o.isActive,
      (t) => {
        !S.value || !P.value || (t ? P.value.play() : P.value.pause());
      }
    ), (t, y) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: I,
      class: "relative w-full h-full flex flex-col"
    }, [
      t.headerHeight > 0 ? (Y(), q("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${t.headerHeight}px` })
      }, [
        G(t.$slots, "header", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: r.value,
          videoError: g.value,
          showNotFound: d.value,
          isLoading: b.value,
          mediaType: s.value,
          isFullyInView: p.value
        })
      ], 4)) : ae("", !0),
      U("div", va, [
        G(t.$slots, "default", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: r.value,
          videoError: g.value,
          showNotFound: d.value,
          isLoading: b.value,
          mediaType: s.value,
          imageSrc: c.value,
          videoSrc: w.value,
          showMedia: f.value,
          isFullyInView: p.value
        }, () => [
          U("div", fa, [
            d.value ? (Y(), q("div", da, y[3] || (y[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", ha, [
              s.value === "image" && c.value ? (Y(), q("img", {
                key: 0,
                src: c.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  m.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: y[0] || (y[0] = (F) => v("image")),
                onMouseleave: y[1] || (y[1] = (F) => E("image"))
              }, null, 42, ma)) : ae("", !0),
              s.value === "video" && w.value ? (Y(), q("video", {
                key: 1,
                ref_key: "videoEl",
                ref: P,
                src: w.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  r.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: S.value && o.isActive,
                controls: S.value,
                onClick: Ve(M, ["stop"]),
                onTouchend: Ve(M, ["stop", "prevent"]),
                onMouseenter: C,
                onMouseleave: j,
                onError: y[2] || (y[2] = (F) => g.value = !0)
              }, null, 42, ga)) : ae("", !0),
              !m.value && !r.value && !h.value && !g.value ? (Y(), q("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  f.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", pa, [
                  G(t.$slots, "placeholder-icon", { mediaType: s.value }, () => [
                    U("i", {
                      class: re(s.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              b.value ? (Y(), q("div", ya, y[4] || (y[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              s.value === "image" && h.value || s.value === "video" && g.value ? (Y(), q("div", wa, [
                U("i", {
                  class: re(s.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + $e(s.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      t.footerHeight > 0 ? (Y(), q("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${t.footerHeight}px` })
      }, [
        G(t.$slots, "footer", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: r.value,
          videoError: g.value,
          showNotFound: d.value,
          isLoading: b.value,
          mediaType: s.value,
          isFullyInView: p.value
        })
      ], 4)) : ae("", !0)
    ], 512));
  }
}), xa = {
  key: 0,
  class: "w-full h-full flex items-center justify-center"
}, ba = { class: "w-full h-full flex items-center justify-center p-4" }, Ma = { class: "w-full h-full max-w-full max-h-full relative" }, Ta = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ia = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ea = { class: "text-red-500 dark:text-red-400" }, Pa = {
  key: 0,
  class: "w-full py-8 text-center"
}, La = {
  key: 1,
  class: "w-full py-8 text-center"
}, Sa = { class: "text-red-500 dark:text-red-400" }, ka = /* @__PURE__ */ Ke({
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
    const n = e, m = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = K(() => {
      var u;
      return {
        ...m,
        ...n.layout,
        sizes: {
          ...m.sizes,
          ...((u = n.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), c = B(null), r = B(typeof window < "u" ? window.innerWidth : 1024), g = B(typeof window < "u" ? window.innerHeight : 768), w = B(null);
    let a = null;
    function p(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const T = K(() => {
      if (n.layoutMode === "masonry") return !1;
      if (n.layoutMode === "swipe") return !0;
      const u = typeof n.mobileBreakpoint == "string" ? p(n.mobileBreakpoint) : n.mobileBreakpoint;
      return r.value < u;
    }), b = o, f = K({
      get: () => n.items,
      set: (u) => b("update:items", u)
    }), I = K(() => {
      const u = f.value;
      return (u == null ? void 0 : u.length) ?? 0;
    }), P = B(7), i = B(null), s = B([]), d = B(null), S = B(!1), x = B(0), v = B(!1), E = B(null), M = B(!1), C = K(() => Zt(r.value)), j = ca({
      masonry: f
    }), { checkItemDimensions: k, reset: N } = j, $ = sa({
      masonry: f,
      useSwipeMode: T,
      container: i,
      columns: P,
      containerWidth: r,
      masonryContentHeight: x,
      layout: h,
      fixedDimensions: w,
      checkItemDimensions: k
    }), { refreshLayout: t, setFixedDimensions: y, onResize: F } = $, D = ua({
      masonry: f,
      container: i,
      columns: P,
      virtualBufferPx: n.virtualBufferPx,
      loadThresholdPx: n.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: W, viewportHeight: A, virtualizing: L, visibleMasonry: z, updateScrollProgress: R, updateViewport: ne, reset: J } = D, { onEnter: ie, onBeforeEnter: Z, onBeforeLeave: at, onLeave: nt } = na(
      { container: i },
      { leaveDurationMs: n.leaveDurationMs, virtualizing: L }
    ), lt = ie, ot = Z, rt = at, it = nt, st = ra({
      getPage: n.getPage,
      masonry: f,
      isLoading: S,
      hasReachedEnd: v,
      loadError: E,
      currentPage: d,
      paginationHistory: s,
      refreshLayout: t,
      retryMaxAttempts: n.retryMaxAttempts,
      retryInitialDelayMs: n.retryInitialDelayMs,
      retryBackoffStepMs: n.retryBackoffStepMs,
      mode: n.mode,
      backfillDelayMs: n.backfillDelayMs,
      backfillMaxCalls: n.backfillMaxCalls,
      pageSize: n.pageSize,
      autoRefreshOnEmpty: n.autoRefreshOnEmpty,
      emits: b
    }), { loadPage: Me, loadNext: pe, refreshCurrentPage: De, cancelLoad: Te, maybeBackfillToTarget: ut } = st, Q = oa({
      useSwipeMode: T,
      masonry: f,
      isLoading: S,
      loadNext: pe,
      loadPage: Me,
      paginationHistory: s
    }), { handleScroll: ze } = la({
      container: i,
      masonry: f,
      columns: P,
      containerHeight: x,
      isLoading: S,
      pageSize: n.pageSize,
      refreshLayout: t,
      setItemsRaw: (u) => {
        f.value = u;
      },
      loadNext: pe,
      loadThresholdPx: n.loadThresholdPx
    });
    D.handleScroll.value = ze;
    const ct = ia({
      masonry: f,
      useSwipeMode: T,
      refreshLayout: t,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: ut,
      autoRefreshOnEmpty: n.autoRefreshOnEmpty,
      paginationHistory: s
    }), { remove: ce, removeMany: vt, restore: ft, restoreMany: dt, removeAll: ht } = ct;
    function mt(u) {
      y(u, R), !u && c.value && (r.value = c.value.clientWidth, g.value = c.value.clientHeight);
    }
    l({
      isLoading: S,
      refreshLayout: t,
      // Container dimensions (wrapper element)
      containerWidth: r,
      containerHeight: g,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: x,
      // Current page
      currentPage: d,
      // End of list tracking
      hasReachedEnd: v,
      // Load error tracking
      loadError: E,
      // Initialization state
      isInitialized: M,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: mt,
      remove: ce,
      removeMany: vt,
      removeAll: ht,
      restore: ft,
      restoreMany: dt,
      loadNext: pe,
      loadPage: Me,
      refreshCurrentPage: De,
      reset: bt,
      destroy: Mt,
      init: Ce,
      restoreItems: Tt,
      paginationHistory: s,
      cancelLoad: Te,
      scrollToTop: yt,
      scrollTo: wt,
      totalItems: K(() => f.value.length),
      currentBreakpoint: C
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Be = Q.handleTouchStart, Re = Q.handleTouchMove, Ae = Q.handleTouchEnd, We = Q.handleMouseDown, Ie = Q.handleMouseMove, Ee = Q.handleMouseUp, Pe = Q.snapToCurrentItem;
    function gt(u) {
      const H = I.value, V = typeof u == "string" ? parseInt(u, 10) : u;
      return H > 0 ? `${V * (100 / H)}%` : "0%";
    }
    function pt() {
      const u = I.value;
      return u > 0 ? `${100 / u}%` : "0%";
    }
    function yt(u) {
      i.value && i.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function wt(u) {
      i.value && (i.value.scrollTo({
        top: u.top ?? i.value.scrollTop,
        left: u.left ?? i.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight || window.innerHeight));
    }
    function xt() {
      F(), i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight);
    }
    function bt() {
      Te(), i.value && i.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), f.value = [], g.value = 0, d.value = n.loadAtPage, s.value = [n.loadAtPage], v.value = !1, E.value = null, M.value = !1, J();
    }
    function Mt() {
      Te(), f.value = [], x.value = 0, d.value = null, s.value = [], v.value = !1, E.value = null, S.value = !1, M.value = !1, se.value = 0, ve.value = 0, ye.value = !1, J(), N(), i.value && i.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ge(async () => {
      T.value || await ne();
    }, 200), Ne = Ge(xt, 200);
    function Oe() {
      Q.handleWindowResize();
    }
    function Ce(u, H, V) {
      d.value = H, s.value = [H], s.value.push(V), v.value = V == null, k(u, "init"), T.value ? (f.value = [...f.value, ...u], se.value === 0 && f.value.length > 0 && (ve.value = 0)) : (t([...f.value, ...u]), i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight || window.innerHeight), _(() => {
        i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight || window.innerHeight, R());
      }));
    }
    async function Tt(u, H, V) {
      if (n.init === "manual") {
        Ce(u, H, V), u && u.length > 0 && (M.value = !0);
        return;
      }
      if (d.value = H, s.value = [H], V != null && s.value.push(V), v.value = V === null, E.value = null, k(u, "restoreItems"), T.value)
        f.value = u, se.value === 0 && f.value.length > 0 && (ve.value = 0);
      else if (t(u), i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight || window.innerHeight), await _(), i.value) {
        W.value = i.value.scrollTop, A.value = i.value.clientHeight || window.innerHeight, R(), await _();
        const ee = xe(f.value, P.value), O = ee.length ? Math.max(...ee) : 0, It = i.value.scrollTop + i.value.clientHeight, Le = typeof n.loadThresholdPx == "number" ? n.loadThresholdPx : 200, Et = Le >= 0 ? Math.max(0, O - Le) : Math.max(0, O + Le);
        It >= Et && !v.value && !S.value && s.value.length > 0 && s.value[s.value.length - 1] != null && await ze(ee, !0);
      }
      u && u.length > 0 && (M.value = !0);
    }
    return te(
      h,
      () => {
        T.value || i.value && (P.value = ue(h.value, r.value), t(f.value));
      },
      { deep: !0 }
    ), te(() => n.layoutMode, () => {
      w.value && w.value.width !== void 0 ? r.value = w.value.width : c.value && (r.value = c.value.clientWidth);
    }), te(i, (u) => {
      u && !T.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 }), te(
      () => f.value.length,
      (u, H) => {
        n.init === "manual" && !M.value && u > 0 && H === 0 && (M.value = !0);
      },
      { immediate: !1 }
    ), te(T, (u, H) => {
      H === void 0 && u === !1 || _(() => {
        u ? (document.addEventListener("mousemove", Ie), document.addEventListener("mouseup", Ee), i.value && i.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, f.value.length > 0 && Pe()) : (document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee), i.value && c.value && (w.value && w.value.width !== void 0 ? r.value = w.value.width : r.value = c.value.clientWidth, i.value.removeEventListener("scroll", oe), i.value.addEventListener("scroll", oe, { passive: !0 }), f.value.length > 0 && (P.value = ue(h.value, r.value), t(f.value), W.value = i.value.scrollTop, A.value = i.value.clientHeight, R())));
      });
    }, { immediate: !0 }), te(le, (u) => {
      u && (u.addEventListener("touchstart", Be, { passive: !1 }), u.addEventListener("touchmove", Re, { passive: !1 }), u.addEventListener("touchend", Ae), u.addEventListener("mousedown", We));
    }), te(() => f.value.length, (u, H) => {
      T.value && u > 0 && H === 0 && (se.value = 0, _(() => Pe()));
    }), te(c, (u) => {
      a && (a.disconnect(), a = null), u && typeof ResizeObserver < "u" ? (a = new ResizeObserver((H) => {
        if (!w.value)
          for (const V of H) {
            const ee = V.contentRect.width, O = V.contentRect.height;
            r.value !== ee && (r.value = ee), g.value !== O && (g.value = O);
          }
      }), a.observe(u), w.value || (r.value = u.clientWidth, g.value = u.clientHeight)) : u && (w.value || (r.value = u.clientWidth, g.value = u.clientHeight));
    }, { immediate: !0 }), te(r, (u, H) => {
      u !== H && u > 0 && !T.value && i.value && f.value.length > 0 && _(() => {
        P.value = ue(h.value, u), t(f.value), R();
      });
    }), Qe(async () => {
      try {
        await _(), c.value && !a && (r.value = c.value.clientWidth, g.value = c.value.clientHeight), T.value || (P.value = ue(h.value, r.value), i.value && (W.value = i.value.scrollTop, A.value = i.value.clientHeight));
        const u = n.loadAtPage;
        if (s.value = [u], n.init === "auto") {
          M.value = !0, await _();
          try {
            await Me(u);
          } catch {
          }
        }
        T.value ? _(() => Pe()) : R();
      } catch (u) {
        E.value || (console.error("Error during component initialization:", u), E.value = me(u)), S.value = !1;
      }
      window.addEventListener("resize", Ne), window.addEventListener("resize", Oe);
    }), Ze(() => {
      var u;
      a && (a.disconnect(), a = null), (u = i.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ne), window.removeEventListener("resize", Oe), le.value && (le.value.removeEventListener("touchstart", Be), le.value.removeEventListener("touchmove", Re), le.value.removeEventListener("touchend", Ae), le.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee);
    }), (u, H) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: c,
      class: "w-full h-full flex flex-col relative"
    }, [
      M.value ? T.value ? (Y(), q("div", {
        key: 1,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": n.forceMotion, "cursor-grab": !X(ye), "cursor-grabbing": X(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        U("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${X(ve)}px)`,
            transition: X(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${I.value * 100}%`
          })
        }, [
          (Y(!0), q(je, null, qe(f.value, (V, ee) => (Y(), q("div", {
            key: `${V.page}-${V.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: gt(ee),
              height: pt()
            })
          }, [
            U("div", ba, [
              U("div", Ma, [
                G(u.$slots, "default", {
                  item: V,
                  remove: X(ce),
                  index: V.originalIndex ?? f.value.indexOf(V)
                }, () => [
                  Se(be, {
                    item: V,
                    remove: X(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": ee === X(se),
                    "onPreload:success": H[0] || (H[0] = (O) => b("item:preload:success", O)),
                    "onPreload:error": H[1] || (H[1] = (O) => b("item:preload:error", O)),
                    onMouseEnter: H[2] || (H[2] = (O) => b("item:mouse-enter", O)),
                    onMouseLeave: H[3] || (H[3] = (O) => b("item:mouse-leave", O))
                  }, {
                    header: fe((O) => [
                      G(u.$slots, "item-header", de({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: fe((O) => [
                      G(u.$slots, "item-footer", de({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        v.value && f.value.length > 0 ? (Y(), q("div", Ta, [
          G(u.$slots, "end-message", {}, () => [
            H[9] || (H[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        E.value && f.value.length > 0 ? (Y(), q("div", Ia, [
          G(u.$slots, "error-message", { error: E.value }, () => [
            U("p", Ea, "Failed to load content: " + $e(E.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (Y(), q("div", {
        key: 2,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": n.forceMotion }]),
        ref_key: "container",
        ref: i
      }, [
        U("div", {
          class: "relative",
          style: ge({ height: `${x.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          Se(Pt, {
            name: "masonry",
            css: !1,
            onEnter: X(lt),
            onBeforeEnter: X(ot),
            onLeave: X(it),
            onBeforeLeave: X(rt)
          }, {
            default: fe(() => [
              (Y(!0), q(je, null, qe(X(z), (V, ee) => (Y(), q("div", de({
                key: `${V.page}-${V.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, X(aa)(V, ee)), [
                G(u.$slots, "default", {
                  item: V,
                  remove: X(ce),
                  index: V.originalIndex ?? f.value.indexOf(V)
                }, () => [
                  Se(be, {
                    item: V,
                    remove: X(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": H[4] || (H[4] = (O) => b("item:preload:success", O)),
                    "onPreload:error": H[5] || (H[5] = (O) => b("item:preload:error", O)),
                    onMouseEnter: H[6] || (H[6] = (O) => b("item:mouse-enter", O)),
                    onMouseLeave: H[7] || (H[7] = (O) => b("item:mouse-leave", O))
                  }, {
                    header: fe((O) => [
                      G(u.$slots, "item-header", de({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    footer: fe((O) => [
                      G(u.$slots, "item-footer", de({ ref_for: !0 }, O), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        v.value && f.value.length > 0 ? (Y(), q("div", Pa, [
          G(u.$slots, "end-message", {}, () => [
            H[10] || (H[10] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        E.value && f.value.length > 0 ? (Y(), q("div", La, [
          G(u.$slots, "error-message", { error: E.value }, () => [
            U("p", Sa, "Failed to load content: " + $e(E.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (Y(), q("div", xa, [
        G(u.$slots, "loading-message", {}, () => [
          H[8] || (H[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ha = (e, l) => {
  const o = e.__vccOpts || e;
  for (const [n, m] of l)
    o[n] = m;
  return o;
}, Je = /* @__PURE__ */ Ha(ka, [["__scopeId", "data-v-1920cd90"]]), za = {
  install(e) {
    e.component("WyxosMasonry", Je), e.component("WMasonry", Je), e.component("WyxosMasonryItem", be), e.component("WMasonryItem", be);
  }
};
export {
  Je as Masonry,
  be as MasonryItem,
  za as default
};
