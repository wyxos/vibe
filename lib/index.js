import { nextTick as C, ref as N, computed as Q, defineComponent as Ge, onMounted as qe, onUnmounted as Je, watch as te, createElementBlock as U, openBlock as _, createCommentVNode as ae, createElementVNode as X, normalizeStyle as he, renderSlot as K, normalizeClass as ie, withModifiers as Ce, toDisplayString as He, unref as J, Fragment as Oe, renderList as Ae, createVNode as ke, withCtx as ve, mergeProps as fe, TransitionGroup as It } from "vue";
let Se = null;
function Lt() {
  if (Se != null) return Se;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const n = document.createElement("div");
  n.style.width = "100%", e.appendChild(n);
  const s = e.offsetWidth - n.offsetWidth;
  return document.body.removeChild(e), Se = s, s;
}
function Ve(e, n, s, a = {}) {
  const {
    gutterX: h = 0,
    gutterY: g = 0,
    header: f = 0,
    footer: l = 0,
    paddingLeft: i = 0,
    paddingRight: M = 0,
    sizes: t = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: T = "masonry"
  } = a;
  let I = 0, x = 0;
  try {
    if (n && n.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const k = window.getComputedStyle(n);
      I = parseFloat(k.paddingLeft) || 0, x = parseFloat(k.paddingRight) || 0;
    }
  } catch {
  }
  const m = (i || 0) + I, L = (M || 0) + x, S = n.offsetWidth - n.clientWidth, d = S > 0 ? S + 2 : Lt() + 2, c = n.offsetWidth - d - m - L, r = h * (s - 1), b = Math.floor((c - r) / s), P = e.map((k) => {
    const H = k.width, W = k.height;
    return Math.round(b * W / H) + l + f;
  });
  if (T === "sequential-balanced") {
    const k = P.length;
    if (k === 0) return [];
    const H = (w, F, B) => w + (F > 0 ? g : 0) + B;
    let W = Math.max(...P), E = P.reduce((w, F) => w + F, 0) + g * Math.max(0, k - 1);
    const z = (w) => {
      let F = 1, B = 0, Y = 0;
      for (let q = 0; q < k; q++) {
        const ne = P[q], G = H(B, Y, ne);
        if (G <= w)
          B = G, Y++;
        else if (F++, B = ne, Y = 1, ne > w || F > s) return !1;
      }
      return F <= s;
    };
    for (; W < E; ) {
      const w = Math.floor((W + E) / 2);
      z(w) ? E = w : W = w + 1;
    }
    const Z = E, o = new Array(s).fill(0);
    let v = s - 1, y = 0, R = 0;
    for (let w = k - 1; w >= 0; w--) {
      const F = P[w], B = w < v;
      !(H(y, R, F) <= Z) || B ? (o[v] = w + 1, v--, y = F, R = 1) : (y = H(y, R, F), R++);
    }
    o[0] = 0;
    const O = [], j = new Array(s).fill(0);
    for (let w = 0; w < s; w++) {
      const F = o[w], B = w + 1 < s ? o[w + 1] : k, Y = w * (b + h);
      for (let q = F; q < B; q++) {
        const G = {
          ...e[q],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        G.imageHeight = P[q] - (l + f), G.columnHeight = P[q], G.left = Y, G.top = j[w], j[w] += G.columnHeight + (q + 1 < B ? g : 0), O.push(G);
      }
    }
    return O;
  }
  const p = new Array(s).fill(0), D = [];
  for (let k = 0; k < e.length; k++) {
    const H = e[k], W = {
      ...H,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, E = p.indexOf(Math.min(...p)), z = H.width, Z = H.height;
    W.columnWidth = b, W.left = E * (b + h), W.imageHeight = Math.round(b * Z / z), W.columnHeight = W.imageHeight + l + f, W.top = p[E], p[E] += W.columnHeight + g, D.push(W);
  }
  return D;
}
var kt = typeof global == "object" && global && global.Object === Object && global, St = typeof self == "object" && self && self.Object === Object && self, Ke = kt || St || Function("return this")(), we = Ke.Symbol, Qe = Object.prototype, Et = Qe.hasOwnProperty, Ht = Qe.toString, de = we ? we.toStringTag : void 0;
function $t(e) {
  var n = Et.call(e, de), s = e[de];
  try {
    e[de] = void 0;
    var a = !0;
  } catch {
  }
  var h = Ht.call(e);
  return a && (n ? e[de] = s : delete e[de]), h;
}
var Nt = Object.prototype, zt = Nt.toString;
function Dt(e) {
  return zt.call(e);
}
var Bt = "[object Null]", Wt = "[object Undefined]", je = we ? we.toStringTag : void 0;
function Rt(e) {
  return e == null ? e === void 0 ? Wt : Bt : je && je in Object(e) ? $t(e) : Dt(e);
}
function Ft(e) {
  return e != null && typeof e == "object";
}
var Ct = "[object Symbol]";
function Ot(e) {
  return typeof e == "symbol" || Ft(e) && Rt(e) == Ct;
}
var At = /\s/;
function Vt(e) {
  for (var n = e.length; n-- && At.test(e.charAt(n)); )
    ;
  return n;
}
var jt = /^\s+/;
function Yt(e) {
  return e && e.slice(0, Vt(e) + 1).replace(jt, "");
}
function $e(e) {
  var n = typeof e;
  return e != null && (n == "object" || n == "function");
}
var Ye = NaN, Ut = /^[-+]0x[0-9a-f]+$/i, _t = /^0b[01]+$/i, Xt = /^0o[0-7]+$/i, Gt = parseInt;
function Ue(e) {
  if (typeof e == "number")
    return e;
  if (Ot(e))
    return Ye;
  if ($e(e)) {
    var n = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = $e(n) ? n + "" : n;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Yt(e);
  var s = _t.test(e);
  return s || Xt.test(e) ? Gt(e.slice(2), s ? 2 : 8) : Ut.test(e) ? Ye : +e;
}
var Ee = function() {
  return Ke.Date.now();
}, qt = "Expected a function", Jt = Math.max, Kt = Math.min;
function _e(e, n, s) {
  var a, h, g, f, l, i, M = 0, t = !1, T = !1, I = !0;
  if (typeof e != "function")
    throw new TypeError(qt);
  n = Ue(n) || 0, $e(s) && (t = !!s.leading, T = "maxWait" in s, g = T ? Jt(Ue(s.maxWait) || 0, n) : g, I = "trailing" in s ? !!s.trailing : I);
  function x(p) {
    var D = a, k = h;
    return a = h = void 0, M = p, f = e.apply(k, D), f;
  }
  function m(p) {
    return M = p, l = setTimeout(d, n), t ? x(p) : f;
  }
  function L(p) {
    var D = p - i, k = p - M, H = n - D;
    return T ? Kt(H, g - k) : H;
  }
  function S(p) {
    var D = p - i, k = p - M;
    return i === void 0 || D >= n || D < 0 || T && k >= g;
  }
  function d() {
    var p = Ee();
    if (S(p))
      return c(p);
    l = setTimeout(d, L(p));
  }
  function c(p) {
    return l = void 0, I && a ? x(p) : (a = h = void 0, f);
  }
  function r() {
    l !== void 0 && clearTimeout(l), M = 0, a = i = h = l = void 0;
  }
  function b() {
    return l === void 0 ? f : c(Ee());
  }
  function P() {
    var p = Ee(), D = S(p);
    if (a = arguments, h = this, i = p, D) {
      if (l === void 0)
        return m(i);
      if (T)
        return clearTimeout(l), l = setTimeout(d, n), x(i);
    }
    return l === void 0 && (l = setTimeout(d, n)), f;
  }
  return P.cancel = r, P.flush = b, P;
}
function se(e, n) {
  const s = n ?? (typeof window < "u" ? window.innerWidth : 1024), a = e.sizes;
  return s >= 1536 && a["2xl"] ? a["2xl"] : s >= 1280 && a.xl ? a.xl : s >= 1024 && a.lg ? a.lg : s >= 768 && a.md ? a.md : s >= 640 && a.sm ? a.sm : a.base;
}
function Qt(e) {
  const n = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return n >= 1536 ? "2xl" : n >= 1280 ? "xl" : n >= 1024 ? "lg" : n >= 768 ? "md" : n >= 640 ? "sm" : "base";
}
function Zt(e) {
  return e.reduce((s, a) => Math.max(s, a.top + a.columnHeight), 0) + 500;
}
function ea(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function ta(e, n = 0) {
  return {
    style: ea(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": n
  };
}
function Ne(e, n) {
  if (!e.length || n <= 0)
    return new Array(Math.max(1, n)).fill(0);
  const a = Array.from(new Set(e.map((f) => f.left))).sort((f, l) => f - l).slice(0, n), h = /* @__PURE__ */ new Map();
  for (let f = 0; f < a.length; f++) h.set(a[f], f);
  const g = new Array(a.length).fill(0);
  for (const f of e) {
    const l = h.get(f.left);
    l != null && (g[l] = Math.max(g[l], f.top + f.columnHeight));
  }
  for (; g.length < n; ) g.push(0);
  return g;
}
function aa(e, n) {
  let s = 0, a = 0;
  const h = 1e3;
  function g(t, T) {
    var m;
    const I = (m = e.container) == null ? void 0 : m.value;
    if (I) {
      const L = I.scrollTop, S = I.clientHeight;
      s = L - h, a = L + S + h;
    }
    return t + T >= s && t <= a;
  }
  function f(t, T) {
    var r;
    const I = parseInt(t.dataset.left || "0", 10), x = parseInt(t.dataset.top || "0", 10), m = parseInt(t.dataset.index || "0", 10), L = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((r = n == null ? void 0 : n.virtualizing) != null && r.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${I}px, ${x}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "", T();
      return;
    }
    if (!g(x, L)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${I}px, ${x}px, 0) scale(1)`, t.style.transition = "none", T();
      return;
    }
    const S = Math.min(m * 20, 160), d = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${S}ms`), t.style.opacity = "1", t.style.transform = `translate3d(${I}px, ${x}px, 0) scale(1)`;
    const c = () => {
      d ? t.style.setProperty("--masonry-opacity-delay", d) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", c), T();
    };
    t.addEventListener("transitionend", c);
  }
  function l(t) {
    var x;
    const T = parseInt(t.dataset.left || "0", 10), I = parseInt(t.dataset.top || "0", 10);
    if ((x = n == null ? void 0 : n.virtualizing) != null && x.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${I}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${T}px, ${I + 10}px, 0) scale(0.985)`;
  }
  function i(t) {
    var m;
    const T = parseInt(t.dataset.left || "0", 10), I = parseInt(t.dataset.top || "0", 10), x = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((m = n == null ? void 0 : n.virtualizing) != null && m.value)) {
      if (!g(I, x)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${I}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "";
    }
  }
  function M(t, T) {
    var P;
    const I = parseInt(t.dataset.left || "0", 10), x = parseInt(t.dataset.top || "0", 10), m = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((P = n == null ? void 0 : n.virtualizing) != null && P.value) {
      T();
      return;
    }
    if (!g(x, m)) {
      t.style.transition = "none", t.style.opacity = "0", T();
      return;
    }
    const L = typeof (n == null ? void 0 : n.leaveDurationMs) == "number" ? n.leaveDurationMs : Number.NaN;
    let S = Number.isFinite(L) && L > 0 ? L : Number.NaN;
    if (!Number.isFinite(S)) {
      const D = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", k = parseFloat(D);
      S = Number.isFinite(k) && k > 0 ? k : 200;
    }
    const d = t.style.transitionDuration, c = () => {
      t.removeEventListener("transitionend", r), clearTimeout(b), t.style.transitionDuration = d || "";
    }, r = (p) => {
      (!p || p.target === t) && (c(), T());
    }, b = setTimeout(() => {
      c(), T();
    }, S + 100);
    t.style.transitionDuration = `${S}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${I}px, ${x + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", r);
  }
  return {
    onEnter: f,
    onBeforeEnter: l,
    onBeforeLeave: i,
    onLeave: M
  };
}
function na({
  container: e,
  masonry: n,
  columns: s,
  containerHeight: a,
  isLoading: h,
  pageSize: g,
  refreshLayout: f,
  setItemsRaw: l,
  loadNext: i,
  loadThresholdPx: M
}) {
  let t = 0;
  async function T(I, x = !1) {
    if (!e.value) return;
    const m = I ?? Ne(n.value, s.value), L = m.length ? Math.max(...m) : 0, S = e.value.scrollTop + e.value.clientHeight, d = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const c = typeof M == "number" ? M : 200, r = c >= 0 ? Math.max(0, L - c) : Math.max(0, L + c);
    if (S >= r && (d || x) && !h.value) {
      await i(), await C();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
function la(e) {
  const { useSwipeMode: n, masonry: s, isLoading: a, loadNext: h, loadPage: g, paginationHistory: f } = e, l = N(0), i = N(0), M = N(!1), t = N(0), T = N(0), I = N(null), x = Q(() => {
    if (!n.value || s.value.length === 0) return null;
    const E = Math.max(0, Math.min(l.value, s.value.length - 1));
    return s.value[E] || null;
  }), m = Q(() => {
    if (!n.value || !x.value) return null;
    const E = l.value + 1;
    return E >= s.value.length ? null : s.value[E] || null;
  }), L = Q(() => {
    if (!n.value || !x.value) return null;
    const E = l.value - 1;
    return E < 0 ? null : s.value[E] || null;
  });
  function S() {
    if (!I.value) return;
    const E = I.value.clientHeight;
    i.value = -l.value * E;
  }
  function d() {
    if (!m.value) {
      h();
      return;
    }
    l.value++, S(), l.value >= s.value.length - 5 && h();
  }
  function c() {
    L.value && (l.value--, S());
  }
  function r(E) {
    n.value && (M.value = !0, t.value = E.touches[0].clientY, T.value = i.value, E.preventDefault());
  }
  function b(E) {
    if (!n.value || !M.value) return;
    const z = E.touches[0].clientY - t.value;
    i.value = T.value + z, E.preventDefault();
  }
  function P(E) {
    if (!n.value || !M.value) return;
    M.value = !1;
    const z = i.value - T.value;
    Math.abs(z) > 100 ? z > 0 && L.value ? c() : z < 0 && m.value ? d() : S() : S(), E.preventDefault();
  }
  function p(E) {
    n.value && (M.value = !0, t.value = E.clientY, T.value = i.value, E.preventDefault());
  }
  function D(E) {
    if (!n.value || !M.value) return;
    const z = E.clientY - t.value;
    i.value = T.value + z, E.preventDefault();
  }
  function k(E) {
    if (!n.value || !M.value) return;
    M.value = !1;
    const z = i.value - T.value;
    Math.abs(z) > 100 ? z > 0 && L.value ? c() : z < 0 && m.value ? d() : S() : S(), E.preventDefault();
  }
  function H() {
    !n.value && l.value > 0 && (l.value = 0, i.value = 0), n.value && s.value.length === 0 && !a.value && g(f.value[0]), n.value && S();
  }
  function W() {
    l.value = 0, i.value = 0, M.value = !1;
  }
  return {
    // State
    currentSwipeIndex: l,
    swipeOffset: i,
    isDragging: M,
    swipeContainer: I,
    // Computed
    currentItem: x,
    nextItem: m,
    previousItem: L,
    // Functions
    handleTouchStart: r,
    handleTouchMove: b,
    handleTouchEnd: P,
    handleMouseDown: p,
    handleMouseMove: D,
    handleMouseUp: k,
    goToNextItem: d,
    goToPreviousItem: c,
    snapToCurrentItem: S,
    handleWindowResize: H,
    reset: W
  };
}
function ge(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function oa(e) {
  const {
    getPage: n,
    context: s,
    masonry: a,
    isLoading: h,
    hasReachedEnd: g,
    loadError: f,
    currentPage: l,
    paginationHistory: i,
    refreshLayout: M,
    retryMaxAttempts: t,
    retryInitialDelayMs: T,
    retryBackoffStepMs: I,
    mode: x,
    backfillDelayMs: m,
    backfillMaxCalls: L,
    pageSize: S,
    emits: d
  } = e, c = typeof x == "string" ? N(x) : x, r = N(!1);
  let b = !1;
  function P(o) {
    return a.value.filter((v) => v.page === o).length;
  }
  function p(o, v) {
    return new Promise((y) => {
      const R = Math.max(0, o | 0), O = Date.now();
      v(R, R);
      const j = setInterval(() => {
        if (r.value) {
          clearInterval(j), y();
          return;
        }
        const w = Date.now() - O, F = Math.max(0, R - w);
        v(F, R), F <= 0 && (clearInterval(j), y());
      }, 100);
    });
  }
  async function D(o) {
    let v = 0;
    const y = t;
    let R = T;
    for (; ; )
      try {
        const O = await o();
        return v > 0 && d("retry:stop", { attempt: v, success: !0 }), O;
      } catch (O) {
        if (v++, v > y)
          throw d("retry:stop", { attempt: v - 1, success: !1 }), O;
        d("retry:start", { attempt: v, max: y, totalMs: R }), await p(R, (j, w) => {
          d("retry:tick", { attempt: v, remainingMs: j, totalMs: w });
        }), R += I;
      }
  }
  async function k(o) {
    try {
      const v = await D(() => n(o, s == null ? void 0 : s.value)), y = [...a.value, ...v.items];
      return a.value = y, await C(), await C(), await C(), M(y), v;
    } catch (v) {
      throw v;
    }
  }
  async function H(o, v = !1) {
    if (!v && c.value !== "backfill" || b || r.value || g.value) return;
    const y = (o || 0) + (S || 0);
    if (!S || S <= 0) return;
    if (i.value[i.value.length - 1] == null) {
      g.value = !0;
      return;
    }
    if (!(a.value.length >= y)) {
      b = !0, h.value || (h.value = !0, d("loading:start"));
      try {
        let O = 0;
        const j = l.value, w = i.value[i.value.length - 1];
        for (d("backfill:start", {
          target: y,
          fetched: a.value.length,
          calls: O,
          currentPage: j,
          nextPage: w
        }); a.value.length < y && O < L && i.value[i.value.length - 1] != null && !r.value && !g.value && b; ) {
          const Y = l.value, q = i.value[i.value.length - 1];
          if (await p(m, (G, be) => {
            d("backfill:tick", {
              fetched: a.value.length,
              target: y,
              calls: O,
              remainingMs: G,
              totalMs: be,
              currentPage: Y,
              nextPage: q
            });
          }), r.value || !b) break;
          const ne = i.value[i.value.length - 1];
          if (ne == null) {
            g.value = !0;
            break;
          }
          try {
            if (r.value || !b) break;
            const G = await k(ne);
            if (r.value || !b) break;
            f.value = null, l.value = ne, i.value.push(G.nextPage), G.nextPage == null && (g.value = !0);
          } catch (G) {
            if (r.value || !b) break;
            f.value = ge(G);
          }
          O++;
        }
        const F = l.value, B = i.value[i.value.length - 1];
        d("backfill:stop", {
          fetched: a.value.length,
          calls: O,
          currentPage: F,
          nextPage: B
        });
      } finally {
        b = !1, h.value = !1;
        const O = l.value, j = i.value[i.value.length - 1];
        d("loading:stop", {
          fetched: a.value.length,
          currentPage: O,
          nextPage: j
        });
      }
    }
  }
  async function W(o) {
    if (!h.value) {
      r.value = !1, h.value || (h.value = !0, d("loading:start")), g.value = !1, f.value = null;
      try {
        const v = a.value.length;
        if (r.value) return;
        const y = await k(o);
        return r.value ? void 0 : (f.value = null, l.value = o, i.value.push(y.nextPage), y.nextPage == null && (g.value = !0), await H(v), y);
      } catch (v) {
        throw f.value = ge(v), v;
      } finally {
        h.value = !1;
        const v = l.value, y = i.value[i.value.length - 1];
        d("loading:stop", {
          fetched: a.value.length,
          currentPage: v,
          nextPage: y
        });
      }
    }
  }
  async function E() {
    if (!h.value && !g.value) {
      r.value = !1, h.value || (h.value = !0, d("loading:start")), f.value = null;
      try {
        const o = a.value.length;
        if (r.value) return;
        if (c.value === "refresh" && l.value != null && P(l.value) < S) {
          const O = await D(() => n(l.value, s == null ? void 0 : s.value));
          if (r.value) return;
          const j = [...a.value], w = O.items.filter((B) => !B || B.id == null || B.page == null ? !1 : !j.some((Y) => Y && Y.id === B.id && Y.page === B.page));
          if (w.length > 0) {
            const B = [...a.value, ...w];
            a.value = B, await C(), await C(), await C(), M(B);
          }
          if (f.value = null, w.length === 0) {
            const B = i.value[i.value.length - 1];
            if (B == null) {
              g.value = !0;
              return;
            }
            const Y = await k(B);
            return r.value ? void 0 : (f.value = null, l.value = B, i.value.push(Y.nextPage), Y.nextPage == null && (g.value = !0), await H(o), Y);
          }
          if (P(l.value) >= S) {
            const B = i.value[i.value.length - 1];
            if (B == null) {
              g.value = !0;
              return;
            }
            const Y = await k(B);
            return r.value ? void 0 : (f.value = null, l.value = B, i.value.push(Y.nextPage), Y.nextPage == null && (g.value = !0), await H(o), Y);
          } else
            return O;
        }
        const v = i.value[i.value.length - 1];
        if (v == null) {
          g.value = !0;
          return;
        }
        const y = await k(v);
        return r.value ? void 0 : (f.value = null, l.value = v, i.value.push(y.nextPage), y.nextPage == null && (g.value = !0), await H(o), y);
      } catch (o) {
        throw f.value = ge(o), o;
      } finally {
        h.value = !1;
        const o = l.value, v = i.value[i.value.length - 1];
        d("loading:stop", {
          fetched: a.value.length,
          currentPage: o,
          nextPage: v
        });
      }
    }
  }
  async function z() {
    if (!h.value) {
      r.value = !1, h.value = !0, d("loading:start");
      try {
        const o = l.value;
        if (o == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", l.value, "paginationHistory:", i.value);
          return;
        }
        a.value = [], g.value = !1, f.value = null, i.value = [o];
        const v = await k(o);
        if (r.value) return;
        f.value = null, l.value = o, i.value.push(v.nextPage), v.nextPage == null && (g.value = !0);
        const y = a.value.length;
        return await H(y), v;
      } catch (o) {
        throw f.value = ge(o), o;
      } finally {
        h.value = !1;
        const o = l.value, v = i.value[i.value.length - 1];
        d("loading:stop", {
          fetched: a.value.length,
          currentPage: o,
          nextPage: v
        });
      }
    }
  }
  function Z() {
    const o = b;
    r.value = !0, h.value = !1, b = !1;
    const v = l.value, y = i.value[i.value.length - 1];
    o && d("backfill:stop", {
      fetched: a.value.length,
      calls: 0,
      cancelled: !0,
      currentPage: v,
      nextPage: y
    }), d("loading:stop", {
      fetched: a.value.length,
      currentPage: v,
      nextPage: y
    });
  }
  return {
    loadPage: W,
    loadNext: E,
    refreshCurrentPage: z,
    cancelLoad: Z,
    maybeBackfillToTarget: H,
    getContent: k
  };
}
function ra(e) {
  const {
    masonry: n,
    useSwipeMode: s,
    refreshLayout: a,
    loadNext: h,
    maybeBackfillToTarget: g,
    paginationHistory: f
  } = e;
  let l = /* @__PURE__ */ new Set(), i = null, M = !1;
  async function t() {
    if (l.size === 0 || M) return;
    M = !0;
    const d = Array.from(l);
    l.clear(), i = null, await I(d), M = !1;
  }
  async function T(d) {
    l.add(d), i && clearTimeout(i), i = setTimeout(() => {
      t();
    }, 16);
  }
  async function I(d) {
    if (!d || d.length === 0) return;
    const c = new Set(d.map((b) => b.id)), r = n.value.filter((b) => !c.has(b.id));
    if (n.value = r, await C(), r.length === 0 && f.value.length > 0) {
      try {
        await h(), await g(0, !0);
      } catch {
      }
      return;
    }
    await C(), await C(), a(r);
  }
  async function x(d) {
    !d || d.length === 0 || (d.forEach((c) => l.add(c)), i && clearTimeout(i), i = setTimeout(() => {
      t();
    }, 16));
  }
  async function m(d, c) {
    if (!d) return;
    const r = n.value;
    if (r.findIndex((D) => D.id === d.id) !== -1) return;
    const P = [...r], p = Math.min(c, P.length);
    P.splice(p, 0, d), n.value = P, await C(), s.value || (await C(), await C(), a(P));
  }
  async function L(d, c) {
    var E;
    if (!d || d.length === 0) return;
    if (!c || c.length !== d.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const r = n.value, b = new Set(r.map((z) => z.id)), P = [];
    for (let z = 0; z < d.length; z++)
      b.has((E = d[z]) == null ? void 0 : E.id) || P.push({ item: d[z], index: c[z] });
    if (P.length === 0) return;
    const p = /* @__PURE__ */ new Map();
    for (const { item: z, index: Z } of P)
      p.set(Z, z);
    const D = P.length > 0 ? Math.max(...P.map(({ index: z }) => z)) : -1, k = Math.max(r.length - 1, D), H = [];
    let W = 0;
    for (let z = 0; z <= k; z++)
      p.has(z) ? H.push(p.get(z)) : W < r.length && (H.push(r[W]), W++);
    for (; W < r.length; )
      H.push(r[W]), W++;
    n.value = H, await C(), s.value || (await C(), await C(), a(H));
  }
  async function S() {
    n.value = [];
  }
  return {
    remove: T,
    removeMany: x,
    restore: m,
    restoreMany: L,
    removeAll: S
  };
}
function ia(e) {
  const {
    masonry: n,
    useSwipeMode: s,
    container: a,
    columns: h,
    containerWidth: g,
    masonryContentHeight: f,
    layout: l,
    fixedDimensions: i,
    checkItemDimensions: M
  } = e;
  let t = [];
  function T(L) {
    const S = Zt(L);
    let d = 0;
    if (a.value) {
      const { scrollTop: c, clientHeight: r } = a.value;
      d = c + r + 100;
    }
    f.value = Math.max(S, d);
  }
  function I(L) {
    var r, b;
    if (s.value) {
      n.value = L;
      return;
    }
    if (n.value = L, !a.value) return;
    if (M(L, "refreshLayout"), L.length > 1e3 && t.length > L.length && t.length - L.length < 100) {
      let P = !0;
      for (let p = 0; p < L.length; p++)
        if (((r = L[p]) == null ? void 0 : r.id) !== ((b = t[p]) == null ? void 0 : b.id)) {
          P = !1;
          break;
        }
      if (P) {
        const p = L.map((D, k) => ({
          ...t[k],
          originalIndex: k
        }));
        T(p), n.value = p, t = p;
        return;
      }
    }
    const d = L.map((P, p) => ({
      ...P,
      originalIndex: p
    })), c = a.value;
    if (i.value && i.value.width !== void 0) {
      const P = c.style.width, p = c.style.boxSizing;
      c.style.boxSizing = "border-box", c.style.width = `${i.value.width}px`, c.offsetWidth;
      const D = Ve(d, c, h.value, l.value);
      c.style.width = P, c.style.boxSizing = p, T(D), n.value = D, t = D;
    } else {
      const P = Ve(d, c, h.value, l.value);
      T(P), n.value = P, t = P;
    }
  }
  function x(L, S) {
    i.value = L, L && (L.width !== void 0 && (g.value = L.width), !s.value && a.value && n.value.length > 0 && C(() => {
      h.value = se(l.value, g.value), I(n.value), S && S();
    }));
  }
  function m() {
    h.value = se(l.value, g.value), I(n.value);
  }
  return {
    refreshLayout: I,
    setFixedDimensions: x,
    onResize: m,
    calculateHeight: T
  };
}
function sa(e) {
  const {
    masonry: n,
    container: s,
    columns: a,
    virtualBufferPx: h,
    loadThresholdPx: g
  } = e, f = N(e.handleScroll), l = N(0), i = N(0), M = h, t = N(!1), T = N({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), I = Q(() => {
    const S = l.value - M, d = l.value + i.value + M, c = n.value;
    return !c || c.length === 0 ? [] : c.filter((b) => {
      if (typeof b.top != "number" || typeof b.columnHeight != "number")
        return !0;
      const P = b.top;
      return b.top + b.columnHeight >= S && P <= d;
    });
  });
  function x(S) {
    if (!s.value) return;
    const { scrollTop: d, clientHeight: c } = s.value, r = d + c, b = S ?? Ne(n.value, a.value), P = b.length ? Math.max(...b) : 0, p = typeof g == "number" ? g : 200, D = p >= 0 ? Math.max(0, P - p) : Math.max(0, P + p), k = Math.max(0, D - r), H = k <= 100;
    T.value = {
      distanceToTrigger: Math.round(k),
      isNearTrigger: H
    };
  }
  async function m() {
    if (s.value) {
      const d = s.value.scrollTop, c = s.value.clientHeight || window.innerHeight, r = c > 0 ? c : window.innerHeight;
      l.value = d, i.value = r;
    }
    t.value = !0, await C(), await C(), t.value = !1;
    const S = Ne(n.value, a.value);
    f.value(S), x(S);
  }
  function L() {
    l.value = 0, i.value = 0, t.value = !1, T.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: l,
    viewportHeight: i,
    virtualizing: t,
    scrollProgress: T,
    visibleMasonry: I,
    updateScrollProgress: x,
    updateViewport: m,
    reset: L,
    handleScroll: f
  };
}
function ua(e) {
  const { masonry: n } = e, s = N(/* @__PURE__ */ new Set());
  function a(f) {
    return typeof f == "number" && f > 0 && Number.isFinite(f);
  }
  function h(f, l) {
    try {
      if (!Array.isArray(f) || f.length === 0) return;
      const i = f.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
      if (i.length === 0) return;
      const M = [];
      for (const t of i) {
        const T = (t == null ? void 0 : t.id) ?? `idx:${n.value.indexOf(t)}`;
        s.value.has(T) || (s.value.add(T), M.push(T));
      }
      if (M.length > 0) {
        const t = M.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: l,
            count: M.length,
            sampleIds: t,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function g() {
    s.value.clear();
  }
  return {
    checkItemDimensions: h,
    invalidDimensionIds: s,
    reset: g
  };
}
const ca = { class: "flex-1 relative min-h-0" }, va = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, fa = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, da = {
  key: 1,
  class: "relative w-full h-full"
}, ga = ["src"], ha = ["src", "autoplay", "controls"], ma = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, pa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ya = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ Ge({
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
    const s = e, a = n, h = N(!1), g = N(!1), f = N(null), l = N(!1), i = N(!1), M = N(null), t = N(!1), T = N(!1), I = N(!1), x = N(!1), m = N(!1), L = N(null), S = N(null);
    let d = null;
    const c = Q(() => {
      var o;
      return s.type ?? ((o = s.item) == null ? void 0 : o.type) ?? "image";
    }), r = Q(() => {
      var o;
      return s.notFound ?? ((o = s.item) == null ? void 0 : o.notFound) ?? !1;
    }), b = Q(() => !!s.inSwipeMode);
    function P(o, v) {
      const y = o === "image" ? h.value : l.value;
      T.value && y && !I.value && (I.value = !0, a("in-view-and-loaded", { item: s.item, type: o, src: v }));
    }
    function p(o) {
      a("mouse-enter", { item: s.item, type: o });
    }
    function D(o) {
      a("mouse-leave", { item: s.item, type: o });
    }
    function k(o) {
      if (b.value) return;
      const v = o.target;
      v && (v.paused ? v.play() : v.pause());
    }
    function H(o) {
      const v = o.target;
      v && (b.value || v.play(), p("video"));
    }
    function W(o) {
      const v = o.target;
      v && (b.value || v.pause(), D("video"));
    }
    function E(o) {
      return new Promise((v, y) => {
        if (!o) {
          const w = new Error("No image source provided");
          a("preload:error", { item: s.item, type: "image", src: o, error: w }), y(w);
          return;
        }
        const R = new Image(), O = Date.now(), j = 300;
        R.onload = () => {
          const w = Date.now() - O, F = Math.max(0, j - w);
          setTimeout(async () => {
            h.value = !0, g.value = !1, x.value = !1, await C(), await new Promise((B) => setTimeout(B, 100)), m.value = !0, a("preload:success", { item: s.item, type: "image", src: o }), P("image", o), v();
          }, F);
        }, R.onerror = () => {
          g.value = !0, h.value = !1, x.value = !1;
          const w = new Error("Failed to load image");
          a("preload:error", { item: s.item, type: "image", src: o, error: w }), y(w);
        }, R.src = o;
      });
    }
    function z(o) {
      return new Promise((v, y) => {
        if (!o) {
          const w = new Error("No video source provided");
          a("preload:error", { item: s.item, type: "video", src: o, error: w }), y(w);
          return;
        }
        const R = document.createElement("video"), O = Date.now(), j = 300;
        R.preload = "metadata", R.muted = !0, R.onloadedmetadata = () => {
          const w = Date.now() - O, F = Math.max(0, j - w);
          setTimeout(async () => {
            l.value = !0, i.value = !1, x.value = !1, await C(), await new Promise((B) => setTimeout(B, 100)), m.value = !0, a("preload:success", { item: s.item, type: "video", src: o }), P("video", o), v();
          }, F);
        }, R.onerror = () => {
          i.value = !0, l.value = !1, x.value = !1;
          const w = new Error("Failed to load video");
          a("preload:error", { item: s.item, type: "video", src: o, error: w }), y(w);
        }, R.src = o;
      });
    }
    async function Z() {
      var v;
      if (!t.value || x.value || r.value || c.value === "video" && l.value || c.value === "image" && h.value)
        return;
      const o = (v = s.item) == null ? void 0 : v.src;
      if (o)
        if (x.value = !0, m.value = !1, c.value === "video") {
          M.value = o, l.value = !1, i.value = !1;
          try {
            await z(o);
          } catch {
          }
        } else {
          f.value = o, h.value = !1, g.value = !1;
          try {
            await E(o);
          } catch {
          }
        }
    }
    return qe(async () => {
      if (!L.value) return;
      const o = [s.preloadThreshold, 1].filter((y, R, O) => O.indexOf(y) === R).sort((y, R) => y - R);
      d = new IntersectionObserver(
        (y) => {
          y.forEach((R) => {
            const O = R.intersectionRatio, j = O >= 1, w = O >= s.preloadThreshold;
            if (j && !T.value) {
              T.value = !0, a("in-view", { item: s.item, type: c.value });
              const F = c.value === "image" ? f.value : M.value, B = c.value === "image" ? h.value : l.value;
              F && B && P(c.value, F);
            }
            w && !t.value ? (t.value = !0, Z()) : R.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: o
        }
      ), d.observe(L.value), await C(), await C(), await C(), v(), setTimeout(() => {
        v();
      }, 100);
      function v() {
        if (!L.value || T.value) return;
        const y = L.value.getBoundingClientRect(), R = window.innerHeight, O = window.innerWidth;
        if (y.top >= 0 && y.bottom <= R && y.left >= 0 && y.right <= O && y.height > 0 && y.width > 0) {
          T.value = !0, a("in-view", { item: s.item, type: c.value });
          const w = c.value === "image" ? f.value : M.value, F = c.value === "image" ? h.value : l.value;
          w && F && P(c.value, w);
        }
      }
    }), Je(() => {
      d && (d.disconnect(), d = null);
    }), te(
      () => {
        var o;
        return (o = s.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || r.value)) {
          if (c.value === "video") {
            if (o !== M.value && (l.value = !1, i.value = !1, M.value = o, t.value)) {
              x.value = !0;
              try {
                await z(o);
              } catch {
              }
            }
          } else if (o !== f.value && (h.value = !1, g.value = !1, f.value = o, t.value)) {
            x.value = !0;
            try {
              await E(o);
            } catch {
            }
          }
        }
      }
    ), te(
      () => s.isActive,
      (o) => {
        !b.value || !S.value || (o ? S.value.play() : S.value.pause());
      }
    ), (o, v) => (_(), U("div", {
      ref_key: "containerRef",
      ref: L,
      class: "relative w-full h-full flex flex-col"
    }, [
      o.headerHeight > 0 ? (_(), U("div", {
        key: 0,
        class: "relative z-10",
        style: he({ height: `${o.headerHeight}px` })
      }, [
        K(o.$slots, "header", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: g.value,
          videoLoaded: l.value,
          videoError: i.value,
          showNotFound: r.value,
          isLoading: x.value,
          mediaType: c.value,
          isFullyInView: T.value
        })
      ], 4)) : ae("", !0),
      X("div", ca, [
        K(o.$slots, "default", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: g.value,
          videoLoaded: l.value,
          videoError: i.value,
          showNotFound: r.value,
          isLoading: x.value,
          mediaType: c.value,
          imageSrc: f.value,
          videoSrc: M.value,
          showMedia: m.value,
          isFullyInView: T.value
        }, () => [
          X("div", va, [
            r.value ? (_(), U("div", fa, v[3] || (v[3] = [
              X("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              X("span", { class: "font-medium" }, "Not Found", -1),
              X("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (_(), U("div", da, [
              c.value === "image" && f.value ? (_(), U("img", {
                key: 0,
                src: f.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  h.value && m.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: v[0] || (v[0] = (y) => p("image")),
                onMouseleave: v[1] || (v[1] = (y) => D("image"))
              }, null, 42, ga)) : ae("", !0),
              c.value === "video" && M.value ? (_(), U("video", {
                key: 1,
                ref_key: "videoEl",
                ref: S,
                src: M.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  l.value && m.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: b.value && s.isActive,
                controls: b.value,
                onClick: Ce(k, ["stop"]),
                onTouchend: Ce(k, ["stop", "prevent"]),
                onMouseenter: H,
                onMouseleave: W,
                onError: v[2] || (v[2] = (y) => i.value = !0)
              }, null, 42, ha)) : ae("", !0),
              !h.value && !l.value && !g.value && !i.value ? (_(), U("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  m.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                X("div", ma, [
                  K(o.$slots, "placeholder-icon", { mediaType: c.value }, () => [
                    X("i", {
                      class: ie(c.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              x.value ? (_(), U("div", pa, v[4] || (v[4] = [
                X("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  X("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              c.value === "image" && g.value || c.value === "video" && i.value ? (_(), U("div", ya, [
                X("i", {
                  class: ie(c.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                X("span", null, "Failed to load " + He(c.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      o.footerHeight > 0 ? (_(), U("div", {
        key: 1,
        class: "relative z-10",
        style: he({ height: `${o.footerHeight}px` })
      }, [
        K(o.$slots, "footer", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: g.value,
          videoLoaded: l.value,
          videoError: i.value,
          showNotFound: r.value,
          isLoading: x.value,
          mediaType: c.value,
          isFullyInView: T.value
        })
      ], 4)) : ae("", !0)
    ], 512));
  }
}), wa = {
  key: 0,
  class: "w-full h-full flex items-center justify-center"
}, xa = { class: "w-full h-full flex items-center justify-center p-4" }, ba = { class: "w-full h-full max-w-full max-h-full relative" }, Ma = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ta = {
  key: 1,
  class: "w-full py-8 text-center"
}, Pa = { class: "text-red-500 dark:text-red-400" }, Ia = {
  key: 0,
  class: "w-full py-8 text-center"
}, La = {
  key: 1,
  class: "w-full py-8 text-center"
}, ka = { class: "text-red-500 dark:text-red-400" }, Sa = /* @__PURE__ */ Ge({
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
  setup(e, { expose: n, emit: s }) {
    const a = e, h = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, g = Q(() => {
      var u;
      return {
        ...h,
        ...a.layout,
        sizes: {
          ...h.sizes,
          ...((u = a.layout) == null ? void 0 : u.sizes) || {}
        }
      };
    }), f = N(null), l = N(typeof window < "u" ? window.innerWidth : 1024), i = N(typeof window < "u" ? window.innerHeight : 768), M = N(null);
    let t = null;
    function T(u) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[u] || 768;
    }
    const I = Q(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const u = typeof a.mobileBreakpoint == "string" ? T(a.mobileBreakpoint) : a.mobileBreakpoint;
      return l.value < u;
    }), x = s, m = Q({
      get: () => a.items,
      set: (u) => x("update:items", u)
    }), L = Q({
      get: () => a.context,
      set: (u) => x("update:context", u)
    });
    function S(u) {
      L.value = u;
    }
    const d = Q(() => {
      const u = m.value;
      return (u == null ? void 0 : u.length) ?? 0;
    }), c = N(7), r = N(null), b = N([]), P = N(null), p = N(!1), D = N(0), k = N(!1), H = N(null), W = N(!1), E = Q(() => Qt(l.value)), z = ua({
      masonry: m
    }), { checkItemDimensions: Z, reset: o } = z, v = ia({
      masonry: m,
      useSwipeMode: I,
      container: r,
      columns: c,
      containerWidth: l,
      masonryContentHeight: D,
      layout: g,
      fixedDimensions: M,
      checkItemDimensions: Z
    }), { refreshLayout: y, setFixedDimensions: R, onResize: O } = v, j = sa({
      masonry: m,
      container: r,
      columns: c,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: w, viewportHeight: F, virtualizing: B, visibleMasonry: Y, updateScrollProgress: q, updateViewport: ne, reset: G } = j, { onEnter: be, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = aa(
      { container: r },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: B }
    ), at = be, nt = Ze, lt = et, ot = tt, rt = Q(() => a.mode), it = oa({
      getPage: a.getPage,
      context: L,
      masonry: m,
      isLoading: p,
      hasReachedEnd: k,
      loadError: H,
      currentPage: P,
      paginationHistory: b,
      refreshLayout: y,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: rt,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: x
    }), { loadPage: Me, loadNext: me, refreshCurrentPage: st, cancelLoad: Te, maybeBackfillToTarget: ut } = it, ee = la({
      useSwipeMode: I,
      masonry: m,
      isLoading: p,
      loadNext: me,
      loadPage: Me,
      paginationHistory: b
    }), { handleScroll: ct } = na({
      container: r,
      masonry: m,
      columns: c,
      containerHeight: D,
      isLoading: p,
      pageSize: a.pageSize,
      refreshLayout: y,
      setItemsRaw: (u) => {
        m.value = u;
      },
      loadNext: me,
      loadThresholdPx: a.loadThresholdPx
    });
    j.handleScroll.value = ct;
    const vt = ra({
      masonry: m,
      useSwipeMode: I,
      refreshLayout: y,
      loadNext: me,
      maybeBackfillToTarget: ut,
      paginationHistory: b
    }), { remove: ue, removeMany: ft, restore: dt, restoreMany: gt, removeAll: ht } = vt;
    function mt(u) {
      R(u, q), !u && f.value && (l.value = f.value.clientWidth, i.value = f.value.clientHeight);
    }
    n({
      // Cancels any ongoing load operations (page loads, backfills, etc.)
      cancelLoad: Te,
      // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
      context: L,
      // Container height (wrapper element) in pixels
      containerHeight: i,
      // Container width (wrapper element) in pixels
      containerWidth: l,
      // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
      currentBreakpoint: E,
      // Current page number or cursor being displayed
      currentPage: P,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Tt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: k,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: Pt,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: W,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: p,
      // Error object if the last load operation failed, null otherwise
      loadError: H,
      // Loads the next page of items asynchronously
      loadNext: me,
      // Loads a specific page number or cursor asynchronously
      loadPage: Me,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: b,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: st,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: y,
      // Removes a single item from the masonry
      remove: ue,
      // Removes all items from the masonry
      removeAll: ht,
      // Removes multiple items from the masonry in a single operation
      removeMany: ft,
      // Resets the component to initial state (clears items, resets pagination, scrolls to top)
      reset: Mt,
      // Restores a single item at its original index (useful for undo operations)
      restore: dt,
      // Restores multiple items at their original indices (useful for undo operations)
      restoreMany: gt,
      // Scrolls the container to a specific position
      scrollTo: xt,
      // Scrolls the container to the top
      scrollToTop: wt,
      // Sets the opaque caller context (alternative to v-model:context)
      setContext: S,
      // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
      setFixedDimensions: mt,
      // Computed property returning the total number of items currently in the masonry
      totalItems: Q(() => m.value.length)
    });
    const ce = ee.currentSwipeIndex, pe = ee.swipeOffset, ye = ee.isDragging, oe = ee.swipeContainer, ze = ee.handleTouchStart, De = ee.handleTouchMove, Be = ee.handleTouchEnd, We = ee.handleMouseDown, Pe = ee.handleMouseMove, Ie = ee.handleMouseUp, Le = ee.snapToCurrentItem;
    function pt(u) {
      const $ = d.value, V = typeof u == "string" ? parseInt(u, 10) : u;
      return $ > 0 ? `${V * (100 / $)}%` : "0%";
    }
    function yt() {
      const u = d.value;
      return u > 0 ? `${100 / u}%` : "0%";
    }
    function wt(u) {
      r.value && r.value.scrollTo({
        top: 0,
        behavior: (u == null ? void 0 : u.behavior) ?? "smooth",
        ...u
      });
    }
    function xt(u) {
      r.value && (r.value.scrollTo({
        top: u.top ?? r.value.scrollTop,
        left: u.left ?? r.value.scrollLeft,
        behavior: u.behavior ?? "auto"
      }), r.value && (w.value = r.value.scrollTop, F.value = r.value.clientHeight || window.innerHeight));
    }
    function bt() {
      O(), r.value && (w.value = r.value.scrollTop, F.value = r.value.clientHeight);
    }
    function Mt() {
      Te(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), m.value = [], i.value = 0, P.value = a.loadAtPage, b.value = [a.loadAtPage], k.value = !1, H.value = null, W.value = !1, G();
    }
    function Tt() {
      Te(), m.value = [], D.value = 0, P.value = null, b.value = [], k.value = !1, H.value = null, p.value = !1, W.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, G(), o(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const re = _e(async () => {
      I.value || await ne();
    }, 200), Re = _e(bt, 200);
    function Fe() {
      ee.handleWindowResize();
    }
    async function Pt(u, $, V) {
      P.value = $, b.value = [$], V != null && b.value.push(V), k.value = V === null, Z(u, "initialize");
      const le = m.value, A = le.length === 0 ? u : [...le, ...u];
      m.value = A, await C(), I.value ? ce.value === 0 && m.value.length > 0 && (pe.value = 0) : (await C(), await C(), y(A), r.value && (w.value = r.value.scrollTop, F.value = r.value.clientHeight || window.innerHeight), C(() => {
        r.value && (w.value = r.value.scrollTop, F.value = r.value.clientHeight || window.innerHeight, q());
      })), u && u.length > 0 && (W.value = !0);
    }
    return te(
      g,
      () => {
        I.value || r.value && (c.value = se(g.value, l.value), y(m.value));
      },
      { deep: !0 }
    ), te(() => a.layoutMode, () => {
      M.value && M.value.width !== void 0 ? l.value = M.value.width : f.value && (l.value = f.value.clientWidth);
    }), te(r, (u) => {
      u && !I.value ? (u.removeEventListener("scroll", re), u.addEventListener("scroll", re, { passive: !0 })) : u && u.removeEventListener("scroll", re);
    }, { immediate: !0 }), te(
      () => m.value.length,
      (u, $) => {
        a.init === "manual" && !W.value && u > 0 && $ === 0 && (W.value = !0);
      },
      { immediate: !1 }
    ), te(I, (u, $) => {
      $ === void 0 && u === !1 || C(() => {
        u ? (document.addEventListener("mousemove", Pe), document.addEventListener("mouseup", Ie), r.value && r.value.removeEventListener("scroll", re), ce.value = 0, pe.value = 0, m.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ie), r.value && f.value && (M.value && M.value.width !== void 0 ? l.value = M.value.width : l.value = f.value.clientWidth, r.value.removeEventListener("scroll", re), r.value.addEventListener("scroll", re, { passive: !0 }), m.value.length > 0 && (c.value = se(g.value, l.value), y(m.value), w.value = r.value.scrollTop, F.value = r.value.clientHeight, q())));
      });
    }, { immediate: !0 }), te(oe, (u) => {
      u && (u.addEventListener("touchstart", ze, { passive: !1 }), u.addEventListener("touchmove", De, { passive: !1 }), u.addEventListener("touchend", Be), u.addEventListener("mousedown", We));
    }), te(() => m.value.length, (u, $) => {
      I.value && u > 0 && $ === 0 && (ce.value = 0, C(() => Le()));
    }), te(f, (u) => {
      t && (t.disconnect(), t = null), u && typeof ResizeObserver < "u" ? (t = new ResizeObserver(($) => {
        if (!M.value)
          for (const V of $) {
            const le = V.contentRect.width, A = V.contentRect.height;
            l.value !== le && (l.value = le), i.value !== A && (i.value = A);
          }
      }), t.observe(u), M.value || (l.value = u.clientWidth, i.value = u.clientHeight)) : u && (M.value || (l.value = u.clientWidth, i.value = u.clientHeight));
    }, { immediate: !0 }), te(l, (u, $) => {
      u !== $ && u > 0 && !I.value && r.value && m.value.length > 0 && C(() => {
        c.value = se(g.value, u), y(m.value), q();
      });
    }), qe(async () => {
      try {
        await C(), f.value && !t && (l.value = f.value.clientWidth, i.value = f.value.clientHeight), I.value || (c.value = se(g.value, l.value), r.value && (w.value = r.value.scrollTop, F.value = r.value.clientHeight));
        const u = a.loadAtPage;
        if (a.init === "auto" && b.value.length === 0 && (b.value = [u]), a.init === "auto") {
          W.value = !0, await C();
          try {
            await Me(u);
          } catch {
          }
        }
        I.value ? C(() => Le()) : q();
      } catch (u) {
        H.value || (console.error("Error during component initialization:", u), H.value = ge(u)), p.value = !1;
      }
      window.addEventListener("resize", Re), window.addEventListener("resize", Fe);
    }), Je(() => {
      var u;
      t && (t.disconnect(), t = null), (u = r.value) == null || u.removeEventListener("scroll", re), window.removeEventListener("resize", Re), window.removeEventListener("resize", Fe), oe.value && (oe.value.removeEventListener("touchstart", ze), oe.value.removeEventListener("touchmove", De), oe.value.removeEventListener("touchend", Be), oe.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ie);
    }), (u, $) => (_(), U("div", {
      ref_key: "wrapper",
      ref: f,
      class: "w-full h-full flex flex-col relative"
    }, [
      W.value ? I.value ? (_(), U("div", {
        key: 1,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !J(ye), "cursor-grabbing": J(ye) }]),
        ref_key: "swipeContainer",
        ref: oe,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        X("div", {
          class: "relative w-full",
          style: he({
            transform: `translateY(${J(pe)}px)`,
            transition: J(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${d.value * 100}%`
          })
        }, [
          (_(!0), U(Oe, null, Ae(m.value, (V, le) => (_(), U("div", {
            key: `${V.page}-${V.id}`,
            class: "absolute top-0 left-0 w-full",
            style: he({
              top: pt(le),
              height: yt()
            })
          }, [
            X("div", xa, [
              X("div", ba, [
                K(u.$slots, "default", {
                  item: V,
                  remove: J(ue),
                  index: V.originalIndex ?? m.value.indexOf(V)
                }, () => [
                  ke(xe, {
                    item: V,
                    remove: J(ue),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": le === J(ce),
                    "onPreload:success": $[0] || ($[0] = (A) => x("item:preload:success", A)),
                    "onPreload:error": $[1] || ($[1] = (A) => x("item:preload:error", A)),
                    onMouseEnter: $[2] || ($[2] = (A) => x("item:mouse-enter", A)),
                    onMouseLeave: $[3] || ($[3] = (A) => x("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      K(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      K(u.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        k.value && m.value.length > 0 ? (_(), U("div", Ma, [
          K(u.$slots, "end-message", {}, () => [
            $[9] || ($[9] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        H.value && m.value.length > 0 ? (_(), U("div", Ta, [
          K(u.$slots, "error-message", { error: H.value }, () => [
            X("p", Pa, "Failed to load content: " + He(H.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (_(), U("div", {
        key: 2,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: r
      }, [
        X("div", {
          class: "relative",
          style: he({ height: `${D.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          ke(It, {
            name: "masonry",
            css: !1,
            onEnter: J(at),
            onBeforeEnter: J(nt),
            onLeave: J(ot),
            onBeforeLeave: J(lt)
          }, {
            default: ve(() => [
              (_(!0), U(Oe, null, Ae(J(Y), (V, le) => (_(), U("div", fe({
                key: `${V.page}-${V.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, J(ta)(V, le)), [
                K(u.$slots, "default", {
                  item: V,
                  remove: J(ue),
                  index: V.originalIndex ?? m.value.indexOf(V)
                }, () => [
                  ke(xe, {
                    item: V,
                    remove: J(ue),
                    "header-height": g.value.header,
                    "footer-height": g.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": $[4] || ($[4] = (A) => x("item:preload:success", A)),
                    "onPreload:error": $[5] || ($[5] = (A) => x("item:preload:error", A)),
                    onMouseEnter: $[6] || ($[6] = (A) => x("item:mouse-enter", A)),
                    onMouseLeave: $[7] || ($[7] = (A) => x("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      K(u.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      K(u.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        k.value && m.value.length > 0 ? (_(), U("div", Ia, [
          K(u.$slots, "end-message", {}, () => [
            $[10] || ($[10] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        H.value && m.value.length > 0 ? (_(), U("div", La, [
          K(u.$slots, "error-message", { error: H.value }, () => [
            X("p", ka, "Failed to load content: " + He(H.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (_(), U("div", wa, [
        K(u.$slots, "loading-message", {}, () => [
          $[8] || ($[8] = X("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ea = (e, n) => {
  const s = e.__vccOpts || e;
  for (const [a, h] of n)
    s[a] = h;
  return s;
}, Xe = /* @__PURE__ */ Ea(Sa, [["__scopeId", "data-v-2ebd6688"]]), $a = {
  install(e) {
    e.component("WyxosMasonry", Xe), e.component("WMasonry", Xe), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  Xe as Masonry,
  xe as MasonryItem,
  $a as default
};
