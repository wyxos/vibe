import { nextTick as _, ref as D, computed as ee, defineComponent as et, onMounted as tt, onUnmounted as at, watch as Z, createElementBlock as q, openBlock as Y, createCommentVNode as ae, createElementVNode as U, normalizeStyle as ge, renderSlot as G, normalizeClass as ie, withModifiers as Ye, toDisplayString as Ne, unref as X, Fragment as Ue, renderList as _e, createVNode as He, withCtx as fe, mergeProps as de, TransitionGroup as It } from "vue";
let $e = null;
function Pt() {
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
    gutterX: m = 0,
    gutterY: h = 0,
    header: c = 0,
    footer: i = 0,
    paddingLeft: w = 0,
    paddingRight: M = 0,
    sizes: n = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: x = "masonry"
  } = t;
  let I = 0, T = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const S = window.getComputedStyle(l);
      I = parseFloat(S.paddingLeft) || 0, T = parseFloat(S.paddingRight) || 0;
    }
  } catch {
  }
  const f = (w || 0) + I, y = (M || 0) + T, r = l.offsetWidth - l.clientWidth, g = r > 0 ? r + 2 : Pt() + 2, s = l.offsetWidth - g - f - y, d = m * (o - 1), L = Math.floor((s - d) / o), p = e.map((S) => {
    const C = S.width, V = S.height;
    return Math.round(L * V / C) + i + c;
  });
  if (x === "sequential-balanced") {
    const S = p.length;
    if (S === 0) return [];
    const C = (E, F, A) => E + (F > 0 ? h : 0) + A;
    let V = Math.max(...p), H = p.reduce((E, F) => E + F, 0) + h * Math.max(0, S - 1);
    const O = (E) => {
      let F = 1, A = 0, ne = 0;
      for (let K = 0; K < S; K++) {
        const re = p[K], te = C(A, ne, re);
        if (te <= E)
          A = te, ne++;
        else if (F++, A = re, ne = 1, re > E || F > o) return !1;
      }
      return F <= o;
    };
    for (; V < H; ) {
      const E = Math.floor((V + H) / 2);
      O(E) ? H = E : V = E + 1;
    }
    const k = H, a = new Array(o).fill(0);
    let b = o - 1, z = 0, $ = 0;
    for (let E = S - 1; E >= 0; E--) {
      const F = p[E], A = E < b;
      !(C(z, $, F) <= k) || A ? (a[b] = E + 1, b--, z = F, $ = 1) : (z = C(z, $, F), $++);
    }
    a[0] = 0;
    const B = [], j = new Array(o).fill(0);
    for (let E = 0; E < o; E++) {
      const F = a[E], A = E + 1 < o ? a[E + 1] : S, ne = E * (L + m);
      for (let K = F; K < A; K++) {
        const te = {
          ...e[K],
          columnWidth: L,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        te.imageHeight = p[K] - (i + c), te.columnHeight = p[K], te.left = ne, te.top = j[E], j[E] += te.columnHeight + (K + 1 < A ? h : 0), B.push(te);
      }
    }
    return B;
  }
  const v = new Array(o).fill(0), P = [];
  for (let S = 0; S < e.length; S++) {
    const C = e[S], V = {
      ...C,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, H = v.indexOf(Math.min(...v)), O = C.width, k = C.height;
    V.columnWidth = L, V.left = H * (L + m), V.imageHeight = Math.round(L * k / O), V.columnHeight = V.imageHeight + i + c, V.top = v[H], v[H] += V.columnHeight + h, P.push(V);
  }
  return P;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Lt = typeof self == "object" && self && self.Object === Object && self, nt = Et || Lt || Function("return this")(), xe = nt.Symbol, lt = Object.prototype, St = lt.hasOwnProperty, kt = lt.toString, he = xe ? xe.toStringTag : void 0;
function Ht(e) {
  var l = St.call(e, he), o = e[he];
  try {
    e[he] = void 0;
    var t = !0;
  } catch {
  }
  var m = kt.call(e);
  return t && (l ? e[he] = o : delete e[he]), m;
}
var $t = Object.prototype, Ft = $t.toString;
function Nt(e) {
  return Ft.call(e);
}
var zt = "[object Null]", Dt = "[object Undefined]", Ge = xe ? xe.toStringTag : void 0;
function Bt(e) {
  return e == null ? e === void 0 ? Dt : zt : Ge && Ge in Object(e) ? Ht(e) : Nt(e);
}
function At(e) {
  return e != null && typeof e == "object";
}
var Rt = "[object Symbol]";
function Wt(e) {
  return typeof e == "symbol" || At(e) && Bt(e) == Rt;
}
var Ot = /\s/;
function Ct(e) {
  for (var l = e.length; l-- && Ot.test(e.charAt(l)); )
    ;
  return l;
}
var Vt = /^\s+/;
function jt(e) {
  return e && e.slice(0, Ct(e) + 1).replace(Vt, "");
}
function ze(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var Je = NaN, qt = /^[-+]0x[0-9a-f]+$/i, Yt = /^0b[01]+$/i, Ut = /^0o[0-7]+$/i, _t = parseInt;
function Ke(e) {
  if (typeof e == "number")
    return e;
  if (Wt(e))
    return Je;
  if (ze(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = ze(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var o = Yt.test(e);
  return o || Ut.test(e) ? _t(e.slice(2), o ? 2 : 8) : qt.test(e) ? Je : +e;
}
var Fe = function() {
  return nt.Date.now();
}, Xt = "Expected a function", Gt = Math.max, Jt = Math.min;
function Qe(e, l, o) {
  var t, m, h, c, i, w, M = 0, n = !1, x = !1, I = !0;
  if (typeof e != "function")
    throw new TypeError(Xt);
  l = Ke(l) || 0, ze(o) && (n = !!o.leading, x = "maxWait" in o, h = x ? Gt(Ke(o.maxWait) || 0, l) : h, I = "trailing" in o ? !!o.trailing : I);
  function T(v) {
    var P = t, S = m;
    return t = m = void 0, M = v, c = e.apply(S, P), c;
  }
  function f(v) {
    return M = v, i = setTimeout(g, l), n ? T(v) : c;
  }
  function y(v) {
    var P = v - w, S = v - M, C = l - P;
    return x ? Jt(C, h - S) : C;
  }
  function r(v) {
    var P = v - w, S = v - M;
    return w === void 0 || P >= l || P < 0 || x && S >= h;
  }
  function g() {
    var v = Fe();
    if (r(v))
      return s(v);
    i = setTimeout(g, y(v));
  }
  function s(v) {
    return i = void 0, I && t ? T(v) : (t = m = void 0, c);
  }
  function d() {
    i !== void 0 && clearTimeout(i), M = 0, t = w = m = i = void 0;
  }
  function L() {
    return i === void 0 ? c : s(Fe());
  }
  function p() {
    var v = Fe(), P = r(v);
    if (t = arguments, m = this, w = v, P) {
      if (i === void 0)
        return f(w);
      if (x)
        return clearTimeout(i), i = setTimeout(g, l), T(w);
    }
    return i === void 0 && (i = setTimeout(g, l)), c;
  }
  return p.cancel = d, p.flush = L, p;
}
function ue(e, l) {
  const o = l ?? (typeof window < "u" ? window.innerWidth : 1024), t = e.sizes;
  return o >= 1536 && t["2xl"] ? t["2xl"] : o >= 1280 && t.xl ? t.xl : o >= 1024 && t.lg ? t.lg : o >= 768 && t.md ? t.md : o >= 640 && t.sm ? t.sm : t.base;
}
function Kt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Qt(e) {
  return e.reduce((o, t) => Math.max(o, t.top + t.columnHeight), 0) + 500;
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
function ea(e, l = 0) {
  return {
    style: Zt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function be(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const t = Array.from(new Set(e.map((c) => c.left))).sort((c, i) => c - i).slice(0, l), m = /* @__PURE__ */ new Map();
  for (let c = 0; c < t.length; c++) m.set(t[c], c);
  const h = new Array(t.length).fill(0);
  for (const c of e) {
    const i = m.get(c.left);
    i != null && (h[i] = Math.max(h[i], c.top + c.columnHeight));
  }
  for (; h.length < l; ) h.push(0);
  return h;
}
function ta(e, l) {
  let o = 0, t = 0;
  const m = 1e3;
  function h(n, x) {
    var f;
    const I = (f = e.container) == null ? void 0 : f.value;
    if (I) {
      const y = I.scrollTop, r = I.clientHeight;
      o = y - m, t = y + r + m;
    }
    return n + x >= o && n <= t;
  }
  function c(n, x) {
    var s;
    const I = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), f = parseInt(n.dataset.index || "0", 10), y = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((s = l == null ? void 0 : l.virtualizing) != null && s.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "", x();
      });
      return;
    }
    if (!h(T, y)) {
      n.style.opacity = "1", n.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`, n.style.transition = "none", x();
      return;
    }
    const r = Math.min(f * 20, 160), g = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${r}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${I}px, ${T}px, 0) scale(1)`;
      const d = () => {
        g ? n.style.setProperty("--masonry-opacity-delay", g) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", d), x();
      };
      n.addEventListener("transitionend", d);
    });
  }
  function i(n) {
    var T;
    const x = parseInt(n.dataset.left || "0", 10), I = parseInt(n.dataset.top || "0", 10);
    if ((T = l == null ? void 0 : l.virtualizing) != null && T.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${I}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    n.style.opacity = "0", n.style.transform = `translate3d(${x}px, ${I + 10}px, 0) scale(0.985)`;
  }
  function w(n) {
    var f;
    const x = parseInt(n.dataset.left || "0", 10), I = parseInt(n.dataset.top || "0", 10), T = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if (!((f = l == null ? void 0 : l.virtualizing) != null && f.value)) {
      if (!h(I, T)) {
        n.style.transition = "none";
        return;
      }
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${I}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "";
      });
    }
  }
  function M(n, x) {
    var p;
    const I = parseInt(n.dataset.left || "0", 10), T = parseInt(n.dataset.top || "0", 10), f = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((p = l == null ? void 0 : l.virtualizing) != null && p.value) {
      x();
      return;
    }
    if (!h(T, f)) {
      n.style.transition = "none", n.style.opacity = "0", x();
      return;
    }
    const y = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let r = Number.isFinite(y) && y > 0 ? y : NaN;
    if (!Number.isFinite(r)) {
      const P = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", S = parseFloat(P);
      r = Number.isFinite(S) && S > 0 ? S : 200;
    }
    const g = n.style.transitionDuration, s = () => {
      n.removeEventListener("transitionend", d), clearTimeout(L), n.style.transitionDuration = g || "";
    }, d = (v) => {
      (!v || v.target === n) && (s(), x());
    }, L = setTimeout(() => {
      s(), x();
    }, r + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${r}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${I}px, ${T + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", d);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: M
  };
}
function aa({
  container: e,
  masonry: l,
  columns: o,
  containerHeight: t,
  isLoading: m,
  pageSize: h,
  refreshLayout: c,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: M
}) {
  let n = 0;
  async function x(I, T = !1) {
    if (!e.value) return;
    const f = I ?? be(l.value, o.value), y = f.length ? Math.max(...f) : 0, r = e.value.scrollTop + e.value.clientHeight, g = e.value.scrollTop > n + 1;
    n = e.value.scrollTop;
    const s = typeof M == "number" ? M : 200, d = s >= 0 ? Math.max(0, y - s) : Math.max(0, y + s);
    if (r >= d && (g || T) && !m.value) {
      await w(), await _();
      return;
    }
  }
  return {
    handleScroll: x
  };
}
function na(e) {
  const { useSwipeMode: l, masonry: o, isLoading: t, loadNext: m, loadPage: h, paginationHistory: c } = e, i = D(0), w = D(0), M = D(!1), n = D(0), x = D(0), I = D(null), T = ee(() => {
    if (!l.value || o.value.length === 0) return null;
    const H = Math.max(0, Math.min(i.value, o.value.length - 1));
    return o.value[H] || null;
  }), f = ee(() => {
    if (!l.value || !T.value) return null;
    const H = i.value + 1;
    return H >= o.value.length ? null : o.value[H] || null;
  }), y = ee(() => {
    if (!l.value || !T.value) return null;
    const H = i.value - 1;
    return H < 0 ? null : o.value[H] || null;
  });
  function r() {
    if (!I.value) return;
    const H = I.value.clientHeight;
    w.value = -i.value * H;
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
  function d(H) {
    l.value && (M.value = !0, n.value = H.touches[0].clientY, x.value = w.value, H.preventDefault());
  }
  function L(H) {
    if (!l.value || !M.value) return;
    const O = H.touches[0].clientY - n.value;
    w.value = x.value + O, H.preventDefault();
  }
  function p(H) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const O = w.value - x.value;
    Math.abs(O) > 100 ? O > 0 && y.value ? s() : O < 0 && f.value ? g() : r() : r(), H.preventDefault();
  }
  function v(H) {
    l.value && (M.value = !0, n.value = H.clientY, x.value = w.value, H.preventDefault());
  }
  function P(H) {
    if (!l.value || !M.value) return;
    const O = H.clientY - n.value;
    w.value = x.value + O, H.preventDefault();
  }
  function S(H) {
    if (!l.value || !M.value) return;
    M.value = !1;
    const O = w.value - x.value;
    Math.abs(O) > 100 ? O > 0 && y.value ? s() : O < 0 && f.value ? g() : r() : r(), H.preventDefault();
  }
  function C() {
    !l.value && i.value > 0 && (i.value = 0, w.value = 0), l.value && o.value.length === 0 && !t.value && h(c.value[0]), l.value && r();
  }
  function V() {
    i.value = 0, w.value = 0, M.value = !1;
  }
  return {
    // State
    currentSwipeIndex: i,
    swipeOffset: w,
    isDragging: M,
    swipeContainer: I,
    // Computed
    currentItem: T,
    nextItem: f,
    previousItem: y,
    // Functions
    handleTouchStart: d,
    handleTouchMove: L,
    handleTouchEnd: p,
    handleMouseDown: v,
    handleMouseMove: P,
    handleMouseUp: S,
    goToNextItem: g,
    goToPreviousItem: s,
    snapToCurrentItem: r,
    handleWindowResize: C,
    reset: V
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function la(e) {
  const {
    getNextPage: l,
    masonry: o,
    isLoading: t,
    hasReachedEnd: m,
    loadError: h,
    currentPage: c,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: M,
    retryInitialDelayMs: n,
    retryBackoffStepMs: x,
    mode: I,
    backfillDelayMs: T,
    backfillMaxCalls: f,
    pageSize: y,
    autoRefreshOnEmpty: r,
    emits: g
  } = e, s = D(!1);
  let d = !1;
  function L(k) {
    return o.value.filter((a) => a.page === k).length;
  }
  function p(k, a) {
    return new Promise((b) => {
      const z = Math.max(0, k | 0), $ = Date.now();
      a(z, z);
      const B = setInterval(() => {
        if (s.value) {
          clearInterval(B), b();
          return;
        }
        const j = Date.now() - $, E = Math.max(0, z - j);
        a(E, z), E <= 0 && (clearInterval(B), b());
      }, 100);
    });
  }
  async function v(k) {
    let a = 0;
    const b = M;
    let z = n;
    for (; ; )
      try {
        const $ = await k();
        return a > 0 && g("retry:stop", { attempt: a, success: !0 }), $;
      } catch ($) {
        if (a++, a > b)
          throw g("retry:stop", { attempt: a - 1, success: !1 }), $;
        g("retry:start", { attempt: a, max: b, totalMs: z }), await p(z, (B, j) => {
          g("retry:tick", { attempt: a, remainingMs: B, totalMs: j });
        }), z += x;
      }
  }
  async function P(k) {
    try {
      const a = await v(() => l(k));
      return w([...o.value, ...a.items]), a;
    } catch (a) {
      throw a;
    }
  }
  async function S(k, a = !1) {
    if (!a && I !== "backfill" || d || s.value || m.value) return;
    const b = (k || 0) + (y || 0);
    if (!y || y <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      m.value = !0;
      return;
    }
    if (!(o.value.length >= b)) {
      d = !0, t.value = !0;
      try {
        let $ = 0;
        for (g("backfill:start", { target: b, fetched: o.value.length, calls: $ }); o.value.length < b && $ < f && i.value[i.value.length - 1] != null && !s.value && !m.value && d && (await p(T, (j, E) => {
          g("backfill:tick", {
            fetched: o.value.length,
            target: b,
            calls: $,
            remainingMs: j,
            totalMs: E
          });
        }), !(s.value || !d)); ) {
          const B = i.value[i.value.length - 1];
          if (B == null) {
            m.value = !0;
            break;
          }
          try {
            if (s.value || !d) break;
            const j = await P(B);
            if (s.value || !d) break;
            h.value = null, i.value.push(j.nextPage), j.nextPage == null && (m.value = !0);
          } catch (j) {
            if (s.value || !d) break;
            h.value = me(j);
          }
          $++;
        }
        g("backfill:stop", { fetched: o.value.length, calls: $ });
      } finally {
        d = !1, t.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function C(k) {
    if (!t.value) {
      s.value = !1, t.value = !0, m.value = !1, h.value = null;
      try {
        const a = o.value.length;
        if (s.value) return;
        const b = await P(k);
        return s.value ? void 0 : (h.value = null, c.value = k, i.value.push(b.nextPage), b.nextPage == null && (m.value = !0), await S(a), b);
      } catch (a) {
        throw h.value = me(a), a;
      } finally {
        t.value = !1;
      }
    }
  }
  async function V() {
    if (!t.value && !m.value) {
      s.value = !1, t.value = !0, h.value = null;
      try {
        const k = o.value.length;
        if (s.value) return;
        if (I === "refresh" && c.value != null && L(c.value) < y) {
          const $ = await v(() => l(c.value));
          if (s.value) return;
          const B = [...o.value], j = $.items.filter((F) => !F || F.id == null || F.page == null ? !1 : !B.some((A) => A && A.id === F.id && A.page === F.page));
          if (j.length > 0) {
            const F = [...o.value, ...j];
            w(F), await new Promise((A) => setTimeout(A, 0));
          }
          if (h.value = null, j.length === 0) {
            const F = i.value[i.value.length - 1];
            if (F == null) {
              m.value = !0;
              return;
            }
            const A = await P(F);
            return s.value ? void 0 : (h.value = null, c.value = F, i.value.push(A.nextPage), A.nextPage == null && (m.value = !0), await S(k), A);
          }
          if (L(c.value) >= y) {
            const F = i.value[i.value.length - 1];
            if (F == null) {
              m.value = !0;
              return;
            }
            const A = await P(F);
            return s.value ? void 0 : (h.value = null, c.value = F, i.value.push(A.nextPage), A.nextPage == null && (m.value = !0), await S(k), A);
          } else
            return $;
        }
        const a = i.value[i.value.length - 1];
        if (a == null) {
          m.value = !0;
          return;
        }
        const b = await P(a);
        return s.value ? void 0 : (h.value = null, c.value = a, i.value.push(b.nextPage), b.nextPage == null && (m.value = !0), await S(k), b);
      } catch (k) {
        throw h.value = me(k), k;
      } finally {
        t.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  async function H() {
    if (!t.value) {
      s.value = !1, t.value = !0;
      try {
        const k = c.value;
        if (k == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", c.value, "paginationHistory:", i.value);
          return;
        }
        o.value = [], m.value = !1, h.value = null, i.value = [k];
        const a = await P(k);
        if (s.value) return;
        h.value = null, c.value = k, i.value.push(a.nextPage), a.nextPage == null && (m.value = !0);
        const b = o.value.length;
        return await S(b), a;
      } catch (k) {
        throw h.value = me(k), k;
      } finally {
        t.value = !1, g("loading:stop", { fetched: o.value.length });
      }
    }
  }
  function O() {
    const k = d;
    s.value = !0, t.value = !1, d = !1, k && g("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 }), g("loading:stop", { fetched: o.value.length });
  }
  return {
    loadPage: C,
    loadNext: V,
    refreshCurrentPage: H,
    cancelLoad: O,
    maybeBackfillToTarget: S,
    getContent: P
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    refreshLayout: t,
    refreshCurrentPage: m,
    loadNext: h,
    maybeBackfillToTarget: c,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  let M = /* @__PURE__ */ new Set(), n = null, x = !1;
  async function I() {
    if (M.size === 0 || x) return;
    x = !0;
    const d = Array.from(M);
    M.clear(), n = null, await f(d), x = !1;
  }
  async function T(d) {
    M.add(d), n && clearTimeout(n), n = setTimeout(() => {
      I();
    }, 16);
  }
  async function f(d) {
    if (!d || d.length === 0) return;
    const L = new Set(d.map((v) => v.id)), p = l.value.filter((v) => !L.has(v.id));
    if (l.value = p, await _(), p.length === 0 && w.value.length > 0) {
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
      t(p);
    });
  }
  async function y(d) {
    !d || d.length === 0 || (d.forEach((L) => M.add(L)), n && clearTimeout(n), n = setTimeout(() => {
      I();
    }, 16));
  }
  async function r(d, L) {
    if (!d) return;
    const p = l.value;
    if (p.findIndex((C) => C.id === d.id) !== -1) return;
    const P = [...p], S = Math.min(L, P.length);
    P.splice(S, 0, d), l.value = P, await _(), o.value || (await new Promise((C) => requestAnimationFrame(() => C())), requestAnimationFrame(() => {
      t(P);
    }));
  }
  async function g(d, L) {
    var k;
    if (!d || d.length === 0) return;
    if (!L || L.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const p = l.value, v = new Set(p.map((a) => a.id)), P = [];
    for (let a = 0; a < d.length; a++)
      v.has((k = d[a]) == null ? void 0 : k.id) || P.push({ item: d[a], index: L[a] });
    if (P.length === 0) return;
    const S = /* @__PURE__ */ new Map();
    for (const { item: a, index: b } of P)
      S.set(b, a);
    const C = P.length > 0 ? Math.max(...P.map(({ index: a }) => a)) : -1, V = Math.max(p.length - 1, C), H = [];
    let O = 0;
    for (let a = 0; a <= V; a++)
      S.has(a) ? H.push(S.get(a)) : O < p.length && (H.push(p[O]), O++);
    for (; O < p.length; )
      H.push(p[O]), O++;
    l.value = H, await _(), o.value || (await new Promise((a) => requestAnimationFrame(() => a())), requestAnimationFrame(() => {
      t(H);
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
function ia(e) {
  const {
    masonry: l,
    useSwipeMode: o,
    container: t,
    columns: m,
    containerWidth: h,
    masonryContentHeight: c,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: M
  } = e;
  let n = [];
  function x(y) {
    const r = Qt(y);
    let g = 0;
    if (t.value) {
      const { scrollTop: s, clientHeight: d } = t.value;
      g = s + d + 100;
    }
    c.value = Math.max(r, g);
  }
  function I(y) {
    var d, L;
    if (o.value) {
      l.value = y;
      return;
    }
    if (l.value = y, !t.value) return;
    if (M(y, "refreshLayout"), y.length > 1e3 && n.length > y.length && n.length - y.length < 100) {
      let p = !0;
      for (let v = 0; v < y.length; v++)
        if (((d = y[v]) == null ? void 0 : d.id) !== ((L = n[v]) == null ? void 0 : L.id)) {
          p = !1;
          break;
        }
      if (p) {
        const v = y.map((P, S) => ({
          ...n[S],
          originalIndex: S
        }));
        x(v), l.value = v, n = v;
        return;
      }
    }
    const g = y.map((p, v) => ({
      ...p,
      originalIndex: v
    })), s = t.value;
    if (w.value && w.value.width !== void 0) {
      const p = s.style.width, v = s.style.boxSizing;
      s.style.boxSizing = "border-box", s.style.width = `${w.value.width}px`, s.offsetWidth;
      const P = Xe(g, s, m.value, i.value);
      s.style.width = p, s.style.boxSizing = v, x(P), l.value = P, n = P;
    } else {
      const p = Xe(g, s, m.value, i.value);
      x(p), l.value = p, n = p;
    }
  }
  function T(y, r) {
    w.value = y, y && (y.width !== void 0 && (h.value = y.width), !o.value && t.value && l.value.length > 0 && _(() => {
      m.value = ue(i.value, h.value), I(l.value), r && r();
    }));
  }
  function f() {
    m.value = ue(i.value, h.value), I(l.value);
  }
  return {
    refreshLayout: I,
    setFixedDimensions: T,
    onResize: f,
    calculateHeight: x
  };
}
function ra(e) {
  const {
    masonry: l,
    container: o,
    columns: t,
    virtualBufferPx: m,
    loadThresholdPx: h
  } = e, c = D(e.handleScroll), i = D(0), w = D(0), M = m, n = D(!1), x = D({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), I = ee(() => {
    const r = i.value - M, g = i.value + w.value + M, s = l.value;
    return !s || s.length === 0 ? [] : s.filter((L) => {
      if (typeof L.top != "number" || typeof L.columnHeight != "number")
        return !0;
      const p = L.top;
      return L.top + L.columnHeight >= r && p <= g;
    });
  });
  function T(r) {
    if (!o.value) return;
    const { scrollTop: g, clientHeight: s } = o.value, d = g + s, L = r ?? be(l.value, t.value), p = L.length ? Math.max(...L) : 0, v = typeof h == "number" ? h : 200, P = v >= 0 ? Math.max(0, p - v) : Math.max(0, p + v), S = Math.max(0, P - d), C = S <= 100;
    x.value = {
      distanceToTrigger: Math.round(S),
      isNearTrigger: C
    };
  }
  async function f() {
    if (o.value) {
      const g = o.value.scrollTop, s = o.value.clientHeight || window.innerHeight, d = s > 0 ? s : window.innerHeight;
      i.value = g, w.value = d;
    }
    n.value = !0, await _(), await new Promise((g) => requestAnimationFrame(() => g())), n.value = !1;
    const r = be(l.value, t.value);
    c.value(r), T(r);
  }
  function y() {
    i.value = 0, w.value = 0, n.value = !1, x.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: i,
    viewportHeight: w,
    virtualizing: n,
    scrollProgress: x,
    visibleMasonry: I,
    updateScrollProgress: T,
    updateViewport: f,
    reset: y,
    handleScroll: c
  };
}
function sa(e) {
  const { masonry: l } = e, o = D(/* @__PURE__ */ new Set());
  function t(c) {
    return typeof c == "number" && c > 0 && Number.isFinite(c);
  }
  function m(c, i) {
    try {
      if (!Array.isArray(c) || c.length === 0) return;
      const w = c.filter((n) => !t(n == null ? void 0 : n.width) || !t(n == null ? void 0 : n.height));
      if (w.length === 0) return;
      const M = [];
      for (const n of w) {
        const x = (n == null ? void 0 : n.id) ?? `idx:${l.value.indexOf(n)}`;
        o.value.has(x) || (o.value.add(x), M.push(x));
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
    const o = e, t = l, m = D(!1), h = D(!1), c = D(null), i = D(!1), w = D(!1), M = D(null), n = D(!1), x = D(!1), I = D(!1), T = D(!1), f = D(!1), y = D(null), r = D(null);
    let g = null;
    const s = ee(() => {
      var a;
      return o.type ?? ((a = o.item) == null ? void 0 : a.type) ?? "image";
    }), d = ee(() => {
      var a;
      return o.notFound ?? ((a = o.item) == null ? void 0 : a.notFound) ?? !1;
    }), L = ee(() => !!o.inSwipeMode);
    function p(a, b) {
      const z = a === "image" ? m.value : i.value;
      x.value && z && !I.value && (I.value = !0, t("in-view-and-loaded", { item: o.item, type: a, src: b }));
    }
    function v(a) {
      t("mouse-enter", { item: o.item, type: a });
    }
    function P(a) {
      t("mouse-leave", { item: o.item, type: a });
    }
    function S(a) {
      if (L.value) return;
      const b = a.target;
      b && (b.paused ? b.play() : b.pause());
    }
    function C(a) {
      const b = a.target;
      b && (L.value || b.play(), v("video"));
    }
    function V(a) {
      const b = a.target;
      b && (L.value || b.pause(), P("video"));
    }
    function H(a) {
      return new Promise((b, z) => {
        if (!a) {
          const E = new Error("No image source provided");
          t("preload:error", { item: o.item, type: "image", src: a, error: E }), z(E);
          return;
        }
        const $ = new Image(), B = Date.now(), j = 300;
        $.onload = () => {
          const E = Date.now() - B, F = Math.max(0, j - E);
          setTimeout(async () => {
            m.value = !0, h.value = !1, T.value = !1, await _(), await new Promise((A) => setTimeout(A, 100)), f.value = !0, t("preload:success", { item: o.item, type: "image", src: a }), p("image", a), b();
          }, F);
        }, $.onerror = () => {
          h.value = !0, m.value = !1, T.value = !1;
          const E = new Error("Failed to load image");
          t("preload:error", { item: o.item, type: "image", src: a, error: E }), z(E);
        }, $.src = a;
      });
    }
    function O(a) {
      return new Promise((b, z) => {
        if (!a) {
          const E = new Error("No video source provided");
          t("preload:error", { item: o.item, type: "video", src: a, error: E }), z(E);
          return;
        }
        const $ = document.createElement("video"), B = Date.now(), j = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const E = Date.now() - B, F = Math.max(0, j - E);
          setTimeout(async () => {
            i.value = !0, w.value = !1, T.value = !1, await _(), await new Promise((A) => setTimeout(A, 100)), f.value = !0, t("preload:success", { item: o.item, type: "video", src: a }), p("video", a), b();
          }, F);
        }, $.onerror = () => {
          w.value = !0, i.value = !1, T.value = !1;
          const E = new Error("Failed to load video");
          t("preload:error", { item: o.item, type: "video", src: a, error: E }), z(E);
        }, $.src = a;
      });
    }
    async function k() {
      var b;
      if (!n.value || T.value || d.value || s.value === "video" && i.value || s.value === "image" && m.value)
        return;
      const a = (b = o.item) == null ? void 0 : b.src;
      if (a)
        if (T.value = !0, f.value = !1, s.value === "video") {
          M.value = a, i.value = !1, w.value = !1;
          try {
            await O(a);
          } catch {
          }
        } else {
          c.value = a, m.value = !1, h.value = !1;
          try {
            await H(a);
          } catch {
          }
        }
    }
    return tt(async () => {
      if (!y.value) return;
      const a = [o.preloadThreshold, 1].filter((z, $, B) => B.indexOf(z) === $).sort((z, $) => z - $);
      g = new IntersectionObserver(
        (z) => {
          z.forEach(($) => {
            const B = $.intersectionRatio, j = B >= 1, E = B >= o.preloadThreshold;
            if (j && !x.value) {
              x.value = !0, t("in-view", { item: o.item, type: s.value });
              const F = s.value === "image" ? c.value : M.value, A = s.value === "image" ? m.value : i.value;
              F && A && p(s.value, F);
            }
            E && !n.value ? (n.value = !0, k()) : $.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: a
        }
      ), g.observe(y.value), await _(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          b();
        });
      }), setTimeout(() => {
        b();
      }, 100);
      function b() {
        if (!y.value || x.value) return;
        const z = y.value.getBoundingClientRect(), $ = window.innerHeight, B = window.innerWidth;
        if (z.top >= 0 && z.bottom <= $ && z.left >= 0 && z.right <= B && z.height > 0 && z.width > 0) {
          x.value = !0, t("in-view", { item: o.item, type: s.value });
          const E = s.value === "image" ? c.value : M.value, F = s.value === "image" ? m.value : i.value;
          E && F && p(s.value, E);
        }
      }
    }), at(() => {
      g && (g.disconnect(), g = null);
    }), Z(
      () => {
        var a;
        return (a = o.item) == null ? void 0 : a.src;
      },
      async (a) => {
        if (!(!a || d.value)) {
          if (s.value === "video") {
            if (a !== M.value && (i.value = !1, w.value = !1, M.value = a, n.value)) {
              T.value = !0;
              try {
                await O(a);
              } catch {
              }
            }
          } else if (a !== c.value && (m.value = !1, h.value = !1, c.value = a, n.value)) {
            T.value = !0;
            try {
              await H(a);
            } catch {
            }
          }
        }
      }
    ), Z(
      () => o.isActive,
      (a) => {
        !L.value || !r.value || (a ? r.value.play() : r.value.pause());
      }
    ), (a, b) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: y,
      class: "relative w-full h-full flex flex-col"
    }, [
      a.headerHeight > 0 ? (Y(), q("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${a.headerHeight}px` })
      }, [
        G(a.$slots, "header", {
          item: a.item,
          remove: a.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: x.value
        })
      ], 4)) : ae("", !0),
      U("div", ua, [
        G(a.$slots, "default", {
          item: a.item,
          remove: a.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          imageSrc: c.value,
          videoSrc: M.value,
          showMedia: f.value,
          isFullyInView: x.value
        }, () => [
          U("div", ca, [
            d.value ? (Y(), q("div", va, b[3] || (b[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", fa, [
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
                onMouseenter: b[0] || (b[0] = (z) => v("image")),
                onMouseleave: b[1] || (b[1] = (z) => P("image"))
              }, null, 42, da)) : ae("", !0),
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
                onClick: Ye(S, ["stop"]),
                onTouchend: Ye(S, ["stop", "prevent"]),
                onMouseenter: C,
                onMouseleave: V,
                onError: b[2] || (b[2] = (z) => w.value = !0)
              }, null, 42, ha)) : ae("", !0),
              !m.value && !i.value && !h.value && !w.value ? (Y(), q("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  f.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", ma, [
                  G(a.$slots, "placeholder-icon", { mediaType: s.value }, () => [
                    U("i", {
                      class: ie(s.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              T.value ? (Y(), q("div", ga, b[4] || (b[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              s.value === "image" && h.value || s.value === "video" && w.value ? (Y(), q("div", pa, [
                U("i", {
                  class: ie(s.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + Ne(s.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      a.footerHeight > 0 ? (Y(), q("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${a.footerHeight}px` })
      }, [
        G(a.$slots, "footer", {
          item: a.item,
          remove: a.remove,
          imageLoaded: m.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: T.value,
          mediaType: s.value,
          isFullyInView: x.value
        })
      ], 4)) : ae("", !0)
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
}, Pa = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ea = { class: "text-red-500 dark:text-red-400" }, La = /* @__PURE__ */ et({
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
    init: {
      type: String,
      default: "manual",
      validator: (e) => ["auto", "manual"].includes(e)
    },
    // Initial pagination state when init is 'auto' and items are provided
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
    const t = e, m = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = ee(() => {
      var u;
      return {
        ...m,
        ...t.layout,
        sizes: {
          ...m.sizes,
          ...((u = t.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), c = D(null), i = D(typeof window < "u" ? window.innerWidth : 1024), w = D(typeof window < "u" ? window.innerHeight : 768), M = D(null);
    let n = null;
    function x(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const I = ee(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const u = typeof t.mobileBreakpoint == "string" ? x(t.mobileBreakpoint) : t.mobileBreakpoint;
      return i.value < u;
    }), T = o, f = ee({
      get: () => t.items,
      set: (u) => T("update:items", u)
    }), y = D(7), r = D(null), g = D([]), s = D(null), d = D(!1), L = D(0), p = D(!1), v = D(null), P = D(!1), S = ee(() => Kt(i.value)), C = sa({
      masonry: f
    }), { checkItemDimensions: V, reset: H } = C, O = ia({
      masonry: f,
      useSwipeMode: I,
      container: r,
      columns: y,
      containerWidth: i,
      masonryContentHeight: L,
      layout: h,
      fixedDimensions: M,
      checkItemDimensions: V
    }), { refreshLayout: k, setFixedDimensions: a, onResize: b } = O, z = ra({
      masonry: f,
      container: r,
      columns: y,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: $, viewportHeight: B, virtualizing: j, visibleMasonry: E, updateScrollProgress: F, updateViewport: A, reset: ne } = z, { onEnter: K, onBeforeEnter: re, onBeforeLeave: te, onLeave: ot } = ta(
      { container: r },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: j }
    ), it = K, rt = re, st = te, ut = ot, ct = la({
      getNextPage: t.getNextPage,
      masonry: f,
      isLoading: d,
      hasReachedEnd: p,
      loadError: v,
      currentPage: s,
      paginationHistory: g,
      refreshLayout: k,
      retryMaxAttempts: t.retryMaxAttempts,
      retryInitialDelayMs: t.retryInitialDelayMs,
      retryBackoffStepMs: t.retryBackoffStepMs,
      mode: t.mode,
      backfillDelayMs: t.backfillDelayMs,
      backfillMaxCalls: t.backfillMaxCalls,
      pageSize: t.pageSize,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      emits: T
    }), { loadPage: Te, loadNext: pe, refreshCurrentPage: De, cancelLoad: Ie, maybeBackfillToTarget: vt } = ct, Q = na({
      useSwipeMode: I,
      masonry: f,
      isLoading: d,
      loadNext: pe,
      loadPage: Te,
      paginationHistory: g
    }), { handleScroll: Be } = aa({
      container: r,
      masonry: f,
      columns: y,
      containerHeight: L,
      isLoading: d,
      pageSize: t.pageSize,
      refreshLayout: k,
      setItemsRaw: (u) => {
        f.value = u;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    z.handleScroll.value = Be;
    const ft = oa({
      masonry: f,
      useSwipeMode: I,
      refreshLayout: k,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: vt,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: g
    }), { remove: ce, removeMany: dt, restore: ht, restoreMany: mt, removeAll: gt } = ft;
    function pt(u) {
      a(u, F), !u && c.value && (i.value = c.value.clientWidth, w.value = c.value.clientHeight);
    }
    l({
      isLoading: d,
      refreshLayout: k,
      // Container dimensions (wrapper element)
      containerWidth: i,
      containerHeight: w,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: L,
      // Current page
      currentPage: s,
      // End of list tracking
      hasReachedEnd: p,
      // Load error tracking
      loadError: v,
      // Initialization state
      isInitialized: P,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: pt,
      remove: ce,
      removeMany: dt,
      removeAll: gt,
      restore: ht,
      restoreMany: mt,
      loadNext: pe,
      loadPage: Te,
      refreshCurrentPage: De,
      reset: bt,
      destroy: Mt,
      init: je,
      restoreItems: Se,
      paginationHistory: g,
      cancelLoad: Ie,
      scrollToTop: yt,
      scrollTo: wt,
      totalItems: ee(() => f.value.length),
      currentBreakpoint: S
    });
    const se = Q.currentSwipeIndex, ve = Q.swipeOffset, ye = Q.isDragging, le = Q.swipeContainer, Ae = Q.handleTouchStart, Re = Q.handleTouchMove, We = Q.handleTouchEnd, Oe = Q.handleMouseDown, Pe = Q.handleMouseMove, Ee = Q.handleMouseUp, Le = Q.snapToCurrentItem;
    function yt(u) {
      r.value && r.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function wt(u) {
      r.value && (r.value.scrollTo({
        top: u.top ?? r.value.scrollTop,
        left: u.left ?? r.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight || window.innerHeight));
    }
    function xt() {
      b(), r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight);
    }
    function bt() {
      Ie(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), f.value = [], w.value = 0, s.value = t.loadAtPage, g.value = [t.loadAtPage], p.value = !1, v.value = null, P.value = !1, ne(), we = !1;
    }
    function Mt() {
      Ie(), f.value = [], L.value = 0, s.value = null, g.value = [], p.value = !1, v.value = null, d.value = !1, P.value = !1, se.value = 0, ve.value = 0, ye.value = !1, ne(), H(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Qe(async () => {
      I.value || await A();
    }, 200), Ce = Qe(xt, 200);
    function Ve() {
      Q.handleWindowResize();
    }
    function je(u, N, R) {
      s.value = N, g.value = [N], g.value.push(R), p.value = R == null, V(u, "init"), I.value ? (f.value = [...f.value, ...u], se.value === 0 && f.value.length > 0 && (ve.value = 0)) : (k([...f.value, ...u]), r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight || window.innerHeight), _(() => {
        r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight || window.innerHeight, F());
      }));
    }
    async function Se(u, N, R) {
      if (t.init === "manual") {
        je(u, N, R), u && u.length > 0 && (P.value = !0);
        return;
      }
      if (s.value = N, g.value = [N], R != null && g.value.push(R), p.value = R === null, v.value = null, V(u, "restoreItems"), I.value)
        f.value = u, se.value === 0 && f.value.length > 0 && (ve.value = 0);
      else if (k(u), r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight || window.innerHeight), await _(), r.value) {
        $.value = r.value.scrollTop, B.value = r.value.clientHeight || window.innerHeight, F(), await _();
        const J = be(f.value, y.value), W = J.length ? Math.max(...J) : 0, qe = r.value.scrollTop + r.value.clientHeight, ke = typeof t.loadThresholdPx == "number" ? t.loadThresholdPx : 200, Tt = ke >= 0 ? Math.max(0, W - ke) : Math.max(0, W + ke);
        qe >= Tt && !p.value && !d.value && g.value.length > 0 && g.value[g.value.length - 1] != null && await Be(J, !0);
      }
      u && u.length > 0 && (P.value = !0);
    }
    Z(
      h,
      () => {
        I.value || r.value && (y.value = ue(h.value, i.value), k(f.value));
      },
      { deep: !0 }
    ), Z(() => t.layoutMode, () => {
      M.value && M.value.width !== void 0 ? i.value = M.value.width : c.value && (i.value = c.value.clientWidth);
    }), Z(r, (u) => {
      u && !I.value ? (u.removeEventListener("scroll", oe), u.addEventListener("scroll", oe, { passive: !0 })) : u && u.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return Z(
      () => [t.items, t.init, t.initialPage, t.initialNextPage],
      ([u, N, R, J]) => {
        if (N === "auto" && u && u.length > 0 && !we) {
          we = !0;
          const W = R ?? t.loadAtPage;
          Se(u, W, J !== void 0 ? J : void 0);
        }
      },
      { immediate: !0 }
    ), Z(
      () => f.value.length,
      (u, N) => {
        t.init === "auto" && !P.value && u > 0 && N === 0 && (P.value = !0), t.init === "manual" && !P.value && u > 0 && N === 0 && (P.value = !0);
      },
      { immediate: !1 }
    ), Z(I, (u, N) => {
      N === void 0 && u === !1 || _(() => {
        u ? (document.addEventListener("mousemove", Pe), document.addEventListener("mouseup", Ee), r.value && r.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, f.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ee), r.value && c.value && (M.value && M.value.width !== void 0 ? i.value = M.value.width : i.value = c.value.clientWidth, r.value.removeEventListener("scroll", oe), r.value.addEventListener("scroll", oe, { passive: !0 }), f.value.length > 0 && (y.value = ue(h.value, i.value), k(f.value), $.value = r.value.scrollTop, B.value = r.value.clientHeight, F())));
      });
    }, { immediate: !0 }), Z(le, (u) => {
      u && (u.addEventListener("touchstart", Ae, { passive: !1 }), u.addEventListener("touchmove", Re, { passive: !1 }), u.addEventListener("touchend", We), u.addEventListener("mousedown", Oe));
    }), Z(() => f.value.length, (u, N) => {
      I.value && u > 0 && N === 0 && (se.value = 0, _(() => Le()));
    }), Z(c, (u) => {
      n && (n.disconnect(), n = null), u && typeof ResizeObserver < "u" ? (n = new ResizeObserver((N) => {
        if (!M.value)
          for (const R of N) {
            const J = R.contentRect.width, W = R.contentRect.height;
            i.value !== J && (i.value = J), w.value !== W && (w.value = W);
          }
      }), n.observe(u), M.value || (i.value = u.clientWidth, w.value = u.clientHeight)) : u && (M.value || (i.value = u.clientWidth, w.value = u.clientHeight));
    }, { immediate: !0 }), Z(i, (u, N) => {
      u !== N && u > 0 && !I.value && r.value && f.value.length > 0 && _(() => {
        y.value = ue(h.value, u), k(f.value), F();
      });
    }), tt(async () => {
      try {
        t.init === "manual" && (P.value = !0), await _(), c.value && !n && (i.value = c.value.clientWidth, w.value = c.value.clientHeight), I.value || (y.value = ue(h.value, i.value), r.value && ($.value = r.value.scrollTop, B.value = r.value.clientHeight));
        const u = t.loadAtPage;
        if (g.value = [u], t.init === "manual")
          await _(), await Te(g.value[0]);
        else if (t.items && t.items.length > 0) {
          const N = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, R = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Se(t.items, N, R), we = !0;
        }
        I.value ? _(() => Le()) : F();
      } catch (u) {
        v.value || (console.error("Error during component initialization:", u), v.value = me(u)), d.value = !1;
      }
      window.addEventListener("resize", Ce), window.addEventListener("resize", Ve);
    }), at(() => {
      var u;
      n && (n.disconnect(), n = null), (u = r.value) == null || u.removeEventListener("scroll", oe), window.removeEventListener("resize", Ce), window.removeEventListener("resize", Ve), le.value && (le.value.removeEventListener("touchstart", Ae), le.value.removeEventListener("touchmove", Re), le.value.removeEventListener("touchend", We), le.value.removeEventListener("mousedown", Oe)), document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ee);
    }), (u, N) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: c,
      class: "w-full h-full flex flex-col relative"
    }, [
      P.value ? I.value ? (Y(), q("div", {
        key: 1,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": t.forceMotion, "cursor-grab": !X(ye), "cursor-grabbing": X(ye) }]),
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
          (Y(!0), q(Ue, null, _e(f.value, (R, J) => (Y(), q("div", {
            key: `${R.page}-${R.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${J * (100 / f.value.length)}%`,
              height: `${100 / f.value.length}%`
            })
          }, [
            U("div", wa, [
              U("div", xa, [
                G(u.$slots, "default", {
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
                    "is-active": J === X(se),
                    "onPreload:success": N[0] || (N[0] = (W) => T("item:preload:success", W)),
                    "onPreload:error": N[1] || (N[1] = (W) => T("item:preload:error", W)),
                    onMouseEnter: N[2] || (N[2] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: N[3] || (N[3] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      G(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      G(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        p.value && f.value.length > 0 ? (Y(), q("div", ba, [
          G(u.$slots, "end-message", {}, () => [
            N[9] || (N[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        v.value && f.value.length > 0 ? (Y(), q("div", Ma, [
          G(u.$slots, "error-message", { error: v.value }, () => [
            U("p", Ta, "Failed to load content: " + Ne(v.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (Y(), q("div", {
        key: 2,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": t.forceMotion }]),
        ref_key: "container",
        ref: r
      }, [
        U("div", {
          class: "relative",
          style: ge({ height: `${L.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          He(It, {
            name: "masonry",
            css: !1,
            onEnter: X(it),
            onBeforeEnter: X(rt),
            onLeave: X(ut),
            onBeforeLeave: X(st)
          }, {
            default: fe(() => [
              (Y(!0), q(Ue, null, _e(X(E), (R, J) => (Y(), q("div", de({
                key: `${R.page}-${R.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, X(ea)(R, J)), [
                G(u.$slots, "default", {
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
                    "onPreload:success": N[4] || (N[4] = (W) => T("item:preload:success", W)),
                    "onPreload:error": N[5] || (N[5] = (W) => T("item:preload:error", W)),
                    onMouseEnter: N[6] || (N[6] = (W) => T("item:mouse-enter", W)),
                    onMouseLeave: N[7] || (N[7] = (W) => T("item:mouse-leave", W))
                  }, {
                    header: fe((W) => [
                      G(u.$slots, "item-header", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    footer: fe((W) => [
                      G(u.$slots, "item-footer", de({ ref_for: !0 }, W), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        p.value && f.value.length > 0 ? (Y(), q("div", Ia, [
          G(u.$slots, "end-message", {}, () => [
            N[10] || (N[10] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        v.value && f.value.length > 0 ? (Y(), q("div", Pa, [
          G(u.$slots, "error-message", { error: v.value }, () => [
            U("p", Ea, "Failed to load content: " + Ne(v.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (Y(), q("div", ya, [
        G(u.$slots, "loading-message", {}, () => [
          N[8] || (N[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Sa = (e, l) => {
  const o = e.__vccOpts || e;
  for (const [t, m] of l)
    o[t] = m;
  return o;
}, Ze = /* @__PURE__ */ Sa(La, [["__scopeId", "data-v-a5864783"]]), Fa = {
  install(e) {
    e.component("WyxosMasonry", Ze), e.component("WMasonry", Ze), e.component("WyxosMasonryItem", Me), e.component("WMasonryItem", Me);
  }
};
export {
  Ze as Masonry,
  Me as MasonryItem,
  Fa as default
};
