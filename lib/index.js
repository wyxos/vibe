import { nextTick as _, ref as D, computed as Z, defineComponent as et, onMounted as tt, onUnmounted as at, watch as te, createElementBlock as q, openBlock as Y, createCommentVNode as ae, createElementVNode as U, normalizeStyle as ge, renderSlot as J, normalizeClass as ie, withModifiers as Ye, toDisplayString as Ne, unref as X, Fragment as Ue, renderList as _e, createVNode as He, withCtx as fe, mergeProps as de, TransitionGroup as Tt } from "vue";
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
function Xe(e, l, o, a = {}) {
  const {
    gutterX: m = 0,
    gutterY: h = 0,
    header: c = 0,
    footer: i = 0,
    paddingLeft: x = 0,
    paddingRight: M = 0,
    sizes: n = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: b = "masonry"
  } = a;
  let P = 0, T = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const E = window.getComputedStyle(l);
      P = parseFloat(E.paddingLeft) || 0, T = parseFloat(E.paddingRight) || 0;
    }
  } catch {
  }
  const f = (x || 0) + P, y = (M || 0) + T, r = l.offsetWidth - l.clientWidth, g = r > 0 ? r + 2 : It() + 2, s = l.offsetWidth - g - f - y, d = m * (o - 1), L = Math.floor((s - d) / o), p = e.map((E) => {
    const O = E.width, j = E.height;
    return Math.round(L * j / O) + i + c;
  });
  if (b === "sequential-balanced") {
    const E = p.length;
    if (E === 0) return [];
    const O = (I, N, A) => I + (N > 0 ? h : 0) + A;
    let j = Math.max(...p), k = p.reduce((I, N) => I + N, 0) + h * Math.max(0, E - 1);
    const z = (I) => {
      let N = 1, A = 0, ne = 0;
      for (let K = 0; K < E; K++) {
        const re = p[K], ee = O(A, ne, re);
        if (ee <= I)
          A = ee, ne++;
        else if (N++, A = re, ne = 1, re > I || N > o) return !1;
      }
      return N <= o;
    };
    for (; j < k; ) {
      const I = Math.floor((j + k) / 2);
      z(I) ? k = I : j = I + 1;
    }
    const F = k, t = new Array(o).fill(0);
    let w = o - 1, S = 0, H = 0;
    for (let I = E - 1; I >= 0; I--) {
      const N = p[I], A = I < w;
      !(O(S, H, N) <= F) || A ? (t[w] = I + 1, w--, S = N, H = 1) : (S = O(S, H, N), H++);
    }
    t[0] = 0;
    const V = [], C = new Array(o).fill(0);
    for (let I = 0; I < o; I++) {
      const N = t[I], A = I + 1 < o ? t[I + 1] : E, ne = I * (L + m);
      for (let K = N; K < A; K++) {
        const ee = {
          ...e[K],
          columnWidth: L,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ee.imageHeight = p[K] - (i + c), ee.columnHeight = p[K], ee.left = ne, ee.top = C[I], C[I] += ee.columnHeight + (K + 1 < A ? h : 0), V.push(ee);
      }
    }
    return V;
  }
  const v = new Array(o).fill(0), $ = [];
  for (let E = 0; E < e.length; E++) {
    const O = e[E], j = {
      ...O,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, k = v.indexOf(Math.min(...v)), z = O.width, F = O.height;
    j.columnWidth = L, j.left = k * (L + m), j.imageHeight = Math.round(L * F / z), j.columnHeight = j.imageHeight + i + c, j.top = v[k], v[k] += j.columnHeight + h, $.push(j);
  }
  return $;
}
var Pt = typeof global == "object" && global && global.Object === Object && global, Lt = typeof self == "object" && self && self.Object === Object && self, nt = Pt || Lt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, Et = lt.hasOwnProperty, kt = lt.toString, he = xe ? xe.toStringTag : void 0;
function St(e) {
  var l = Et.call(e, he), o = e[he];
  try {
    e[he] = void 0;
    var a = !0;
  } catch {
  }
  var m = kt.call(e);
  return a && (l ? e[he] = o : delete e[he]), m;
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
  var a, m, h, c, i, x, M = 0, n = !1, b = !1, P = !0;
  if (typeof e != "function")
    throw new TypeError(_t);
  l = Ke(l) || 0, Be(o) && (n = !!o.leading, b = "maxWait" in o, h = b ? Xt(Ke(o.maxWait) || 0, l) : h, P = "trailing" in o ? !!o.trailing : P);
  function T(v) {
    var $ = a, E = m;
    return a = m = void 0, M = v, c = e.apply(E, $), c;
  }
  function f(v) {
    return M = v, i = setTimeout(g, l), n ? T(v) : c;
  }
  function y(v) {
    var $ = v - x, E = v - M, O = l - $;
    return b ? Gt(O, h - E) : O;
  }
  function r(v) {
    var $ = v - x, E = v - M;
    return x === void 0 || $ >= l || $ < 0 || b && E >= h;
  }
  function g() {
    var v = Fe();
    if (r(v))
      return s(v);
    i = setTimeout(g, y(v));
  }
  function s(v) {
    return i = void 0, P && a ? T(v) : (a = m = void 0, c);
  }
  function d() {
    i !== void 0 && clearTimeout(i), M = 0, a = x = m = i = void 0;
  }
  function L() {
    return i === void 0 ? c : s(Fe());
  }
  function p() {
    var v = Fe(), $ = r(v);
    if (a = arguments, m = this, x = v, $) {
      if (i === void 0)
        return f(x);
      if (b)
        return clearTimeout(i), i = setTimeout(g, l), T(x);
    }
    return i === void 0 && (i = setTimeout(g, l)), c;
  }
  return p.cancel = d, p.flush = L, p;
}
function ue(e, l) {
  const o = l ?? (typeof window < "u" ? window.innerWidth : 1024), a = e.sizes;
  return o >= 1536 && a["2xl"] ? a["2xl"] : o >= 1280 && a.xl ? a.xl : o >= 1024 && a.lg ? a.lg : o >= 768 && a.md ? a.md : o >= 640 && a.sm ? a.sm : a.base;
}
function Jt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Kt(e) {
  return e.reduce((o, a) => Math.max(o, a.top + a.columnHeight), 0) + 500;
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
  const a = Array.from(new Set(e.map((c) => c.left))).sort((c, i) => c - i).slice(0, l), m = /* @__PURE__ */ new Map();
  for (let c = 0; c < a.length; c++) m.set(a[c], c);
  const h = new Array(a.length).fill(0);
  for (const c of e) {
    const i = m.get(c.left);
    i != null && (h[i] = Math.max(h[i], c.top + c.columnHeight));
  }
  for (; h.length < l; ) h.push(0);
  return h;
}
function ea(e, l) {
  let o = 0, a = 0;
  const m = 1e3;
  function h(n, b) {
    var f;
    const P = (f = e.container) == null ? void 0 : f.value;
    if (P) {
      const y = P.scrollTop, r = P.clientHeight;
      o = y - m, a = y + r + m;
    }
    return n + b >= o && n <= a;
  }
  function c(n, b) {
    var s;
    const P = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), f = parseInt(n.dataset.index || "0", 10), y = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((s = l == null ? void 0 : l.virtualizing) != null && s.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${P}px, ${T}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "", b();
      });
      return;
    }
    if (!h(T, y)) {
      n.style.opacity = "1", n.style.transform = `translate3d(${P}px, ${T}px, 0) scale(1)`, n.style.transition = "none", b();
      return;
    }
    const r = Math.min(f * 20, 160), g = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${r}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${P}px, ${T}px, 0) scale(1)`;
      const d = () => {
        g ? n.style.setProperty("--masonry-opacity-delay", g) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", d), b();
      };
      n.addEventListener("transitionend", d);
    });
  }
  function i(n) {
    var T;
    const b = parseInt(n.dataset.left || "0", 10), P = parseInt(n.dataset.top || "0", 10);
    if ((T = l == null ? void 0 : l.virtualizing) != null && T.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${b}px, ${P}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    n.style.opacity = "0", n.style.transform = `translate3d(${b}px, ${P + 10}px, 0) scale(0.985)`;
  }
  function x(n) {
    var f;
    const b = parseInt(n.dataset.left || "0", 10), P = parseInt(n.dataset.top || "0", 10), T = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if (!((f = l == null ? void 0 : l.virtualizing) != null && f.value)) {
      if (!h(P, T)) {
        n.style.transition = "none";
        return;
      }
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${b}px, ${P}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "";
      });
    }
  }
  function M(n, b) {
    var p;
    const P = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), f = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((p = l == null ? void 0 : l.virtualizing) != null && p.value) {
      b();
      return;
    }
    if (!h(T, f)) {
      n.style.transition = "none", n.style.opacity = "0", b();
      return;
    }
    const y = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let r = Number.isFinite(y) && y > 0 ? y : NaN;
    if (!Number.isFinite(r)) {
      const $ = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", E = parseFloat($);
      r = Number.isFinite(E) && E > 0 ? E : 200;
    }
    const g = n.style.transitionDuration, s = () => {
      n.removeEventListener("transitionend", d), clearTimeout(L), n.style.transitionDuration = g || "";
    }, d = (v) => {
      (!v || v.target === n) && (s(), b());
    }, L = setTimeout(() => {
      s(), b();
    }, r + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${r}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${P}px, ${T + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", d);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: i,
    onBeforeLeave: x,
    onLeave: M
  };
}
function ta({
  container: e,
  masonry: l,
  columns: o,
  containerHeight: a,
  isLoading: m,
  pageSize: h,
  refreshLayout: c,
  setItemsRaw: i,
  loadNext: x,
  loadThresholdPx: M
}) {
  let n = 0;
  async function b(P, T = !1) {
    if (!e.value) return;
    const f = P ?? be(l.value, o.value), y = f.length ? Math.max(...f) : 0, r = e.value.scrollTop + e.value.clientHeight, g = e.value.scrollTop > n + 1;
    n = e.value.scrollTop;
    const s = typeof M == "number" ? M : 200, d = s >= 0 ? Math.max(0, y - s) : Math.max(0, y + s);
    if (r >= d && (g || T) && !m.value) {
      await x(), await _();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
function aa(e) {
  const { useSwipeMode: l, masonry: o, isLoading: a, loadNext: m, loadPage: h, paginationHistory: c } = e, i = D(0), x = D(0), M = D(!1), n = D(0), b = D(0), P = D(null), T = Z(() => {
    if (!l.value || o.value.length === 0) return null;
    const k = Math.max(0, Math.min(i.value, o.value.length - 1));
    return o.value[k] || null;
  }), f = Z(() => {
    if (!l.value || !T.value) return null;
    const k = i.value + 1;
    return k >= o.value.length ? null : o.value[k] || null;
  }), y = Z(() => {
    if (!l.value || !T.value) return null;
    const k = i.value - 1;
    return k < 0 ? null : o.value[k] || null;
  });
  function r() {
    if (!P.value) return;
    const k = P.value.clientHeight;
    x.value = -i.value * k;
  }
  function g() {
    if (!f.value) {
      m();
      return;
    }
    i.value++, r(), i.value >= o.value.length - 5 && m();
  }
  function s() {
    y.value && (i.value--, r());
  }
  function d(k) {
    l.value && (M.value = !0, n.value = k.touches[0].clientY, b.value = x.value, k.preventDefault());
  }
  function L(k) {
    if (!l.value || !M.value) return;
    const z = k.touches[0].clientY - n.value;
    x.value = b.value + z, k.preventDefault();
  }
  function p(k) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const z = x.value - b.value;
    Math.abs(z) > 100 ? z > 0 && y.value ? s() : z < 0 && f.value ? g() : r() : r(), k.preventDefault();
  }
  function v(k) {
    l.value && (M.value = !0, n.value = k.clientY, b.value = x.value, k.preventDefault());
  }
  function $(k) {
    if (!l.value || !M.value) return;
    const z = k.clientY - n.value;
    x.value = b.value + z, k.preventDefault();
  }
  function E(k) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const z = x.value - b.value;
    Math.abs(z) > 100 ? z > 0 && y.value ? s() : z < 0 && f.value ? g() : r() : r(), k.preventDefault();
  }
  function O() {
    !l.value && i.value > 0 && (i.value = 0, x.value = 0), l.value && o.value.length === 0 && !a.value && h(c.value[0]), l.value && r();
  }
  function j() {
    i.value = 0, x.value = 0, M.value = !1;
  }
  return {
    // State
    currentSwipeIndex: i,
    swipeOffset: x,
    isDragging: M,
    swipeContainer: P,
    // Computed
    currentItem: T,
    nextItem: f,
    previousItem: y,
    // Functions
    handleTouchStart: d,
    handleTouchMove: L,
    handleTouchEnd: p,
    handleMouseDown: v,
    handleMouseMove: $,
    handleMouseUp: E,
    goToNextItem: g,
    goToPreviousItem: s,
    snapToCurrentItem: r,
    handleWindowResize: O,
    reset: j
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function na(e) {
  const {
    getNextPage: l,
    masonry: o,
    isLoading: a,
    hasReachedEnd: m,
    loadError: h,
    currentPage: c,
    paginationHistory: i,
    refreshLayout: x,
    retryMaxAttempts: M,
    retryInitialDelayMs: n,
    retryBackoffStepMs: b,
    mode: P,
    backfillDelayMs: T,
    backfillMaxCalls: f,
    pageSize: y,
    autoRefreshOnEmpty: r,
    emits: g
  } = e, s = D(!1);
  let d = !1;
  function L(F) {
    return o.value.filter((t) => t.page === F).length;
  }
  function p(F, t) {
    return new Promise((w) => {
      const S = Math.max(0, F | 0), H = Date.now();
      t(S, S);
      const V = setInterval(() => {
        if (s.value) {
          clearInterval(V), w();
          return;
        }
        const C = Date.now() - H, I = Math.max(0, S - C);
        t(I, S), I <= 0 && (clearInterval(V), w());
      }, 100);
    });
  }
  async function v(F) {
    let t = 0;
    const w = M;
    let S = n;
    for (; ; )
      try {
        const H = await F();
        return t > 0 && g("retry:stop", { attempt: t, success: !0 }), H;
      } catch (H) {
        if (t++, t > w)
          throw g("retry:stop", { attempt: t - 1, success: !1 }), H;
        g("retry:start", { attempt: t, max: w, totalMs: S }), await p(S, (V, C) => {
          g("retry:tick", { attempt: t, remainingMs: V, totalMs: C });
        }), S += b;
      }
  }
  async function $(F) {
    try {
      const t = await v(() => l(F));
      return x([...o.value, ...t.items]), t;
    } catch (t) {
      throw t;
    }
  }
  async function E(F, t = !1) {
    if (!t && P !== "backfill" || d || s.value || m.value) return;
    const w = (F || 0) + (y || 0);
    if (!y || y <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      m.value = !0;
      return;
    }
    if (!(o.value.length >= w)) {
      d = !0, a.value = !0;
      try {
        let H = 0;
        for (g("backfill:start", { target: w, fetched: o.value.length, calls: H }); o.value.length < w && H < f && i.value[i.value.length - 1] != null && !s.value && !m.value && d && (await p(T, (C, I) => {
          g("backfill:tick", {
            fetched: o.value.length,
            target: w,
            calls: H,
            remainingMs: C,
            totalMs: I
          });
        }), !(s.value || !d)); ) {
          const V = i.value[i.value.length - 1];
          if (V == null) {
            m.value = !0;
            break;
          }
          try {
            if (s.value || !d) break;
            const C = await $(V);
            if (s.value || !d) break;
            h.value = null, i.value.push(C.nextPage), C.nextPage == null && (m.value = !0);
          } catch (C) {
            if (s.value || !d) break;
            h.value = me(C);
          }
          H++;
        }
        g("backfill:stop", { fetched: o.value.length, calls: H });
      } finally {
        d = !1, a.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function O(F) {
    if (!a.value) {
      s.value = !1, a.value = !0, m.value = !1, h.value = null;
      try {
        const t = o.value.length;
        if (s.value) return;
        const w = await $(F);
        return s.value ? void 0 : (h.value = null, c.value = F, i.value.push(w.nextPage), w.nextPage == null && (m.value = !0), await E(t), w);
      } catch (t) {
        throw h.value = me(t), t;
      } finally {
        a.value = !1;
      }
    }
  }
  async function j() {
    if (!a.value && !m.value) {
      s.value = !1, a.value = !0, h.value = null;
      try {
        const F = o.value.length;
        if (s.value) return;
        if (P === "refresh" && c.value != null && L(c.value) < y) {
          const H = await v(() => l(c.value));
          if (s.value) return;
          const V = [...o.value], C = H.items.filter((N) => !N || N.id == null || N.page == null ? !1 : !V.some((A) => A && A.id === N.id && A.page === N.page));
          if (C.length > 0) {
            const N = [...o.value, ...C];
            x(N), await new Promise((A) => setTimeout(A, 0));
          }
          if (h.value = null, C.length === 0) {
            const N = i.value[i.value.length - 1];
            if (N == null) {
              m.value = !0;
              return;
            }
            const A = await $(N);
            return s.value ? void 0 : (h.value = null, c.value = N, i.value.push(A.nextPage), A.nextPage == null && (m.value = !0), await E(F), A);
          }
          if (L(c.value) >= y) {
            const N = i.value[i.value.length - 1];
            if (N == null) {
              m.value = !0;
              return;
            }
            const A = await $(N);
            return s.value ? void 0 : (h.value = null, c.value = N, i.value.push(A.nextPage), A.nextPage == null && (m.value = !0), await E(F), A);
          } else
            return H;
        }
        const t = i.value[i.value.length - 1];
        if (t == null) {
          m.value = !0;
          return;
        }
        const w = await $(t);
        return s.value ? void 0 : (h.value = null, c.value = t, i.value.push(w.nextPage), w.nextPage == null && (m.value = !0), await E(F), w);
      } catch (F) {
        throw h.value = me(F), F;
      } finally {
        a.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function k() {
    if (!a.value) {
      s.value = !1, a.value = !0;
      try {
        const F = c.value;
        if (F == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", c.value, "paginationHistory:", i.value);
          return;
        }
        o.value = [], m.value = !1, h.value = null, i.value = [F];
        const t = await $(F);
        if (s.value) return;
        h.value = null, c.value = F, i.value.push(t.nextPage), t.nextPage == null && (m.value = !0);
        const w = o.value.length;
        return await E(w), t;
      } catch (F) {
        throw h.value = me(F), F;
      } finally {
        a.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  function z() {
    const F = d;
    s.value = !0, a.value = !1, d = !1, F && g("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 }), g("loading:stop", { fetched: o.value.length });
  }
  return {
    loadPage: O,
    loadNext: j,
    refreshCurrentPage: k,
    cancelLoad: z,
    maybeBackfillToTarget: E,
    getContent: $
  };
}
function la(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    refreshLayout: a,
    refreshCurrentPage: m,
    loadNext: h,
    maybeBackfillToTarget: c,
    autoRefreshOnEmpty: i,
    paginationHistory: x
  } = e;
  let M = /* @__PURE__ */ new Set(), n = null, b = !1;
  async function P() {
    if (M.size === 0 || b) return;
    b = !0;
    const d = Array.from(M);
    M.clear(), n = null, await f(d), b = !1;
  }
  async function T(d) {
    M.add(d), n && clearTimeout(n), n = setTimeout(() => {
      P();
    }, 16);
  }
  async function f(d) {
    if (!d || d.length === 0) return;
    const L = new Set(d.map((v) => v.id)), p = l.value.filter((v) => !L.has(v.id));
    if (l.value = p, await _(), p.length === 0 && x.value.length > 0) {
      if (i)
        await m();
      else
        try {
          await h(), await c(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((v) => requestAnimationFrame(() => v())), requestAnimationFrame(() => {
      a(p);
    });
  }
  async function y(d) {
    !d || d.length === 0 || (d.forEach((L) => M.add(L)), n && clearTimeout(n), n = setTimeout(() => {
      P();
    }, 16));
  }
  async function r(d, L) {
    if (!d) return;
    const p = l.value;
    if (p.findIndex((O) => O.id === d.id) !== -1) return;
    const $ = [...p], E = Math.min(L, $.length);
    $.splice(E, 0, d), l.value = $, await _(), o.value || (await new Promise((O) => requestAnimationFrame(() => O())), requestAnimationFrame(() => {
      a($);
    }));
  }
  async function g(d, L) {
    var F;
    if (!d || d.length === 0) return;
    if (!L || L.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const p = l.value, v = new Set(p.map((t) => t.id)), $ = [];
    for (let t = 0; t < d.length; t++)
      v.has((F = d[t]) == null ? void 0 : F.id) || $.push({ item: d[t], index: L[t] });
    if ($.length === 0) return;
    const E = /* @__PURE__ */ new Map();
    for (const { item: t, index: w } of $)
      E.set(w, t);
    const O = $.length > 0 ? Math.max(...$.map(({ index: t }) => t)) : -1, j = Math.max(p.length - 1, O), k = [];
    let z = 0;
    for (let t = 0; t <= j; t++)
      E.has(t) ? k.push(E.get(t)) : z < p.length && (k.push(p[z]), z++);
    for (; z < p.length; )
      k.push(p[z]), z++;
    l.value = k, await _(), o.value || (await new Promise((t) => requestAnimationFrame(() => t())), requestAnimationFrame(() => {
      a(k);
    }));
  }
  async function s() {
    l.value = [];
  }
  return {
    remove: T,
    removeMany: y,
    restore: r,
    restoreMany: g,
    removeAll: s
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    container: a,
    columns: m,
    containerWidth: h,
    masonryContentHeight: c,
    layout: i,
    fixedDimensions: x,
    checkItemDimensions: M
  } = e;
  let n = [];
  function b(y) {
    const r = Kt(y);
    let g = 0;
    if (a.value) {
      const { scrollTop: s, clientHeight: d } = a.value;
      g = s + d + 100;
    }
    c.value = Math.max(r, g);
  }
  function P(y) {
    var d, L;
    if (o.value) {
      l.value = y;
      return;
    }
    if (l.value = y, !a.value) return;
    if (M(y, "refreshLayout"), y.length > 1e3 && n.length > y.length && n.length - y.length < 100) {
      let p = !0;
      for (let v = 0; v < y.length; v++)
        if (((d = y[v]) == null ? void 0 : d.id) !== ((L = n[v]) == null ? void 0 : L.id)) {
          p = !1;
          break;
        }
      if (p) {
        const v = y.map(($, E) => ({
          ...n[E],
          originalIndex: E
        }));
        b(v), l.value = v, n = v;
        return;
      }
    }
    const g = y.map((p, v) => ({
      ...p,
      originalIndex: v
    })), s = a.value;
    if (x.value && x.value.width !== void 0) {
      const p = s.style.width, v = s.style.boxSizing;
      s.style.boxSizing = "border-box", s.style.width = `${x.value.width}px`, s.offsetWidth;
      const $ = Xe(g, s, m.value, i.value);
      s.style.width = p, s.style.boxSizing = v, b($), l.value = $, n = $;
    } else {
      const p = Xe(g, s, m.value, i.value);
      b(p), l.value = p, n = p;
    }
  }
  function T(y, r) {
    x.value = y, y && (y.width !== void 0 && (h.value = y.width), !o.value && a.value && l.value.length > 0 && _(() => {
      m.value = ue(i.value, h.value), P(l.value), r && r();
    }));
  }
  function f() {
    m.value = ue(i.value, h.value), P(l.value);
  }
  return {
    refreshLayout: P,
    setFixedDimensions: T,
    onResize: f,
    calculateHeight: b
  };
}
function ia(e) {
  const {
    masonry: l,
    container: o,
    columns: a,
    virtualBufferPx: m,
    loadThresholdPx: h
  } = e, c = D(e.handleScroll), i = D(0), x = D(0), M = m, n = D(!1), b = D({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), P = Z(() => {
    const r = i.value - M, g = i.value + x.value + M, s = l.value;
    return !s || s.length === 0 ? [] : s.filter((L) => {
      if (typeof L.top != "number" || typeof L.columnHeight != "number")
        return !0;
      const p = L.top;
      return L.top + L.columnHeight >= r && p <= g;
    });
  });
  function T(r) {
    if (!o.value) return;
    const { scrollTop: g, clientHeight: s } = o.value, d = g + s, L = r ?? be(l.value, a.value), p = L.length ? Math.max(...L) : 0, v = typeof h == "number" ? h : 200, $ = v >= 0 ? Math.max(0, p - v) : Math.max(0, p + v), E = Math.max(0, $ - d), O = E <= 100;
    b.value = {
      distanceToTrigger: Math.round(E),
      isNearTrigger: O
    };
  }
  async function f() {
    if (o.value) {
      const g = o.value.scrollTop, s = o.value.clientHeight || window.innerHeight, d = s > 0 ? s : window.innerHeight;
      i.value = g, x.value = d;
    }
    n.value = !0, await _(), await new Promise((g) => requestAnimationFrame(() => g())), n.value = !1;
    const r = be(l.value, a.value);
    c.value(r), T(r);
  }
  function y() {
    i.value = 0, x.value = 0, n.value = !1, b.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: x,
    virtualizing: n,
    scrollProgress: b,
    visibleMasonry: P,
    updateScrollProgress: T,
    updateViewport: f,
    reset: y,
    handleScroll: c
  };
}
function ra(e) {
  const { masonry: l } = e, o = D(/* @__PURE__ */ new Set());
  function a(c) {
    return typeof c == "number" && c > 0 && Number.isFinite(c);
  }
  function m(c, i) {
    try {
      if (!Array.isArray(c) || c.length === 0) return;
      const x = c.filter((n) => !a(n == null ? void 0 : n.width) || !a(n == null ? void 0 : n.height));
      if (x.length === 0) return;
      const M = [];
      for (const n of x) {
        const b = (n == null ? void 0 : n.id) ?? `idx:${l.value.indexOf(n)}`;
        o.value.has(b) || (o.value.add(b), M.push(b));
      }
      if (M.length > 0) {
        const n = M.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: i,
            count: M.length,
            sampleIds: n,
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
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave", "in-view", "in-view-and-loaded"],
  setup(e, { emit: l }) {
    const o = e, a = l, m = D(!1), h = D(!1), c = D(null), i = D(!1), x = D(!1), M = D(null), n = D(!1), b = D(!1), P = D(!1), T = D(!1), f = D(!1), y = D(null), r = D(null);
    let g = null;
    const s = Z(() => {
      var t;
      return o.type ?? ((t = o.item) == null ? void 0 : t.type) ?? "image";
    }), d = Z(() => {
      var t;
      return o.notFound ?? ((t = o.item) == null ? void 0 : t.notFound) ?? !1;
    }), L = Z(() => !!o.inSwipeMode);
    function p(t, w) {
      const S = t === "image" ? m.value : i.value;
      b.value && S && !P.value && (P.value = !0, a("in-view-and-loaded", { item: o.item, type: t, src: w }));
    }
    function v(t) {
      a("mouse-enter", { item: o.item, type: t });
    }
    function $(t) {
      a("mouse-leave", { item: o.item, type: t });
    }
    function E(t) {
      if (L.value) return;
      const w = t.target;
      w && (w.paused ? w.play() : w.pause());
    }
    function O(t) {
      const w = t.target;
      w && (L.value || w.play(), v("video"));
    }
    function j(t) {
      const w = t.target;
      w && (L.value || w.pause(), $("video"));
    }
    function k(t) {
      return new Promise((w, S) => {
        if (!t) {
          const I = new Error("No image source provided");
          a("preload:error", { item: o.item, type: "image", src: t, error: I }), S(I);
          return;
        }
        const H = new Image(), V = Date.now(), C = 300;
        H.onload = () => {
          const I = Date.now() - V, N = Math.max(0, C - I);
          setTimeout(async () => {
            m.value = !0, h.value = !1, T.value = !1, await _(), await new Promise((A) => setTimeout(A, 100)), f.value = !0, a("preload:success", { item: o.item, type: "image", src: t }), p("image", t), w();
          }, N);
        }, H.onerror = () => {
          h.value = !0, m.value = !1, T.value = !1;
          const I = new Error("Failed to load image");
          a("preload:error", { item: o.item, type: "image", src: t, error: I }), S(I);
        }, H.src = t;
      });
    }
    function z(t) {
      return new Promise((w, S) => {
        if (!t) {
          const I = new Error("No video source provided");
          a("preload:error", { item: o.item, type: "video", src: t, error: I }), S(I);
          return;
        }
        const H = document.createElement("video"), V = Date.now(), C = 300;
        H.preload = "metadata", H.muted = !0, H.onloadedmetadata = () => {
          const I = Date.now() - V, N = Math.max(0, C - I);
          setTimeout(async () => {
            i.value = !0, x.value = !1, T.value = !1, await _(), await new Promise((A) => setTimeout(A, 100)), f.value = !0, a("preload:success", { item: o.item, type: "video", src: t }), p("video", t), w();
          }, N);
        }, H.onerror = () => {
          x.value = !0, i.value = !1, T.value = !1;
          const I = new Error("Failed to load video");
          a("preload:error", { item: o.item, type: "video", src: t, error: I }), S(I);
        }, H.src = t;
      });
    }
    async function F() {
      var w;
      if (!n.value || T.value || d.value || s.value === "video" && i.value || s.value === "image" && m.value)
        return;
      const t = (w = o.item) == null ? void 0 : w.src;
      if (t)
        if (T.value = !0, f.value = !1, s.value === "video") {
          M.value = t, i.value = !1, x.value = !1;
          try {
            await z(t);
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
    return tt(async () => {
      if (!y.value) return;
      const t = [o.preloadThreshold, 1].filter((S, H, V) => V.indexOf(S) === H).sort((S, H) => S - H);
      g = new IntersectionObserver(
        (S) => {
          S.forEach((H) => {
            const V = H.intersectionRatio, C = V >= 1, I = V >= o.preloadThreshold;
            if (C && !b.value) {
              b.value = !0, a("in-view", { item: o.item, type: s.value });
              const N = s.value === "image" ? c.value : M.value, A = s.value === "image" ? m.value : i.value;
              N && A && p(s.value, N);
            }
            I && !n.value ? (n.value = !0, F()) : H.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: t
        }
      ), g.observe(y.value), await _(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          w();
        });
      }), setTimeout(() => {
        w();
      }, 100);
      function w() {
        if (!y.value || b.value) return;
        const S = y.value.getBoundingClientRect(), H = window.innerHeight, V = window.innerWidth;
        if (S.top >= 0 && S.bottom <= H && S.left >= 0 && S.right <= V && S.height > 0 && S.width > 0) {
          b.value = !0, a("in-view", { item: o.item, type: s.value });
          const I = s.value === "image" ? c.value : M.value, N = s.value === "image" ? m.value : i.value;
          I && N && p(s.value, I);
        }
      }
    }), at(() => {
      g && (g.disconnect(), g = null);
    }), te(
      () => {
        var t;
        return (t = o.item) == null ? void 0 : t.src;
      },
      async (t) => {
        if (!(!t || d.value)) {
          if (s.value === "video") {
            if (t !== M.value && (i.value = !1, x.value = !1, M.value = t, n.value)) {
              T.value = !0;
              try {
                await z(t);
              } catch {
              }
            }
          } else if (t !== c.value && (m.value = !1, h.value = !1, c.value = t, n.value)) {
            T.value = !0;
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
        !L.value || !r.value || (t ? r.value.play() : r.value.pause());
      }
    ), (t, w) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: y,
      class: "relative w-full h-full flex flex-col"
    }, [
      t.headerHeight > 0 ? (Y(), q("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${t.headerHeight}px` })
      }, [
        J(t.$slots, "header", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: x.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: b.value
        })
      ], 4)) : ae("", !0),
      U("div", sa, [
        J(t.$slots, "default", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: x.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          imageSrc: c.value,
          videoSrc: M.value,
          showMedia: f.value,
          isFullyInView: b.value
        }, () => [
          U("div", ua, [
            d.value ? (Y(), q("div", ca, w[3] || (w[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", va, [
              s.value === "image" && c.value ? (Y(), q("img", {
                key: 0,
                src: c.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  m.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: w[0] || (w[0] = (S) => v("image")),
                onMouseleave: w[1] || (w[1] = (S) => $("image"))
              }, null, 42, fa)) : ae("", !0),
              s.value === "video" && M.value ? (Y(), q("video", {
                key: 1,
                ref_key: "videoEl",
                ref: r,
                src: M.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  i.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: L.value && o.isActive,
                controls: L.value,
                onClick: Ye(E, ["stop"]),
                onTouchend: Ye(E, ["stop", "prevent"]),
                onMouseenter: O,
                onMouseleave: j,
                onError: w[2] || (w[2] = (S) => x.value = !0)
              }, null, 42, da)) : ae("", !0),
              !m.value && !i.value && !h.value && !x.value ? (Y(), q("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  f.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", ha, [
                  J(t.$slots, "placeholder-icon", { mediaType: s.value }, () => [
                    U("i", {
                      class: ie(s.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              T.value ? (Y(), q("div", ma, w[4] || (w[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              s.value === "image" && h.value || s.value === "video" && x.value ? (Y(), q("div", ga, [
                U("i", {
                  class: ie(s.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + Ne(s.value), 1)
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
        J(t.$slots, "footer", {
          item: t.item,
          remove: t.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: x.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: b.value
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
}, Ia = { class: "text-red-500 dark:text-red-400" }, Pa = /* @__PURE__ */ et({
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
    const a = e, m = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = Z(() => {
      var u;
      return {
        ...m,
        ...a.layout,
        sizes: {
          ...m.sizes,
          ...((u = a.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), c = D(null), i = D(typeof window < "u" ? window.innerWidth : 1024), x = D(typeof window < "u" ? window.innerHeight : 768), M = D(null);
    let n = null;
    function b(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const P = Z(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const u = typeof a.mobileBreakpoint == "string" ? b(a.mobileBreakpoint) : a.mobileBreakpoint;
      return i.value < u;
    }), T = o, f = Z({
      get: () => a.items,
      set: (u) => T("update:items", u)
    }), y = D(7), r = D(null), g = D([]), s = D(null), d = D(!1), L = D(0), p = D(!1), v = D(null), $ = Z(() => Jt(i.value)), E = ra({
      masonry: f
    }), { checkItemDimensions: O, reset: j } = E, k = oa({
      masonry: f,
      useSwipeMode: P,
      container: r,
      columns: y,
      containerWidth: i,
      masonryContentHeight: L,
      layout: h,
      fixedDimensions: M,
      checkItemDimensions: O
    }), { refreshLayout: z, setFixedDimensions: F, onResize: t } = k, w = ia({
      masonry: f,
      container: r,
      columns: y,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: S, viewportHeight: H, virtualizing: V, visibleMasonry: C, updateScrollProgress: I, updateViewport: N, reset: A } = w, { onEnter: ne, onBeforeEnter: K, onBeforeLeave: re, onLeave: ee } = ea(
      { container: r },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: V }
    ), ot = ne, it = K, rt = re, st = ee, ut = na({
      getNextPage: a.getNextPage,
      masonry: f,
      isLoading: d,
      hasReachedEnd: p,
      loadError: v,
      currentPage: s,
      paginationHistory: g,
      refreshLayout: z,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: a.mode,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      autoRefreshOnEmpty: a.autoRefreshOnEmpty,
      emits: T
    }), { loadPage: Te, loadNext: pe, refreshCurrentPage: De, cancelLoad: Ie, maybeBackfillToTarget: ct } = ut, Q = aa({
      useSwipeMode: P,
      masonry: f,
      isLoading: d,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: g
    }), { handleScroll: ze } = ta({
      container: r,
      masonry: f,
      columns: y,
      containerHeight: L,
      isLoading: d,
      pageSize: a.pageSize,
      refreshLayout: z,
      setItemsRaw: (u) => {
        f.value = u;
      },
      loadNext: pe,
      loadThresholdPx: a.loadThresholdPx
    });
    w.handleScroll.value = ze;
    const vt = la({
      masonry: f,
      useSwipeMode: P,
      refreshLayout: z,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: ct,
      autoRefreshOnEmpty: a.autoRefreshOnEmpty,
      paginationHistory: g
    }), { remove: ce, removeMany: ft, restore: dt, restoreMany: ht, removeAll: mt } = vt;
    function gt(u) {
      F(u, I), !u && c.value && (i.value = c.value.clientWidth, x.value = c.value.clientHeight);
    }
    l({
      isLoading: d,
      refreshLayout: z,
      // Container dimensions (wrapper element)
      containerWidth: i,
      containerHeight: x,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: L,
      // Current page
      currentPage: s,
      // End of list tracking
      hasReachedEnd: p,
      // Load error tracking
      loadError: v,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: gt,
      remove: ce,
      removeMany: ft,
      removeAll: mt,
      restore: dt,
      restoreMany: ht,
      loadNext: pe,
      loadPage: Te,
      refreshCurrentPage: De,
      reset: xt,
      destroy: bt,
      init: je,
      restoreItems: ke,
      paginationHistory: g,
      cancelLoad: Ie,
      scrollToTop: pt,
      scrollTo: yt,
      totalItems: Z(() => f.value.length),
      currentBreakpoint: $
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Ae = Q.handleTouchStart, Re = Q.handleTouchMove, We = Q.handleTouchEnd, Oe = Q.handleMouseDown, Pe = Q.handleMouseMove, Le = Q.handleMouseUp, Ee = Q.snapToCurrentItem;
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
      }), r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight || window.innerHeight));
    }
    function wt() {
      t(), r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight);
    }
    function xt() {
      Ie(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), f.value = [], x.value = 0, s.value = a.loadAtPage, g.value = [a.loadAtPage], p.value = !1, v.value = null, A(), we = !1;
    }
    function bt() {
      Ie(), f.value = [], L.value = 0, s.value = null, g.value = [], p.value = !1, v.value = null, d.value = !1, se.value = 0, ve.value = 0, ye.value = !1, A(), j(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Qe(async () => {
      P.value || await N();
    }, 200), Ce = Qe(wt, 200);
    function Ve() {
      Q.handleWindowResize();
    }
    function je(u, B, R) {
      s.value = B, g.value = [B], g.value.push(R), p.value = R == null, O(u, "init"), P.value ? (f.value = [...f.value, ...u], se.value === 0 && f.value.length > 0 && (ve.value = 0)) : (z([...f.value, ...u]), r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight || window.innerHeight), _(() => {
        r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight || window.innerHeight, I());
      }));
    }
    async function ke(u, B, R) {
      if (!a.skipInitialLoad) {
        je(u, B, R);
        return;
      }
      if (s.value = B, g.value = [B], R != null && g.value.push(R), p.value = R === null, v.value = null, O(u, "restoreItems"), P.value)
        f.value = u, se.value === 0 && f.value.length > 0 && (ve.value = 0);
      else if (z(u), r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight || window.innerHeight), await _(), r.value) {
        S.value = r.value.scrollTop, H.value = r.value.clientHeight || window.innerHeight, I(), await _();
        const G = be(f.value, y.value), W = G.length ? Math.max(...G) : 0, qe = r.value.scrollTop + r.value.clientHeight, Se = typeof a.loadThresholdPx == "number" ? a.loadThresholdPx : 200, Mt = Se >= 0 ? Math.max(0, W - Se) : Math.max(0, W + Se);
        qe >= Mt && !p.value && !d.value && g.value.length > 0 && g.value[g.value.length - 1] != null && await ze(G, !0);
      }
    }
    te(
      h,
      () => {
        P.value || r.value && (y.value = ue(h.value, i.value), z(f.value));
      },
      { deep: !0 }
    ), te(() => a.layoutMode, () => {
      M.value && M.value.width !== void 0 ? i.value = M.value.width : c.value && (i.value = c.value.clientWidth);
    }), te(r, (u) => {
      u && !P.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return te(
      () => [a.items, a.skipInitialLoad, a.initialPage, a.initialNextPage],
      ([u, B, R, G]) => {
        if (B && u && u.length > 0 && !we) {
          we = !0;
          const W = R ?? a.loadAtPage;
          ke(u, W, G !== void 0 ? G : void 0);
        }
      },
      { immediate: !1 }
    ), te(P, (u, B) => {
      B === void 0 && u === !1 || _(() => {
        u ? (document.addEventListener("mousemove", Pe), document.addEventListener("mouseup", Le), r.value && r.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, f.value.length > 0 && Ee()) : (document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Le), r.value && c.value && (M.value && M.value.width !== void 0 ? i.value = M.value.width : i.value = c.value.clientWidth, r.value.removeEventListener("scroll", oe), r.value.addEventListener("scroll", oe, { passive: !0 }), f.value.length > 0 && (y.value = ue(h.value, i.value), z(f.value), S.value = r.value.scrollTop, H.value = r.value.clientHeight, I())));
      });
    }, { immediate: !0 }), te(le, (u) => {
      u && (u.addEventListener("touchstart", Ae, { passive: !1 }), u.addEventListener("touchmove", Re, { passive: !1 }), u.addEventListener("touchend", We), u.addEventListener("mousedown", Oe));
    }), te(() => f.value.length, (u, B) => {
      P.value && u > 0 && B === 0 && (se.value = 0, _(() => Ee()));
    }), te(c, (u) => {
      n && (n.disconnect(), n = null), u && typeof ResizeObserver < "u" ? (n = new ResizeObserver((B) => {
        if (!M.value)
          for (const R of B) {
            const G = R.contentRect.width, W = R.contentRect.height;
            i.value !== G && (i.value = G), x.value !== W && (x.value = W);
          }
      }), n.observe(u), M.value || (i.value = u.clientWidth, x.value = u.clientHeight)) : u && (M.value || (i.value = u.clientWidth, x.value = u.clientHeight));
    }, { immediate: !0 }), te(i, (u, B) => {
      u !== B && u > 0 && !P.value && r.value && f.value.length > 0 && _(() => {
        y.value = ue(h.value, u), z(f.value), I();
      });
    }), tt(async () => {
      try {
        await _(), c.value && !n && (i.value = c.value.clientWidth, x.value = c.value.clientHeight), P.value || (y.value = ue(h.value, i.value), r.value && (S.value = r.value.scrollTop, H.value = r.value.clientHeight));
        const u = a.loadAtPage;
        if (g.value = [u], !a.skipInitialLoad)
          await Te(g.value[0]);
        else if (a.items && a.items.length > 0) {
          const B = a.initialPage !== null && a.initialPage !== void 0 ? a.initialPage : a.loadAtPage, R = a.initialNextPage !== void 0 ? a.initialNextPage : void 0;
          await ke(a.items, B, R), we = !0;
        }
        P.value ? _(() => Ee()) : I();
      } catch (u) {
        v.value || (console.error("Error during component initialization:", u), v.value = me(u)), d.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", Ve);
    }), at(() => {
      var u;
      n && (n.disconnect(), n = null), (u = r.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", Ve), le.value && (le.value.removeEventListener("touchstart", Ae), le.value.removeEventListener("touchmove", Re), le.value.removeEventListener("touchend", We), le.value.removeEventListener("mousedown", Oe)), document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Le);
    }), (u, B) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: c,
      class: "w-full h-full flex flex-col relative"
    }, [
      P.value ? (Y(), q("div", {
        key: 0,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !X(ye), "cursor-grabbing": X(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        U("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${X(ve)}px)`,
            transition: X(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${f.value.length * 100}%`
          })
        }, [
          (Y(!0), q(Ue, null, _e(f.value, (R, G) => (Y(), q("div", {
            key: `${R.page}-${R.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${G * (100 / f.value.length)}%`,
              height: `${100 / f.value.length}%`
            })
          }, [
            U("div", pa, [
              U("div", ya, [
                J(u.$slots, "default", {
                  item: R,
                  remove: X(ce),
                  index: R.originalIndex ?? f.value.indexOf(R)
                }, () => [
                  He(Me, {
                    item: R,
                    remove: X(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": G === X(se),
                    "onPreload:success": B[0] || (B[0] = (W) => T("item:preload:success", W)),
                    "onPreload:error": B[1] || (B[1] = (W) => T("item:preload:error", W)),
                    onMouseEnter: B[2] || (B[2] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: B[3] || (B[3] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      J(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      J(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        p.value && f.value.length > 0 ? (Y(), q("div", wa, [
          J(u.$slots, "end-message", {}, () => [
            B[8] || (B[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        v.value && f.value.length > 0 ? (Y(), q("div", xa, [
          J(u.$slots, "error-message", { error: v.value }, () => [
            U("p", ba, "Failed to load content: " + Ne(v.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (Y(), q("div", {
        key: 1,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: r
      }, [
        U("div", {
          class: "relative",
          style: ge({ height: `${L.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          He(Tt, {
            name: "masonry",
            css: !1,
            onEnter: X(ot),
            onBeforeEnter: X(it),
            onLeave: X(st),
            onBeforeLeave: X(rt)
          }, {
            default: fe(() => [
              (Y(!0), q(Ue, null, _e(X(C), (R, G) => (Y(), q("div", de({
                key: `${R.page}-${R.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, X(Zt)(R, G)), [
                J(u.$slots, "default", {
                  item: R,
                  remove: X(ce),
                  index: R.originalIndex ?? f.value.indexOf(R)
                }, () => [
                  He(Me, {
                    item: R,
                    remove: X(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": B[4] || (B[4] = (W) => T("item:preload:success", W)),
                    "onPreload:error": B[5] || (B[5] = (W) => T("item:preload:error", W)),
                    onMouseEnter: B[6] || (B[6] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: B[7] || (B[7] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      J(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      J(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        p.value && f.value.length > 0 ? (Y(), q("div", Ma, [
          J(u.$slots, "end-message", {}, () => [
            B[9] || (B[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        v.value && f.value.length > 0 ? (Y(), q("div", Ta, [
          J(u.$slots, "error-message", { error: v.value }, () => [
            U("p", Ia, "Failed to load content: " + Ne(v.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2))
    ], 512));
  }
}), La = (e, l) => {
  const o = e.__vccOpts || e;
  for (const [a, m] of l)
    o[a] = m;
  return o;
}, Ze = /* @__PURE__ */ La(Pa, [["__scopeId", "data-v-0855c0b9"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Ha as default
};
