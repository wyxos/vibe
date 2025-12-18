import { nextTick as q, ref as D, computed as Q, defineComponent as Ke, onMounted as Qe, onUnmounted as Ze, watch as ee, createElementBlock as R, openBlock as O, createCommentVNode as te, createElementVNode as V, normalizeStyle as ge, renderSlot as _, normalizeClass as re, withModifiers as je, toDisplayString as $e, unref as U, Fragment as Ve, renderList as qe, createVNode as Pe, withCtx as fe, mergeProps as de, TransitionGroup as xt } from "vue";
let Se = null;
function bt() {
  if (Se != null) return Se;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const r = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), Se = r, r;
}
function Ye(e, l, r, t = {}) {
  const {
    gutterX: y = 0,
    gutterY: h = 0,
    header: m = 0,
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
  let x = 0, M = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(l);
      x = parseFloat(L.paddingLeft) || 0, M = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const s = (w || 0) + x, g = (b || 0) + M, a = l.offsetWidth - l.clientWidth, d = a > 0 ? a + 2 : bt() + 2, v = l.offsetWidth - d - s - g, T = y * (r - 1), P = Math.floor((v - T) / r), I = e.map((L) => {
    const k = L.width, W = L.height;
    return Math.round(P * W / k) + i + m;
  });
  if (p === "sequential-balanced") {
    const L = I.length;
    if (L === 0) return [];
    const k = (z, Y, G) => z + (Y > 0 ? h : 0) + G;
    let W = Math.max(...I), o = I.reduce((z, Y) => z + Y, 0) + h * Math.max(0, L - 1);
    const u = (z) => {
      let Y = 1, G = 0, ne = 0;
      for (let J = 0; J < L; J++) {
        const ie = I[J], Z = k(G, ne, ie);
        if (Z <= z)
          G = Z, ne++;
        else if (Y++, G = ie, ne = 1, ie > z || Y > r) return !1;
      }
      return Y <= r;
    };
    for (; W < o; ) {
      const z = Math.floor((W + o) / 2);
      u(z) ? o = z : W = z + 1;
    }
    const E = o, $ = new Array(r).fill(0);
    let C = r - 1, F = 0, N = 0;
    for (let z = L - 1; z >= 0; z--) {
      const Y = I[z], G = z < C;
      !(k(F, N, Y) <= E) || G ? ($[C] = z + 1, C--, F = Y, N = 1) : (F = k(F, N, Y), N++);
    }
    $[0] = 0;
    const j = [], X = new Array(r).fill(0);
    for (let z = 0; z < r; z++) {
      const Y = $[z], G = z + 1 < r ? $[z + 1] : L, ne = z * (P + y);
      for (let J = Y; J < G; J++) {
        const Z = {
          ...e[J],
          columnWidth: P,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = I[J] - (i + m), Z.columnHeight = I[J], Z.left = ne, Z.top = X[z], X[z] += Z.columnHeight + (J + 1 < G ? h : 0), j.push(Z);
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
    W.columnWidth = P, W.left = o * (P + y), W.imageHeight = Math.round(P * E / u), W.columnHeight = W.imageHeight + i + m, W.top = f[o], f[o] += W.columnHeight + h, H.push(W);
  }
  return H;
}
var Mt = typeof global == "object" && global && global.Object === Object && global, Tt = typeof self == "object" && self && self.Object === Object && self, et = Mt || Tt || Function("return this")(), xe = et.Symbol, tt = Object.prototype, It = tt.hasOwnProperty, Et = tt.toString, me = xe ? xe.toStringTag : void 0;
function kt(e) {
  var l = It.call(e, me), r = e[me];
  try {
    e[me] = void 0;
    var t = !0;
  } catch {
  }
  var y = Et.call(e);
  return t && (l ? e[me] = r : delete e[me]), y;
}
var Lt = Object.prototype, Pt = Lt.toString;
function St(e) {
  return Pt.call(e);
}
var Ht = "[object Null]", $t = "[object Undefined]", Ue = xe ? xe.toStringTag : void 0;
function Nt(e) {
  return e == null ? e === void 0 ? $t : Ht : Ue && Ue in Object(e) ? kt(e) : St(e);
}
function Dt(e) {
  return e != null && typeof e == "object";
}
var zt = "[object Symbol]";
function Bt(e) {
  return typeof e == "symbol" || Dt(e) && Nt(e) == zt;
}
var Ft = /\s/;
function At(e) {
  for (var l = e.length; l-- && Ft.test(e.charAt(l)); )
    ;
  return l;
}
var Wt = /^\s+/;
function Rt(e) {
  return e && e.slice(0, At(e) + 1).replace(Wt, "");
}
function Ne(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var _e = NaN, Ot = /^[-+]0x[0-9a-f]+$/i, Ct = /^0b[01]+$/i, jt = /^0o[0-7]+$/i, Vt = parseInt;
function Xe(e) {
  if (typeof e == "number")
    return e;
  if (Bt(e))
    return _e;
  if (Ne(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Ne(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Rt(e);
  var r = Ct.test(e);
  return r || jt.test(e) ? Vt(e.slice(2), r ? 2 : 8) : Ot.test(e) ? _e : +e;
}
var He = function() {
  return et.Date.now();
}, qt = "Expected a function", Yt = Math.max, Ut = Math.min;
function Ge(e, l, r) {
  var t, y, h, m, i, w, b = 0, n = !1, p = !1, x = !0;
  if (typeof e != "function")
    throw new TypeError(qt);
  l = Xe(l) || 0, Ne(r) && (n = !!r.leading, p = "maxWait" in r, h = p ? Yt(Xe(r.maxWait) || 0, l) : h, x = "trailing" in r ? !!r.trailing : x);
  function M(f) {
    var H = t, L = y;
    return t = y = void 0, b = f, m = e.apply(L, H), m;
  }
  function s(f) {
    return b = f, i = setTimeout(d, l), n ? M(f) : m;
  }
  function g(f) {
    var H = f - w, L = f - b, k = l - H;
    return p ? Ut(k, h - L) : k;
  }
  function a(f) {
    var H = f - w, L = f - b;
    return w === void 0 || H >= l || H < 0 || p && L >= h;
  }
  function d() {
    var f = He();
    if (a(f))
      return v(f);
    i = setTimeout(d, g(f));
  }
  function v(f) {
    return i = void 0, x && t ? M(f) : (t = y = void 0, m);
  }
  function T() {
    i !== void 0 && clearTimeout(i), b = 0, t = w = y = i = void 0;
  }
  function P() {
    return i === void 0 ? m : v(He());
  }
  function I() {
    var f = He(), H = a(f);
    if (t = arguments, y = this, w = f, H) {
      if (i === void 0)
        return s(w);
      if (p)
        return clearTimeout(i), i = setTimeout(d, l), M(w);
    }
    return i === void 0 && (i = setTimeout(d, l)), m;
  }
  return I.cancel = T, I.flush = P, I;
}
function ue(e, l) {
  const r = l ?? (typeof window < "u" ? window.innerWidth : 1024), t = e.sizes;
  return r >= 1536 && t["2xl"] ? t["2xl"] : r >= 1280 && t.xl ? t.xl : r >= 1024 && t.lg ? t.lg : r >= 768 && t.md ? t.md : r >= 640 && t.sm ? t.sm : t.base;
}
function _t(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Xt(e) {
  return e.reduce((r, t) => Math.max(r, t.top + t.columnHeight), 0) + 500;
}
function Gt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function Jt(e, l = 0) {
  return {
    style: Gt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function De(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const t = Array.from(new Set(e.map((m) => m.left))).sort((m, i) => m - i).slice(0, l), y = /* @__PURE__ */ new Map();
  for (let m = 0; m < t.length; m++) y.set(t[m], m);
  const h = new Array(t.length).fill(0);
  for (const m of e) {
    const i = y.get(m.left);
    i != null && (h[i] = Math.max(h[i], m.top + m.columnHeight));
  }
  for (; h.length < l; ) h.push(0);
  return h;
}
function Kt(e, l) {
  let r = 0, t = 0;
  const y = 1e3;
  function h(n, p) {
    var s;
    const x = (s = e.container) == null ? void 0 : s.value;
    if (x) {
      const g = x.scrollTop, a = x.clientHeight;
      r = g - y, t = g + a + y;
    }
    return n + p >= r && n <= t;
  }
  function m(n, p) {
    var v;
    const x = parseInt(n.dataset.left || "0", 10), M = parseInt(n.dataset.top || "0", 10), s = parseInt(n.dataset.index || "0", 10), g = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((v = l == null ? void 0 : l.virtualizing) != null && v.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        n.style.transition = "", p();
      });
      return;
    }
    if (!h(M, g)) {
      n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`, n.style.transition = "none", p();
      return;
    }
    const a = Math.min(s * 20, 160), d = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${a}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${x}px, ${M}px, 0) scale(1)`;
      const T = () => {
        d ? n.style.setProperty("--masonry-opacity-delay", d) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", T), p();
      };
      n.addEventListener("transitionend", T);
    });
  }
  function i(n) {
    var M;
    const p = parseInt(n.dataset.left || "0", 10), x = parseInt(n.dataset.top || "0", 10);
    if ((M = l == null ? void 0 : l.virtualizing) != null && M.value) {
      n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${p}px, ${x}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    n.style.opacity = "0", n.style.transform = `translate3d(${p}px, ${x + 10}px, 0) scale(0.985)`;
  }
  function w(n) {
    var s;
    const p = parseInt(n.dataset.left || "0", 10), x = parseInt(n.dataset.top || "0", 10), M = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if (!((s = l == null ? void 0 : l.virtualizing) != null && s.value)) {
      if (!h(x, M)) {
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
    const x = parseInt(n.dataset.left || "0", 10), M = parseInt(n.dataset.top || "0", 10), s = n.offsetHeight || parseInt(getComputedStyle(n).height || "200", 10) || 200;
    if ((I = l == null ? void 0 : l.virtualizing) != null && I.value) {
      p();
      return;
    }
    if (!h(M, s)) {
      n.style.transition = "none", n.style.opacity = "0", p();
      return;
    }
    const g = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let a = Number.isFinite(g) && g > 0 ? g : NaN;
    if (!Number.isFinite(a)) {
      const H = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(H);
      a = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const d = n.style.transitionDuration, v = () => {
      n.removeEventListener("transitionend", T), clearTimeout(P), n.style.transitionDuration = d || "";
    }, T = (f) => {
      (!f || f.target === n) && (v(), p());
    }, P = setTimeout(() => {
      v(), p();
    }, a + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${a}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${x}px, ${M + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", T);
    });
  }
  return {
    onEnter: m,
    onBeforeEnter: i,
    onBeforeLeave: w,
    onLeave: b
  };
}
function Qt({
  container: e,
  masonry: l,
  columns: r,
  containerHeight: t,
  isLoading: y,
  pageSize: h,
  refreshLayout: m,
  setItemsRaw: i,
  loadNext: w,
  loadThresholdPx: b
}) {
  let n = 0;
  async function p(x) {
    if (!e.value) return;
    const M = x ?? De(l.value, r.value), s = M.length ? Math.max(...M) : 0, g = e.value.scrollTop + e.value.clientHeight, a = e.value.scrollTop > n + 1;
    n = e.value.scrollTop;
    const d = typeof b == "number" ? b : 200, v = d >= 0 ? Math.max(0, s - d) : Math.max(0, s + d);
    if (g >= v && a && !y.value) {
      await w(), await q();
      return;
    }
  }
  return {
    handleScroll: p
  };
}
function Zt(e) {
  const { useSwipeMode: l, masonry: r, isLoading: t, loadNext: y, loadPage: h, paginationHistory: m } = e, i = D(0), w = D(0), b = D(!1), n = D(0), p = D(0), x = D(null), M = Q(() => {
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
    g.value && (i.value--, a());
  }
  function T(o) {
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
    Math.abs(u) > 100 ? u > 0 && g.value ? v() : u < 0 && s.value ? d() : a() : a(), o.preventDefault();
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
    Math.abs(u) > 100 ? u > 0 && g.value ? v() : u < 0 && s.value ? d() : a() : a(), o.preventDefault();
  }
  function k() {
    !l.value && i.value > 0 && (i.value = 0, w.value = 0), l.value && r.value.length === 0 && !t.value && h(m.value[0]), l.value && a();
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
function he(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function ea(e) {
  const {
    getNextPage: l,
    masonry: r,
    isLoading: t,
    hasReachedEnd: y,
    loadError: h,
    currentPage: m,
    paginationHistory: i,
    refreshLayout: w,
    retryMaxAttempts: b,
    retryInitialDelayMs: n,
    retryBackoffStepMs: p,
    backfillEnabled: x,
    backfillDelayMs: M,
    backfillMaxCalls: s,
    pageSize: g,
    autoRefreshOnEmpty: a,
    emits: d
  } = e, v = D(!1);
  let T = !1;
  function P(u, E) {
    return new Promise(($) => {
      const C = Math.max(0, u | 0), F = Date.now();
      E(C, C);
      const N = setInterval(() => {
        if (v.value) {
          clearInterval(N), $();
          return;
        }
        const j = Date.now() - F, X = Math.max(0, C - j);
        E(X, C), X <= 0 && (clearInterval(N), $());
      }, 100);
    });
  }
  async function I(u) {
    let E = 0;
    const $ = b;
    let C = n;
    for (; ; )
      try {
        const F = await u();
        return E > 0 && d("retry:stop", { attempt: E, success: !0 }), F;
      } catch (F) {
        if (E++, E > $)
          throw d("retry:stop", { attempt: E - 1, success: !1 }), F;
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
    if (!E && !x || T || v.value || y.value) return;
    const $ = (u || 0) + (g || 0);
    if (!g || g <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      y.value = !0;
      return;
    }
    if (!(r.value.length >= $)) {
      T = !0, t.value = !0;
      try {
        let F = 0;
        for (d("backfill:start", { target: $, fetched: r.value.length, calls: F }); r.value.length < $ && F < s && i.value[i.value.length - 1] != null && !v.value && !y.value && T && (await P(M, (j, X) => {
          d("backfill:tick", {
            fetched: r.value.length,
            target: $,
            calls: F,
            remainingMs: j,
            totalMs: X
          });
        }), !(v.value || !T)); ) {
          const N = i.value[i.value.length - 1];
          if (N == null) {
            y.value = !0;
            break;
          }
          try {
            if (v.value || !T) break;
            const j = await f(N);
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
        T = !1, t.value = !1;
      }
    }
  }
  async function L(u) {
    if (!t.value) {
      v.value = !1, t.value = !0, y.value = !1, h.value = null;
      try {
        const E = r.value.length;
        if (v.value) return;
        const $ = await f(u);
        return v.value ? void 0 : (h.value = null, m.value = u, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await H(E), $);
      } catch (E) {
        throw h.value = he(E), E;
      } finally {
        t.value = !1;
      }
    }
  }
  async function k() {
    if (!t.value && !y.value) {
      v.value = !1, t.value = !0, h.value = null;
      try {
        const u = r.value.length;
        if (v.value) return;
        const E = i.value[i.value.length - 1];
        if (E == null) {
          y.value = !0, t.value = !1;
          return;
        }
        const $ = await f(E);
        return v.value ? void 0 : (h.value = null, m.value = E, i.value.push($.nextPage), $.nextPage == null && (y.value = !0), await H(u), $);
      } catch (u) {
        throw h.value = he(u), u;
      } finally {
        t.value = !1;
      }
    }
  }
  async function W() {
    if (!t.value) {
      v.value = !1, t.value = !0;
      try {
        const u = m.value;
        if (u == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", m.value, "paginationHistory:", i.value);
          return;
        }
        r.value = [], y.value = !1, h.value = null, i.value = [u];
        const E = await f(u);
        if (v.value) return;
        h.value = null, m.value = u, i.value.push(E.nextPage), E.nextPage == null && (y.value = !0);
        const $ = r.value.length;
        return await H($), E;
      } catch (u) {
        throw h.value = he(u), u;
      } finally {
        t.value = !1;
      }
    }
  }
  function o() {
    const u = T;
    v.value = !0, t.value = !1, T = !1, u && d("backfill:stop", { fetched: r.value.length, calls: 0, cancelled: !0 });
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
function ta(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    refreshLayout: t,
    refreshCurrentPage: y,
    loadNext: h,
    maybeBackfillToTarget: m,
    autoRefreshOnEmpty: i,
    paginationHistory: w
  } = e;
  async function b(s) {
    const g = l.value.filter((a) => a.id !== s.id);
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
    await new Promise((a) => requestAnimationFrame(() => a())), requestAnimationFrame(() => {
      t(g);
    });
  }
  async function n(s) {
    if (!s || s.length === 0) return;
    const g = new Set(s.map((d) => d.id)), a = l.value.filter((d) => !g.has(d.id));
    if (l.value = a, await q(), a.length === 0 && w.value.length > 0) {
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
      t(a);
    });
  }
  async function p(s, g) {
    if (!s) return;
    const a = l.value;
    if (a.findIndex((P) => P.id === s.id) !== -1) return;
    const v = [...a], T = Math.min(g, v.length);
    v.splice(T, 0, s), l.value = v, await q(), r.value || (await new Promise((P) => requestAnimationFrame(() => P())), requestAnimationFrame(() => {
      t(v);
    }));
  }
  async function x(s, g) {
    var L;
    if (!s || s.length === 0) return;
    if (!g || g.length !== s.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const a = l.value, d = new Set(a.map((k) => k.id)), v = [];
    for (let k = 0; k < s.length; k++)
      d.has((L = s[k]) == null ? void 0 : L.id) || v.push({ item: s[k], index: g[k] });
    if (v.length === 0) return;
    const T = /* @__PURE__ */ new Map();
    for (const { item: k, index: W } of v)
      T.set(W, k);
    const P = v.length > 0 ? Math.max(...v.map(({ index: k }) => k)) : -1, I = Math.max(a.length - 1, P), f = [];
    let H = 0;
    for (let k = 0; k <= I; k++)
      T.has(k) ? f.push(T.get(k)) : H < a.length && (f.push(a[H]), H++);
    for (; H < a.length; )
      f.push(a[H]), H++;
    l.value = f, await q(), r.value || (await new Promise((k) => requestAnimationFrame(() => k())), requestAnimationFrame(() => {
      t(f);
    }));
  }
  async function M() {
    l.value = [];
  }
  return {
    remove: b,
    removeMany: n,
    restore: p,
    restoreMany: x,
    removeAll: M
  };
}
function aa(e) {
  const {
    masonry: l,
    useSwipeMode: r,
    container: t,
    columns: y,
    containerWidth: h,
    masonryContentHeight: m,
    layout: i,
    fixedDimensions: w,
    checkItemDimensions: b
  } = e;
  let n = [];
  function p(g) {
    const a = Xt(g);
    let d = 0;
    if (t.value) {
      const { scrollTop: v, clientHeight: T } = t.value;
      d = v + T + 100;
    }
    m.value = Math.max(a, d);
  }
  function x(g) {
    var T, P;
    if (r.value) {
      l.value = g;
      return;
    }
    if (!t.value) return;
    if (b(g, "refreshLayout"), g.length > 1e3 && n.length > g.length && n.length - g.length < 100) {
      let I = !0;
      for (let f = 0; f < g.length; f++)
        if (((T = g[f]) == null ? void 0 : T.id) !== ((P = n[f]) == null ? void 0 : P.id)) {
          I = !1;
          break;
        }
      if (I) {
        const f = g.map((H, L) => ({
          ...n[L],
          originalIndex: L
        }));
        p(f), l.value = f, n = f;
        return;
      }
    }
    const d = g.map((I, f) => ({
      ...I,
      originalIndex: f
    })), v = t.value;
    if (w.value && w.value.width !== void 0) {
      const I = v.style.width, f = v.style.boxSizing;
      v.style.boxSizing = "border-box", v.style.width = `${w.value.width}px`, v.offsetWidth;
      const H = Ye(d, v, y.value, i.value);
      v.style.width = I, v.style.boxSizing = f, p(H), l.value = H, n = H;
    } else {
      const I = Ye(d, v, y.value, i.value);
      p(I), l.value = I, n = I;
    }
  }
  function M(g, a) {
    w.value = g, g && (g.width !== void 0 && (h.value = g.width), !r.value && t.value && l.value.length > 0 && q(() => {
      y.value = ue(i.value, h.value), x(l.value), a && a();
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
function na(e) {
  const {
    masonry: l,
    container: r,
    columns: t,
    virtualBufferPx: y,
    loadThresholdPx: h
  } = e, m = D(e.handleScroll), i = D(0), w = D(0), b = y, n = D(!1), p = D({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), x = Q(() => {
    const a = i.value - b, d = i.value + w.value + b, v = l.value;
    return !v || v.length === 0 ? [] : v.filter((P) => {
      if (typeof P.top != "number" || typeof P.columnHeight != "number")
        return !0;
      const I = P.top;
      return P.top + P.columnHeight >= a && I <= d;
    });
  });
  function M(a) {
    if (!r.value) return;
    const { scrollTop: d, clientHeight: v } = r.value, T = d + v, P = a ?? De(l.value, t.value), I = P.length ? Math.max(...P) : 0, f = typeof h == "number" ? h : 200, H = f >= 0 ? Math.max(0, I - f) : Math.max(0, I + f), L = Math.max(0, H - T), k = L <= 100;
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
    n.value = !0, await q(), await new Promise((d) => requestAnimationFrame(() => d())), n.value = !1;
    const a = De(l.value, t.value);
    m.value(a), M(a);
  }
  function g() {
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
    updateScrollProgress: M,
    updateViewport: s,
    reset: g,
    handleScroll: m
  };
}
function la(e) {
  const { masonry: l } = e, r = D(/* @__PURE__ */ new Set());
  function t(m) {
    return typeof m == "number" && m > 0 && Number.isFinite(m);
  }
  function y(m, i) {
    try {
      if (!Array.isArray(m) || m.length === 0) return;
      const w = m.filter((n) => !t(n == null ? void 0 : n.width) || !t(n == null ? void 0 : n.height));
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
  function h() {
    r.value.clear();
  }
  return {
    checkItemDimensions: y,
    invalidDimensionIds: r,
    reset: h
  };
}
const oa = { class: "flex-1 relative min-h-0" }, ra = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ia = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, sa = {
  key: 1,
  class: "relative w-full h-full"
}, ua = ["src"], ca = ["src", "autoplay", "controls"], va = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, fa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, da = {
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
    inSwipeMode: { type: Boolean, default: !1 }
  },
  emits: ["preload:success", "preload:error", "mouse-enter", "mouse-leave"],
  setup(e, { emit: l }) {
    const r = e, t = l, y = D(!1), h = D(!1), m = D(null), i = D(!1), w = D(!1), b = D(null), n = D(!1), p = D(!1), x = D(!1), M = D(null), s = D(null);
    let g = null;
    const a = Q(() => {
      var o;
      return r.type ?? ((o = r.item) == null ? void 0 : o.type) ?? "image";
    }), d = Q(() => {
      var o;
      return r.notFound ?? ((o = r.item) == null ? void 0 : o.notFound) ?? !1;
    }), v = Q(() => !!r.inSwipeMode);
    function T(o) {
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
      u && (v.value || u.play(), T("video"));
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
        const $ = new Image(), C = Date.now(), F = 300;
        $.onload = () => {
          const N = Date.now() - C, j = Math.max(0, F - N);
          setTimeout(async () => {
            y.value = !0, h.value = !1, p.value = !1, await q(), await new Promise((X) => setTimeout(X, 100)), x.value = !0, t("preload:success", { item: r.item, type: "image", src: o }), u();
          }, j);
        }, $.onerror = () => {
          h.value = !0, y.value = !1, p.value = !1;
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
        const $ = document.createElement("video"), C = Date.now(), F = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const N = Date.now() - C, j = Math.max(0, F - N);
          setTimeout(async () => {
            i.value = !0, w.value = !1, p.value = !1, await q(), await new Promise((X) => setTimeout(X, 100)), x.value = !0, t("preload:success", { item: r.item, type: "video", src: o }), u();
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
          m.value = o, y.value = !1, h.value = !1;
          try {
            await L(o);
          } catch {
          }
        }
    }
    return Qe(() => {
      M.value && (g = new IntersectionObserver(
        (o) => {
          o.forEach((u) => {
            u.isIntersecting && u.intersectionRatio >= 1 ? n.value || (n.value = !0, W()) : u.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), g.observe(M.value));
    }), Ze(() => {
      g && (g.disconnect(), g = null);
    }), ee(
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
          } else if (o !== m.value && (y.value = !1, h.value = !1, m.value = o, n.value)) {
            p.value = !0;
            try {
              await L(o);
            } catch {
            }
          }
        }
      }
    ), ee(
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
          mediaType: a.value
        })
      ], 4)) : te("", !0),
      V("div", oa, [
        _(o.$slots, "default", {
          item: o.item,
          remove: o.remove,
          imageLoaded: y.value,
          imageError: h.value,
          videoLoaded: i.value,
          videoError: w.value,
          showNotFound: d.value,
          isLoading: p.value,
          mediaType: a.value,
          imageSrc: m.value,
          videoSrc: b.value,
          showMedia: x.value
        }, () => [
          V("div", ra, [
            d.value ? (O(), R("div", ia, u[3] || (u[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (O(), R("div", sa, [
              a.value === "image" && m.value ? (O(), R("img", {
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
                onMouseenter: u[0] || (u[0] = (E) => T("image")),
                onMouseleave: u[1] || (u[1] = (E) => P("image"))
              }, null, 42, ua)) : te("", !0),
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
                onClick: je(I, ["stop"]),
                onTouchend: je(I, ["stop", "prevent"]),
                onMouseenter: f,
                onMouseleave: H,
                onError: u[2] || (u[2] = (E) => w.value = !0)
              }, null, 42, ca)) : te("", !0),
              !y.value && !i.value && !h.value && !w.value ? (O(), R("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  x.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", va, [
                  _(o.$slots, "placeholder-icon", { mediaType: a.value }, () => [
                    V("i", {
                      class: re(a.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : te("", !0),
              p.value ? (O(), R("div", fa, u[4] || (u[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : te("", !0),
              a.value === "image" && h.value || a.value === "video" && w.value ? (O(), R("div", da, [
                V("i", {
                  class: re(a.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + $e(a.value), 1)
              ])) : te("", !0)
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
          mediaType: a.value
        })
      ], 4)) : te("", !0)
    ], 512));
  }
}), ma = { class: "w-full h-full flex items-center justify-center p-4" }, ha = { class: "w-full h-full max-w-full max-h-full relative" }, ga = {
  key: 0,
  class: "w-full py-8 text-center"
}, pa = {
  key: 1,
  class: "w-full py-8 text-center"
}, ya = { class: "text-red-500 dark:text-red-400" }, wa = {
  key: 0,
  class: "w-full py-8 text-center"
}, xa = {
  key: 1,
  class: "w-full py-8 text-center"
}, ba = { class: "text-red-500 dark:text-red-400" }, Ma = /* @__PURE__ */ Ke({
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
    }, h = Q(() => {
      var c;
      return {
        ...y,
        ...t.layout,
        sizes: {
          ...y.sizes,
          ...((c = t.layout) == null ? void 0 : c.sizes) || {}
        }
      };
    }), m = D(null), i = D(typeof window < "u" ? window.innerWidth : 1024), w = D(typeof window < "u" ? window.innerHeight : 768), b = D(null);
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
    const x = Q(() => {
      if (t.layoutMode === "masonry") return !1;
      if (t.layoutMode === "swipe") return !0;
      const c = typeof t.mobileBreakpoint == "string" ? p(t.mobileBreakpoint) : t.mobileBreakpoint;
      return i.value < c;
    }), M = r, s = Q({
      get: () => t.items,
      set: (c) => M("update:items", c)
    }), g = D(7), a = D(null), d = D([]), v = D(null), T = D(!1), P = D(0), I = D(!1), f = D(null), H = Q(() => _t(i.value)), L = la({
      masonry: s
    }), { checkItemDimensions: k, reset: W } = L, o = aa({
      masonry: s,
      useSwipeMode: x,
      container: a,
      columns: g,
      containerWidth: i,
      masonryContentHeight: P,
      layout: h,
      fixedDimensions: b,
      checkItemDimensions: k
    }), { refreshLayout: u, setFixedDimensions: E, onResize: $ } = o, C = na({
      masonry: s,
      container: a,
      columns: g,
      virtualBufferPx: t.virtualBufferPx,
      loadThresholdPx: t.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: F, viewportHeight: N, virtualizing: j, visibleMasonry: X, updateScrollProgress: z, updateViewport: Y, reset: G } = C, { onEnter: ne, onBeforeEnter: J, onBeforeLeave: ie, onLeave: Z } = Kt(
      { container: a },
      { leaveDurationMs: t.leaveDurationMs, virtualizing: j }
    ), at = ne, nt = J, lt = ie, ot = Z, rt = ea({
      getNextPage: t.getNextPage,
      masonry: s,
      isLoading: T,
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
      emits: M
    }), { loadPage: Me, loadNext: pe, refreshCurrentPage: ze, cancelLoad: Te, maybeBackfillToTarget: it } = rt, K = Zt({
      useSwipeMode: x,
      masonry: s,
      isLoading: T,
      loadNext: pe,
      loadPage: Me,
      paginationHistory: d
    }), { handleScroll: st } = Qt({
      container: a,
      masonry: s,
      columns: g,
      containerHeight: P,
      isLoading: T,
      pageSize: t.pageSize,
      refreshLayout: u,
      setItemsRaw: (c) => {
        s.value = c;
      },
      loadNext: pe,
      loadThresholdPx: t.loadThresholdPx
    });
    C.handleScroll.value = st;
    const ut = ta({
      masonry: s,
      useSwipeMode: x,
      refreshLayout: u,
      refreshCurrentPage: ze,
      loadNext: pe,
      maybeBackfillToTarget: it,
      autoRefreshOnEmpty: t.autoRefreshOnEmpty,
      paginationHistory: d
    }), { remove: ce, removeMany: ct, restore: vt, restoreMany: ft, removeAll: dt } = ut;
    function mt(c) {
      E(c, z), !c && m.value && (i.value = m.value.clientWidth, w.value = m.value.clientHeight);
    }
    l({
      isLoading: T,
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
      setFixedDimensions: mt,
      remove: ce,
      removeMany: ct,
      removeAll: dt,
      restore: vt,
      restoreMany: ft,
      loadNext: pe,
      loadPage: Me,
      refreshCurrentPage: ze,
      reset: yt,
      destroy: wt,
      init: Ce,
      restoreItems: Le,
      paginationHistory: d,
      cancelLoad: Te,
      scrollToTop: ht,
      scrollTo: gt,
      totalItems: Q(() => s.value.length),
      currentBreakpoint: H
    });
    const se = K.currentSwipeIndex, ve = K.swipeOffset, ye = K.isDragging, le = K.swipeContainer, Be = K.handleTouchStart, Fe = K.handleTouchMove, Ae = K.handleTouchEnd, We = K.handleMouseDown, Ie = K.handleMouseMove, Ee = K.handleMouseUp, ke = K.snapToCurrentItem;
    function ht(c) {
      a.value && a.value.scrollTo({
        top: 0,
        behavior: (c == null ? void 0 : c.behavior) ?? "smooth",
        ...c
      });
    }
    function gt(c) {
      a.value && (a.value.scrollTo({
        top: c.top ?? a.value.scrollTop,
        left: c.left ?? a.value.scrollLeft,
        behavior: c.behavior ?? "auto"
      }), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight));
    }
    function pt() {
      $(), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight);
    }
    function yt() {
      Te(), a.value && a.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), s.value = [], w.value = 0, v.value = t.loadAtPage, d.value = [t.loadAtPage], I.value = !1, f.value = null, G(), we = !1;
    }
    function wt() {
      Te(), s.value = [], P.value = 0, v.value = null, d.value = [], I.value = !1, f.value = null, T.value = !1, se.value = 0, ve.value = 0, ye.value = !1, G(), W(), a.value && a.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ge(async () => {
      x.value || await Y();
    }, 200), Re = Ge(pt, 200);
    function Oe() {
      K.handleWindowResize();
    }
    function Ce(c, S, B) {
      v.value = S, d.value = [S], d.value.push(B), I.value = B == null, k(c, "init"), x.value ? (s.value = [...s.value, ...c], se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (u([...s.value, ...c]), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight), q(() => {
        a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight, z());
      }));
    }
    async function Le(c, S, B) {
      if (!t.skipInitialLoad) {
        Ce(c, S, B);
        return;
      }
      v.value = S, d.value = [S], B != null && d.value.push(B), I.value = B === null, f.value = null, k(c, "restoreItems"), x.value ? (s.value = c, se.value === 0 && s.value.length > 0 && (ve.value = 0)) : (u(c), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight), await q(), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight || window.innerHeight, z()));
    }
    ee(
      h,
      () => {
        x.value || a.value && (g.value = ue(h.value, i.value), u(s.value));
      },
      { deep: !0 }
    ), ee(() => t.layoutMode, () => {
      b.value && b.value.width !== void 0 ? i.value = b.value.width : m.value && (i.value = m.value.clientWidth);
    }), ee(a, (c) => {
      c && !x.value ? (c.removeEventListener("scroll", oe), c.addEventListener("scroll", oe, { passive: !0 })) : c && c.removeEventListener("scroll", oe);
    }, { immediate: !0 });
    let we = !1;
    return ee(
      () => [t.items, t.skipInitialLoad, t.initialPage, t.initialNextPage],
      ([c, S, B, ae]) => {
        if (S && c && c.length > 0 && !we) {
          we = !0;
          const A = B ?? t.loadAtPage;
          Le(c, A, ae !== void 0 ? ae : void 0);
        }
      },
      { immediate: !1 }
    ), ee(x, (c, S) => {
      S === void 0 && c === !1 || q(() => {
        c ? (document.addEventListener("mousemove", Ie), document.addEventListener("mouseup", Ee), a.value && a.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, s.value.length > 0 && ke()) : (document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee), a.value && m.value && (b.value && b.value.width !== void 0 ? i.value = b.value.width : i.value = m.value.clientWidth, a.value.removeEventListener("scroll", oe), a.value.addEventListener("scroll", oe, { passive: !0 }), s.value.length > 0 && (g.value = ue(h.value, i.value), u(s.value), F.value = a.value.scrollTop, N.value = a.value.clientHeight, z())));
      });
    }, { immediate: !0 }), ee(le, (c) => {
      c && (c.addEventListener("touchstart", Be, { passive: !1 }), c.addEventListener("touchmove", Fe, { passive: !1 }), c.addEventListener("touchend", Ae), c.addEventListener("mousedown", We));
    }), ee(() => s.value.length, (c, S) => {
      x.value && c > 0 && S === 0 && (se.value = 0, q(() => ke()));
    }), ee(m, (c) => {
      n && (n.disconnect(), n = null), c && typeof ResizeObserver < "u" ? (n = new ResizeObserver((S) => {
        if (!b.value)
          for (const B of S) {
            const ae = B.contentRect.width, A = B.contentRect.height;
            i.value !== ae && (i.value = ae), w.value !== A && (w.value = A);
          }
      }), n.observe(c), b.value || (i.value = c.clientWidth, w.value = c.clientHeight)) : c && (b.value || (i.value = c.clientWidth, w.value = c.clientHeight));
    }, { immediate: !0 }), ee(i, (c, S) => {
      c !== S && c > 0 && !x.value && a.value && s.value.length > 0 && q(() => {
        g.value = ue(h.value, c), u(s.value), z();
      });
    }), Qe(async () => {
      try {
        await q(), m.value && !n && (i.value = m.value.clientWidth, w.value = m.value.clientHeight), x.value || (g.value = ue(h.value, i.value), a.value && (F.value = a.value.scrollTop, N.value = a.value.clientHeight));
        const c = t.loadAtPage;
        if (d.value = [c], !t.skipInitialLoad)
          await Me(d.value[0]);
        else if (t.items && t.items.length > 0) {
          const S = t.initialPage !== null && t.initialPage !== void 0 ? t.initialPage : t.loadAtPage, B = t.initialNextPage !== void 0 ? t.initialNextPage : void 0;
          await Le(t.items, S, B), we = !0;
        }
        x.value ? q(() => ke()) : z();
      } catch (c) {
        f.value || (console.error("Error during component initialization:", c), f.value = he(c)), T.value = !1;
      }
      window.addEventListener("resize", Re), window.addEventListener("resize", Oe);
    }), Ze(() => {
      var c;
      n && (n.disconnect(), n = null), (c = a.value) == null || c.removeEventListener("scroll", oe), window.removeEventListener("resize", Re), window.removeEventListener("resize", Oe), le.value && (le.value.removeEventListener("touchstart", Be), le.value.removeEventListener("touchmove", Fe), le.value.removeEventListener("touchend", Ae), le.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee);
    }), (c, S) => (O(), R("div", {
      ref_key: "wrapper",
      ref: m,
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
          (O(!0), R(Ve, null, qe(s.value, (B, ae) => (O(), R("div", {
            key: `${B.page}-${B.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${ae * (100 / s.value.length)}%`,
              height: `${100 / s.value.length}%`
            })
          }, [
            V("div", ma, [
              V("div", ha, [
                _(c.$slots, "default", {
                  item: B,
                  remove: U(ce),
                  index: B.originalIndex ?? s.value.indexOf(B)
                }, () => [
                  Pe(be, {
                    item: B,
                    remove: U(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": ae === U(se),
                    "onPreload:success": S[0] || (S[0] = (A) => M("item:preload:success", A)),
                    "onPreload:error": S[1] || (S[1] = (A) => M("item:preload:error", A)),
                    onMouseEnter: S[2] || (S[2] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: S[3] || (S[3] = (A) => M("item:mouse-leave", A))
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
        I.value && s.value.length > 0 ? (O(), R("div", ga, [
          _(c.$slots, "end-message", {}, () => [
            S[8] || (S[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", pa, [
          _(c.$slots, "error-message", { error: f.value }, () => [
            V("p", ya, "Failed to load content: " + $e(f.value.message), 1)
          ], !0)
        ])) : te("", !0)
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
          Pe(xt, {
            name: "masonry",
            css: !1,
            onEnter: U(at),
            onBeforeEnter: U(nt),
            onLeave: U(ot),
            onBeforeLeave: U(lt)
          }, {
            default: fe(() => [
              (O(!0), R(Ve, null, qe(U(X), (B, ae) => (O(), R("div", de({
                key: `${B.page}-${B.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, U(Jt)(B, ae)), [
                _(c.$slots, "default", {
                  item: B,
                  remove: U(ce),
                  index: B.originalIndex ?? s.value.indexOf(B)
                }, () => [
                  Pe(be, {
                    item: B,
                    remove: U(ce),
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": S[4] || (S[4] = (A) => M("item:preload:success", A)),
                    "onPreload:error": S[5] || (S[5] = (A) => M("item:preload:error", A)),
                    onMouseEnter: S[6] || (S[6] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: S[7] || (S[7] = (A) => M("item:mouse-leave", A))
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
        I.value && s.value.length > 0 ? (O(), R("div", wa, [
          _(c.$slots, "end-message", {}, () => [
            S[9] || (S[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : te("", !0),
        f.value && s.value.length > 0 ? (O(), R("div", xa, [
          _(c.$slots, "error-message", { error: f.value }, () => [
            V("p", ba, "Failed to load content: " + $e(f.value.message), 1)
          ], !0)
        ])) : te("", !0)
      ], 2))
    ], 512));
  }
}), Ta = (e, l) => {
  const r = e.__vccOpts || e;
  for (const [t, y] of l)
    r[t] = y;
  return r;
}, Je = /* @__PURE__ */ Ta(Ma, [["__scopeId", "data-v-c6a3147d"]]), ka = {
  install(e) {
    e.component("WyxosMasonry", Je), e.component("WMasonry", Je), e.component("WyxosMasonryItem", be), e.component("WMasonryItem", be);
  }
};
export {
  Je as Masonry,
  be as MasonryItem,
  ka as default
};
