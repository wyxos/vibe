import { nextTick as q, ref as N, computed as Z, defineComponent as et, onMounted as tt, onUnmounted as at, watch as te, createElementBlock as C, openBlock as j, createCommentVNode as ae, createElementVNode as V, normalizeStyle as ge, renderSlot as X, normalizeClass as re, withModifiers as Ye, toDisplayString as Be, unref as U, Fragment as Ue, renderList as _e, createVNode as He, withCtx as fe, mergeProps as de, TransitionGroup as Tt } from "vue";
let $e = null;
function It() {
  if ($e != null) return $e;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const r = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), $e = r, r;
}
function Xe(e, o, r, t = {}) {
  const {
    gutterX: y = 0,
    gutterY: g = 0,
    header: h = 0,
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
    placement: M = "masonry"
  } = t;
  let p = 0, T = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(o);
      p = parseFloat(L.paddingLeft) || 0, T = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const s = (w || 0) + p, m = (x || 0) + T, l = o.offsetWidth - o.clientWidth, c = l > 0 ? l + 2 : It() + 2, v = o.offsetWidth - c - s - m, b = y * (r - 1), P = Math.floor((v - b) / r), I = e.map((L) => {
    const E = L.width, R = L.height;
    return Math.round(P * R / E) + i + h;
  });
  if (M === "sequential-balanced") {
    const L = I.length;
    if (L === 0) return [];
    const E = (B, Y, J) => B + (Y > 0 ? g : 0) + J;
    let R = Math.max(...I), S = I.reduce((B, Y) => B + Y, 0) + g * Math.max(0, L - 1);
    const n = (B) => {
      let Y = 1, J = 0, ne = 0;
      for (let K = 0; K < L; K++) {
        const ie = I[K], ee = E(J, ne, ie);
        if (ee <= B)
          J = ee, ne++;
        else if (Y++, J = ie, ne = 1, ie > B || Y > r) return !1;
      }
      return Y <= r;
    };
    for (; R < S; ) {
      const B = Math.floor((R + S) / 2);
      n(B) ? S = B : R = B + 1;
    }
    const d = S, k = new Array(r).fill(0);
    let z = r - 1, F = 0, O = 0;
    for (let B = L - 1; B >= 0; B--) {
      const Y = I[B], J = B < z;
      !(E(F, O, Y) <= d) || J ? (k[z] = B + 1, z--, F = Y, O = 1) : (F = E(F, O, Y), O++);
    }
    k[0] = 0;
    const A = [], G = new Array(r).fill(0);
    for (let B = 0; B < r; B++) {
      const Y = k[B], J = B + 1 < r ? k[B + 1] : L, ne = B * (P + y);
      for (let K = Y; K < J; K++) {
        const ee = {
          ...e[K],
          columnWidth: P,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ee.imageHeight = I[K] - (i + h), ee.columnHeight = I[K], ee.left = ne, ee.top = G[B], G[B] += ee.columnHeight + (K + 1 < J ? g : 0), A.push(ee);
      }
    }
    return A;
  }
  const f = new Array(r).fill(0), $ = [];
  for (let L = 0; L < e.length; L++) {
    const E = e[L], R = {
      ...E,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, S = f.indexOf(Math.min(...f)), n = E.width, d = E.height;
    R.columnWidth = P, R.left = S * (P + y), R.imageHeight = Math.round(P * d / n), R.columnHeight = R.imageHeight + i + h, R.top = f[S], f[S] += R.columnHeight + g, $.push(R);
  }
  return $;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Pt = typeof self == "object" && self && self.Object === Object && self, nt = Et || Pt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, kt = lt.hasOwnProperty, Lt = lt.toString, he = xe ? xe.toStringTag : void 0;
function St(e) {
  var o = kt.call(e, he), r = e[he];
  try {
    e[he] = void 0;
    var t = !0;
  } catch {
  }
  var y = Lt.call(e);
  return t && (o ? e[he] = r : delete e[he]), y;
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
var Ot = /\s/;
function Rt(e) {
  for (var o = e.length; o-- && Ot.test(e.charAt(o)); )
    ;
  return o;
}
var Ct = /^\s+/;
function jt(e) {
  return e && e.slice(0, Rt(e) + 1).replace(Ct, "");
}
function De(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var Je = NaN, Vt = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Yt = /^0o[0-7]+$/i, Ut = parseInt;
function Ke(e) {
  if (typeof e == "number")
    return e;
  if (Wt(e))
    return Je;
  if (De(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = De(o) ? o + "" : o;
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
function Qe(e, o, r) {
  var t, y, g, h, i, w, x = 0, a = !1, M = !1, p = !0;
  if (typeof e != "function")
    throw new TypeError(_t);
  o = Ke(o) || 0, De(r) && (a = !!r.leading, M = "maxWait" in r, g = M ? Xt(Ke(r.maxWait) || 0, o) : g, p = "trailing" in r ? !!r.trailing : p);
  function T(f) {
    var $ = t, L = y;
    return t = y = void 0, x = f, h = e.apply(L, $), h;
  }
  function s(f) {
    return x = f, i = setTimeout(c, o), a ? T(f) : h;
  }
  function m(f) {
    var $ = f - w, L = f - x, E = o - $;
    return M ? Gt(E, g - L) : E;
  }
  function l(f) {
    var $ = f - w, L = f - x;
    return w === void 0 || $ >= o || $ < 0 || M && L >= g;
  }
  function c() {
    var f = Ne();
    if (l(f))
      return v(f);
    i = setTimeout(c, m(f));
  }
  function v(f) {
    return i = void 0, p && t ? T(f) : (t = y = void 0, h);
  }
  function b() {
    i !== void 0 && clearTimeout(i), x = 0, t = w = y = i = void 0;
  }
  function P() {
    return i === void 0 ? h : v(Ne());
  }
  function I() {
    var f = Ne(), $ = l(f);
    if (t = arguments, y = this, w = f, $) {
      if (i === void 0)
        return s(w);
      if (M)
        return clearTimeout(i), i = setTimeout(c, o), T(w);
    }
    return i === void 0 && (i = setTimeout(c, o)), h;
  }
  return I.cancel = b, I.flush = P, I;
}
function ue(e, o) {
  const r = o ?? (typeof window < "u" ? window.innerWidth : 1024), t = e.sizes;
  return r >= 1536 && t["2xl"] ? t["2xl"] : r >= 1280 && t.xl ? t.xl : r >= 1024 && t.lg ? t.lg : r >= 768 && t.md ? t.md : r >= 640 && t.sm ? t.sm : t.base;
}
function Jt(e) {
  const o = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return o >= 1536 ? "2xl" : o >= 1280 ? "xl" : o >= 1024 ? "lg" : o >= 768 ? "md" : o >= 640 ? "sm" : "base";
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
function Zt(e, o = 0) {
  return {
    style: Qt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function be(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const t = Array.from(new Set(e.map((h) => h.left))).sort((h, i) => h - i).slice(0, o), y = /* @__PURE__ */ new Map();
  for (let h = 0; h < t.length; h++) y.set(t[h], h);
  const g = new Array(t.length).fill(0);
  for (const h of e) {
    const i = y.get(h.left);
    i != null && (g[i] = Math.max(g[i], h.top + h.columnHeight));
  }
  for (; g.length < o; ) g.push(0);
  return g;
}
function ea(e, o) {
  let r = 0, t = 0;
  const y = 1e3;
  function g(a, M) {
    var s;
    const p = (s = e.container) == null ? void 0 : s.value;
    if (p) {
      const m = p.scrollTop, l = p.clientHeight;
      r = m - y, t = m + l + y;
    }
    return a + M >= r && a <= t;
  }
  function h(a, M) {
    var v;
    const p = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10), s = parseInt(a.dataset.index || "0", 10), m = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((v = o == null ? void 0 : o.virtualizing) != null && v.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${T}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "", M();
      });
      return;
    }
    if (!g(T, m)) {
      a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${T}px, 0) scale(1)`, a.style.transition = "none", M();
      return;
    }
    const l = Math.min(s * 20, 160), c = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${l}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${p}px, ${T}px, 0) scale(1)`;
      const b = () => {
        c ? a.style.setProperty("--masonry-opacity-delay", c) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", b), M();
      };
      a.addEventListener("transitionend", b);
    });
  }
  function i(a) {
    var T;
    const M = parseInt(a.dataset.left || "0", 10), p = parseInt(a.dataset.top || "0", 10);
    if ((T = o == null ? void 0 : o.virtualizing) != null && T.value) {
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${M}px, ${p}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    a.style.opacity = "0", a.style.transform = `translate3d(${M}px, ${p + 10}px, 0) scale(0.985)`;
  }
  function w(a) {
    var s;
    const M = parseInt(a.dataset.left || "0", 10), p = parseInt(a.dataset.top || "0", 10), T = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if (!((s = o == null ? void 0 : o.virtualizing) != null && s.value)) {
      if (!g(p, T)) {
        a.style.transition = "none";
        return;
      }
      a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${M}px, ${p}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        a.style.transition = "";
      });
    }
  }
  function x(a, M) {
    var I;
    const p = parseInt(a.dataset.left || "0", 10), T = parseInt(a.dataset.top || "0", 10), s = a.offsetHeight || parseInt(getComputedStyle(a).height || "200", 10) || 200;
    if ((I = o == null ? void 0 : o.virtualizing) != null && I.value) {
      M();
      return;
    }
    if (!g(T, s)) {
      a.style.transition = "none", a.style.opacity = "0", M();
      return;
    }
    const m = typeof (o == null ? void 0 : o.leaveDurationMs) == "number" ? o.leaveDurationMs : NaN;
    let l = Number.isFinite(m) && m > 0 ? m : NaN;
    if (!Number.isFinite(l)) {
      const $ = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat($);
      l = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const c = a.style.transitionDuration, v = () => {
      a.removeEventListener("transitionend", b), clearTimeout(P), a.style.transitionDuration = c || "";
    }, b = (f) => {
      (!f || f.target === a) && (v(), M());
    }, P = setTimeout(() => {
      v(), M();
    }, l + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${l}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${p}px, ${T + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", b);
    });
  }
  return {
    onEnter: h,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: x
  };
}
function ta({
  container: e,
  masonry: o,
  columns: r,
  containerHeight: t,
  isLoading: y,
  pageSize: g,
  refreshLayout: h,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: x
}) {
  let a = 0;
  async function M(p, T = !1) {
    if (!e.value) return;
    const s = p ?? be(o.value, r.value), m = s.length ? Math.max(...s) : 0, l = e.value.scrollTop + e.value.clientHeight, c = e.value.scrollTop > a + 1;
    a = e.value.scrollTop;
    const v = typeof x == "number" ? x : 200, b = v >= 0 ? Math.max(0, m - v) : Math.max(0, m + v);
    if (l >= b && (c || T) && !y.value) {
      await w(), await q();
      return;
    }
  }
  return {
    handleScroll: M
  };
}
function aa(e) {
  const { useSwipeMode: o, masonry: r, isLoading: t, loadNext: y, loadPage: g, paginationHistory: h } = e, i = N(0), w = N(0), x = N(!1), a = N(0), M = N(0), p = N(null), T = Z(() => {
    if (!o.value || r.value.length === 0) return null;
    const S = Math.max(0, Math.min(i.value, r.value.length - 1));
    return r.value[S] || null;
  }), s = Z(() => {
    if (!o.value || !T.value) return null;
    const S = i.value + 1;
    return S >= r.value.length ? null : r.value[S] || null;
  }), m = Z(() => {
    if (!o.value || !T.value) return null;
    const S = i.value - 1;
    return S < 0 ? null : r.value[S] || null;
  });
  function l() {
    if (!p.value) return;
    const S = p.value.clientHeight;
    w.value = -i.value * S;
  }
  function c() {
    if (!s.value) {
      y();
      return;
    }
    i.value++, l(), i.value >= r.value.length - 5 && y();
  }
  function v() {
    m.value && (i.value--, l());
  }
  function b(S) {
    o.value && (x.value = !0, a.value = S.touches[0].clientY, M.value = w.value, S.preventDefault());
  }
  function P(S) {
    if (!o.value || !x.value) return;
    const n = S.touches[0].clientY - a.value;
    w.value = M.value + n, S.preventDefault();
  }
  function I(S) {
    if (!o.value || !x.value) return;
    x.value = !1;
    const n = w.value - M.value;
    Math.abs(n) > 100 ? n > 0 && m.value ? v() : n < 0 && s.value ? c() : l() : l(), S.preventDefault();
  }
  function f(S) {
    o.value && (x.value = !0, a.value = S.clientY, M.value = w.value, S.preventDefault());
  }
  function $(S) {
    if (!o.value || !x.value) return;
    const n = S.clientY - a.value;
    w.value = M.value + n, S.preventDefault();
  }
  function L(S) {
    if (!o.value || !x.value) return;
    x.value = !1;
    const n = w.value - M.value;
    Math.abs(n) > 100 ? n > 0 && m.value ? v() : n < 0 && s.value ? c() : l() : l(), S.preventDefault();
  }
  function E() {
    !o.value && i.value > 0 && (i.value = 0, w.value = 0), o.value && r.value.length === 0 && !t.value && g(h.value[0]), o.value && l();
  }
  function R() {
    i.value = 0, w.value = 0, x.value = !1;
  }
  return {
    // State
    currentSwipeIndex: i,
    swipeOffset: w,
    isDragging: x,
    swipeContainer: p,
    // Computed
    currentItem: T,
    nextItem: s,
    previousItem: m,
    // Functions
    handleTouchStart: b,
    handleTouchMove: P,
    handleTouchEnd: I,
    handleMouseDown: f,
    handleMouseMove: $,
    handleMouseUp: L,
    goToNextItem: c,
    goToPreviousItem: v,
    snapToCurrentItem: l,
    handleWindowResize: E,
    reset: R
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function na(e) {
  const {
    getNextPage: o,
    masonry: r,
    isLoading: t,
    hasReachedEnd: y,
    loadError: g,
    currentPage: h,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: x,
    retryInitialDelayMs: a,
    retryBackoffStepMs: M,
    backfillEnabled: p,
    backfillDelayMs: T,
    backfillMaxCalls: s,
    pageSize: m,
    autoRefreshOnEmpty: l,
    emits: c
  } = e, v = N(!1);
  let b = !1;
  function P(n, d) {
    return new Promise((k) => {
      const z = Math.max(0, n | 0), F = Date.now();
      d(z, z);
      const O = setInterval(() => {
        if (v.value) {
          clearInterval(O), k();
          return;
        }
        const A = Date.now() - F, G = Math.max(0, z - A);
        d(G, z), G <= 0 && (clearInterval(O), k());
      }, 100);
    });
  }
  async function I(n) {
    let d = 0;
    const k = x;
    let z = a;
    for (; ; )
      try {
        const F = await n();
        return d > 0 && c("retry:stop", { attempt: d, success: !0 }), F;
      } catch (F) {
        if (d++, d > k)
          throw c("retry:stop", { attempt: d - 1, success: !1 }), F;
        c("retry:start", { attempt: d, max: k, totalMs: z }), await P(z, (O, A) => {
          c("retry:tick", { attempt: d, remainingMs: O, totalMs: A });
        }), z += M;
      }
  }
  async function f(n) {
    try {
      const d = await I(() => o(n));
      return w([...r.value, ...d.items]), d;
    } catch (d) {
      throw d;
    }
  }
  async function $(n, d = !1) {
    if (!d && !p || b || v.value || y.value) return;
    const k = (n || 0) + (m || 0);
    if (!m || m <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      y.value = !0;
      return;
    }
    if (!(r.value.length >= k)) {
      b = !0, t.value = !0;
      try {
        let F = 0;
        for (c("backfill:start", { target: k, fetched: r.value.length, calls: F }); r.value.length < k && F < s && i.value[i.value.length - 1] != null && !v.value && !y.value && b && (await P(T, (A, G) => {
          c("backfill:tick", {
            fetched: r.value.length,
            target: k,
            calls: F,
            remainingMs: A,
            totalMs: G
          });
        }), !(v.value || !b)); ) {
          const O = i.value[i.value.length - 1];
          if (O == null) {
            y.value = !0;
            break;
          }
          try {
            if (v.value || !b) break;
            const A = await f(O);
            if (v.value || !b) break;
            g.value = null, i.value.push(A.nextPage), A.nextPage == null && (y.value = !0);
          } catch (A) {
            if (v.value || !b) break;
            g.value = me(A);
          }
          F++;
        }
        c("backfill:stop", { fetched: r.value.length, calls: F });
      } finally {
        b = !1, t.value = !1;
      }
    }
  }
  async function L(n) {
    if (!t.value) {
      v.value = !1, t.value = !0, y.value = !1, g.value = null;
      try {
        const d = r.value.length;
        if (v.value) return;
        const k = await f(n);
        return v.value ? void 0 : (g.value = null, h.value = n, i.value.push(k.nextPage), k.nextPage == null && (y.value = !0), await $(d), k);
      } catch (d) {
        throw g.value = me(d), d;
      } finally {
        t.value = !1;
      }
    }
  }
  async function E() {
    if (!t.value && !y.value) {
      v.value = !1, t.value = !0, g.value = null;
      try {
        const n = r.value.length;
        if (v.value) return;
        const d = i.value[i.value.length - 1];
        if (d == null) {
          y.value = !0, t.value = !1;
          return;
        }
        const k = await f(d);
        return v.value ? void 0 : (g.value = null, h.value = d, i.value.push(k.nextPage), k.nextPage == null && (y.value = !0), await $(n), k);
      } catch (n) {
        throw g.value = me(n), n;
      } finally {
        t.value = !1;
      }
    }
  }
  async function R() {
    if (!t.value) {
      v.value = !1, t.value = !0;
      try {
        const n = h.value;
        if (n == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", h.value, "paginationHistory:", i.value);
          return;
        }
        r.value = [], y.value = !1, g.value = null, i.value = [n];
        const d = await f(n);
        if (v.value) return;
        g.value = null, h.value = n, i.value.push(d.nextPage), d.nextPage == null && (y.value = !0);
        const k = r.value.length;
        return await $(k), d;
      } catch (n) {
        throw g.value = me(n), n;
      } finally {
        t.value = !1;
      }
    }
  }
  function S() {
    const n = b;
    v.value = !0, t.value = !1, b = !1, n && c("backfill:stop", { fetched: r.value.length, calls: 0, cancelled: !0 });
  }
  return {
    loadPage: L,
    loadNext: E,
    refreshCurrentPage: R,
    cancelLoad: S,
    maybeBackfillToTarget: $,
    getContent: f
  };
}
function la(e) {
  const {
    masonry: o,
    useSwipeMode: r,
    refreshLayout: t,
    refreshCurrentPage: y,
    loadNext: g,
    maybeBackfillToTarget: h,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  async function x(s) {
    const m = o.value.filter((l) => l.id !== s.id);
    if (o.value = m, await q(), m.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await g(), await h(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((l) => requestAnimationFrame(() => l())), requestAnimationFrame(() => {
      t(m);
    });
  }
  async function a(s) {
    if (!s || s.length === 0) return;
    const m = new Set(s.map((c) => c.id)), l = o.value.filter((c) => !m.has(c.id));
    if (o.value = l, await q(), l.length === 0 && w.value.length > 0) {
      if (i)
        await y();
      else
        try {
          await g(), await h(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
      t(l);
    });
  }
  async function M(s, m) {
    if (!s) return;
    const l = o.value;
    if (l.findIndex((P) => P.id === s.id) !== -1) return;
    const v = [...l], b = Math.min(m, v.length);
    v.splice(b, 0, s), o.value = v, await q(), r.value || (await new Promise((P) => requestAnimationFrame(() => P())), requestAnimationFrame(() => {
      t(v);
    }));
  }
  async function p(s, m) {
    var L;
    if (!s || s.length === 0) return;
    if (!m || m.length !== s.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const l = o.value, c = new Set(l.map((E) => E.id)), v = [];
    for (let E = 0; E < s.length; E++)
      c.has((L = s[E]) == null ? void 0 : L.id) || v.push({ item: s[E], index: m[E] });
    if (v.length === 0) return;
    const b = /* @__PURE__ */ new Map();
    for (const { item: E, index: R } of v)
      b.set(R, E);
    const P = v.length > 0 ? Math.max(...v.map(({ index: E }) => E)) : -1, I = Math.max(l.length - 1, P), f = [];
    let $ = 0;
    for (let E = 0; E <= I; E++)
      b.has(E) ? f.push(b.get(E)) : $ < l.length && (f.push(l[$]), $++);
    for (; $ < l.length; )
      f.push(l[$]), $++;
    o.value = f, await q(), r.value || (await new Promise((E) => requestAnimationFrame(() => E())), requestAnimationFrame(() => {
      t(f);
    }));
  }
  async function T() {
    o.value = [];
  }
  return {
    remove: x,
    removeMany: a,
    restore: M,
    restoreMany: p,
    removeAll: T
  };
}
function oa(e) {
  const {
    masonry: o,
    useSwipeMode: r,
    container: t,
    columns: y,
    containerWidth: g,
    masonryContentHeight: h,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: x
  } = e;
  let a = [];
  function M(m) {
    const l = Kt(m);
    let c = 0;
    if (t.value) {
      const { scrollTop: v, clientHeight: b } = t.value;
      c = v + b + 100;
    }
    h.value = Math.max(l, c);
  }
  function p(m) {
    var b, P;
    if (r.value) {
      o.value = m;
      return;
    }
    if (!t.value) return;
    if (x(m, "refreshLayout"), m.length > 1e3 && a.length > m.length && a.length - m.length < 100) {
      let I = !0;
      for (let f = 0; f < m.length; f++)
        if (((b = m[f]) == null ? void 0 : b.id) !== ((P = a[f]) == null ? void 0 : P.id)) {
          I = !1;
          break;
        }
      if (I) {
        const f = m.map(($, L) => ({
          ...a[L],
          originalIndex: L
        }));
        M(f), o.value = f, a = f;
        return;
      }
    }
    const c = m.map((I, f) => ({
      ...I,
      originalIndex: f
    })), v = t.value;
    if (w.value && w.value.width !== void 0) {
      const I = v.style.width, f = v.style.boxSizing;
      v.style.boxSizing = "border-box", v.style.width = `${w.value.width}px`, v.offsetWidth;
      const $ = Xe(c, v, y.value, i.value);
      v.style.width = I, v.style.boxSizing = f, M($), o.value = $, a = $;
    } else {
      const I = Xe(c, v, y.value, i.value);
      M(I), o.value = I, a = I;
    }
  }
  function T(m, l) {
    w.value = m, m && (m.width !== void 0 && (g.value = m.width), !r.value && t.value && o.value.length > 0 && q(() => {
      y.value = ue(i.value, g.value), p(o.value), l && l();
    }));
  }
  function s() {
    y.value = ue(i.value, g.value), p(o.value);
  }
  return {
    refreshLayout: p,
    setFixedDimensions: T,
    onResize: s,
    calculateHeight: M
  };
}
function ra(e) {
  const {
    masonry: o,
    container: r,
    columns: t,
    virtualBufferPx: y,
    loadThresholdPx: g
  } = e, h = N(e.handleScroll), i = N(0), w = N(0), x = y, a = N(!1), M = N({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), p = Z(() => {
    const l = i.value - x, c = i.value + w.value + x, v = o.value;
    return !v || v.length === 0 ? [] : v.filter((P) => {
      if (typeof P.top != "number" || typeof P.columnHeight != "number")
        return !0;
      const I = P.top;
      return P.top + P.columnHeight >= l && I <= c;
    });
  });
  function T(l) {
    if (!r.value) return;
    const { scrollTop: c, clientHeight: v } = r.value, b = c + v, P = l ?? be(o.value, t.value), I = P.length ? Math.max(...P) : 0, f = typeof g == "number" ? g : 200, $ = f >= 0 ? Math.max(0, I - f) : Math.max(0, I + f), L = Math.max(0, $ - b), E = L <= 100;
    M.value = {
      distanceToTrigger: Math.round(L),
      isNearTrigger: E
    };
  }
  async function s() {
    if (r.value) {
      const c = r.value.scrollTop, v = r.value.clientHeight || window.innerHeight, b = v > 0 ? v : window.innerHeight;
      i.value = c, w.value = b;
    }
    a.value = !0, await q(), await new Promise((c) => requestAnimationFrame(() => c())), a.value = !1;
    const l = be(o.value, t.value);
    h.value(l), T(l);
  }
  function m() {
    i.value = 0, w.value = 0, a.value = !1, M.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: w,
    virtualizing: a,
    scrollProgress: M,
    visibleMasonry: p,
    updateScrollProgress: T,
    updateViewport: s,
    reset: m,
    handleScroll: h
  };
}
function ia(e) {
  const { masonry: o } = e, r = N(/* @__PURE__ */ new Set());
  function t(h) {
    return typeof h == "number" && h > 0 && Number.isFinite(h);
  }
  function y(h, i) {
    try {
      if (!Array.isArray(h) || h.length === 0) return;
      const w = h.filter((a) => !t(a == null ? void 0 : a.width) || !t(a == null ? void 0 : a.height));
      if (w.length === 0) return;
      const x = [];
      for (const a of w) {
        const M = (a == null ? void 0 : a.id) ?? `idx:${o.value.indexOf(a)}`;
        r.value.has(M) || (r.value.add(M), x.push(M));
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
    inSwipeMode: { type: Boolean, default: !1 },
    preloadThreshold: { default: 1 }
  },
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave", "in-view"],
  setup(e, { emit: o }) {
    const r = e, t = o, y = N(!1), g = N(!1), h = N(null), i = N(!1), w = N(!1), x = N(null), a = N(!1), M = N(!1), p = N(!1), T = N(!1), s = N(null), m = N(null);
    let l = null;
    const c = Z(() => {
      var n;
      return r.type ?? ((n = r.item) == null ? void 0 : n.type) ?? "image";
    }), v = Z(() => {
      var n;
      return r.notFound ?? ((n = r.item) == null ? void 0 : n.notFound) ?? !1;
    }), b = Z(() => !!r.inSwipeMode);
    function P(n) {
      t("mouse-enter", { item: r.item, type: n });
    }
    function I(n) {
      t("mouse-leave", { item: r.item, type: n });
    }
    function f(n) {
      if (b.value) return;
      const d = n.target;
      d && (d.paused ? d.play() : d.pause());
    }
    function $(n) {
      const d = n.target;
      d && (b.value || d.play(), P("video"));
    }
    function L(n) {
      const d = n.target;
      d && (b.value || d.pause(), I("video"));
    }
    function E(n) {
      return new Promise((d, k) => {
        if (!n) {
          const A = new Error("No image source provided");
          t("preload:error", { item: r.item, type: "image", src: n, error: A }), k(A);
          return;
        }
        const z = new Image(), F = Date.now(), O = 300;
        z.onload = () => {
          const A = Date.now() - F, G = Math.max(0, O - A);
          setTimeout(async () => {
            y.value = !0, g.value = !1, p.value = !1, await q(), await new Promise((B) => setTimeout(B, 100)), T.value = !0, t("preload:success", { item: r.item, type: "image", src: n }), d();
          }, G);
        }, z.onerror = () => {
          g.value = !0, y.value = !1, p.value = !1;
          const A = new Error("Failed to load image");
          t("preload:error", { item: r.item, type: "image", src: n, error: A }), k(A);
        }, z.src = n;
      });
    }
    function R(n) {
      return new Promise((d, k) => {
        if (!n) {
          const A = new Error("No video source provided");
          t("preload:error", { item: r.item, type: "video", src: n, error: A }), k(A);
          return;
        }
        const z = document.createElement("video"), F = Date.now(), O = 300;
        z.preload = "metadata", z.muted = !0, z.onloadedmetadata = () => {
          const A = Date.now() - F, G = Math.max(0, O - A);
          setTimeout(async () => {
            i.value = !0, w.value = !1, p.value = !1, await q(), await new Promise((B) => setTimeout(B, 100)), T.value = !0, t("preload:success", { item: r.item, type: "video", src: n }), d();
          }, G);
        }, z.onerror = () => {
          w.value = !0, i.value = !1, p.value = !1;
          const A = new Error("Failed to load video");
          t("preload:error", { item: r.item, type: "video", src: n, error: A }), k(A);
        }, z.src = n;
      });
    }
    async function S() {
      var d;
      if (!a.value || p.value || v.value || c.value === "video" && i.value || c.value === "image" && y.value)
        return;
      const n = (d = r.item) == null ? void 0 : d.src;
      if (n)
        if (p.value = !0, T.value = !1, c.value === "video") {
          x.value = n, i.value = !1, w.value = !1;
          try {
            await R(n);
          } catch {
          }
        } else {
          h.value = n, y.value = !1, g.value = !1;
          try {
            await E(n);
          } catch {
          }
        }
    }
    return tt(() => {
      if (!s.value) return;
      const n = [r.preloadThreshold, 1].filter((d, k, z) => z.indexOf(d) === k).sort((d, k) => d - k);
      l = new IntersectionObserver(
        (d) => {
          d.forEach((k) => {
            const z = k.intersectionRatio, F = z >= 1, O = z >= r.preloadThreshold;
            F && !M.value && (M.value = !0, t("in-view", { item: r.item, type: c.value })), O && !a.value ? (a.value = !0, S()) : k.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: n
        }
      ), l.observe(s.value);
    }), at(() => {
      l && (l.disconnect(), l = null);
    }), te(
      () => {
        var n;
        return (n = r.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || v.value)) {
          if (c.value === "video") {
            if (n !== x.value && (i.value = !1, w.value = !1, x.value = n, a.value)) {
              p.value = !0;
              try {
                await R(n);
              } catch {
              }
            }
          } else if (n !== h.value && (y.value = !1, g.value = !1, h.value = n, a.value)) {
            p.value = !0;
            try {
              await E(n);
            } catch {
            }
          }
        }
      }
    ), te(
      () => r.isActive,
      (n) => {
        !b.value || !m.value || (n ? m.value.play() : m.value.pause());
      }
    ), (n, d) => (j(), C("div", {
      ref_key: "containerRef",
      ref: s,
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
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: v.value,
          isLoading: p.value,
          mediaType: c.value
        })
      ], 4)) : ae("", !0),
      V("div", sa, [
        X(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: y.value,
          imageError: g.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: v.value,
          isLoading: p.value,
          mediaType: c.value,
          imageSrc: h.value,
          videoSrc: x.value,
          showMedia: T.value
        }, () => [
          V("div", ua, [
            v.value ? (j(), C("div", ca, d[3] || (d[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), C("div", va, [
              c.value === "image" && h.value ? (j(), C("img", {
                key: 0,
                src: h.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  y.value && T.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: d[0] || (d[0] = (k) => P("image")),
                onMouseleave: d[1] || (d[1] = (k) => I("image"))
              }, null, 42, fa)) : ae("", !0),
              c.value === "video" && x.value ? (j(), C("video", {
                key: 1,
                ref_key: "videoEl",
                ref: m,
                src: x.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  i.value && T.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: b.value && r.isActive,
                controls: b.value,
                onClick: Ye(f, ["stop"]),
                onTouchend: Ye(f, ["stop", "prevent"]),
                onMouseenter: $,
                onMouseleave: L,
                onError: d[2] || (d[2] = (k) => w.value = !0)
              }, null, 42, da)) : ae("", !0),
              !y.value && !i.value && !g.value && !w.value ? (j(), C("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  T.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ha, [
                  X(n.$slots, "placeholder-icon", { mediaType: c.value }, () => [
                    V("i", {
                      class: re(c.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              p.value ? (j(), C("div", ma, d[4] || (d[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              c.value === "image" && g.value || c.value === "video" && w.value ? (j(), C("div", ga, [
                V("i", {
                  class: re(c.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Be(c.value), 1)
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
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: v.value,
          isLoading: p.value,
          mediaType: c.value
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
  setup(e, { expose: o, emit: r }) {
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
      var u;
      return {
        ...y,
        ...t.layout,
        sizes: {
          ...y.sizes,
          ...((u = t.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), h = N(null), i = N(typeof window < "u" ? window.innerWidth : 1024), w = N(typeof window < "u" ? window.innerHeight : 768), x = N(null);
    let a = null;
    function M(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const p = Z(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const u = typeof t.mobileBreakpoint == "string" ? M(t.mobileBreakpoint) : t.mobileBreakpoint;
      return i.value < u;
    }), T = r, s = Z({
      get: () => t.items,
      set: (u) => T("update:items", u)
    }), m = N(7), l = N(null), c = N([]), v = N(null), b = N(!1), P = N(0), I = N(!1), f = N(null), $ = Z(() => Jt(i.value)), L = ia({
      masonry: s
    }), { checkItemDimensions: E, reset: R } = L, S = oa({
      masonry: s,
      useSwipeMode: p,
      container: l,
      columns: m,
      containerWidth: i,
      masonryContentHeight: P,
      layout: g,
      fixedDimensions: x,
      checkItemDimensions: E
    }), { refreshLayout: n, setFixedDimensions: d, onResize: k } = S, z = ra({
      masonry: s,
      container: l,
      columns: m,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: F, viewportHeight: O, virtualizing: A, visibleMasonry: G, updateScrollProgress: B, updateViewport: Y, reset: J } = z, { onEnter: ne, onBeforeEnter: K, onBeforeLeave: ie, onLeave: ee } = ea(
      { container: l },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: A }
    ), ot = ne, rt = K, it = ie, st = ee, ut = na({
      getNextPage: t.getNextPage,
      masonry: s,
      isLoading: b,
      hasReachedEnd: I,
      loadError: f,
      currentPage: v,
      paginationHistory: c,
      refreshLayout: n,
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
      useSwipeMode: p,
      masonry: s,
      isLoading: b,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: c
    }), { handleScroll: Fe } = ta({
      container: l,
      masonry: s,
      columns: m,
      containerHeight: P,
      isLoading: b,
      pageSize: t.pageSize,
      refreshLayout: n,
      setItemsRaw: (u) => {
        s.value = u;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    z.handleScroll.value = Fe;
    const vt = la({
      masonry: s,
      useSwipeMode: p,
      refreshLayout: n,
      refreshCurrentPage: ze,
      loadNext: pe,
      maybeBackfillToTarget: ct,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: c
    }), { remove: ce, removeMany: ft, restore: dt, restoreMany: ht, removeAll: mt } = vt;
    function gt(u) {
      d(u, B), !u && h.value && (i.value = h.value.clientWidth, w.value = h.value.clientHeight);
    }
    o({
      isLoading: b,
      refreshLayout: n,
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
      paginationHistory: c,
      cancelLoad: Ie,
      scrollToTop: pt,
      scrollTo: yt,
      totalItems: Z(() => s.value.length),
      currentBreakpoint: $
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Ae = Q.handleTouchStart, We = Q.handleTouchMove, Oe = Q.handleTouchEnd, Re = Q.handleMouseDown, Ee = Q.handleMouseMove, Pe = Q.handleMouseUp, ke = Q.snapToCurrentItem;
    function pt(u) {
      l.value && l.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function yt(u) {
      l.value && (l.value.scrollTo({
        top: u.top ?? l.value.scrollTop,
        left: u.left ?? l.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight || window.innerHeight));
    }
    function wt() {
      k(), l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight);
    }
    function xt() {
      Ie(), l.value && l.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), s.value = [], w.value = 0, v.value = t.loadAtPage, c.value = [t.loadAtPage], I.value = !1, f.value = null, J(), we = !1;
    }
    function bt() {
      Ie(), s.value = [], P.value = 0, v.value = null, c.value = [], I.value = !1, f.value = null, b.value = !1, se.value = 0, ve.value = 0, ye.value = !1, J(), R(), l.value && l.value.scrollTo({
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
    function Ve(u, H, D) {
      v.value = H, c.value = [H], c.value.push(D), I.value = D == null, E(u, "init"), p.value ? (s.value = [...s.value, ...u], se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (n([...s.value, ...u]), l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight || window.innerHeight), q(() => {
        l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight || window.innerHeight, B());
      }));
    }
    async function Le(u, H, D) {
      if (!t.skipInitialLoad) {
        Ve(u, H, D);
        return;
      }
      if (v.value = H, c.value = [H], D != null && c.value.push(D), I.value = D === null, f.value = null, E(u, "restoreItems"), p.value)
        s.value = u, se.value === 0 && s.value.length > 0 && (ve.value = 0);
      else if (n(u), l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight || window.innerHeight), await q(), l.value) {
        F.value = l.value.scrollTop, O.value = l.value.clientHeight || window.innerHeight, B(), await q();
        const _ = be(s.value, m.value), W = _.length ? Math.max(..._) : 0, qe = l.value.scrollTop + l.value.clientHeight, Se = typeof t.loadThresholdPx == "number" ? t.loadThresholdPx : 200, Mt = Se >= 0 ? Math.max(0, W - Se) : Math.max(0, W + Se);
        qe >= Mt && !I.value && !b.value && c.value.length > 0 && c.value[c.value.length - 1] != null && await Fe(_, !0);
      }
    }
    te(
      g,
      () => {
        p.value || l.value && (m.value = ue(g.value, i.value), n(s.value));
      },
      { deep: !0 }
    ), te(() => t.layoutMode, () => {
      x.value && x.value.width !== void 0 ? i.value = x.value.width : h.value && (i.value = h.value.clientWidth);
    }), te(l, (u) => {
      u && !p.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return te(
      () => [t.items, t.skipInitialLoad, t.initialPage, t.initialNextPage],
      ([u, H, D, _]) => {
        if (H && u && u.length > 0 && !we) {
          we = !0;
          const W = D ?? t.loadAtPage;
          Le(u, W, _ !== void 0 ? _ : void 0);
        }
      },
      { immediate: !1 }
    ), te(p, (u, H) => {
      H === void 0 && u === !1 || q(() => {
        u ? (document.addEventListener("mousemove", Ee), document.addEventListener("mouseup", Pe), l.value && l.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, s.value.length > 0 && ke()) : (document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Pe), l.value && h.value && (x.value && x.value.width !== void 0 ? i.value = x.value.width : i.value = h.value.clientWidth, l.value.removeEventListener("scroll", oe), l.value.addEventListener("scroll", oe, { passive: !0 }), s.value.length > 0 && (m.value = ue(g.value, i.value), n(s.value), F.value = l.value.scrollTop, O.value = l.value.clientHeight, B())));
      });
    }, { immediate: !0 }), te(le, (u) => {
      u && (u.addEventListener("touchstart", Ae, { passive: !1 }), u.addEventListener("touchmove", We, { passive: !1 }), u.addEventListener("touchend", Oe), u.addEventListener("mousedown", Re));
    }), te(() => s.value.length, (u, H) => {
      p.value && u > 0 && H === 0 && (se.value = 0, q(() => ke()));
    }), te(h, (u) => {
      a && (a.disconnect(), a = null), u && typeof ResizeObserver < "u" ? (a = new ResizeObserver((H) => {
        if (!x.value)
          for (const D of H) {
            const _ = D.contentRect.width, W = D.contentRect.height;
            i.value !== _ && (i.value = _), w.value !== W && (w.value = W);
          }
      }), a.observe(u), x.value || (i.value = u.clientWidth, w.value = u.clientHeight)) : u && (x.value || (i.value = u.clientWidth, w.value = u.clientHeight));
    }, { immediate: !0 }), te(i, (u, H) => {
      u !== H && u > 0 && !p.value && l.value && s.value.length > 0 && q(() => {
        m.value = ue(g.value, u), n(s.value), B();
      });
    }), tt(async () => {
      try {
        await q(), h.value && !a && (i.value = h.value.clientWidth, w.value = h.value.clientHeight), p.value || (m.value = ue(g.value, i.value), l.value && (F.value = l.value.scrollTop, O.value = l.value.clientHeight));
        const u = t.loadAtPage;
        if (c.value = [u], !t.skipInitialLoad)
          await Te(c.value[0]);
        else if (t.items && t.items.length > 0) {
          const H = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, D = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Le(t.items, H, D), we = !0;
        }
        p.value ? q(() => ke()) : B();
      } catch (u) {
        f.value || (console.error("Error during component initialization:", u), f.value = me(u)), b.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", je);
    }), at(() => {
      var u;
      a && (a.disconnect(), a = null), (u = l.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", je), le.value && (le.value.removeEventListener("touchstart", Ae), le.value.removeEventListener("touchmove", We), le.value.removeEventListener("touchend", Oe), le.value.removeEventListener("mousedown", Re)), document.removeEventListener("mousemove", Ee), document.removeEventListener("mouseup", Pe);
    }), (u, H) => (j(), C("div", {
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
            height: `${s.value.length * 100}%`
          })
        }, [
          (j(!0), C(Ue, null, _e(s.value, (D, _) => (j(), C("div", {
            key: `${D.page}-${D.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${_ * (100 / s.value.length)}%`,
              height: `${100 / s.value.length}%`
            })
          }, [
            V("div", pa, [
              V("div", ya, [
                X(u.$slots, "default", {
                  item: D,
                  remove: U(ce),
                  index: D.originalIndex ?? s.value.indexOf(D)
                }, () => [
                  He(Me, {
                    item: D,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": _ === U(se),
                    "onPreload:success": H[0] || (H[0] = (W) => T("item:preload:success", W)),
                    "onPreload:error": H[1] || (H[1] = (W) => T("item:preload:error", W)),
                    onMouseEnter: H[2] || (H[2] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: H[3] || (H[3] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      X(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      X(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        I.value && s.value.length > 0 ? (j(), C("div", wa, [
          X(u.$slots, "end-message", {}, () => [
            H[8] || (H[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        f.value && s.value.length > 0 ? (j(), C("div", xa, [
          X(u.$slots, "error-message", { error: f.value }, () => [
            V("p", ba, "Failed to load content: " + Be(f.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (j(), C("div", {
        key: 1,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": t.forceMotion }]),
        ref_key: "container",
        ref: l
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
                X(u.$slots, "default", {
                  item: D,
                  remove: U(ce),
                  index: D.originalIndex ?? s.value.indexOf(D)
                }, () => [
                  He(Me, {
                    item: D,
                    remove: U(ce),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": H[4] || (H[4] = (W) => T("item:preload:success", W)),
                    "onPreload:error": H[5] || (H[5] = (W) => T("item:preload:error", W)),
                    onMouseEnter: H[6] || (H[6] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: H[7] || (H[7] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      X(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      X(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        I.value && s.value.length > 0 ? (j(), C("div", Ma, [
          X(u.$slots, "end-message", {}, () => [
            H[9] || (H[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        f.value && s.value.length > 0 ? (j(), C("div", Ta, [
          X(u.$slots, "error-message", { error: f.value }, () => [
            V("p", Ia, "Failed to load content: " + Be(f.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2))
    ], 512));
  }
}), Pa = (e, o) => {
  const r = e.__vccOpts || e;
  for (const [t, y] of o)
    r[t] = y;
  return r;
}, Ze = /* @__PURE__ */ Pa(Ea, [["__scopeId", "data-v-2c2a4c76"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Ha as default
};
