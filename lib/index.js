import { nextTick as C, ref as F, computed as Q, defineComponent as Xe, onMounted as Ge, onUnmounted as qe, watch as te, createElementBlock as U, openBlock as _, createCommentVNode as ae, createElementVNode as G, normalizeStyle as he, renderSlot as J, normalizeClass as ie, withModifiers as Re, toDisplayString as Ee, unref as q, Fragment as Ce, renderList as Oe, createVNode as Le, withCtx as ve, mergeProps as fe, TransitionGroup as Pt } from "vue";
let ke = null;
function It() {
  if (ke != null) return ke;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const i = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), ke = i, i;
}
function Ae(e, l, i, a = {}) {
  const {
    gutterX: g = 0,
    gutterY: d = 0,
    header: v = 0,
    footer: o = 0,
    paddingLeft: s = 0,
    paddingRight: w = 0,
    sizes: t = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: x = "masonry"
  } = a;
  let T = 0, y = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const k = window.getComputedStyle(l);
      T = parseFloat(k.paddingLeft) || 0, y = parseFloat(k.paddingRight) || 0;
    }
  } catch {
  }
  const h = (s || 0) + T, P = (w || 0) + y, I = l.offsetWidth - l.clientWidth, f = I > 0 ? I + 2 : It() + 2, r = l.offsetWidth - f - h - P, u = g * (i - 1), L = Math.floor((r - u) / i), M = e.map((k) => {
    const B = k.width, R = k.height;
    return Math.round(L * R / B) + o + v;
  });
  if (x === "sequential-balanced") {
    const k = M.length;
    if (k === 0) return [];
    const B = (b, E, O) => b + (E > 0 ? d : 0) + O;
    let R = Math.max(...M), $ = M.reduce((b, E) => b + E, 0) + d * Math.max(0, k - 1);
    const W = (b) => {
      let E = 1, O = 0, ne = 0;
      for (let X = 0; X < k; X++) {
        const Z = M[X], K = B(O, ne, Z);
        if (K <= b)
          O = K, ne++;
        else if (E++, O = Z, ne = 1, Z > b || E > i) return !1;
      }
      return E <= i;
    };
    for (; R < $; ) {
      const b = Math.floor((R + $) / 2);
      W(b) ? $ = b : R = b + 1;
    }
    const H = $, n = new Array(i).fill(0);
    let p = i - 1, S = 0, z = 0;
    for (let b = k - 1; b >= 0; b--) {
      const E = M[b], O = b < p;
      !(B(S, z, E) <= H) || O ? (n[p] = b + 1, p--, S = E, z = 1) : (S = B(S, z, E), z++);
    }
    n[0] = 0;
    const V = [], Y = new Array(i).fill(0);
    for (let b = 0; b < i; b++) {
      const E = n[b], O = b + 1 < i ? n[b + 1] : k, ne = b * (L + g);
      for (let X = E; X < O; X++) {
        const K = {
          ...e[X],
          columnWidth: L,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        K.imageHeight = M[X] - (o + v), K.columnHeight = M[X], K.left = ne, K.top = Y[b], Y[b] += K.columnHeight + (X + 1 < O ? d : 0), V.push(K);
      }
    }
    return V;
  }
  const m = new Array(i).fill(0), N = [];
  for (let k = 0; k < e.length; k++) {
    const B = e[k], R = {
      ...B,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, $ = m.indexOf(Math.min(...m)), W = B.width, H = B.height;
    R.columnWidth = L, R.left = $ * (L + g), R.imageHeight = Math.round(L * H / W), R.columnHeight = R.imageHeight + o + v, R.top = m[$], m[$] += R.columnHeight + d, N.push(R);
  }
  return N;
}
var Lt = typeof global == "object" && global && global.Object === Object && global, kt = typeof self == "object" && self && self.Object === Object && self, Je = Lt || kt || Function("return this")(), we = Je.Symbol, Ke = Object.prototype, St = Ke.hasOwnProperty, Et = Ke.toString, de = we ? we.toStringTag : void 0;
function Ht(e) {
  var l = St.call(e, de), i = e[de];
  try {
    e[de] = void 0;
    var a = !0;
  } catch {
  }
  var g = Et.call(e);
  return a && (l ? e[de] = i : delete e[de]), g;
}
var $t = Object.prototype, Nt = $t.toString;
function zt(e) {
  return Nt.call(e);
}
var Dt = "[object Null]", Bt = "[object Undefined]", Ve = we ? we.toStringTag : void 0;
function Wt(e) {
  return e == null ? e === void 0 ? Bt : Dt : Ve && Ve in Object(e) ? Ht(e) : zt(e);
}
function Ft(e) {
  return e != null && typeof e == "object";
}
var Rt = "[object Symbol]";
function Ct(e) {
  return typeof e == "symbol" || Ft(e) && Wt(e) == Rt;
}
var Ot = /\s/;
function At(e) {
  for (var l = e.length; l-- && Ot.test(e.charAt(l)); )
    ;
  return l;
}
var Vt = /^\s+/;
function jt(e) {
  return e && e.slice(0, At(e) + 1).replace(Vt, "");
}
function He(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var je = NaN, Yt = /^[-+]0x[0-9a-f]+$/i, Ut = /^0b[01]+$/i, _t = /^0o[0-7]+$/i, Xt = parseInt;
function Ye(e) {
  if (typeof e == "number")
    return e;
  if (Ct(e))
    return je;
  if (He(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = He(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = jt(e);
  var i = Ut.test(e);
  return i || _t.test(e) ? Xt(e.slice(2), i ? 2 : 8) : Yt.test(e) ? je : +e;
}
var Se = function() {
  return Je.Date.now();
}, Gt = "Expected a function", qt = Math.max, Jt = Math.min;
function Ue(e, l, i) {
  var a, g, d, v, o, s, w = 0, t = !1, x = !1, T = !0;
  if (typeof e != "function")
    throw new TypeError(Gt);
  l = Ye(l) || 0, He(i) && (t = !!i.leading, x = "maxWait" in i, d = x ? qt(Ye(i.maxWait) || 0, l) : d, T = "trailing" in i ? !!i.trailing : T);
  function y(m) {
    var N = a, k = g;
    return a = g = void 0, w = m, v = e.apply(k, N), v;
  }
  function h(m) {
    return w = m, o = setTimeout(f, l), t ? y(m) : v;
  }
  function P(m) {
    var N = m - s, k = m - w, B = l - N;
    return x ? Jt(B, d - k) : B;
  }
  function I(m) {
    var N = m - s, k = m - w;
    return s === void 0 || N >= l || N < 0 || x && k >= d;
  }
  function f() {
    var m = Se();
    if (I(m))
      return r(m);
    o = setTimeout(f, P(m));
  }
  function r(m) {
    return o = void 0, T && a ? y(m) : (a = g = void 0, v);
  }
  function u() {
    o !== void 0 && clearTimeout(o), w = 0, a = s = g = o = void 0;
  }
  function L() {
    return o === void 0 ? v : r(Se());
  }
  function M() {
    var m = Se(), N = I(m);
    if (a = arguments, g = this, s = m, N) {
      if (o === void 0)
        return h(s);
      if (x)
        return clearTimeout(o), o = setTimeout(f, l), y(s);
    }
    return o === void 0 && (o = setTimeout(f, l)), v;
  }
  return M.cancel = u, M.flush = L, M;
}
function se(e, l) {
  const i = l ?? (typeof window < "u" ? window.innerWidth : 1024), a = e.sizes;
  return i >= 1536 && a["2xl"] ? a["2xl"] : i >= 1280 && a.xl ? a.xl : i >= 1024 && a.lg ? a.lg : i >= 768 && a.md ? a.md : i >= 640 && a.sm ? a.sm : a.base;
}
function Kt(e) {
  const l = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return l >= 1536 ? "2xl" : l >= 1280 ? "xl" : l >= 1024 ? "lg" : l >= 768 ? "md" : l >= 640 ? "sm" : "base";
}
function Qt(e) {
  return e.reduce((i, a) => Math.max(i, a.top + a.columnHeight), 0) + 500;
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
function $e(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const a = Array.from(new Set(e.map((v) => v.left))).sort((v, o) => v - o).slice(0, l), g = /* @__PURE__ */ new Map();
  for (let v = 0; v < a.length; v++) g.set(a[v], v);
  const d = new Array(a.length).fill(0);
  for (const v of e) {
    const o = g.get(v.left);
    o != null && (d[o] = Math.max(d[o], v.top + v.columnHeight));
  }
  for (; d.length < l; ) d.push(0);
  return d;
}
function ta(e, l) {
  let i = 0, a = 0;
  const g = 1e3;
  function d(t, x) {
    var h;
    const T = (h = e.container) == null ? void 0 : h.value;
    if (T) {
      const P = T.scrollTop, I = T.clientHeight;
      i = P - g, a = P + I + g;
    }
    return t + x >= i && t <= a;
  }
  function v(t, x) {
    var u;
    const T = parseInt(t.dataset.left || "0", 10), y = parseInt(t.dataset.top || "0", 10), h = parseInt(t.dataset.index || "0", 10), P = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((u = l == null ? void 0 : l.virtualizing) != null && u.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "", x();
      return;
    }
    if (!d(y, P)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`, t.style.transition = "none", x();
      return;
    }
    const I = Math.min(h * 20, 160), f = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${I}ms`), t.style.opacity = "1", t.style.transform = `translate3d(${T}px, ${y}px, 0) scale(1)`;
    const r = () => {
      f ? t.style.setProperty("--masonry-opacity-delay", f) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", r), x();
    };
    t.addEventListener("transitionend", r);
  }
  function o(t) {
    var y;
    const x = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10);
    if ((y = l == null ? void 0 : l.virtualizing) != null && y.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${x}px, ${T + 10}px, 0) scale(0.985)`;
  }
  function s(t) {
    var h;
    const x = parseInt(t.dataset.left || "0", 10), T = parseInt(t.dataset.top || "0", 10), y = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((h = l == null ? void 0 : l.virtualizing) != null && h.value)) {
      if (!d(T, y)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${T}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "";
    }
  }
  function w(t, x) {
    var M;
    const T = parseInt(t.dataset.left || "0", 10), y = parseInt(t.dataset.top || "0", 10), h = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((M = l == null ? void 0 : l.virtualizing) != null && M.value) {
      x();
      return;
    }
    if (!d(y, h)) {
      t.style.transition = "none", t.style.opacity = "0", x();
      return;
    }
    const P = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : Number.NaN;
    let I = Number.isFinite(P) && P > 0 ? P : Number.NaN;
    if (!Number.isFinite(I)) {
      const N = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", k = parseFloat(N);
      I = Number.isFinite(k) && k > 0 ? k : 200;
    }
    const f = t.style.transitionDuration, r = () => {
      t.removeEventListener("transitionend", u), clearTimeout(L), t.style.transitionDuration = f || "";
    }, u = (m) => {
      (!m || m.target === t) && (r(), x());
    }, L = setTimeout(() => {
      r(), x();
    }, I + 100);
    t.style.transitionDuration = `${I}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${T}px, ${y + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", u);
  }
  return {
    onEnter: v,
    onBeforeEnter: o,
    onBeforeLeave: s,
    onLeave: w
  };
}
function aa({
  container: e,
  masonry: l,
  columns: i,
  containerHeight: a,
  isLoading: g,
  pageSize: d,
  refreshLayout: v,
  setItemsRaw: o,
  loadNext: s,
  loadThresholdPx: w
}) {
  let t = 0;
  async function x(T, y = !1) {
    if (!e.value) return;
    const h = T ?? $e(l.value, i.value), P = h.length ? Math.max(...h) : 0, I = e.value.scrollTop + e.value.clientHeight, f = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const r = typeof w == "number" ? w : 200, u = r >= 0 ? Math.max(0, P - r) : Math.max(0, P + r);
    if (I >= u && (f || y) && !g.value) {
      await s(), await C();
      return;
    }
  }
  return {
    handleScroll: x
  };
}
function na(e) {
  const { useSwipeMode: l, masonry: i, isLoading: a, loadNext: g, loadPage: d, paginationHistory: v } = e, o = F(0), s = F(0), w = F(!1), t = F(0), x = F(0), T = F(null), y = Q(() => {
    if (!l.value || i.value.length === 0) return null;
    const $ = Math.max(0, Math.min(o.value, i.value.length - 1));
    return i.value[$] || null;
  }), h = Q(() => {
    if (!l.value || !y.value) return null;
    const $ = o.value + 1;
    return $ >= i.value.length ? null : i.value[$] || null;
  }), P = Q(() => {
    if (!l.value || !y.value) return null;
    const $ = o.value - 1;
    return $ < 0 ? null : i.value[$] || null;
  });
  function I() {
    if (!T.value) return;
    const $ = T.value.clientHeight;
    s.value = -o.value * $;
  }
  function f() {
    if (!h.value) {
      g();
      return;
    }
    o.value++, I(), o.value >= i.value.length - 5 && g();
  }
  function r() {
    P.value && (o.value--, I());
  }
  function u($) {
    l.value && (w.value = !0, t.value = $.touches[0].clientY, x.value = s.value, $.preventDefault());
  }
  function L($) {
    if (!l.value || !w.value) return;
    const W = $.touches[0].clientY - t.value;
    s.value = x.value + W, $.preventDefault();
  }
  function M($) {
    if (!l.value || !w.value) return;
    w.value = !1;
    const W = s.value - x.value;
    Math.abs(W) > 100 ? W > 0 && P.value ? r() : W < 0 && h.value ? f() : I() : I(), $.preventDefault();
  }
  function m($) {
    l.value && (w.value = !0, t.value = $.clientY, x.value = s.value, $.preventDefault());
  }
  function N($) {
    if (!l.value || !w.value) return;
    const W = $.clientY - t.value;
    s.value = x.value + W, $.preventDefault();
  }
  function k($) {
    if (!l.value || !w.value) return;
    w.value = !1;
    const W = s.value - x.value;
    Math.abs(W) > 100 ? W > 0 && P.value ? r() : W < 0 && h.value ? f() : I() : I(), $.preventDefault();
  }
  function B() {
    !l.value && o.value > 0 && (o.value = 0, s.value = 0), l.value && i.value.length === 0 && !a.value && d(v.value[0]), l.value && I();
  }
  function R() {
    o.value = 0, s.value = 0, w.value = !1;
  }
  return {
    // State
    currentSwipeIndex: o,
    swipeOffset: s,
    isDragging: w,
    swipeContainer: T,
    // Computed
    currentItem: y,
    nextItem: h,
    previousItem: P,
    // Functions
    handleTouchStart: u,
    handleTouchMove: L,
    handleTouchEnd: M,
    handleMouseDown: m,
    handleMouseMove: N,
    handleMouseUp: k,
    goToNextItem: f,
    goToPreviousItem: r,
    snapToCurrentItem: I,
    handleWindowResize: B,
    reset: R
  };
}
function ge(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function la(e) {
  const {
    getPage: l,
    context: i,
    masonry: a,
    isLoading: g,
    hasReachedEnd: d,
    loadError: v,
    currentPage: o,
    paginationHistory: s,
    refreshLayout: w,
    retryMaxAttempts: t,
    retryInitialDelayMs: x,
    retryBackoffStepMs: T,
    mode: y,
    backfillDelayMs: h,
    backfillMaxCalls: P,
    pageSize: I,
    emits: f
  } = e, r = F(!1);
  let u = !1;
  function L(H) {
    return a.value.filter((n) => n.page === H).length;
  }
  function M(H, n) {
    return new Promise((p) => {
      const S = Math.max(0, H | 0), z = Date.now();
      n(S, S);
      const V = setInterval(() => {
        if (r.value) {
          clearInterval(V), p();
          return;
        }
        const Y = Date.now() - z, b = Math.max(0, S - Y);
        n(b, S), b <= 0 && (clearInterval(V), p());
      }, 100);
    });
  }
  async function m(H) {
    let n = 0;
    const p = t;
    let S = x;
    for (; ; )
      try {
        const z = await H();
        return n > 0 && f("retry:stop", { attempt: n, success: !0 }), z;
      } catch (z) {
        if (n++, n > p)
          throw f("retry:stop", { attempt: n - 1, success: !1 }), z;
        f("retry:start", { attempt: n, max: p, totalMs: S }), await M(S, (V, Y) => {
          f("retry:tick", { attempt: n, remainingMs: V, totalMs: Y });
        }), S += T;
      }
  }
  async function N(H) {
    try {
      const n = await m(() => l(H, i == null ? void 0 : i.value)), p = [...a.value, ...n.items];
      return a.value = p, await C(), await C(), await C(), w(p), n;
    } catch (n) {
      throw n;
    }
  }
  async function k(H, n = !1) {
    if (!n && y !== "backfill" || u || r.value || d.value) return;
    const p = (H || 0) + (I || 0);
    if (!I || I <= 0) return;
    if (s.value[s.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(a.value.length >= p)) {
      u = !0, g.value || (g.value = !0, f("loading:start"));
      try {
        let z = 0;
        const V = o.value, Y = s.value[s.value.length - 1];
        for (f("backfill:start", {
          target: p,
          fetched: a.value.length,
          calls: z,
          currentPage: V,
          nextPage: Y
        }); a.value.length < p && z < P && s.value[s.value.length - 1] != null && !r.value && !d.value && u; ) {
          const O = o.value, ne = s.value[s.value.length - 1];
          if (await M(h, (Z, K) => {
            f("backfill:tick", {
              fetched: a.value.length,
              target: p,
              calls: z,
              remainingMs: Z,
              totalMs: K,
              currentPage: O,
              nextPage: ne
            });
          }), r.value || !u) break;
          const X = s.value[s.value.length - 1];
          if (X == null) {
            d.value = !0;
            break;
          }
          try {
            if (r.value || !u) break;
            const Z = await N(X);
            if (r.value || !u) break;
            v.value = null, o.value = X, s.value.push(Z.nextPage), Z.nextPage == null && (d.value = !0);
          } catch (Z) {
            if (r.value || !u) break;
            v.value = ge(Z);
          }
          z++;
        }
        const b = o.value, E = s.value[s.value.length - 1];
        f("backfill:stop", {
          fetched: a.value.length,
          calls: z,
          currentPage: b,
          nextPage: E
        });
      } finally {
        u = !1, g.value = !1;
        const z = o.value, V = s.value[s.value.length - 1];
        f("loading:stop", {
          fetched: a.value.length,
          currentPage: z,
          nextPage: V
        });
      }
    }
  }
  async function B(H) {
    if (!g.value) {
      r.value = !1, g.value || (g.value = !0, f("loading:start")), d.value = !1, v.value = null;
      try {
        const n = a.value.length;
        if (r.value) return;
        const p = await N(H);
        return r.value ? void 0 : (v.value = null, o.value = H, s.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await k(n), p);
      } catch (n) {
        throw v.value = ge(n), n;
      } finally {
        g.value = !1;
      }
    }
  }
  async function R() {
    if (!g.value && !d.value) {
      r.value = !1, g.value || (g.value = !0, f("loading:start")), v.value = null;
      try {
        const H = a.value.length;
        if (r.value) return;
        if (y === "refresh" && o.value != null && L(o.value) < I) {
          const z = await m(() => l(o.value, i == null ? void 0 : i.value));
          if (r.value) return;
          const V = [...a.value], Y = z.items.filter((E) => !E || E.id == null || E.page == null ? !1 : !V.some((O) => O && O.id === E.id && O.page === E.page));
          if (Y.length > 0) {
            const E = [...a.value, ...Y];
            a.value = E, await C(), await C(), await C(), w(E);
          }
          if (v.value = null, Y.length === 0) {
            const E = s.value[s.value.length - 1];
            if (E == null) {
              d.value = !0;
              return;
            }
            const O = await N(E);
            return r.value ? void 0 : (v.value = null, o.value = E, s.value.push(O.nextPage), O.nextPage == null && (d.value = !0), await k(H), O);
          }
          if (L(o.value) >= I) {
            const E = s.value[s.value.length - 1];
            if (E == null) {
              d.value = !0;
              return;
            }
            const O = await N(E);
            return r.value ? void 0 : (v.value = null, o.value = E, s.value.push(O.nextPage), O.nextPage == null && (d.value = !0), await k(H), O);
          } else
            return z;
        }
        const n = s.value[s.value.length - 1];
        if (n == null) {
          d.value = !0;
          return;
        }
        const p = await N(n);
        return r.value ? void 0 : (v.value = null, o.value = n, s.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await k(H), p);
      } catch (H) {
        throw v.value = ge(H), H;
      } finally {
        g.value = !1;
        const H = o.value, n = s.value[s.value.length - 1];
        f("loading:stop", {
          fetched: a.value.length,
          currentPage: H,
          nextPage: n
        });
      }
    }
  }
  async function $() {
    if (!g.value) {
      r.value = !1, g.value = !0, f("loading:start");
      try {
        const H = o.value;
        if (H == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", o.value, "paginationHistory:", s.value);
          return;
        }
        a.value = [], d.value = !1, v.value = null, s.value = [H];
        const n = await N(H);
        if (r.value) return;
        v.value = null, o.value = H, s.value.push(n.nextPage), n.nextPage == null && (d.value = !0);
        const p = a.value.length;
        return await k(p), n;
      } catch (H) {
        throw v.value = ge(H), H;
      } finally {
        g.value = !1;
        const H = o.value, n = s.value[s.value.length - 1];
        f("loading:stop", {
          fetched: a.value.length,
          currentPage: H,
          nextPage: n
        });
      }
    }
  }
  function W() {
    const H = u;
    r.value = !0, g.value = !1, u = !1;
    const n = o.value, p = s.value[s.value.length - 1];
    H && f("backfill:stop", {
      fetched: a.value.length,
      calls: 0,
      cancelled: !0,
      currentPage: n,
      nextPage: p
    }), f("loading:stop", {
      fetched: a.value.length,
      currentPage: n,
      nextPage: p
    });
  }
  return {
    loadPage: B,
    loadNext: R,
    refreshCurrentPage: $,
    cancelLoad: W,
    maybeBackfillToTarget: k,
    getContent: N
  };
}
function oa(e) {
  const {
    masonry: l,
    useSwipeMode: i,
    refreshLayout: a,
    loadNext: g,
    maybeBackfillToTarget: d,
    paginationHistory: v
  } = e;
  let o = /* @__PURE__ */ new Set(), s = null, w = !1;
  async function t() {
    if (o.size === 0 || w) return;
    w = !0;
    const f = Array.from(o);
    o.clear(), s = null, await T(f), w = !1;
  }
  async function x(f) {
    o.add(f), s && clearTimeout(s), s = setTimeout(() => {
      t();
    }, 16);
  }
  async function T(f) {
    if (!f || f.length === 0) return;
    const r = new Set(f.map((L) => L.id)), u = l.value.filter((L) => !r.has(L.id));
    if (l.value = u, await C(), u.length === 0 && v.value.length > 0) {
      try {
        await g(), await d(0, !0);
      } catch {
      }
      return;
    }
    await C(), await C(), a(u);
  }
  async function y(f) {
    !f || f.length === 0 || (f.forEach((r) => o.add(r)), s && clearTimeout(s), s = setTimeout(() => {
      t();
    }, 16));
  }
  async function h(f, r) {
    if (!f) return;
    const u = l.value;
    if (u.findIndex((N) => N.id === f.id) !== -1) return;
    const M = [...u], m = Math.min(r, M.length);
    M.splice(m, 0, f), l.value = M, await C(), i.value || (await C(), await C(), a(M));
  }
  async function P(f, r) {
    var $;
    if (!f || f.length === 0) return;
    if (!r || r.length !== f.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const u = l.value, L = new Set(u.map((W) => W.id)), M = [];
    for (let W = 0; W < f.length; W++)
      L.has(($ = f[W]) == null ? void 0 : $.id) || M.push({ item: f[W], index: r[W] });
    if (M.length === 0) return;
    const m = /* @__PURE__ */ new Map();
    for (const { item: W, index: H } of M)
      m.set(H, W);
    const N = M.length > 0 ? Math.max(...M.map(({ index: W }) => W)) : -1, k = Math.max(u.length - 1, N), B = [];
    let R = 0;
    for (let W = 0; W <= k; W++)
      m.has(W) ? B.push(m.get(W)) : R < u.length && (B.push(u[R]), R++);
    for (; R < u.length; )
      B.push(u[R]), R++;
    l.value = B, await C(), i.value || (await C(), await C(), a(B));
  }
  async function I() {
    l.value = [];
  }
  return {
    remove: x,
    removeMany: y,
    restore: h,
    restoreMany: P,
    removeAll: I
  };
}
function ra(e) {
  const {
    masonry: l,
    useSwipeMode: i,
    container: a,
    columns: g,
    containerWidth: d,
    masonryContentHeight: v,
    layout: o,
    fixedDimensions: s,
    checkItemDimensions: w
  } = e;
  let t = [];
  function x(P) {
    const I = Qt(P);
    let f = 0;
    if (a.value) {
      const { scrollTop: r, clientHeight: u } = a.value;
      f = r + u + 100;
    }
    v.value = Math.max(I, f);
  }
  function T(P) {
    var u, L;
    if (i.value) {
      l.value = P;
      return;
    }
    if (l.value = P, !a.value) return;
    if (w(P, "refreshLayout"), P.length > 1e3 && t.length > P.length && t.length - P.length < 100) {
      let M = !0;
      for (let m = 0; m < P.length; m++)
        if (((u = P[m]) == null ? void 0 : u.id) !== ((L = t[m]) == null ? void 0 : L.id)) {
          M = !1;
          break;
        }
      if (M) {
        const m = P.map((N, k) => ({
          ...t[k],
          originalIndex: k
        }));
        x(m), l.value = m, t = m;
        return;
      }
    }
    const f = P.map((M, m) => ({
      ...M,
      originalIndex: m
    })), r = a.value;
    if (s.value && s.value.width !== void 0) {
      const M = r.style.width, m = r.style.boxSizing;
      r.style.boxSizing = "border-box", r.style.width = `${s.value.width}px`, r.offsetWidth;
      const N = Ae(f, r, g.value, o.value);
      r.style.width = M, r.style.boxSizing = m, x(N), l.value = N, t = N;
    } else {
      const M = Ae(f, r, g.value, o.value);
      x(M), l.value = M, t = M;
    }
  }
  function y(P, I) {
    s.value = P, P && (P.width !== void 0 && (d.value = P.width), !i.value && a.value && l.value.length > 0 && C(() => {
      g.value = se(o.value, d.value), T(l.value), I && I();
    }));
  }
  function h() {
    g.value = se(o.value, d.value), T(l.value);
  }
  return {
    refreshLayout: T,
    setFixedDimensions: y,
    onResize: h,
    calculateHeight: x
  };
}
function ia(e) {
  const {
    masonry: l,
    container: i,
    columns: a,
    virtualBufferPx: g,
    loadThresholdPx: d
  } = e, v = F(e.handleScroll), o = F(0), s = F(0), w = g, t = F(!1), x = F({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), T = Q(() => {
    const I = o.value - w, f = o.value + s.value + w, r = l.value;
    return !r || r.length === 0 ? [] : r.filter((L) => {
      if (typeof L.top != "number" || typeof L.columnHeight != "number")
        return !0;
      const M = L.top;
      return L.top + L.columnHeight >= I && M <= f;
    });
  });
  function y(I) {
    if (!i.value) return;
    const { scrollTop: f, clientHeight: r } = i.value, u = f + r, L = I ?? $e(l.value, a.value), M = L.length ? Math.max(...L) : 0, m = typeof d == "number" ? d : 200, N = m >= 0 ? Math.max(0, M - m) : Math.max(0, M + m), k = Math.max(0, N - u), B = k <= 100;
    x.value = {
      distanceToTrigger: Math.round(k),
      isNearTrigger: B
    };
  }
  async function h() {
    if (i.value) {
      const f = i.value.scrollTop, r = i.value.clientHeight || window.innerHeight, u = r > 0 ? r : window.innerHeight;
      o.value = f, s.value = u;
    }
    t.value = !0, await C(), await C(), t.value = !1;
    const I = $e(l.value, a.value);
    v.value(I), y(I);
  }
  function P() {
    o.value = 0, s.value = 0, t.value = !1, x.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: o,
    viewportHeight: s,
    virtualizing: t,
    scrollProgress: x,
    visibleMasonry: T,
    updateScrollProgress: y,
    updateViewport: h,
    reset: P,
    handleScroll: v
  };
}
function sa(e) {
  const { masonry: l } = e, i = F(/* @__PURE__ */ new Set());
  function a(v) {
    return typeof v == "number" && v > 0 && Number.isFinite(v);
  }
  function g(v, o) {
    try {
      if (!Array.isArray(v) || v.length === 0) return;
      const s = v.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
      if (s.length === 0) return;
      const w = [];
      for (const t of s) {
        const x = (t == null ? void 0 : t.id) ?? `idx:${l.value.indexOf(t)}`;
        i.value.has(x) || (i.value.add(x), w.push(x));
      }
      if (w.length > 0) {
        const t = w.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: o,
            count: w.length,
            sampleIds: t,
            hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
          }
        );
      }
    } catch {
    }
  }
  function d() {
    i.value.clear();
  }
  return {
    checkItemDimensions: g,
    invalidDimensionIds: i,
    reset: d
  };
}
const ua = { class: "flex-1 relative min-h-0" }, ca = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, va = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, fa = {
  key: 1,
  class: "relative w-full h-full"
}, da = ["src"], ga = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ma = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, pa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ Xe({
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
    const i = e, a = l, g = F(!1), d = F(!1), v = F(null), o = F(!1), s = F(!1), w = F(null), t = F(!1), x = F(!1), T = F(!1), y = F(!1), h = F(!1), P = F(null), I = F(null);
    let f = null;
    const r = Q(() => {
      var n;
      return i.type ?? ((n = i.item) == null ? void 0 : n.type) ?? "image";
    }), u = Q(() => {
      var n;
      return i.notFound ?? ((n = i.item) == null ? void 0 : n.notFound) ?? !1;
    }), L = Q(() => !!i.inSwipeMode);
    function M(n, p) {
      const S = n === "image" ? g.value : o.value;
      x.value && S && !T.value && (T.value = !0, a("in-view-and-loaded", { item: i.item, type: n, src: p }));
    }
    function m(n) {
      a("mouse-enter", { item: i.item, type: n });
    }
    function N(n) {
      a("mouse-leave", { item: i.item, type: n });
    }
    function k(n) {
      if (L.value) return;
      const p = n.target;
      p && (p.paused ? p.play() : p.pause());
    }
    function B(n) {
      const p = n.target;
      p && (L.value || p.play(), m("video"));
    }
    function R(n) {
      const p = n.target;
      p && (L.value || p.pause(), N("video"));
    }
    function $(n) {
      return new Promise((p, S) => {
        if (!n) {
          const b = new Error("No image source provided");
          a("preload:error", { item: i.item, type: "image", src: n, error: b }), S(b);
          return;
        }
        const z = new Image(), V = Date.now(), Y = 300;
        z.onload = () => {
          const b = Date.now() - V, E = Math.max(0, Y - b);
          setTimeout(async () => {
            g.value = !0, d.value = !1, y.value = !1, await C(), await new Promise((O) => setTimeout(O, 100)), h.value = !0, a("preload:success", { item: i.item, type: "image", src: n }), M("image", n), p();
          }, E);
        }, z.onerror = () => {
          d.value = !0, g.value = !1, y.value = !1;
          const b = new Error("Failed to load image");
          a("preload:error", { item: i.item, type: "image", src: n, error: b }), S(b);
        }, z.src = n;
      });
    }
    function W(n) {
      return new Promise((p, S) => {
        if (!n) {
          const b = new Error("No video source provided");
          a("preload:error", { item: i.item, type: "video", src: n, error: b }), S(b);
          return;
        }
        const z = document.createElement("video"), V = Date.now(), Y = 300;
        z.preload = "metadata", z.muted = !0, z.onloadedmetadata = () => {
          const b = Date.now() - V, E = Math.max(0, Y - b);
          setTimeout(async () => {
            o.value = !0, s.value = !1, y.value = !1, await C(), await new Promise((O) => setTimeout(O, 100)), h.value = !0, a("preload:success", { item: i.item, type: "video", src: n }), M("video", n), p();
          }, E);
        }, z.onerror = () => {
          s.value = !0, o.value = !1, y.value = !1;
          const b = new Error("Failed to load video");
          a("preload:error", { item: i.item, type: "video", src: n, error: b }), S(b);
        }, z.src = n;
      });
    }
    async function H() {
      var p;
      if (!t.value || y.value || u.value || r.value === "video" && o.value || r.value === "image" && g.value)
        return;
      const n = (p = i.item) == null ? void 0 : p.src;
      if (n)
        if (y.value = !0, h.value = !1, r.value === "video") {
          w.value = n, o.value = !1, s.value = !1;
          try {
            await W(n);
          } catch {
          }
        } else {
          v.value = n, g.value = !1, d.value = !1;
          try {
            await $(n);
          } catch {
          }
        }
    }
    return Ge(async () => {
      if (!P.value) return;
      const n = [i.preloadThreshold, 1].filter((S, z, V) => V.indexOf(S) === z).sort((S, z) => S - z);
      f = new IntersectionObserver(
        (S) => {
          S.forEach((z) => {
            const V = z.intersectionRatio, Y = V >= 1, b = V >= i.preloadThreshold;
            if (Y && !x.value) {
              x.value = !0, a("in-view", { item: i.item, type: r.value });
              const E = r.value === "image" ? v.value : w.value, O = r.value === "image" ? g.value : o.value;
              E && O && M(r.value, E);
            }
            b && !t.value ? (t.value = !0, H()) : z.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: n
        }
      ), f.observe(P.value), await C(), await C(), await C(), p(), setTimeout(() => {
        p();
      }, 100);
      function p() {
        if (!P.value || x.value) return;
        const S = P.value.getBoundingClientRect(), z = window.innerHeight, V = window.innerWidth;
        if (S.top >= 0 && S.bottom <= z && S.left >= 0 && S.right <= V && S.height > 0 && S.width > 0) {
          x.value = !0, a("in-view", { item: i.item, type: r.value });
          const b = r.value === "image" ? v.value : w.value, E = r.value === "image" ? g.value : o.value;
          b && E && M(r.value, b);
        }
      }
    }), qe(() => {
      f && (f.disconnect(), f = null);
    }), te(
      () => {
        var n;
        return (n = i.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || u.value)) {
          if (r.value === "video") {
            if (n !== w.value && (o.value = !1, s.value = !1, w.value = n, t.value)) {
              y.value = !0;
              try {
                await W(n);
              } catch {
              }
            }
          } else if (n !== v.value && (g.value = !1, d.value = !1, v.value = n, t.value)) {
            y.value = !0;
            try {
              await $(n);
            } catch {
            }
          }
        }
      }
    ), te(
      () => i.isActive,
      (n) => {
        !L.value || !I.value || (n ? I.value.play() : I.value.pause());
      }
    ), (n, p) => (_(), U("div", {
      ref_key: "containerRef",
      ref: P,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (_(), U("div", {
        key: 0,
        class: "relative z-10",
        style: he({ height: `${n.headerHeight}px` })
      }, [
        J(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: s.value,
          showNotFound: u.value,
          isLoading: y.value,
          mediaType: r.value,
          isFullyInView: x.value
        })
      ], 4)) : ae("", !0),
      G("div", ua, [
        J(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: s.value,
          showNotFound: u.value,
          isLoading: y.value,
          mediaType: r.value,
          imageSrc: v.value,
          videoSrc: w.value,
          showMedia: h.value,
          isFullyInView: x.value
        }, () => [
          G("div", ca, [
            u.value ? (_(), U("div", va, p[3] || (p[3] = [
              G("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              G("span", { class: "font-medium" }, "Not Found", -1),
              G("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (_(), U("div", fa, [
              r.value === "image" && v.value ? (_(), U("img", {
                key: 0,
                src: v.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  g.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: p[0] || (p[0] = (S) => m("image")),
                onMouseleave: p[1] || (p[1] = (S) => N("image"))
              }, null, 42, da)) : ae("", !0),
              r.value === "video" && w.value ? (_(), U("video", {
                key: 1,
                ref_key: "videoEl",
                ref: I,
                src: w.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  o.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: L.value && i.isActive,
                controls: L.value,
                onClick: Re(k, ["stop"]),
                onTouchend: Re(k, ["stop", "prevent"]),
                onMouseenter: B,
                onMouseleave: R,
                onError: p[2] || (p[2] = (S) => s.value = !0)
              }, null, 42, ga)) : ae("", !0),
              !g.value && !o.value && !d.value && !s.value ? (_(), U("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  h.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                G("div", ha, [
                  J(n.$slots, "placeholder-icon", { mediaType: r.value }, () => [
                    G("i", {
                      class: ie(r.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ae("", !0),
              y.value ? (_(), U("div", ma, p[4] || (p[4] = [
                G("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  G("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ae("", !0),
              r.value === "image" && d.value || r.value === "video" && s.value ? (_(), U("div", pa, [
                G("i", {
                  class: ie(r.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                G("span", null, "Failed to load " + Ee(r.value), 1)
              ])) : ae("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (_(), U("div", {
        key: 1,
        class: "relative z-10",
        style: he({ height: `${n.footerHeight}px` })
      }, [
        J(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: g.value,
          imageError: d.value,
          videoLoaded: o.value,
          videoError: s.value,
          showNotFound: u.value,
          isLoading: y.value,
          mediaType: r.value,
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
}, Ta = { class: "text-red-500 dark:text-red-400" }, Pa = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ia = {
  key: 1,
  class: "w-full py-8 text-center"
}, La = { class: "text-red-500 dark:text-red-400" }, ka = /* @__PURE__ */ Xe({
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
  setup(e, { expose: l, emit: i }) {
    const a = e, g = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, d = Q(() => {
      var c;
      return {
        ...g,
        ...a.layout,
        sizes: {
          ...g.sizes,
          ...((c = a.layout) == null ? void 0 : c.sizes) || {}
        }
      };
    }), v = F(null), o = F(typeof window < "u" ? window.innerWidth : 1024), s = F(typeof window < "u" ? window.innerHeight : 768), w = F(null);
    let t = null;
    function x(c) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[c] || 768;
    }
    const T = Q(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const c = typeof a.mobileBreakpoint == "string" ? x(a.mobileBreakpoint) : a.mobileBreakpoint;
      return o.value < c;
    }), y = i, h = Q({
      get: () => a.items,
      set: (c) => y("update:items", c)
    }), P = Q({
      get: () => a.context,
      set: (c) => y("update:context", c)
    });
    function I(c) {
      P.value = c;
    }
    const f = Q(() => {
      const c = h.value;
      return (c == null ? void 0 : c.length) ?? 0;
    }), r = F(7), u = F(null), L = F([]), M = F(null), m = F(!1), N = F(0), k = F(!1), B = F(null), R = F(!1), $ = Q(() => Kt(o.value)), W = sa({
      masonry: h
    }), { checkItemDimensions: H, reset: n } = W, p = ra({
      masonry: h,
      useSwipeMode: T,
      container: u,
      columns: r,
      containerWidth: o,
      masonryContentHeight: N,
      layout: d,
      fixedDimensions: w,
      checkItemDimensions: H
    }), { refreshLayout: S, setFixedDimensions: z, onResize: V } = p, Y = ia({
      masonry: h,
      container: u,
      columns: r,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: b, viewportHeight: E, virtualizing: O, visibleMasonry: ne, updateScrollProgress: X, updateViewport: Z, reset: K } = Y, { onEnter: Qe, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = ta(
      { container: u },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: O }
    ), at = Qe, nt = Ze, lt = et, ot = tt, rt = la({
      getPage: a.getPage,
      context: P,
      masonry: h,
      isLoading: m,
      hasReachedEnd: k,
      loadError: B,
      currentPage: M,
      paginationHistory: L,
      refreshLayout: S,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: a.mode,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: y
    }), { loadPage: be, loadNext: me, refreshCurrentPage: it, cancelLoad: Me, maybeBackfillToTarget: st } = rt, ee = na({
      useSwipeMode: T,
      masonry: h,
      isLoading: m,
      loadNext: me,
      loadPage: be,
      paginationHistory: L
    }), { handleScroll: ut } = aa({
      container: u,
      masonry: h,
      columns: r,
      containerHeight: N,
      isLoading: m,
      pageSize: a.pageSize,
      refreshLayout: S,
      setItemsRaw: (c) => {
        h.value = c;
      },
      loadNext: me,
      loadThresholdPx: a.loadThresholdPx
    });
    Y.handleScroll.value = ut;
    const ct = oa({
      masonry: h,
      useSwipeMode: T,
      refreshLayout: S,
      loadNext: me,
      maybeBackfillToTarget: st,
      paginationHistory: L
    }), { remove: ue, removeMany: vt, restore: ft, restoreMany: dt, removeAll: gt } = ct;
    function ht(c) {
      z(c, X), !c && v.value && (o.value = v.value.clientWidth, s.value = v.value.clientHeight);
    }
    l({
      // Cancels any ongoing load operations (page loads, backfills, etc.)
      cancelLoad: Me,
      // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
      context: P,
      // Container height (wrapper element) in pixels
      containerHeight: s,
      // Container width (wrapper element) in pixels
      containerWidth: o,
      // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
      currentBreakpoint: $,
      // Current page number or cursor being displayed
      currentPage: M,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Mt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: k,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: Tt,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: R,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: m,
      // Error object if the last load operation failed, null otherwise
      loadError: B,
      // Loads the next page of items asynchronously
      loadNext: me,
      // Loads a specific page number or cursor asynchronously
      loadPage: be,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: L,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: it,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: S,
      // Removes a single item from the masonry
      remove: ue,
      // Removes all items from the masonry
      removeAll: gt,
      // Removes multiple items from the masonry in a single operation
      removeMany: vt,
      // Resets the component to initial state (clears items, resets pagination, scrolls to top)
      reset: bt,
      // Restores a single item at its original index (useful for undo operations)
      restore: ft,
      // Restores multiple items at their original indices (useful for undo operations)
      restoreMany: dt,
      // Scrolls the container to a specific position
      scrollTo: wt,
      // Scrolls the container to the top
      scrollToTop: yt,
      // Sets the opaque caller context (alternative to v-model:context)
      setContext: I,
      // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
      setFixedDimensions: ht,
      // Computed property returning the total number of items currently in the masonry
      totalItems: Q(() => h.value.length)
    });
    const ce = ee.currentSwipeIndex, pe = ee.swipeOffset, ye = ee.isDragging, oe = ee.swipeContainer, Ne = ee.handleTouchStart, ze = ee.handleTouchMove, De = ee.handleTouchEnd, Be = ee.handleMouseDown, Te = ee.handleMouseMove, Pe = ee.handleMouseUp, Ie = ee.snapToCurrentItem;
    function mt(c) {
      const D = f.value, j = typeof c == "string" ? parseInt(c, 10) : c;
      return D > 0 ? `${j * (100 / D)}%` : "0%";
    }
    function pt() {
      const c = f.value;
      return c > 0 ? `${100 / c}%` : "0%";
    }
    function yt(c) {
      u.value && u.value.scrollTo({
        top: 0,
        behavior: (c == null ? void 0 : c.behavior) ?? "smooth",
        ...c
      });
    }
    function wt(c) {
      u.value && (u.value.scrollTo({
        top: c.top ?? u.value.scrollTop,
        left: c.left ?? u.value.scrollLeft,
        behavior: c.behavior ?? "auto"
      }), u.value && (b.value = u.value.scrollTop, E.value = u.value.clientHeight || window.innerHeight));
    }
    function xt() {
      V(), u.value && (b.value = u.value.scrollTop, E.value = u.value.clientHeight);
    }
    function bt() {
      Me(), u.value && u.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), h.value = [], s.value = 0, M.value = a.loadAtPage, L.value = [a.loadAtPage], k.value = !1, B.value = null, R.value = !1, K();
    }
    function Mt() {
      Me(), h.value = [], N.value = 0, M.value = null, L.value = [], k.value = !1, B.value = null, m.value = !1, R.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, K(), n(), u.value && u.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const re = Ue(async () => {
      T.value || await Z();
    }, 200), We = Ue(xt, 200);
    function Fe() {
      ee.handleWindowResize();
    }
    async function Tt(c, D, j) {
      M.value = D, L.value = [D], j != null && L.value.push(j), k.value = j === null, H(c, "initialize");
      const le = h.value, A = le.length === 0 ? c : [...le, ...c];
      h.value = A, await C(), T.value ? ce.value === 0 && h.value.length > 0 && (pe.value = 0) : (await C(), await C(), S(A), u.value && (b.value = u.value.scrollTop, E.value = u.value.clientHeight || window.innerHeight), C(() => {
        u.value && (b.value = u.value.scrollTop, E.value = u.value.clientHeight || window.innerHeight, X());
      })), c && c.length > 0 && (R.value = !0);
    }
    return te(
      d,
      () => {
        T.value || u.value && (r.value = se(d.value, o.value), S(h.value));
      },
      { deep: !0 }
    ), te(() => a.layoutMode, () => {
      w.value && w.value.width !== void 0 ? o.value = w.value.width : v.value && (o.value = v.value.clientWidth);
    }), te(u, (c) => {
      c && !T.value ? (c.removeEventListener("scroll", re), c.addEventListener("scroll", re, { passive: !0 })) : c && c.removeEventListener("scroll", re);
    }, { immediate: !0 }), te(
      () => h.value.length,
      (c, D) => {
        a.init === "manual" && !R.value && c > 0 && D === 0 && (R.value = !0);
      },
      { immediate: !1 }
    ), te(T, (c, D) => {
      D === void 0 && c === !1 || C(() => {
        c ? (document.addEventListener("mousemove", Te), document.addEventListener("mouseup", Pe), u.value && u.value.removeEventListener("scroll", re), ce.value = 0, pe.value = 0, h.value.length > 0 && Ie()) : (document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Pe), u.value && v.value && (w.value && w.value.width !== void 0 ? o.value = w.value.width : o.value = v.value.clientWidth, u.value.removeEventListener("scroll", re), u.value.addEventListener("scroll", re, { passive: !0 }), h.value.length > 0 && (r.value = se(d.value, o.value), S(h.value), b.value = u.value.scrollTop, E.value = u.value.clientHeight, X())));
      });
    }, { immediate: !0 }), te(oe, (c) => {
      c && (c.addEventListener("touchstart", Ne, { passive: !1 }), c.addEventListener("touchmove", ze, { passive: !1 }), c.addEventListener("touchend", De), c.addEventListener("mousedown", Be));
    }), te(() => h.value.length, (c, D) => {
      T.value && c > 0 && D === 0 && (ce.value = 0, C(() => Ie()));
    }), te(v, (c) => {
      t && (t.disconnect(), t = null), c && typeof ResizeObserver < "u" ? (t = new ResizeObserver((D) => {
        if (!w.value)
          for (const j of D) {
            const le = j.contentRect.width, A = j.contentRect.height;
            o.value !== le && (o.value = le), s.value !== A && (s.value = A);
          }
      }), t.observe(c), w.value || (o.value = c.clientWidth, s.value = c.clientHeight)) : c && (w.value || (o.value = c.clientWidth, s.value = c.clientHeight));
    }, { immediate: !0 }), te(o, (c, D) => {
      c !== D && c > 0 && !T.value && u.value && h.value.length > 0 && C(() => {
        r.value = se(d.value, c), S(h.value), X();
      });
    }), Ge(async () => {
      try {
        await C(), v.value && !t && (o.value = v.value.clientWidth, s.value = v.value.clientHeight), T.value || (r.value = se(d.value, o.value), u.value && (b.value = u.value.scrollTop, E.value = u.value.clientHeight));
        const c = a.loadAtPage;
        if (a.init === "auto" && L.value.length === 0 && (L.value = [c]), a.init === "auto") {
          R.value = !0, await C();
          try {
            await be(c);
          } catch {
          }
        }
        T.value ? C(() => Ie()) : X();
      } catch (c) {
        B.value || (console.error("Error during component initialization:", c), B.value = ge(c)), m.value = !1;
      }
      window.addEventListener("resize", We), window.addEventListener("resize", Fe);
    }), qe(() => {
      var c;
      t && (t.disconnect(), t = null), (c = u.value) == null || c.removeEventListener("scroll", re), window.removeEventListener("resize", We), window.removeEventListener("resize", Fe), oe.value && (oe.value.removeEventListener("touchstart", Ne), oe.value.removeEventListener("touchmove", ze), oe.value.removeEventListener("touchend", De), oe.value.removeEventListener("mousedown", Be)), document.removeEventListener("mousemove", Te), document.removeEventListener("mouseup", Pe);
    }), (c, D) => (_(), U("div", {
      ref_key: "wrapper",
      ref: v,
      class: "w-full h-full flex flex-col relative"
    }, [
      R.value ? T.value ? (_(), U("div", {
        key: 1,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !q(ye), "cursor-grabbing": q(ye) }]),
        ref_key: "swipeContainer",
        ref: oe,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        G("div", {
          class: "relative w-full",
          style: he({
            transform: `translateY(${q(pe)}px)`,
            transition: q(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${f.value * 100}%`
          })
        }, [
          (_(!0), U(Ce, null, Oe(h.value, (j, le) => (_(), U("div", {
            key: `${j.page}-${j.id}`,
            class: "absolute top-0 left-0 w-full",
            style: he({
              top: mt(le),
              height: pt()
            })
          }, [
            G("div", wa, [
              G("div", xa, [
                J(c.$slots, "default", {
                  item: j,
                  remove: q(ue),
                  index: j.originalIndex ?? h.value.indexOf(j)
                }, () => [
                  Le(xe, {
                    item: j,
                    remove: q(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": le === q(ce),
                    "onPreload:success": D[0] || (D[0] = (A) => y("item:preload:success", A)),
                    "onPreload:error": D[1] || (D[1] = (A) => y("item:preload:error", A)),
                    onMouseEnter: D[2] || (D[2] = (A) => y("item:mouse-enter", A)),
                    onMouseLeave: D[3] || (D[3] = (A) => y("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      J(c.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      J(c.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        k.value && h.value.length > 0 ? (_(), U("div", ba, [
          J(c.$slots, "end-message", {}, () => [
            D[9] || (D[9] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        B.value && h.value.length > 0 ? (_(), U("div", Ma, [
          J(c.$slots, "error-message", { error: B.value }, () => [
            G("p", Ta, "Failed to load content: " + Ee(B.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (_(), U("div", {
        key: 2,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: u
      }, [
        G("div", {
          class: "relative",
          style: he({ height: `${N.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          Le(Pt, {
            name: "masonry",
            css: !1,
            onEnter: q(at),
            onBeforeEnter: q(nt),
            onLeave: q(ot),
            onBeforeLeave: q(lt)
          }, {
            default: ve(() => [
              (_(!0), U(Ce, null, Oe(q(ne), (j, le) => (_(), U("div", fe({
                key: `${j.page}-${j.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, q(ea)(j, le)), [
                J(c.$slots, "default", {
                  item: j,
                  remove: q(ue),
                  index: j.originalIndex ?? h.value.indexOf(j)
                }, () => [
                  Le(xe, {
                    item: j,
                    remove: q(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": D[4] || (D[4] = (A) => y("item:preload:success", A)),
                    "onPreload:error": D[5] || (D[5] = (A) => y("item:preload:error", A)),
                    onMouseEnter: D[6] || (D[6] = (A) => y("item:mouse-enter", A)),
                    onMouseLeave: D[7] || (D[7] = (A) => y("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      J(c.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      J(c.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        k.value && h.value.length > 0 ? (_(), U("div", Pa, [
          J(c.$slots, "end-message", {}, () => [
            D[10] || (D[10] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ae("", !0),
        B.value && h.value.length > 0 ? (_(), U("div", Ia, [
          J(c.$slots, "error-message", { error: B.value }, () => [
            G("p", La, "Failed to load content: " + Ee(B.value.message), 1)
          ], !0)
        ])) : ae("", !0)
      ], 2)) : (_(), U("div", ya, [
        J(c.$slots, "loading-message", {}, () => [
          D[8] || (D[8] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Sa = (e, l) => {
  const i = e.__vccOpts || e;
  for (const [a, g] of l)
    i[a] = g;
  return i;
}, _e = /* @__PURE__ */ Sa(ka, [["__scopeId", "data-v-a7ad9844"]]), Ha = {
  install(e) {
    e.component("WyxosMasonry", _e), e.component("WMasonry", _e), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  _e as Masonry,
  xe as MasonryItem,
  Ha as default
};
