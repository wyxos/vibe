import { nextTick as q, ref as B, computed as Z, defineComponent as et, onMounted as tt, onUnmounted as at, watch as te, createElementBlock as R, openBlock as O, createCommentVNode as ae, createElementVNode as V, normalizeStyle as ge, renderSlot as X, normalizeClass as re, withModifiers as Ye, toDisplayString as Be, unref as U, Fragment as Ue, renderList as _e, createVNode as He, withCtx as fe, mergeProps as de, TransitionGroup as Tt } from "vue";
let $e = null;
function It() {
  if ($e != null) return $e;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const r = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), $e = r, r;
}
function Xe(e, l, r, t = {}) {
  const {
    gutterX: y = 0,
    gutterY: g = 0,
    header: h = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: b = 0,
    sizes: n = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: p = "masonry"
  } = t;
  let x = 0, T = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(l);
      x = parseFloat(L.paddingLeft) || 0, T = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const s = (w || 0) + x, m = (b || 0) + T, a = l.offsetWidth - l.clientWidth, d = a > 0 ? a + 2 : It() + 2, v = l.offsetWidth - d - s - m, M = y * (r - 1), P = Math.floor((v - M) / r), I = e.map((L) => {
    const k = L.width, W = L.height;
    return Math.round(P * W / k) + i + h;
  });
  if (p === "sequential-balanced") {
    const L = I.length;
    if (L === 0) return [];
    const k = (D, Y, J) => D + (Y > 0 ? g : 0) + J;
    let W = Math.max(...I), o = I.reduce((D, Y) => D + Y, 0) + g * Math.max(0, L - 1);
    const u = (D) => {
      let Y = 1, J = 0, ne = 0;
      for (let K = 0; K < L; K++) {
        const ie = I[K], ee = k(J, ne, ie);
        if (ee <= D)
          J = ee, ne++;
        else if (Y++, J = ie, ne = 1, ie > D || Y > r) return !1;
      }
      return Y <= r;
    };
    for (; W < o; ) {
      const D = Math.floor((W + o) / 2);
      u(D) ? o = D : W = D + 1;
    }
    const E = o, $ = new Array(r).fill(0);
    let C = r - 1, A = 0, N = 0;
    for (let D = L - 1; D >= 0; D--) {
      const Y = I[D], J = D < C;
      !(k(A, N, Y) <= E) || J ? ($[C] = D + 1, C--, A = Y, N = 1) : (A = k(A, N, Y), N++);
    }
    $[0] = 0;
    const j = [], G = new Array(r).fill(0);
    for (let D = 0; D < r; D++) {
      const Y = $[D], J = D + 1 < r ? $[D + 1] : L, ne = D * (P + y);
      for (let K = Y; K < J; K++) {
        const ee = {
          ...e[K],
          columnWidth: P,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ee.imageHeight = I[K] - (i + h), ee.columnHeight = I[K], ee.left = ne, ee.top = G[D], G[D] += ee.columnHeight + (K + 1 < J ? g : 0), j.push(ee);
      }
    }
    return j;
  }
  const f = new Array(r).fill(0), H = [];
  for (let L = 0; L < e.length; L++) {
    const k = e[L], W = {
      ...k,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, o = f.indexOf(Math.min(...f)), u = k.width, E = k.height;
    W.columnWidth = P, W.left = o * (P + y), W.imageHeight = Math.round(P * E / u), W.columnHeight = W.imageHeight + i + h, W.top = f[o], f[o] += W.columnHeight + g, H.push(W);
  }
  return H;
}
var Et = typeof global == "object" && global && global.Object === Object && global, kt = typeof self == "object" && self && self.Object === Object && self, nt = Et || kt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, Pt = lt.hasOwnProperty, Lt = lt.toString, he = xe ? xe.toStringTag : void 0;
function St(e) {
  var l = Pt.call(e, he), r = e[he];
  try {
    e[he] = void 0;
    var t = !0;
  } catch {
  }
  var y = Lt.call(e);
  return t && (l ? e[he] = r : delete e[he]), y;
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
var At = "[object Symbol]";
function Wt(e) {
  return typeof e == "symbol" || Ft(e) && zt(e) == At;
}
var Rt = /\s/;
function Ot(e) {
  for (var l = e.length; l-- && Rt.test(e.charAt(l)); )
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
  if (Wt(e))
    return Je;
  if (De(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = De(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var r = qt.test(e);
  return r || Yt.test(e) ? Ut(e.slice(2), r ? 2 : 8) : Vt.test(e) ? Je : +e;
}
var Ne = function() {
  return nt.Date.now();
}, _t = "Expected a function", Xt = Math.max, Gt = Math.min;
function Qe(e, l, r) {
  var t, y, g, h, i, w, b = 0, n = !1, p = !1, x = !0;
  if (typeof e != "function")
    throw new TypeError(_t);
  l = Ke(l) || 0, De(r) && (n = !!r.leading, p = "maxWait" in r, g = p ? Xt(Ke(r.maxWait) || 0, l) : g, x = "trailing" in r ? !!r.trailing : x);
  function T(f) {
    var H = t, L = y;
    return t = y = void 0, b = f, h = e.apply(L, H), h;
  }
  function s(f) {
    return b = f, i = setTimeout(d, l), n ? T(f) : h;
  }
  function m(f) {
    var H = f - w, L = f - b, k = l - H;
    return p ? Gt(k, g - L) : k;
  }
  function a(f) {
    var H = f - w, L = f - b;
    return w === void 0 || H >= l || H < 0 || p && L >= g;
  }
  function d() {
    var f = Ne();
    if (a(f))
      return v(f);
    i = setTimeout(d, m(f));
  }
  function v(f) {
    return i = void 0, x && t ? T(f) : (t = y = void 0, h);
  }
  function M() {
    i !== void 0 && clearTimeout(i), b = 0, t = w = y = i = void 0;
  }
  function P() {
    return i === void 0 ? h : v(Ne());
  }
  function I() {
    var f = Ne(), H = a(f);
    if (t = arguments, y = this, w = f, H) {
      if (i === void 0)
        return s(w);
      if (p)
        return clearTimeout(i), i = setTimeout(d, l), T(w);
    }
    return i === void 0 && (i = setTimeout(d, l)), h;
  }
  return I.cancel = M, I.flush = P, I;
}
function ue(e, l) {
  const r = l ?? (typeof window < "u" ? window.innerWidth : 1024), t = e.sizes;
  return r >= 1536 && t["2xl"] ? t["2xl"] : r >= 1280 && t.xl ? t.xl : r >= 1024 && t.lg ? t.lg : r >= 768 && t.md ? t.md : r >= 640 && t.sm ? t.sm : t.base;
}
function Jt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Kt(e) {
  return e.reduce((r, t) => Math.max(r, t.top + t.columnHeight), 0) + 500;
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
  const t = Array.from(new Set(e.map((h) => h.left))).sort((h, i) => h - i).slice(0, l), y = /* @__PURE__ */ new Map();
  for (let h = 0; h < t.length; h++) y.set(t[h], h);
  const g = new Array(t.length).fill(0);
  for (const h of e) {
    const i = y.get(h.left);
    i != null && (g[i] = Math.max(g[i], h.top + h.columnHeight));
  }
  for (; g.length < l; ) g.push(0);
  return g;
}
function ea(e, l) {
  let r = 0, t = 0;
  const y = 1e3;
  function g(n, p) {
    var s;
    const x = (s = e.container) == null ? void 0 : s.value;
    if (x) {
      const m = x.scrollTop, a = x.clientHeight;
      r = m - y, t = m + a + y;
    }
    return n + p >= r && n <= t;
  }
  function h(n, p) {
    var v;
    const x = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), s = parseInt(n.dataset.index || "0", 10), m = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((v = l == null ? void 0 : l.virtualizing) != null && v.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "", p();
      });
      return;
    }
    if (!g(T, m)) {
      n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, n.style.transition = "none", p();
      return;
    }
    const a = Math.min(s * 20, 160), d = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${a}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`;
      const M = () => {
        d ? n.style.setProperty("--masonry-opacity-delay", d) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", M), p();
      };
      n.addEventListener("transitionend", M);
    });
  }
  function i(n) {
    var T;
    const p = parseInt(n.dataset.left || "0", 10), x = parseInt(n.dataset.top || "0", 10);
    if ((T = l == null ? void 0 : l.virtualizing) != null && T.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${p}px, ${x}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    n.style.opacity = "0", n.style.transform = `translate3d(${p}px, ${x + 10}px, 0) scale(0.985)`;
  }
  function w(n) {
    var s;
    const p = parseInt(n.dataset.left || "0", 10), x = parseInt(n.dataset.top || "0", 10), T = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if (!((s = l == null ? void 0 : l.virtualizing) != null && s.value)) {
      if (!g(x, T)) {
        n.style.transition = "none";
        return;
      }
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${p}px, ${x}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "";
      });
    }
  }
  function b(n, p) {
    var I;
    const x = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), s = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((I = l == null ? void 0 : l.virtualizing) != null && I.value) {
      p();
      return;
    }
    if (!g(T, s)) {
      n.style.transition = "none", n.style.opacity = "0", p();
      return;
    }
    const m = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let a = Number.isFinite(m) && m > 0 ? m : NaN;
    if (!Number.isFinite(a)) {
      const H = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(H);
      a = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const d = n.style.transitionDuration, v = () => {
      n.removeEventListener("transitionend", M), clearTimeout(P), n.style.transitionDuration = d || "";
    }, M = (f) => {
      (!f || f.target === n) && (v(), p());
    }, P = setTimeout(() => {
      v(), p();
    }, a + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${a}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${x}px, ${T + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", M);
    });
  }
  return {
    onEnter: h,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: b
  };
}
function ta({
  container: e,
  masonry: l,
  columns: r,
  containerHeight: t,
  isLoading: y,
  pageSize: g,
  refreshLayout: h,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: b
}) {
  let n = 0;
  async function p(x, T = !1) {
    if (!e.value) return;
    const s = x ?? be(l.value, r.value), m = s.length ? Math.max(...s) : 0, a = e.value.scrollTop + e.value.clientHeight, d = e.value.scrollTop > n + 1;
    n = e.value.scrollTop;
    const v = typeof b == "number" ? b : 200, M = v >= 0 ? Math.max(0, m - v) : Math.max(0, m + v);
    if (a >= M && (d || T) && !y.value) {
      await w(), await q();
      return;
    }
  }
  return {
    handleScroll: p
  };
}
function aa(e) {
  const { useSwipeMode: l, masonry: r, isLoading: t, loadNext: y, loadPage: g, paginationHistory: h } = e, i = B(0), w = B(0), b = B(!1), n = B(0), p = B(0), x = B(null), T = Z(() => {
    if (!l.value || r.value.length === 0) return null;
    const o = Math.max(0, Math.min(i.value, r.value.length - 1));
    return r.value[o] || null;
  }), s = Z(() => {
    if (!l.value || !T.value) return null;
    const o = i.value + 1;
    return o >= r.value.length ? null : r.value[o] || null;
  }), m = Z(() => {
    if (!l.value || !T.value) return null;
    const o = i.value - 1;
    return o < 0 ? null : r.value[o] || null;
  });
  function a() {
    if (!x.value) return;
    const o = x.value.clientHeight;
    w.value = -i.value * o;
  }
  function d() {
    if (!s.value) {
      y();
      return;
    }
    i.value++, a(), i.value >= r.value.length - 5 && y();
  }
  function v() {
    m.value && (i.value--, a());
  }
  function M(o) {
    l.value && (b.value = !0, n.value = o.touches[0].clientY, p.value = w.value, o.preventDefault());
  }
  function P(o) {
    if (!l.value || !b.value) return;
    const u = o.touches[0].clientY - n.value;
    w.value = p.value + u, o.preventDefault();
  }
  function I(o) {
    if (!l.value || !b.value) return;
    b.value = !1;
    const u = w.value - p.value;
    Math.abs(u) > 100 ? u > 0 && m.value ? v() : u < 0 && s.value ? d() : a() : a(), o.preventDefault();
  }
  function f(o) {
    l.value && (b.value = !0, n.value = o.clientY, p.value = w.value, o.preventDefault());
  }
  function H(o) {
    if (!l.value || !b.value) return;
    const u = o.clientY - n.value;
    w.value = p.value + u, o.preventDefault();
  }
  function L(o) {
    if (!l.value || !b.value) return;
    b.value = !1;
    const u = w.value - p.value;
    Math.abs(u) > 100 ? u > 0 && m.value ? v() : u < 0 && s.value ? d() : a() : a(), o.preventDefault();
  }
  function k() {
    !l.value && i.value > 0 && (i.value = 0, w.value = 0), l.value && r.value.length === 0 && !t.value && g(h.value[0]), l.value && a();
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
    currentItem: T,
    nextItem: s,
    previousItem: m,
    // Functions
    handleTouchStart: M,
    handleTouchMove: P,
    handleTouchEnd: I,
    handleMouseDown: f,
    handleMouseMove: H,
    handleMouseUp: L,
    goToNextItem: d,
    goToPreviousItem: v,
    snapToCurrentItem: a,
    handleWindowResize: k,
    reset: W
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function na(e) {
  const {
    getNextPage: l,
    masonry: r,
    isLoading: t,
    hasReachedEnd: y,
    loadError: g,
    currentPage: h,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: b,
    retryInitialDelayMs: n,
    retryBackoffStepMs: p,
    backfillEnabled: x,
    backfillDelayMs: T,
    backfillMaxCalls: s,
    pageSize: m,
    autoRefreshOnEmpty: a,
    emits: d
  } = e, v = B(!1);
  let M = !1;
  function P(u, E) {
    return new Promise(($) => {
      const C = Math.max(0, u | 0), A = Date.now();
      E(C, C);
      const N = setInterval(() => {
        if (v.value) {
          clearInterval(N), $();
          return;
        }
        const j = Date.now() - A, G = Math.max(0, C - j);
        E(G, C), G <= 0 && (clearInterval(N), $());
      }, 100);
    });
  }
  async function I(u) {
    let E = 0;
    const $ = b;
    let C = n;
    for (; ; )
      try {
        const A = await u();
        return E > 0 && d("retry:stop", { attempt: E, success: !0 }), A;
      } catch (A) {
        if (E++, E > $)
          throw d("retry:stop", { attempt: E - 1, success: !1 }), A;
        d("retry:start", { attempt: E, max: $, totalMs: C }), await P(C, (N, j) => {
          d("retry:tick", { attempt: E, remainingMs: N, totalMs: j });
        }), C += p;
      }
  }
  async function f(u) {
    try {
      const E = await I(() => l(u));
      return w([...r.value, ...E.items]), E;
    } catch (E) {
      throw E;
    }
  }
  async function H(u, E = !1) {
    if (!E && !x || M || v.value || y.value) return;
    const $ = (u || 0) + (m || 0);
    if (!m || m <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      y.value = !0;
      return;
    }
    if (!(r.value.length >= $)) {
      M = !0, t.value = !0;
      try {
        let A = 0;
        for (d("backfill:start", { target: $, fetched: r.value.length, calls: A }); r.value.length < $ && A < s && i.value[i.value.length - 1] != null && !v.value && !y.value && M && (await P(T, (j, G) => {
          d("backfill:tick", {
            fetched: r.value.length,
            target: $,
            calls: A,
            remainingMs: j,
            totalMs: G
          });
        }), !(v.value || !M)); ) {
          const N = i.value[i.value.length - 1];
          if (N == null) {
            y.value = !0;
            break;
          }
          try {
            if (v.value || !M) break;
            const j = await f(N);
            if (v.value || !M) break;
            g.value = null, i.value.push(j.nextPage), j.nextPage == null && (y.value = !0);
          } catch (j) {
            if (v.value || !M) break;
            g.value = me(j);
          }
          A++;
        }
        d("backfill:stop", { fetched: r.value.length, calls: A });
      } finally {
        M = !1, t.value = !1;
      }
    }
  }
  async function L(u) {
    if (!t.value) {
      v.value = !1, t.value = !0, y.value = !1, g.value = null;
      try {
        const E = r.value.length;
        if (v.value) return;
        const $ = await f(u);
        return v.value ? void 0 : (g.value = null, h.value = u, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await H(E), $);
      } catch (E) {
        throw g.value = me(E), E;
      } finally {
        t.value = !1;
      }
    }
  }
  async function k() {
    if (!t.value && !y.value) {
      v.value = !1, t.value = !0, g.value = null;
      try {
        const u = r.value.length;
        if (v.value) return;
        const E = i.value[i.value.length - 1];
        if (E == null) {
          y.value = !0, t.value = !1;
          return;
        }
        const $ = await f(E);
        return v.value ? void 0 : (g.value = null, h.value = E, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await H(u), $);
      } catch (u) {
        throw g.value = me(u), u;
      } finally {
        t.value = !1;
      }
    }
  }
  async function W() {
    if (!t.value) {
      v.value = !1, t.value = !0;
      try {
        const u = h.value;
        if (u == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", h.value, "paginationHistory:", i.value);
          return;
        }
        r.value = [], y.value = !1, g.value = null, i.value = [u];
        const E = await f(u);
        if (v.value) return;
        g.value = null, h.value = u, i.value.push(E.nextPage), E.nextPage == null && (y.value = !0);
        const $ = r.value.length;
        return await H($), E;
      } catch (u) {
        throw g.value = me(u), u;
      } finally {
        t.value = !1;
      }
    }
  }
  function o() {
    const u = M;
    v.value = !0, t.value = !1, M = !1, u && d("backfill:stop", { fetched: r.value.length, calls: 0, cancelled: !0 });
  }
  return {
    loadPage: L,
    loadNext: k,
    refreshCurrentPage: W,
    cancelLoad: o,
    maybeBackfillToTarget: H,
    getContent: f
  };
}
function la(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    refreshLayout: t,
    refreshCurrentPage: y,
    loadNext: g,
    maybeBackfillToTarget: h,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  async function b(s) {
    const m = l.value.filter((a) => a.id !== s.id);
    if (l.value = m, await q(), m.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await g(), await h(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((a) => requestAnimationFrame(() => a())), requestAnimationFrame(() => {
      t(m);
    });
  }
  async function n(s) {
    if (!s || s.length === 0) return;
    const m = new Set(s.map((d) => d.id)), a = l.value.filter((d) => !m.has(d.id));
    if (l.value = a, await q(), a.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await g(), await h(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((d) => requestAnimationFrame(() => d())), requestAnimationFrame(() => {
      t(a);
    });
  }
  async function p(s, m) {
    if (!s) return;
    const a = l.value;
    if (a.findIndex((P) => P.id === s.id) !== -1) return;
    const v = [...a], M = Math.min(m, v.length);
    v.splice(M, 0, s), l.value = v, await q(), r.value || (await new Promise((P) => requestAnimationFrame(() => P())), requestAnimationFrame(() => {
      t(v);
    }));
  }
  async function x(s, m) {
    var L;
    if (!s || s.length === 0) return;
    if (!m || m.length !== s.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const a = l.value, d = new Set(a.map((k) => k.id)), v = [];
    for (let k = 0; k < s.length; k++)
      d.has((L = s[k]) == null ? void 0 : L.id) || v.push({ item: s[k], index: m[k] });
    if (v.length === 0) return;
    const M = /* @__PURE__ */ new Map();
    for (const { item: k, index: W } of v)
      M.set(W, k);
    const P = v.length > 0 ? Math.max(...v.map(({ index: k }) => k)) : -1, I = Math.max(a.length - 1, P), f = [];
    let H = 0;
    for (let k = 0; k <= I; k++)
      M.has(k) ? f.push(M.get(k)) : H < a.length && (f.push(a[H]), H++);
    for (; H < a.length; )
      f.push(a[H]), H++;
    l.value = f, await q(), r.value || (await new Promise((k) => requestAnimationFrame(() => k())), requestAnimationFrame(() => {
      t(f);
    }));
  }
  async function T() {
    l.value = [];
  }
  return {
    remove: b,
    removeMany: n,
    restore: p,
    restoreMany: x,
    removeAll: T
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    container: t,
    columns: y,
    containerWidth: g,
    masonryContentHeight: h,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: b
  } = e;
  let n = [];
  function p(m) {
    const a = Kt(m);
    let d = 0;
    if (t.value) {
      const { scrollTop: v, clientHeight: M } = t.value;
      d = v + M + 100;
    }
    h.value = Math.max(a, d);
  }
  function x(m) {
    var M, P;
    if (r.value) {
      l.value = m;
      return;
    }
    if (!t.value) return;
    if (b(m, "refreshLayout"), m.length > 1e3 && n.length > m.length && n.length - m.length < 100) {
      let I = !0;
      for (let f = 0; f < m.length; f++)
        if (((M = m[f]) == null ? void 0 : M.id) !== ((P = n[f]) == null ? void 0 : P.id)) {
          I = !1;
          break;
        }
      if (I) {
        const f = m.map((H, L) => ({
          ...n[L],
          originalIndex: L
        }));
        p(f), l.value = f, n = f;
        return;
      }
    }
    const d = m.map((I, f) => ({
      ...I,
      originalIndex: f
    })), v = t.value;
    if (w.value && w.value.width !== void 0) {
      const I = v.style.width, f = v.style.boxSizing;
      v.style.boxSizing = "border-box", v.style.width = `${w.value.width}px`, v.offsetWidth;
      const H = Xe(d, v, y.value, i.value);
      v.style.width = I, v.style.boxSizing = f, p(H), l.value = H, n = H;
    } else {
      const I = Xe(d, v, y.value, i.value);
      p(I), l.value = I, n = I;
    }
  }
  function T(m, a) {
    w.value = m, m && (m.width !== void 0 && (g.value = m.width), !r.value && t.value && l.value.length > 0 && q(() => {
      y.value = ue(i.value, g.value), x(l.value), a && a();
    }));
  }
  function s() {
    y.value = ue(i.value, g.value), x(l.value);
  }
  return {
    refreshLayout: x,
    setFixedDimensions: T,
    onResize: s,
    calculateHeight: p
  };
}
function ra(e) {
  const {
    masonry: l,
    container: r,
    columns: t,
    virtualBufferPx: y,
    loadThresholdPx: g
  } = e, h = B(e.handleScroll), i = B(0), w = B(0), b = y, n = B(!1), p = B({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), x = Z(() => {
    const a = i.value - b, d = i.value + w.value + b, v = l.value;
    return !v || v.length === 0 ? [] : v.filter((P) => {
      if (typeof P.top != "number" || typeof P.columnHeight != "number")
        return !0;
      const I = P.top;
      return P.top + P.columnHeight >= a && I <= d;
    });
  });
  function T(a) {
    if (!r.value) return;
    const { scrollTop: d, clientHeight: v } = r.value, M = d + v, P = a ?? be(l.value, t.value), I = P.length ? Math.max(...P) : 0, f = typeof g == "number" ? g : 200, H = f >= 0 ? Math.max(0, I - f) : Math.max(0, I + f), L = Math.max(0, H - M), k = L <= 100;
    p.value = {
      distanceToTrigger: Math.round(L),
      isNearTrigger: k
    };
  }
  async function s() {
    if (r.value) {
      const d = r.value.scrollTop, v = r.value.clientHeight || window.innerHeight, M = v > 0 ? v : window.innerHeight;
      i.value = d, w.value = M;
    }
    n.value = !0, await q(), await new Promise((d) => requestAnimationFrame(() => d())), n.value = !1;
    const a = be(l.value, t.value);
    h.value(a), T(a);
  }
  function m() {
    i.value = 0, w.value = 0, n.value = !1, p.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: w,
    virtualizing: n,
    scrollProgress: p,
    visibleMasonry: x,
    updateScrollProgress: T,
    updateViewport: s,
    reset: m,
    handleScroll: h
  };
}
function ia(e) {
  const { masonry: l } = e, r = B(/* @__PURE__ */ new Set());
  function t(h) {
    return typeof h == "number" && h > 0 && Number.isFinite(h);
  }
  function y(h, i) {
    try {
      if (!Array.isArray(h) || h.length === 0) return;
      const w = h.filter((n) => !t(n == null ? void 0 : n.width) || !t(n == null ? void 0 : n.height));
      if (w.length === 0) return;
      const b = [];
      for (const n of w) {
        const p = (n == null ? void 0 : n.id) ?? `idx:${l.value.indexOf(n)}`;
        r.value.has(p) || (r.value.add(p), b.push(p));
      }
      if (b.length > 0) {
        const n = b.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: i,
            count: b.length,
            sampleIds: n,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function g() {
    r.value.clear();
  }
  return {
    checkItemDimensions: y,
    invalidDimensionIds: r,
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
    inSwipeMode: { type: Boolean, default: !1 }
  },
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave"],
  setup(e, { emit: l }) {
    const r = e, t = l, y = B(!1), g = B(!1), h = B(null), i = B(!1), w = B(!1), b = B(null), n = B(!1), p = B(!1), x = B(!1), T = B(null), s = B(null);
    let m = null;
    const a = Z(() => {
      var o;
      return r.type ?? ((o = r.item) == null ? void 0 : o.type) ?? "image";
    }), d = Z(() => {
      var o;
      return r.notFound ?? ((o = r.item) == null ? void 0 : o.notFound) ?? !1;
    }), v = Z(() => !!r.inSwipeMode);
    function M(o) {
      t("mouse-enter", { item: r.item, type: o });
    }
    function P(o) {
      t("mouse-leave", { item: r.item, type: o });
    }
    function I(o) {
      if (v.value) return;
      const u = o.target;
      u && (u.paused ? u.play() : u.pause());
    }
    function f(o) {
      const u = o.target;
      u && (v.value || u.play(), M("video"));
    }
    function H(o) {
      const u = o.target;
      u && (v.value || u.pause(), P("video"));
    }
    function L(o) {
      return new Promise((u, E) => {
        if (!o) {
          const N = new Error("No image source provided");
          t("preload:error", { item: r.item, type: "image", src: o, error: N }), E(N);
          return;
        }
        const $ = new Image(), C = Date.now(), A = 300;
        $.onload = () => {
          const N = Date.now() - C, j = Math.max(0, A - N);
          setTimeout(async () => {
            y.value = !0, g.value = !1, p.value = !1, await q(), await new Promise((G) => setTimeout(G, 100)), x.value = !0, t("preload:success", { item: r.item, type: "image", src: o }), u();
          }, j);
        }, $.onerror = () => {
          g.value = !0, y.value = !1, p.value = !1;
          const N = new Error("Failed to load image");
          t("preload:error", { item: r.item, type: "image", src: o, error: N }), E(N);
        }, $.src = o;
      });
    }
    function k(o) {
      return new Promise((u, E) => {
        if (!o) {
          const N = new Error("No video source provided");
          t("preload:error", { item: r.item, type: "video", src: o, error: N }), E(N);
          return;
        }
        const $ = document.createElement("video"), C = Date.now(), A = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const N = Date.now() - C, j = Math.max(0, A - N);
          setTimeout(async () => {
            i.value = !0, w.value = !1, p.value = !1, await q(), await new Promise((G) => setTimeout(G, 100)), x.value = !0, t("preload:success", { item: r.item, type: "video", src: o }), u();
          }, j);
        }, $.onerror = () => {
          w.value = !0, i.value = !1, p.value = !1;
          const N = new Error("Failed to load video");
          t("preload:error", { item: r.item, type: "video", src: o, error: N }), E(N);
        }, $.src = o;
      });
    }
    async function W() {
      var u;
      if (!n.value || p.value || d.value || a.value === "video" && i.value || a.value === "image" && y.value)
        return;
      const o = (u = r.item) == null ? void 0 : u.src;
      if (o)
        if (p.value = !0, x.value = !1, a.value === "video") {
          b.value = o, i.value = !1, w.value = !1;
          try {
            await k(o);
          } catch {
          }
        } else {
          h.value = o, y.value = !1, g.value = !1;
          try {
            await L(o);
          } catch {
          }
        }
    }
    return tt(() => {
      T.value && (m = new IntersectionObserver(
        (o) => {
          o.forEach((u) => {
            u.isIntersecting && u.intersectionRatio >= 1 ? n.value || (n.value = !0, W()) : u.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), m.observe(T.value));
    }), at(() => {
      m && (m.disconnect(), m = null);
    }), te(
      () => {
        var o;
        return (o = r.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || d.value)) {
          if (a.value === "video") {
            if (o !== b.value && (i.value = !1, w.value = !1, b.value = o, n.value)) {
              p.value = !0;
              try {
                await k(o);
              } catch {
              }
            }
          } else if (o !== h.value && (y.value = !1, g.value = !1, h.value = o, n.value)) {
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
      ref: T,
      class: "relative w-full h-full flex flex-col"
    }, [
      o.headerHeight > 0 ? (O(), R("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${o.headerHeight}px` })
      }, [
        X(o.$slots, "header", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: a.value
        })
      ], 4)) : ae("", !0),
      V("div", sa, [
        X(o.$slots, "default", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: a.value,
          imageSrc: h.value,
          videoSrc: b.value,
          showMedia: x.value
        }, () => [
          V("div", ua, [
            d.value ? (O(), R("div", ca, u[3] || (u[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (O(), R("div", va, [
              a.value === "image" && h.value ? (O(), R("img", {
                key: 0,
                src: h.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  y.value && x.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: u[0] || (u[0] = (E) => M("image")),
                onMouseleave: u[1] || (u[1] = (E) => P("image"))
              }, null, 42, fa)) : ae("", !0),
              a.value === "video" && b.value ? (O(), R("video", {
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
                onClick: Ye(I, ["stop"]),
                onTouchend: Ye(I, ["stop", "prevent"]),
                onMouseenter: f,
                onMouseleave: H,
                onError: u[2] || (u[2] = (E) => w.value = !0)
              }, null, 42, da)) : ae("", !0),
              !y.value && !i.value && !g.value && !w.value ? (O(), R("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  x.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ha, [
                  X(o.$slots, "placeholder-icon", { mediaType: a.value }, () => [
                    V("i", {
                      class: re(a.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              p.value ? (O(), R("div", ma, u[4] || (u[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              a.value === "image" && g.value || a.value === "video" && w.value ? (O(), R("div", ga, [
                V("i", {
                  class: re(a.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Be(a.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      o.footerHeight > 0 ? (O(), R("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${o.footerHeight}px` })
      }, [
        X(o.$slots, "footer", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: a.value
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
    "remove-all:complete",
    // Re-emit item-level preload events from the default MasonryItem
    "item:preload:success",
    "item:preload:error",
    // Mouse events from MasonryItem content
    "item:mouse-enter",
    "item:mouse-leave"
  ],
  setup(e, { expose: l, emit: r }) {
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
      var c;
      return {
        ...y,
        ...t.layout,
        sizes: {
          ...y.sizes,
          ...((c = t.layout) == null ? void 0 : c.sizes) || {}
        }
      };
    }), h = B(null), i = B(typeof window < "u" ? window.innerWidth : 1024), w = B(typeof window < "u" ? window.innerHeight : 768), b = B(null);
    let n = null;
    function p(c) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[c] || 768;
    }
    const x = Z(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const c = typeof t.mobileBreakpoint == "string" ? p(t.mobileBreakpoint) : t.mobileBreakpoint;
      return i.value < c;
    }), T = r, s = Z({
      get: () => t.items,
      set: (c) => T("update:items", c)
    }), m = B(7), a = B(null), d = B([]), v = B(null), M = B(!1), P = B(0), I = B(!1), f = B(null), H = Z(() => Jt(i.value)), L = ia({
      masonry: s
    }), { checkItemDimensions: k, reset: W } = L, o = oa({
      masonry: s,
      useSwipeMode: x,
      container: a,
      columns: m,
      containerWidth: i,
      masonryContentHeight: P,
      layout: g,
      fixedDimensions: b,
      checkItemDimensions: k
    }), { refreshLayout: u, setFixedDimensions: E, onResize: $ } = o, C = ra({
      masonry: s,
      container: a,
      columns: m,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: A, viewportHeight: N, virtualizing: j, visibleMasonry: G, updateScrollProgress: D, updateViewport: Y, reset: J } = C, { onEnter: ne, onBeforeEnter: K, onBeforeLeave: ie, onLeave: ee } = ea(
      { container: a },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: j }
    ), ot = ne, rt = K, it = ie, st = ee, ut = na({
      getNextPage: t.getNextPage,
      masonry: s,
      isLoading: M,
      hasReachedEnd: I,
      loadError: f,
      currentPage: v,
      paginationHistory: d,
      refreshLayout: u,
      retryMaxAttempts: t.retryMaxAttempts,
      retryInitialDelayMs: t.retryInitialDelayMs,
      retryBackoffStepMs: t.retryBackoffStepMs,
      backfillEnabled: t.backfillEnabled,
      backfillDelayMs: t.backfillDelayMs,
      backfillMaxCalls: t.backfillMaxCalls,
      pageSize: t.pageSize,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      emits: T
    }), { loadPage: Te, loadNext: pe, refreshCurrentPage: ze, cancelLoad: Ie, maybeBackfillToTarget: ct } = ut, Q = aa({
      useSwipeMode: x,
      masonry: s,
      isLoading: M,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: d
    }), { handleScroll: Fe } = ta({
      container: a,
      masonry: s,
      columns: m,
      containerHeight: P,
      isLoading: M,
      pageSize: t.pageSize,
      refreshLayout: u,
      setItemsRaw: (c) => {
        s.value = c;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    C.handleScroll.value = Fe;
    const vt = la({
      masonry: s,
      useSwipeMode: x,
      refreshLayout: u,
      refreshCurrentPage: ze,
      loadNext: pe,
      maybeBackfillToTarget: ct,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: d
    }), { remove: ce, removeMany: ft, restore: dt, restoreMany: ht, removeAll: mt } = vt;
    function gt(c) {
      E(c, D), !c && h.value && (i.value = h.value.clientWidth, w.value = h.value.clientHeight);
    }
    l({
      isLoading: M,
      refreshLayout: u,
      // Container dimensions (wrapper element)
      containerWidth: i,
      containerHeight: w,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: P,
      // Current page
      currentPage: v,
      // End of list tracking
      hasReachedEnd: I,
      // Load error tracking
      loadError: f,
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
      paginationHistory: d,
      cancelLoad: Ie,
      scrollToTop: pt,
      scrollTo: yt,
      totalItems: Z(() => s.value.length),
      currentBreakpoint: H
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Ae = Q.handleTouchStart, We = Q.handleTouchMove, Re = Q.handleTouchEnd, Oe = Q.handleMouseDown, Ee = Q.handleMouseMove, ke = Q.handleMouseUp, Pe = Q.snapToCurrentItem;
    function pt(c) {
      a.value && a.value.scrollTo({
        top: 0,
        behavior: (c == null ? void 0 : c.behavior) ?? "smooth",
        ...c
      });
    }
    function yt(c) {
      a.value && (a.value.scrollTo({
        top: c.top ?? a.value.scrollTop,
        left: c.left ?? a.value.scrollLeft,
        behavior: c.behavior ?? "auto"
      }), a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight));
    }
    function wt() {
      $(), a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight);
    }
    function xt() {
      Ie(), a.value && a.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), s.value = [], w.value = 0, v.value = t.loadAtPage, d.value = [t.loadAtPage], I.value = !1, f.value = null, J(), we = !1;
    }
    function bt() {
      Ie(), s.value = [], P.value = 0, v.value = null, d.value = [], I.value = !1, f.value = null, M.value = !1, se.value = 0, ve.value = 0, ye.value = !1, J(), W(), a.value && a.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Qe(async () => {
      x.value || await Y();
    }, 200), Ce = Qe(wt, 200);
    function je() {
      Q.handleWindowResize();
    }
    function Ve(c, S, z) {
      v.value = S, d.value = [S], d.value.push(z), I.value = z == null, k(c, "init"), x.value ? (s.value = [...s.value, ...c], se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (u([...s.value, ...c]), a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight), q(() => {
        a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight, D());
      }));
    }
    async function Le(c, S, z) {
      if (!t.skipInitialLoad) {
        Ve(c, S, z);
        return;
      }
      if (v.value = S, d.value = [S], z != null && d.value.push(z), I.value = z === null, f.value = null, k(c, "restoreItems"), x.value)
        s.value = c, se.value === 0 && s.value.length > 0 && (ve.value = 0);
      else if (u(c), a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight), await q(), a.value) {
        A.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight, D(), await q();
        const _ = be(s.value, m.value), F = _.length ? Math.max(..._) : 0, qe = a.value.scrollTop + a.value.clientHeight, Se = typeof t.loadThresholdPx == "number" ? t.loadThresholdPx : 200, Mt = Se >= 0 ? Math.max(0, F - Se) : Math.max(0, F + Se);
        qe >= Mt && !I.value && !M.value && d.value.length > 0 && d.value[d.value.length - 1] != null && await Fe(_, !0);
      }
    }
    te(
      g,
      () => {
        x.value || a.value && (m.value = ue(g.value, i.value), u(s.value));
      },
      { deep: !0 }
    ), te(() => t.layoutMode, () => {
      b.value && b.value.width !== void 0 ? i.value = b.value.width : h.value && (i.value = h.value.clientWidth);
    }), te(a, (c) => {
      c && !x.value ? (c.removeEventListener("scroll", oe), c.addEventListener("scroll", oe, { passive: !0 })) : c && c.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return te(
      () => [t.items, t.skipInitialLoad, t.initialPage, t.initialNextPage],
      ([c, S, z, _]) => {
        if (S && c && c.length > 0 && !we) {
          we = !0;
          const F = z ?? t.loadAtPage;
          Le(c, F, _ !== void 0 ? _ : void 0);
        }
      },
      { immediate: !1 }
    ), te(x, (c, S) => {
      S === void 0 && c === !1 || q(() => {
        c ? (document.addEventListener("mousemove", Ee), document.addEventListener("mouseup", ke), a.value && a.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, s.value.length > 0 && Pe()) : (document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", ke), a.value && h.value && (b.value && b.value.width !== void 0 ? i.value = b.value.width : i.value = h.value.clientWidth, a.value.removeEventListener("scroll", oe), a.value.addEventListener("scroll", oe, { passive: !0 }), s.value.length > 0 && (m.value = ue(g.value, i.value), u(s.value), A.value = a.value.scrollTop, N.value = a.value.clientHeight, D())));
      });
    }, { immediate: !0 }), te(le, (c) => {
      c && (c.addEventListener("touchstart", Ae, { passive: !1 }), c.addEventListener("touchmove", We, { passive: !1 }), c.addEventListener("touchend", Re), c.addEventListener("mousedown", Oe));
    }), te(() => s.value.length, (c, S) => {
      x.value && c > 0 && S === 0 && (se.value = 0, q(() => Pe()));
    }), te(h, (c) => {
      n && (n.disconnect(), n = null), c && typeof ResizeObserver < "u" ? (n = new ResizeObserver((S) => {
        if (!b.value)
          for (const z of S) {
            const _ = z.contentRect.width, F = z.contentRect.height;
            i.value !== _ && (i.value = _), w.value !== F && (w.value = F);
          }
      }), n.observe(c), b.value || (i.value = c.clientWidth, w.value = c.clientHeight)) : c && (b.value || (i.value = c.clientWidth, w.value = c.clientHeight));
    }, { immediate: !0 }), te(i, (c, S) => {
      c !== S && c > 0 && !x.value && a.value && s.value.length > 0 && q(() => {
        m.value = ue(g.value, c), u(s.value), D();
      });
    }), tt(async () => {
      try {
        await q(), h.value && !n && (i.value = h.value.clientWidth, w.value = h.value.clientHeight), x.value || (m.value = ue(g.value, i.value), a.value && (A.value = a.value.scrollTop, N.value = a.value.clientHeight));
        const c = t.loadAtPage;
        if (d.value = [c], !t.skipInitialLoad)
          await Te(d.value[0]);
        else if (t.items && t.items.length > 0) {
          const S = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, z = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Le(t.items, S, z), we = !0;
        }
        x.value ? q(() => Pe()) : D();
      } catch (c) {
        f.value || (console.error("Error during component initialization:", c), f.value = me(c)), M.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", je);
    }), at(() => {
      var c;
      n && (n.disconnect(), n = null), (c = a.value) == null || c.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", je), le.value && (le.value.removeEventListener("touchstart", Ae), le.value.removeEventListener("touchmove", We), le.value.removeEventListener("touchend", Re), le.value.removeEventListener("mousedown", Oe)), document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", ke);
    }), (c, S) => (O(), R("div", {
      ref_key: "wrapper",
      ref: h,
      class: "w-full h-full flex flex-col relative"
    }, [
      x.value ? (O(), R("div", {
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
            height: `${s.value.length * 100}%`
          })
        }, [
          (O(!0), R(Ue, null, _e(s.value, (z, _) => (O(), R("div", {
            key: `${z.page}-${z.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${_ * (100 / s.value.length)}%`,
              height: `${100 / s.value.length}%`
            })
          }, [
            V("div", pa, [
              V("div", ya, [
                X(c.$slots, "default", {
                  item: z,
                  remove: U(ce),
                  index: z.originalIndex ?? s.value.indexOf(z)
                }, () => [
                  He(Me, {
                    item: z,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": _ === U(se),
                    "onPreload:success": S[0] || (S[0] = (F) => T("item:preload:success", F)),
                    "onPreload:error": S[1] || (S[1] = (F) => T("item:preload:error", F)),
                    onMouseEnter: S[2] || (S[2] = (F) => T("item:mouse-enter", F)),
                    onMouseLeave: S[3] || (S[3] = (F) => T("item:mouse-leave", F))
                  }, {
                    header: fe((F) => [
                      X(c.$slots, "item-header", de({ ref_for: !0 }, F), void 0, !0)
                    ]),
                    footer: fe((F) => [
                      X(c.$slots, "item-footer", de({ ref_for: !0 }, F), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        I.value && s.value.length > 0 ? (O(), R("div", wa, [
          X(c.$slots, "end-message", {}, () => [
            S[8] || (S[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", xa, [
          X(c.$slots, "error-message", { error: f.value }, () => [
            V("p", ba, "Failed to load content: " + Be(f.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (O(), R("div", {
        key: 1,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": t.forceMotion }]),
        ref_key: "container",
        ref: a
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
              (O(!0), R(Ue, null, _e(U(G), (z, _) => (O(), R("div", de({
                key: `${z.page}-${z.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, U(Zt)(z, _)), [
                X(c.$slots, "default", {
                  item: z,
                  remove: U(ce),
                  index: z.originalIndex ?? s.value.indexOf(z)
                }, () => [
                  He(Me, {
                    item: z,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": S[4] || (S[4] = (F) => T("item:preload:success", F)),
                    "onPreload:error": S[5] || (S[5] = (F) => T("item:preload:error", F)),
                    onMouseEnter: S[6] || (S[6] = (F) => T("item:mouse-enter", F)),
                    onMouseLeave: S[7] || (S[7] = (F) => T("item:mouse-leave", F))
                  }, {
                    header: fe((F) => [
                      X(c.$slots, "item-header", de({ ref_for: !0 }, F), void 0, !0)
                    ]),
                    footer: fe((F) => [
                      X(c.$slots, "item-footer", de({ ref_for: !0 }, F), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        I.value && s.value.length > 0 ? (O(), R("div", Ma, [
          X(c.$slots, "end-message", {}, () => [
            S[9] || (S[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", Ta, [
          X(c.$slots, "error-message", { error: f.value }, () => [
            V("p", Ia, "Failed to load content: " + Be(f.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2))
    ], 512));
  }
}), ka = (e, l) => {
  const r = e.__vccOpts || e;
  for (const [t, y] of l)
    r[t] = y;
  return r;
}, Ze = /* @__PURE__ */ ka(Ea, [["__scopeId", "data-v-2c2a4c76"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Ha as default
};
