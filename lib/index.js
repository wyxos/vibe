import { nextTick as q, ref as $, computed as Z, defineComponent as et, onMounted as tt, onUnmounted as at, watch as te, createElementBlock as C, openBlock as j, createCommentVNode as ae, createElementVNode as V, normalizeStyle as ge, renderSlot as X, normalizeClass as re, withModifiers as Ye, toDisplayString as Be, unref as U, Fragment as Ue, renderList as _e, createVNode as He, withCtx as fe, mergeProps as de, TransitionGroup as Tt } from "vue";
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
    gutterX: y = 0,
    gutterY: g = 0,
    header: h = 0,
    footer: r = 0,
    paddingLeft: x = 0,
    paddingRight: M = 0,
    sizes: a = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: I = "masonry"
  } = t;
  let p = 0, E = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(l);
      p = parseFloat(L.paddingLeft) || 0, E = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const m = (x || 0) + p, T = (M || 0) + E, i = l.offsetWidth - l.clientWidth, u = i > 0 ? i + 2 : It() + 2, f = l.offsetWidth - u - m - T, d = y * (o - 1), P = Math.floor((f - d) / o), b = e.map((L) => {
    const z = L.width, O = L.height;
    return Math.round(P * O / z) + r + h;
  });
  if (I === "sequential-balanced") {
    const L = b.length;
    if (L === 0) return [];
    const z = (N, Y, J) => N + (Y > 0 ? g : 0) + J;
    let O = Math.max(...b), k = b.reduce((N, Y) => N + Y, 0) + g * Math.max(0, L - 1);
    const n = (N) => {
      let Y = 1, J = 0, ne = 0;
      for (let K = 0; K < L; K++) {
        const ie = b[K], ee = z(J, ne, ie);
        if (ee <= N)
          J = ee, ne++;
        else if (Y++, J = ie, ne = 1, ie > N || Y > o) return !1;
      }
      return Y <= o;
    };
    for (; O < k; ) {
      const N = Math.floor((O + k) / 2);
      n(N) ? k = N : O = N + 1;
    }
    const v = k, w = new Array(o).fill(0);
    let B = o - 1, F = 0, W = 0;
    for (let N = L - 1; N >= 0; N--) {
      const Y = b[N], J = N < B;
      !(z(F, W, Y) <= v) || J ? (w[B] = N + 1, B--, F = Y, W = 1) : (F = z(F, W, Y), W++);
    }
    w[0] = 0;
    const R = [], G = new Array(o).fill(0);
    for (let N = 0; N < o; N++) {
      const Y = w[N], J = N + 1 < o ? w[N + 1] : L, ne = N * (P + y);
      for (let K = Y; K < J; K++) {
        const ee = {
          ...e[K],
          columnWidth: P,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ee.imageHeight = b[K] - (r + h), ee.columnHeight = b[K], ee.left = ne, ee.top = G[N], G[N] += ee.columnHeight + (K + 1 < J ? g : 0), R.push(ee);
      }
    }
    return R;
  }
  const c = new Array(o).fill(0), S = [];
  for (let L = 0; L < e.length; L++) {
    const z = e[L], O = {
      ...z,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, k = c.indexOf(Math.min(...c)), n = z.width, v = z.height;
    O.columnWidth = P, O.left = k * (P + y), O.imageHeight = Math.round(P * v / n), O.columnHeight = O.imageHeight + r + h, O.top = c[k], c[k] += O.columnHeight + g, S.push(O);
  }
  return S;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Pt = typeof self == "object" && self && self.Object === Object && self, nt = Et || Pt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, kt = lt.hasOwnProperty, Lt = lt.toString, he = xe ? xe.toStringTag : void 0;
function St(e) {
  var l = kt.call(e, he), o = e[he];
  try {
    e[he] = void 0;
    var t = !0;
  } catch {
  }
  var y = Lt.call(e);
  return t && (l ? e[he] = o : delete e[he]), y;
}
var Ht = Object.prototype, $t = Ht.toString;
function Nt(e) {
  return $t.call(e);
}
var Bt = "[object Null]", Dt = "[object Undefined]", Ge = xe ? xe.toStringTag : void 0;
function zt(e) {
  return e == null ? e === void 0 ? Dt : Bt : Ge && Ge in Object(e) ? St(e) : Nt(e);
}
function Ft(e) {
  return e != null && typeof e == "object";
}
var Rt = "[object Symbol]";
function At(e) {
  return typeof e == "symbol" || Ft(e) && zt(e) == Rt;
}
var Wt = /\s/;
function Ot(e) {
  for (var l = e.length; l-- && Wt.test(e.charAt(l)); )
    ;
  return l;
}
var Ct = /^\s+/;
function jt(e) {
  return e && e.slice(0, Ot(e) + 1).replace(Ct, "");
}
function De(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var Je = NaN, Vt = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Yt = /^0o[0-7]+$/i, Ut = parseInt;
function Ke(e) {
  if (typeof e == "number")
    return e;
  if (At(e))
    return Je;
  if (De(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = De(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var o = qt.test(e);
  return o || Yt.test(e) ? Ut(e.slice(2), o ? 2 : 8) : Vt.test(e) ? Je : +e;
}
var Ne = function() {
  return nt.Date.now();
}, _t = "Expected a function", Xt = Math.max, Gt = Math.min;
function Qe(e, l, o) {
  var t, y, g, h, r, x, M = 0, a = !1, I = !1, p = !0;
  if (typeof e != "function")
    throw new TypeError(_t);
  l = Ke(l) || 0, De(o) && (a = !!o.leading, I = "maxWait" in o, g = I ? Xt(Ke(o.maxWait) || 0, l) : g, p = "trailing" in o ? !!o.trailing : p);
  function E(c) {
    var S = t, L = y;
    return t = y = void 0, M = c, h = e.apply(L, S), h;
  }
  function m(c) {
    return M = c, r = setTimeout(u, l), a ? E(c) : h;
  }
  function T(c) {
    var S = c - x, L = c - M, z = l - S;
    return I ? Gt(z, g - L) : z;
  }
  function i(c) {
    var S = c - x, L = c - M;
    return x === void 0 || S >= l || S < 0 || I && L >= g;
  }
  function u() {
    var c = Ne();
    if (i(c))
      return f(c);
    r = setTimeout(u, T(c));
  }
  function f(c) {
    return r = void 0, p && t ? E(c) : (t = y = void 0, h);
  }
  function d() {
    r !== void 0 && clearTimeout(r), M = 0, t = x = y = r = void 0;
  }
  function P() {
    return r === void 0 ? h : f(Ne());
  }
  function b() {
    var c = Ne(), S = i(c);
    if (t = arguments, y = this, x = c, S) {
      if (r === void 0)
        return m(x);
      if (I)
        return clearTimeout(r), r = setTimeout(u, l), E(x);
    }
    return r === void 0 && (r = setTimeout(u, l)), h;
  }
  return b.cancel = d, b.flush = P, b;
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
  const t = Array.from(new Set(e.map((h) => h.left))).sort((h, r) => h - r).slice(0, l), y = /* @__PURE__ */ new Map();
  for (let h = 0; h < t.length; h++) y.set(t[h], h);
  const g = new Array(t.length).fill(0);
  for (const h of e) {
    const r = y.get(h.left);
    r != null && (g[r] = Math.max(g[r], h.top + h.columnHeight));
  }
  for (; g.length < l; ) g.push(0);
  return g;
}
function ea(e, l) {
  let o = 0, t = 0;
  const y = 1e3;
  function g(a, I) {
    var m;
    const p = (m = e.container) == null ? void 0 : m.value;
    if (p) {
      const T = p.scrollTop, i = p.clientHeight;
      o = T - y, t = T + i + y;
    }
    return a + I >= o && a <= t;
  }
  function h(a, I) {
    var f;
    const p = parseInt(a.dataset.left || "0", 10), E = parseInt(a.dataset.top || "0", 10), m = parseInt(a.dataset.index || "0", 10), T = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((f = l == null ? void 0 : l.virtualizing) != null && f.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${E}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "", I();
      });
      return;
    }
    if (!g(E, T)) {
      a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${E}px, 0) scale(1)`, a.style.transition = "none", I();
      return;
    }
    const i = Math.min(m * 20, 160), u = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${i}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${E}px, 0) scale(1)`;
      const d = () => {
        u ? a.style.setProperty("--masonry-opacity-delay", u) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", d), I();
      };
      a.addEventListener("transitionend", d);
    });
  }
  function r(a) {
    var E;
    const I = parseInt(a.dataset.left || "0", 10), p = parseInt(a.dataset.top || "0", 10);
    if ((E = l == null ? void 0 : l.virtualizing) != null && E.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${I}px, ${p}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    a.style.opacity = "0", a.style.transform = `translate3d(${I}px, ${p + 10}px, 0) scale(0.985)`;
  }
  function x(a) {
    var m;
    const I = parseInt(a.dataset.left || "0", 10), p = parseInt(a.dataset.top || "0", 10), E = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if (!((m = l == null ? void 0 : l.virtualizing) != null && m.value)) {
      if (!g(p, E)) {
        a.style.transition = "none";
        return;
      }
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${I}px, ${p}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "";
      });
    }
  }
  function M(a, I) {
    var b;
    const p = parseInt(a.dataset.left || "0", 10), E = parseInt(a.dataset.top || "0", 10), m = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((b = l == null ? void 0 : l.virtualizing) != null && b.value) {
      I();
      return;
    }
    if (!g(E, m)) {
      a.style.transition = "none", a.style.opacity = "0", I();
      return;
    }
    const T = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let i = Number.isFinite(T) && T > 0 ? T : NaN;
    if (!Number.isFinite(i)) {
      const S = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(S);
      i = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const u = a.style.transitionDuration, f = () => {
      a.removeEventListener("transitionend", d), clearTimeout(P), a.style.transitionDuration = u || "";
    }, d = (c) => {
      (!c || c.target === a) && (f(), I());
    }, P = setTimeout(() => {
      f(), I();
    }, i + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${i}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${p}px, ${E + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", d);
    });
  }
  return {
    onEnter: h,
    onBeforeEnter: r,
    onBeforeLeave: x,
    onLeave: M
  };
}
function ta({
  container: e,
  masonry: l,
  columns: o,
  containerHeight: t,
  isLoading: y,
  pageSize: g,
  refreshLayout: h,
  setItemsRaw: r,
  loadNext: x,
  loadThresholdPx: M
}) {
  let a = 0;
  async function I(p, E = !1) {
    if (!e.value) return;
    const m = p ?? be(l.value, o.value), T = m.length ? Math.max(...m) : 0, i = e.value.scrollTop + e.value.clientHeight, u = e.value.scrollTop > a + 1;
    a = e.value.scrollTop;
    const f = typeof M == "number" ? M : 200, d = f >= 0 ? Math.max(0, T - f) : Math.max(0, T + f);
    if (i >= d && (u || E) && !y.value) {
      await x(), await q();
      return;
    }
  }
  return {
    handleScroll: I
  };
}
function aa(e) {
  const { useSwipeMode: l, masonry: o, isLoading: t, loadNext: y, loadPage: g, paginationHistory: h } = e, r = $(0), x = $(0), M = $(!1), a = $(0), I = $(0), p = $(null), E = Z(() => {
    if (!l.value || o.value.length === 0) return null;
    const k = Math.max(0, Math.min(r.value, o.value.length - 1));
    return o.value[k] || null;
  }), m = Z(() => {
    if (!l.value || !E.value) return null;
    const k = r.value + 1;
    return k >= o.value.length ? null : o.value[k] || null;
  }), T = Z(() => {
    if (!l.value || !E.value) return null;
    const k = r.value - 1;
    return k < 0 ? null : o.value[k] || null;
  });
  function i() {
    if (!p.value) return;
    const k = p.value.clientHeight;
    x.value = -r.value * k;
  }
  function u() {
    if (!m.value) {
      y();
      return;
    }
    r.value++, i(), r.value >= o.value.length - 5 && y();
  }
  function f() {
    T.value && (r.value--, i());
  }
  function d(k) {
    l.value && (M.value = !0, a.value = k.touches[0].clientY, I.value = x.value, k.preventDefault());
  }
  function P(k) {
    if (!l.value || !M.value) return;
    const n = k.touches[0].clientY - a.value;
    x.value = I.value + n, k.preventDefault();
  }
  function b(k) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const n = x.value - I.value;
    Math.abs(n) > 100 ? n > 0 && T.value ? f() : n < 0 && m.value ? u() : i() : i(), k.preventDefault();
  }
  function c(k) {
    l.value && (M.value = !0, a.value = k.clientY, I.value = x.value, k.preventDefault());
  }
  function S(k) {
    if (!l.value || !M.value) return;
    const n = k.clientY - a.value;
    x.value = I.value + n, k.preventDefault();
  }
  function L(k) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const n = x.value - I.value;
    Math.abs(n) > 100 ? n > 0 && T.value ? f() : n < 0 && m.value ? u() : i() : i(), k.preventDefault();
  }
  function z() {
    !l.value && r.value > 0 && (r.value = 0, x.value = 0), l.value && o.value.length === 0 && !t.value && g(h.value[0]), l.value && i();
  }
  function O() {
    r.value = 0, x.value = 0, M.value = !1;
  }
  return {
    // State
    currentSwipeIndex: r,
    swipeOffset: x,
    isDragging: M,
    swipeContainer: p,
    // Computed
    currentItem: E,
    nextItem: m,
    previousItem: T,
    // Functions
    handleTouchStart: d,
    handleTouchMove: P,
    handleTouchEnd: b,
    handleMouseDown: c,
    handleMouseMove: S,
    handleMouseUp: L,
    goToNextItem: u,
    goToPreviousItem: f,
    snapToCurrentItem: i,
    handleWindowResize: z,
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
    hasReachedEnd: y,
    loadError: g,
    currentPage: h,
    paginationHistory: r,
    refreshLayout: x,
    retryMaxAttempts: M,
    retryInitialDelayMs: a,
    retryBackoffStepMs: I,
    backfillEnabled: p,
    backfillDelayMs: E,
    backfillMaxCalls: m,
    pageSize: T,
    autoRefreshOnEmpty: i,
    emits: u
  } = e, f = $(!1);
  let d = !1;
  function P(n, v) {
    return new Promise((w) => {
      const B = Math.max(0, n | 0), F = Date.now();
      v(B, B);
      const W = setInterval(() => {
        if (f.value) {
          clearInterval(W), w();
          return;
        }
        const R = Date.now() - F, G = Math.max(0, B - R);
        v(G, B), G <= 0 && (clearInterval(W), w());
      }, 100);
    });
  }
  async function b(n) {
    let v = 0;
    const w = M;
    let B = a;
    for (; ; )
      try {
        const F = await n();
        return v > 0 && u("retry:stop", { attempt: v, success: !0 }), F;
      } catch (F) {
        if (v++, v > w)
          throw u("retry:stop", { attempt: v - 1, success: !1 }), F;
        u("retry:start", { attempt: v, max: w, totalMs: B }), await P(B, (W, R) => {
          u("retry:tick", { attempt: v, remainingMs: W, totalMs: R });
        }), B += I;
      }
  }
  async function c(n) {
    try {
      const v = await b(() => l(n));
      return x([...o.value, ...v.items]), v;
    } catch (v) {
      throw v;
    }
  }
  async function S(n, v = !1) {
    if (!v && !p || d || f.value || y.value) return;
    const w = (n || 0) + (T || 0);
    if (!T || T <= 0) return;
    if (r.value[r.value.length - 1] == null) {
      y.value = !0;
      return;
    }
    if (!(o.value.length >= w)) {
      d = !0, t.value = !0;
      try {
        let F = 0;
        for (u("backfill:start", { target: w, fetched: o.value.length, calls: F }); o.value.length < w && F < m && r.value[r.value.length - 1] != null && !f.value && !y.value && d && (await P(E, (R, G) => {
          u("backfill:tick", {
            fetched: o.value.length,
            target: w,
            calls: F,
            remainingMs: R,
            totalMs: G
          });
        }), !(f.value || !d)); ) {
          const W = r.value[r.value.length - 1];
          if (W == null) {
            y.value = !0;
            break;
          }
          try {
            if (f.value || !d) break;
            const R = await c(W);
            if (f.value || !d) break;
            g.value = null, r.value.push(R.nextPage), R.nextPage == null && (y.value = !0);
          } catch (R) {
            if (f.value || !d) break;
            g.value = me(R);
          }
          F++;
        }
        u("backfill:stop", { fetched: o.value.length, calls: F });
      } finally {
        d = !1, t.value = !1, u("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function L(n) {
    if (!t.value) {
      f.value = !1, t.value = !0, y.value = !1, g.value = null;
      try {
        const v = o.value.length;
        if (f.value) return;
        const w = await c(n);
        return f.value ? void 0 : (g.value = null, h.value = n, r.value.push(w.nextPage), w.nextPage == null && (y.value = !0), await S(v), w);
      } catch (v) {
        throw g.value = me(v), v;
      } finally {
        t.value = !1;
      }
    }
  }
  async function z() {
    if (!t.value && !y.value) {
      f.value = !1, t.value = !0, g.value = null;
      try {
        const n = o.value.length;
        if (f.value) return;
        const v = r.value[r.value.length - 1];
        if (v == null) {
          y.value = !0, t.value = !1, u("loading:stop", { fetched: o.value.length });
          return;
        }
        const w = await c(v);
        return f.value ? void 0 : (g.value = null, h.value = v, r.value.push(w.nextPage), w.nextPage == null && (y.value = !0), await S(n), w);
      } catch (n) {
        throw g.value = me(n), n;
      } finally {
        t.value = !1, u("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function O() {
    if (!t.value) {
      f.value = !1, t.value = !0;
      try {
        const n = h.value;
        if (n == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", h.value, "paginationHistory:", r.value);
          return;
        }
        o.value = [], y.value = !1, g.value = null, r.value = [n];
        const v = await c(n);
        if (f.value) return;
        g.value = null, h.value = n, r.value.push(v.nextPage), v.nextPage == null && (y.value = !0);
        const w = o.value.length;
        return await S(w), v;
      } catch (n) {
        throw g.value = me(n), n;
      } finally {
        t.value = !1, u("loading:stop", { fetched: o.value.length });
      }
    }
  }
  function k() {
    const n = d;
    f.value = !0, t.value = !1, d = !1, n && u("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 }), u("loading:stop", { fetched: o.value.length });
  }
  return {
    loadPage: L,
    loadNext: z,
    refreshCurrentPage: O,
    cancelLoad: k,
    maybeBackfillToTarget: S,
    getContent: c
  };
}
function la(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    refreshLayout: t,
    refreshCurrentPage: y,
    loadNext: g,
    maybeBackfillToTarget: h,
    autoRefreshOnEmpty: r,
    paginationHistory: x
  } = e;
  let M = /* @__PURE__ */ new Set(), a = null, I = !1;
  async function p() {
    if (M.size === 0 || I) return;
    I = !0;
    const d = Array.from(M);
    M.clear(), a = null, await m(d), I = !1;
  }
  async function E(d) {
    M.add(d), a && clearTimeout(a), a = setTimeout(() => {
      p();
    }, 16);
  }
  async function m(d) {
    if (!d || d.length === 0) return;
    const P = new Set(d.map((c) => c.id)), b = l.value.filter((c) => !P.has(c.id));
    if (l.value = b, await q(), b.length === 0 && x.value.length > 0) {
      if (r)
        await y();
      else
        try {
          await g(), await h(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
      t(b);
    });
  }
  async function T(d) {
    !d || d.length === 0 || (d.forEach((P) => M.add(P)), a && clearTimeout(a), a = setTimeout(() => {
      p();
    }, 16));
  }
  async function i(d, P) {
    if (!d) return;
    const b = l.value;
    if (b.findIndex((z) => z.id === d.id) !== -1) return;
    const S = [...b], L = Math.min(P, S.length);
    S.splice(L, 0, d), l.value = S, await q(), o.value || (await new Promise((z) => requestAnimationFrame(() => z())), requestAnimationFrame(() => {
      t(S);
    }));
  }
  async function u(d, P) {
    var v;
    if (!d || d.length === 0) return;
    if (!P || P.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const b = l.value, c = new Set(b.map((w) => w.id)), S = [];
    for (let w = 0; w < d.length; w++)
      c.has((v = d[w]) == null ? void 0 : v.id) || S.push({ item: d[w], index: P[w] });
    if (S.length === 0) return;
    const L = /* @__PURE__ */ new Map();
    for (const { item: w, index: B } of S)
      L.set(B, w);
    const z = S.length > 0 ? Math.max(...S.map(({ index: w }) => w)) : -1, O = Math.max(b.length - 1, z), k = [];
    let n = 0;
    for (let w = 0; w <= O; w++)
      L.has(w) ? k.push(L.get(w)) : n < b.length && (k.push(b[n]), n++);
    for (; n < b.length; )
      k.push(b[n]), n++;
    l.value = k, await q(), o.value || (await new Promise((w) => requestAnimationFrame(() => w())), requestAnimationFrame(() => {
      t(k);
    }));
  }
  async function f() {
    l.value = [];
  }
  return {
    remove: E,
    removeMany: T,
    restore: i,
    restoreMany: u,
    removeAll: f
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    container: t,
    columns: y,
    containerWidth: g,
    masonryContentHeight: h,
    layout: r,
    fixedDimensions: x,
    checkItemDimensions: M
  } = e;
  let a = [];
  function I(T) {
    const i = Kt(T);
    let u = 0;
    if (t.value) {
      const { scrollTop: f, clientHeight: d } = t.value;
      u = f + d + 100;
    }
    h.value = Math.max(i, u);
  }
  function p(T) {
    var d, P;
    if (o.value) {
      l.value = T;
      return;
    }
    if (!t.value) return;
    if (M(T, "refreshLayout"), T.length > 1e3 && a.length > T.length && a.length - T.length < 100) {
      let b = !0;
      for (let c = 0; c < T.length; c++)
        if (((d = T[c]) == null ? void 0 : d.id) !== ((P = a[c]) == null ? void 0 : P.id)) {
          b = !1;
          break;
        }
      if (b) {
        const c = T.map((S, L) => ({
          ...a[L],
          originalIndex: L
        }));
        I(c), l.value = c, a = c;
        return;
      }
    }
    const u = T.map((b, c) => ({
      ...b,
      originalIndex: c
    })), f = t.value;
    if (x.value && x.value.width !== void 0) {
      const b = f.style.width, c = f.style.boxSizing;
      f.style.boxSizing = "border-box", f.style.width = `${x.value.width}px`, f.offsetWidth;
      const S = Xe(u, f, y.value, r.value);
      f.style.width = b, f.style.boxSizing = c, I(S), l.value = S, a = S;
    } else {
      const b = Xe(u, f, y.value, r.value);
      I(b), l.value = b, a = b;
    }
  }
  function E(T, i) {
    x.value = T, T && (T.width !== void 0 && (g.value = T.width), !o.value && t.value && l.value.length > 0 && q(() => {
      y.value = ue(r.value, g.value), p(l.value), i && i();
    }));
  }
  function m() {
    y.value = ue(r.value, g.value), p(l.value);
  }
  return {
    refreshLayout: p,
    setFixedDimensions: E,
    onResize: m,
    calculateHeight: I
  };
}
function ra(e) {
  const {
    masonry: l,
    container: o,
    columns: t,
    virtualBufferPx: y,
    loadThresholdPx: g
  } = e, h = $(e.handleScroll), r = $(0), x = $(0), M = y, a = $(!1), I = $({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), p = Z(() => {
    const i = r.value - M, u = r.value + x.value + M, f = l.value;
    return !f || f.length === 0 ? [] : f.filter((P) => {
      if (typeof P.top != "number" || typeof P.columnHeight != "number")
        return !0;
      const b = P.top;
      return P.top + P.columnHeight >= i && b <= u;
    });
  });
  function E(i) {
    if (!o.value) return;
    const { scrollTop: u, clientHeight: f } = o.value, d = u + f, P = i ?? be(l.value, t.value), b = P.length ? Math.max(...P) : 0, c = typeof g == "number" ? g : 200, S = c >= 0 ? Math.max(0, b - c) : Math.max(0, b + c), L = Math.max(0, S - d), z = L <= 100;
    I.value = {
      distanceToTrigger: Math.round(L),
      isNearTrigger: z
    };
  }
  async function m() {
    if (o.value) {
      const u = o.value.scrollTop, f = o.value.clientHeight || window.innerHeight, d = f > 0 ? f : window.innerHeight;
      r.value = u, x.value = d;
    }
    a.value = !0, await q(), await new Promise((u) => requestAnimationFrame(() => u())), a.value = !1;
    const i = be(l.value, t.value);
    h.value(i), E(i);
  }
  function T() {
    r.value = 0, x.value = 0, a.value = !1, I.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: r,
    viewportHeight: x,
    virtualizing: a,
    scrollProgress: I,
    visibleMasonry: p,
    updateScrollProgress: E,
    updateViewport: m,
    reset: T,
    handleScroll: h
  };
}
function ia(e) {
  const { masonry: l } = e, o = $(/* @__PURE__ */ new Set());
  function t(h) {
    return typeof h == "number" && h > 0 && Number.isFinite(h);
  }
  function y(h, r) {
    try {
      if (!Array.isArray(h) || h.length === 0) return;
      const x = h.filter((a) => !t(a == null ? void 0 : a.width) || !t(a == null ? void 0 : a.height));
      if (x.length === 0) return;
      const M = [];
      for (const a of x) {
        const I = (a == null ? void 0 : a.id) ?? `idx:${l.value.indexOf(a)}`;
        o.value.has(I) || (o.value.add(I), M.push(I));
      }
      if (M.length > 0) {
        const a = M.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: r,
            count: M.length,
            sampleIds: a,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function g() {
    o.value.clear();
  }
  return {
    checkItemDimensions: y,
    invalidDimensionIds: o,
    reset: g
  };
}
const sa = { class: "flex-1 relative min-h-0" }, ua = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ca = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, va = {
  key: 1,
  class: "relative w-full h-full"
}, fa = ["src"], da = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ma = {
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
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave", "in-view"],
  setup(e, { emit: l }) {
    const o = e, t = l, y = $(!1), g = $(!1), h = $(null), r = $(!1), x = $(!1), M = $(null), a = $(!1), I = $(!1), p = $(!1), E = $(!1), m = $(null), T = $(null);
    let i = null;
    const u = Z(() => {
      var n;
      return o.type ?? ((n = o.item) == null ? void 0 : n.type) ?? "image";
    }), f = Z(() => {
      var n;
      return o.notFound ?? ((n = o.item) == null ? void 0 : n.notFound) ?? !1;
    }), d = Z(() => !!o.inSwipeMode);
    function P(n) {
      t("mouse-enter", { item: o.item, type: n });
    }
    function b(n) {
      t("mouse-leave", { item: o.item, type: n });
    }
    function c(n) {
      if (d.value) return;
      const v = n.target;
      v && (v.paused ? v.play() : v.pause());
    }
    function S(n) {
      const v = n.target;
      v && (d.value || v.play(), P("video"));
    }
    function L(n) {
      const v = n.target;
      v && (d.value || v.pause(), b("video"));
    }
    function z(n) {
      return new Promise((v, w) => {
        if (!n) {
          const R = new Error("No image source provided");
          t("preload:error", { item: o.item, type: "image", src: n, error: R }), w(R);
          return;
        }
        const B = new Image(), F = Date.now(), W = 300;
        B.onload = () => {
          const R = Date.now() - F, G = Math.max(0, W - R);
          setTimeout(async () => {
            y.value = !0, g.value = !1, p.value = !1, await q(), await new Promise((N) => setTimeout(N, 100)), E.value = !0, t("preload:success", { item: o.item, type: "image", src: n }), v();
          }, G);
        }, B.onerror = () => {
          g.value = !0, y.value = !1, p.value = !1;
          const R = new Error("Failed to load image");
          t("preload:error", { item: o.item, type: "image", src: n, error: R }), w(R);
        }, B.src = n;
      });
    }
    function O(n) {
      return new Promise((v, w) => {
        if (!n) {
          const R = new Error("No video source provided");
          t("preload:error", { item: o.item, type: "video", src: n, error: R }), w(R);
          return;
        }
        const B = document.createElement("video"), F = Date.now(), W = 300;
        B.preload = "metadata", B.muted = !0, B.onloadedmetadata = () => {
          const R = Date.now() - F, G = Math.max(0, W - R);
          setTimeout(async () => {
            r.value = !0, x.value = !1, p.value = !1, await q(), await new Promise((N) => setTimeout(N, 100)), E.value = !0, t("preload:success", { item: o.item, type: "video", src: n }), v();
          }, G);
        }, B.onerror = () => {
          x.value = !0, r.value = !1, p.value = !1;
          const R = new Error("Failed to load video");
          t("preload:error", { item: o.item, type: "video", src: n, error: R }), w(R);
        }, B.src = n;
      });
    }
    async function k() {
      var v;
      if (!a.value || p.value || f.value || u.value === "video" && r.value || u.value === "image" && y.value)
        return;
      const n = (v = o.item) == null ? void 0 : v.src;
      if (n)
        if (p.value = !0, E.value = !1, u.value === "video") {
          M.value = n, r.value = !1, x.value = !1;
          try {
            await O(n);
          } catch {
          }
        } else {
          h.value = n, y.value = !1, g.value = !1;
          try {
            await z(n);
          } catch {
          }
        }
    }
    return tt(() => {
      if (!m.value) return;
      const n = [o.preloadThreshold, 1].filter((v, w, B) => B.indexOf(v) === w).sort((v, w) => v - w);
      i = new IntersectionObserver(
        (v) => {
          v.forEach((w) => {
            const B = w.intersectionRatio, F = B >= 1, W = B >= o.preloadThreshold;
            F && !I.value && (I.value = !0, t("in-view", { item: o.item, type: u.value })), W && !a.value ? (a.value = !0, k()) : w.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: n
        }
      ), i.observe(m.value);
    }), at(() => {
      i && (i.disconnect(), i = null);
    }), te(
      () => {
        var n;
        return (n = o.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || f.value)) {
          if (u.value === "video") {
            if (n !== M.value && (r.value = !1, x.value = !1, M.value = n, a.value)) {
              p.value = !0;
              try {
                await O(n);
              } catch {
              }
            }
          } else if (n !== h.value && (y.value = !1, g.value = !1, h.value = n, a.value)) {
            p.value = !0;
            try {
              await z(n);
            } catch {
            }
          }
        }
      }
    ), te(
      () => o.isActive,
      (n) => {
        !d.value || !T.value || (n ? T.value.play() : T.value.pause());
      }
    ), (n, v) => (j(), C("div", {
      ref_key: "containerRef",
      ref: m,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (j(), C("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${n.headerHeight}px` })
      }, [
        X(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: r.value,
          videoError: x.value,
          showNotFound: f.value,
          isLoading: p.value,
          mediaType: u.value
        })
      ], 4)) : ae("", !0),
      V("div", sa, [
        X(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: r.value,
          videoError: x.value,
          showNotFound: f.value,
          isLoading: p.value,
          mediaType: u.value,
          imageSrc: h.value,
          videoSrc: M.value,
          showMedia: E.value
        }, () => [
          V("div", ua, [
            f.value ? (j(), C("div", ca, v[3] || (v[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), C("div", va, [
              u.value === "image" && h.value ? (j(), C("img", {
                key: 0,
                src: h.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  y.value && E.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: v[0] || (v[0] = (w) => P("image")),
                onMouseleave: v[1] || (v[1] = (w) => b("image"))
              }, null, 42, fa)) : ae("", !0),
              u.value === "video" && M.value ? (j(), C("video", {
                key: 1,
                ref_key: "videoEl",
                ref: T,
                src: M.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  r.value && E.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: d.value && o.isActive,
                controls: d.value,
                onClick: Ye(c, ["stop"]),
                onTouchend: Ye(c, ["stop", "prevent"]),
                onMouseenter: S,
                onMouseleave: L,
                onError: v[2] || (v[2] = (w) => x.value = !0)
              }, null, 42, da)) : ae("", !0),
              !y.value && !r.value && !g.value && !x.value ? (j(), C("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  E.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ha, [
                  X(n.$slots, "placeholder-icon", { mediaType: u.value }, () => [
                    V("i", {
                      class: re(u.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              p.value ? (j(), C("div", ma, v[4] || (v[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              u.value === "image" && g.value || u.value === "video" && x.value ? (j(), C("div", ga, [
                V("i", {
                  class: re(u.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Be(u.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (j(), C("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${n.footerHeight}px` })
      }, [
        X(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: r.value,
          videoError: x.value,
          showNotFound: f.value,
          isLoading: p.value,
          mediaType: u.value
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
    const t = e, y = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, g = Z(() => {
      var s;
      return {
        ...y,
        ...t.layout,
        sizes: {
          ...y.sizes,
          ...((s = t.layout) == null ? void 0 : s.sizes) || {}
        }
      };
    }), h = $(null), r = $(typeof window < "u" ? window.innerWidth : 1024), x = $(typeof window < "u" ? window.innerHeight : 768), M = $(null);
    let a = null;
    function I(s) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[s] || 768;
    }
    const p = Z(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const s = typeof t.mobileBreakpoint == "string" ? I(t.mobileBreakpoint) : t.mobileBreakpoint;
      return r.value < s;
    }), E = o, m = Z({
      get: () => t.items,
      set: (s) => E("update:items", s)
    }), T = $(7), i = $(null), u = $([]), f = $(null), d = $(!1), P = $(0), b = $(!1), c = $(null), S = Z(() => Jt(r.value)), L = ia({
      masonry: m
    }), { checkItemDimensions: z, reset: O } = L, k = oa({
      masonry: m,
      useSwipeMode: p,
      container: i,
      columns: T,
      containerWidth: r,
      masonryContentHeight: P,
      layout: g,
      fixedDimensions: M,
      checkItemDimensions: z
    }), { refreshLayout: n, setFixedDimensions: v, onResize: w } = k, B = ra({
      masonry: m,
      container: i,
      columns: T,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: F, viewportHeight: W, virtualizing: R, visibleMasonry: G, updateScrollProgress: N, updateViewport: Y, reset: J } = B, { onEnter: ne, onBeforeEnter: K, onBeforeLeave: ie, onLeave: ee } = ea(
      { container: i },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: R }
    ), ot = ne, rt = K, it = ie, st = ee, ut = na({
      getNextPage: t.getNextPage,
      masonry: m,
      isLoading: d,
      hasReachedEnd: b,
      loadError: c,
      currentPage: f,
      paginationHistory: u,
      refreshLayout: n,
      retryMaxAttempts: t.retryMaxAttempts,
      retryInitialDelayMs: t.retryInitialDelayMs,
      retryBackoffStepMs: t.retryBackoffStepMs,
      backfillEnabled: t.backfillEnabled,
      backfillDelayMs: t.backfillDelayMs,
      backfillMaxCalls: t.backfillMaxCalls,
      pageSize: t.pageSize,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      emits: E
    }), { loadPage: Te, loadNext: pe, refreshCurrentPage: ze, cancelLoad: Ie, maybeBackfillToTarget: ct } = ut, Q = aa({
      useSwipeMode: p,
      masonry: m,
      isLoading: d,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: u
    }), { handleScroll: Fe } = ta({
      container: i,
      masonry: m,
      columns: T,
      containerHeight: P,
      isLoading: d,
      pageSize: t.pageSize,
      refreshLayout: n,
      setItemsRaw: (s) => {
        m.value = s;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    B.handleScroll.value = Fe;
    const vt = la({
      masonry: m,
      useSwipeMode: p,
      refreshLayout: n,
      refreshCurrentPage: ze,
      loadNext: pe,
      maybeBackfillToTarget: ct,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: u
    }), { remove: ce, removeMany: ft, restore: dt, restoreMany: ht, removeAll: mt } = vt;
    function gt(s) {
      v(s, N), !s && h.value && (r.value = h.value.clientWidth, x.value = h.value.clientHeight);
    }
    l({
      isLoading: d,
      refreshLayout: n,
      // Container dimensions (wrapper element)
      containerWidth: r,
      containerHeight: x,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: P,
      // Current page
      currentPage: f,
      // End of list tracking
      hasReachedEnd: b,
      // Load error tracking
      loadError: c,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: gt,
      remove: ce,
      removeMany: ft,
      removeAll: mt,
      restore: dt,
      restoreMany: ht,
      loadNext: pe,
      loadPage: Te,
      refreshCurrentPage: ze,
      reset: xt,
      destroy: bt,
      init: Ve,
      restoreItems: Le,
      paginationHistory: u,
      cancelLoad: Ie,
      scrollToTop: pt,
      scrollTo: yt,
      totalItems: Z(() => m.value.length),
      currentBreakpoint: S
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Re = Q.handleTouchStart, Ae = Q.handleTouchMove, We = Q.handleTouchEnd, Oe = Q.handleMouseDown, Ee = Q.handleMouseMove, Pe = Q.handleMouseUp, ke = Q.snapToCurrentItem;
    function pt(s) {
      i.value && i.value.scrollTo({
        top: 0,
        behavior: (s == null ? void 0 : s.behavior) ?? "smooth",
        ...s
      });
    }
    function yt(s) {
      i.value && (i.value.scrollTo({
        top: s.top ?? i.value.scrollTop,
        left: s.left ?? i.value.scrollLeft,
        behavior: s.behavior ?? "auto"
      }), i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight || window.innerHeight));
    }
    function wt() {
      w(), i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight);
    }
    function xt() {
      Ie(), i.value && i.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), m.value = [], x.value = 0, f.value = t.loadAtPage, u.value = [t.loadAtPage], b.value = !1, c.value = null, J(), we = !1;
    }
    function bt() {
      Ie(), m.value = [], P.value = 0, f.value = null, u.value = [], b.value = !1, c.value = null, d.value = !1, se.value = 0, ve.value = 0, ye.value = !1, J(), O(), i.value && i.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Qe(async () => {
      p.value || await Y();
    }, 200), Ce = Qe(wt, 200);
    function je() {
      Q.handleWindowResize();
    }
    function Ve(s, H, D) {
      f.value = H, u.value = [H], u.value.push(D), b.value = D == null, z(s, "init"), p.value ? (m.value = [...m.value, ...s], se.value === 0 && m.value.length > 0 && (ve.value = 0)) : (n([...m.value, ...s]), i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight || window.innerHeight), q(() => {
        i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight || window.innerHeight, N());
      }));
    }
    async function Le(s, H, D) {
      if (!t.skipInitialLoad) {
        Ve(s, H, D);
        return;
      }
      if (f.value = H, u.value = [H], D != null && u.value.push(D), b.value = D === null, c.value = null, z(s, "restoreItems"), p.value)
        m.value = s, se.value === 0 && m.value.length > 0 && (ve.value = 0);
      else if (n(s), i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight || window.innerHeight), await q(), i.value) {
        F.value = i.value.scrollTop, W.value = i.value.clientHeight || window.innerHeight, N(), await q();
        const _ = be(m.value, T.value), A = _.length ? Math.max(..._) : 0, qe = i.value.scrollTop + i.value.clientHeight, Se = typeof t.loadThresholdPx == "number" ? t.loadThresholdPx : 200, Mt = Se >= 0 ? Math.max(0, A - Se) : Math.max(0, A + Se);
        qe >= Mt && !b.value && !d.value && u.value.length > 0 && u.value[u.value.length - 1] != null && await Fe(_, !0);
      }
    }
    te(
      g,
      () => {
        p.value || i.value && (T.value = ue(g.value, r.value), n(m.value));
      },
      { deep: !0 }
    ), te(() => t.layoutMode, () => {
      M.value && M.value.width !== void 0 ? r.value = M.value.width : h.value && (r.value = h.value.clientWidth);
    }), te(i, (s) => {
      s && !p.value ? (s.removeEventListener("scroll", oe), s.addEventListener("scroll", oe, { passive: !0 })) : s && s.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return te(
      () => [t.items, t.skipInitialLoad, t.initialPage, t.initialNextPage],
      ([s, H, D, _]) => {
        if (H && s && s.length > 0 && !we) {
          we = !0;
          const A = D ?? t.loadAtPage;
          Le(s, A, _ !== void 0 ? _ : void 0);
        }
      },
      { immediate: !1 }
    ), te(p, (s, H) => {
      H === void 0 && s === !1 || q(() => {
        s ? (document.addEventListener("mousemove", Ee), document.addEventListener("mouseup", Pe), i.value && i.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, m.value.length > 0 && ke()) : (document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Pe), i.value && h.value && (M.value && M.value.width !== void 0 ? r.value = M.value.width : r.value = h.value.clientWidth, i.value.removeEventListener("scroll", oe), i.value.addEventListener("scroll", oe, { passive: !0 }), m.value.length > 0 && (T.value = ue(g.value, r.value), n(m.value), F.value = i.value.scrollTop, W.value = i.value.clientHeight, N())));
      });
    }, { immediate: !0 }), te(le, (s) => {
      s && (s.addEventListener("touchstart", Re, { passive: !1 }), s.addEventListener("touchmove", Ae, { passive: !1 }), s.addEventListener("touchend", We), s.addEventListener("mousedown", Oe));
    }), te(() => m.value.length, (s, H) => {
      p.value && s > 0 && H === 0 && (se.value = 0, q(() => ke()));
    }), te(h, (s) => {
      a && (a.disconnect(), a = null), s && typeof ResizeObserver < "u" ? (a = new ResizeObserver((H) => {
        if (!M.value)
          for (const D of H) {
            const _ = D.contentRect.width, A = D.contentRect.height;
            r.value !== _ && (r.value = _), x.value !== A && (x.value = A);
          }
      }), a.observe(s), M.value || (r.value = s.clientWidth, x.value = s.clientHeight)) : s && (M.value || (r.value = s.clientWidth, x.value = s.clientHeight));
    }, { immediate: !0 }), te(r, (s, H) => {
      s !== H && s > 0 && !p.value && i.value && m.value.length > 0 && q(() => {
        T.value = ue(g.value, s), n(m.value), N();
      });
    }), tt(async () => {
      try {
        await q(), h.value && !a && (r.value = h.value.clientWidth, x.value = h.value.clientHeight), p.value || (T.value = ue(g.value, r.value), i.value && (F.value = i.value.scrollTop, W.value = i.value.clientHeight));
        const s = t.loadAtPage;
        if (u.value = [s], !t.skipInitialLoad)
          await Te(u.value[0]);
        else if (t.items && t.items.length > 0) {
          const H = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, D = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Le(t.items, H, D), we = !0;
        }
        p.value ? q(() => ke()) : N();
      } catch (s) {
        c.value || (console.error("Error during component initialization:", s), c.value = me(s)), d.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", je);
    }), at(() => {
      var s;
      a && (a.disconnect(), a = null), (s = i.value) == null || s.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", je), le.value && (le.value.removeEventListener("touchstart", Re), le.value.removeEventListener("touchmove", Ae), le.value.removeEventListener("touchend", We), le.value.removeEventListener("mousedown", Oe)), document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Pe);
    }), (s, H) => (j(), C("div", {
      ref_key: "wrapper",
      ref: h,
      class: "w-full h-full flex flex-col relative"
    }, [
      p.value ? (j(), C("div", {
        key: 0,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": t.forceMotion, "cursor-grab": !U(ye), "cursor-grabbing": U(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${U(ve)}px)`,
            transition: U(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${m.value.length * 100}%`
          })
        }, [
          (j(!0), C(Ue, null, _e(m.value, (D, _) => (j(), C("div", {
            key: `${D.page}-${D.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${_ * (100 / m.value.length)}%`,
              height: `${100 / m.value.length}%`
            })
          }, [
            V("div", pa, [
              V("div", ya, [
                X(s.$slots, "default", {
                  item: D,
                  remove: U(ce),
                  index: D.originalIndex ?? m.value.indexOf(D)
                }, () => [
                  He(Me, {
                    item: D,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": _ === U(se),
                    "onPreload:success": H[0] || (H[0] = (A) => E("item:preload:success", A)),
                    "onPreload:error": H[1] || (H[1] = (A) => E("item:preload:error", A)),
                    onMouseEnter: H[2] || (H[2] = (A) => E("item:mouse-enter", A)),
                    onMouseLeave: H[3] || (H[3] = (A) => E("item:mouse-leave", A))
                  }, {
                    header: fe((A) => [
                      X(s.$slots, "item-header", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: fe((A) => [
                      X(s.$slots, "item-footer", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        b.value && m.value.length > 0 ? (j(), C("div", wa, [
          X(s.$slots, "end-message", {}, () => [
            H[8] || (H[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        c.value && m.value.length > 0 ? (j(), C("div", xa, [
          X(s.$slots, "error-message", { error: c.value }, () => [
            V("p", ba, "Failed to load content: " + Be(c.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (j(), C("div", {
        key: 1,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": t.forceMotion }]),
        ref_key: "container",
        ref: i
      }, [
        V("div", {
          class: "relative",
          style: ge({ height: `${P.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          He(Tt, {
            name: "masonry",
            css: !1,
            onEnter: U(ot),
            onBeforeEnter: U(rt),
            onLeave: U(st),
            onBeforeLeave: U(it)
          }, {
            default: fe(() => [
              (j(!0), C(Ue, null, _e(U(G), (D, _) => (j(), C("div", de({
                key: `${D.page}-${D.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, U(Zt)(D, _)), [
                X(s.$slots, "default", {
                  item: D,
                  remove: U(ce),
                  index: D.originalIndex ?? m.value.indexOf(D)
                }, () => [
                  He(Me, {
                    item: D,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": H[4] || (H[4] = (A) => E("item:preload:success", A)),
                    "onPreload:error": H[5] || (H[5] = (A) => E("item:preload:error", A)),
                    onMouseEnter: H[6] || (H[6] = (A) => E("item:mouse-enter", A)),
                    onMouseLeave: H[7] || (H[7] = (A) => E("item:mouse-leave", A))
                  }, {
                    header: fe((A) => [
                      X(s.$slots, "item-header", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: fe((A) => [
                      X(s.$slots, "item-footer", de({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        b.value && m.value.length > 0 ? (j(), C("div", Ma, [
          X(s.$slots, "end-message", {}, () => [
            H[9] || (H[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        c.value && m.value.length > 0 ? (j(), C("div", Ta, [
          X(s.$slots, "error-message", { error: c.value }, () => [
            V("p", Ia, "Failed to load content: " + Be(c.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2))
    ], 512));
  }
}), Pa = (e, l) => {
  const o = e.__vccOpts || e;
  for (const [t, y] of l)
    o[t] = y;
  return o;
}, Ze = /* @__PURE__ */ Pa(Ea, [["__scopeId", "data-v-c0458ed8"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Ha as default
};
