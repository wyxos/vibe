import { nextTick as V, ref as N, computed as Z, defineComponent as Ge, onMounted as qe, onUnmounted as Je, watch as ae, createElementBlock as _, openBlock as X, createCommentVNode as ne, createElementVNode as G, normalizeStyle as he, renderSlot as Q, normalizeClass as ie, withModifiers as Ce, toDisplayString as He, unref as K, Fragment as Oe, renderList as Ae, createVNode as ke, withCtx as ve, mergeProps as fe, TransitionGroup as Lt } from "vue";
let Se = null;
function kt() {
  if (Se != null) return Se;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const n = document.createElement("div");
  n.style.width = "100%", e.appendChild(n);
  const i = e.offsetWidth - n.offsetWidth;
  return document.body.removeChild(e), Se = i, i;
}
function Ve(e, n, i, a = {}) {
  const {
    gutterX: h = 0,
    gutterY: d = 0,
    header: f = 0,
    footer: l = 0,
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
  let k = 0, M = 0;
  try {
    if (n && n.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const L = window.getComputedStyle(n);
      k = parseFloat(L.paddingLeft) || 0, M = parseFloat(L.paddingRight) || 0;
    }
  } catch {
  }
  const g = (s || 0) + k, P = (w || 0) + M, S = n.offsetWidth - n.clientWidth, T = S > 0 ? S + 2 : kt() + 2, u = n.offsetWidth - T - g - P, r = h * (i - 1), y = Math.floor((u - r) / i), I = e.map((L) => {
    const $ = L.width, F = L.height;
    return Math.round(y * F / $) + l + f;
  });
  if (x === "sequential-balanced") {
    const L = I.length;
    if (L === 0) return [];
    const $ = (b, W, z) => b + (W > 0 ? d : 0) + z;
    let F = Math.max(...I), E = I.reduce((b, W) => b + W, 0) + d * Math.max(0, L - 1);
    const C = (b) => {
      let W = 1, z = 0, Y = 0;
      for (let J = 0; J < L; J++) {
        const le = I[J], q = $(z, Y, le);
        if (q <= b)
          z = q, Y++;
        else if (W++, z = le, Y = 1, le > b || W > i) return !1;
      }
      return W <= i;
    };
    for (; F < E; ) {
      const b = Math.floor((F + E) / 2);
      C(b) ? E = b : F = b + 1;
    }
    const O = E, o = new Array(i).fill(0);
    let v = i - 1, p = 0, B = 0;
    for (let b = L - 1; b >= 0; b--) {
      const W = I[b], z = b < v;
      !($(p, B, W) <= O) || z ? (o[v] = b + 1, v--, p = W, B = 1) : (p = $(p, B, W), B++);
    }
    o[0] = 0;
    const R = [], j = new Array(i).fill(0);
    for (let b = 0; b < i; b++) {
      const W = o[b], z = b + 1 < i ? o[b + 1] : L, Y = b * (y + h);
      for (let J = W; J < z; J++) {
        const q = {
          ...e[J],
          columnWidth: y,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        q.imageHeight = I[J] - (l + f), q.columnHeight = I[J], q.left = Y, q.top = j[b], j[b] += q.columnHeight + (J + 1 < z ? d : 0), R.push(q);
      }
    }
    return R;
  }
  const m = new Array(i).fill(0), H = [];
  for (let L = 0; L < e.length; L++) {
    const $ = e[L], F = {
      ...$,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, E = m.indexOf(Math.min(...m)), C = $.width, O = $.height;
    F.columnWidth = y, F.left = E * (y + h), F.imageHeight = Math.round(y * O / C), F.columnHeight = F.imageHeight + l + f, F.top = m[E], m[E] += F.columnHeight + d, H.push(F);
  }
  return H;
}
var St = typeof global == "object" && global && global.Object === Object && global, Et = typeof self == "object" && self && self.Object === Object && self, Ke = St || Et || Function("return this")(), we = Ke.Symbol, Qe = Object.prototype, Ht = Qe.hasOwnProperty, $t = Qe.toString, de = we ? we.toStringTag : void 0;
function Dt(e) {
  var n = Ht.call(e, de), i = e[de];
  try {
    e[de] = void 0;
    var a = !0;
  } catch {
  }
  var h = $t.call(e);
  return a && (n ? e[de] = i : delete e[de]), h;
}
var Nt = Object.prototype, zt = Nt.toString;
function Bt(e) {
  return zt.call(e);
}
var Wt = "[object Null]", Rt = "[object Undefined]", je = we ? we.toStringTag : void 0;
function Ft(e) {
  return e == null ? e === void 0 ? Rt : Wt : je && je in Object(e) ? Dt(e) : Bt(e);
}
function Ct(e) {
  return e != null && typeof e == "object";
}
var Ot = "[object Symbol]";
function At(e) {
  return typeof e == "symbol" || Ct(e) && Ft(e) == Ot;
}
var Vt = /\s/;
function jt(e) {
  for (var n = e.length; n-- && Vt.test(e.charAt(n)); )
    ;
  return n;
}
var Yt = /^\s+/;
function Ut(e) {
  return e && e.slice(0, jt(e) + 1).replace(Yt, "");
}
function $e(e) {
  var n = typeof e;
  return e != null && (n == "object" || n == "function");
}
var Ye = NaN, _t = /^[-+]0x[0-9a-f]+$/i, Xt = /^0b[01]+$/i, Gt = /^0o[0-7]+$/i, qt = parseInt;
function Ue(e) {
  if (typeof e == "number")
    return e;
  if (At(e))
    return Ye;
  if ($e(e)) {
    var n = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = $e(n) ? n + "" : n;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Ut(e);
  var i = Xt.test(e);
  return i || Gt.test(e) ? qt(e.slice(2), i ? 2 : 8) : _t.test(e) ? Ye : +e;
}
var Ee = function() {
  return Ke.Date.now();
}, Jt = "Expected a function", Kt = Math.max, Qt = Math.min;
function _e(e, n, i) {
  var a, h, d, f, l, s, w = 0, t = !1, x = !1, k = !0;
  if (typeof e != "function")
    throw new TypeError(Jt);
  n = Ue(n) || 0, $e(i) && (t = !!i.leading, x = "maxWait" in i, d = x ? Kt(Ue(i.maxWait) || 0, n) : d, k = "trailing" in i ? !!i.trailing : k);
  function M(m) {
    var H = a, L = h;
    return a = h = void 0, w = m, f = e.apply(L, H), f;
  }
  function g(m) {
    return w = m, l = setTimeout(T, n), t ? M(m) : f;
  }
  function P(m) {
    var H = m - s, L = m - w, $ = n - H;
    return x ? Qt($, d - L) : $;
  }
  function S(m) {
    var H = m - s, L = m - w;
    return s === void 0 || H >= n || H < 0 || x && L >= d;
  }
  function T() {
    var m = Ee();
    if (S(m))
      return u(m);
    l = setTimeout(T, P(m));
  }
  function u(m) {
    return l = void 0, k && a ? M(m) : (a = h = void 0, f);
  }
  function r() {
    l !== void 0 && clearTimeout(l), w = 0, a = s = h = l = void 0;
  }
  function y() {
    return l === void 0 ? f : u(Ee());
  }
  function I() {
    var m = Ee(), H = S(m);
    if (a = arguments, h = this, s = m, H) {
      if (l === void 0)
        return g(s);
      if (x)
        return clearTimeout(l), l = setTimeout(T, n), M(s);
    }
    return l === void 0 && (l = setTimeout(T, n)), f;
  }
  return I.cancel = r, I.flush = y, I;
}
function se(e, n) {
  const i = n ?? (typeof window < "u" ? window.innerWidth : 1024), a = e.sizes;
  return i >= 1536 && a["2xl"] ? a["2xl"] : i >= 1280 && a.xl ? a.xl : i >= 1024 && a.lg ? a.lg : i >= 768 && a.md ? a.md : i >= 640 && a.sm ? a.sm : a.base;
}
function Zt(e) {
  const n = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return n >= 1536 ? "2xl" : n >= 1280 ? "xl" : n >= 1024 ? "lg" : n >= 768 ? "md" : n >= 640 ? "sm" : "base";
}
function ea(e) {
  return e.reduce((i, a) => Math.max(i, a.top + a.columnHeight), 0) + 500;
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
function aa(e, n = 0) {
  return {
    style: ta(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": n
  };
}
function De(e, n) {
  if (!e.length || n <= 0)
    return new Array(Math.max(1, n)).fill(0);
  const a = Array.from(new Set(e.map((f) => f.left))).sort((f, l) => f - l).slice(0, n), h = /* @__PURE__ */ new Map();
  for (let f = 0; f < a.length; f++) h.set(a[f], f);
  const d = new Array(a.length).fill(0);
  for (const f of e) {
    const l = h.get(f.left);
    l != null && (d[l] = Math.max(d[l], f.top + f.columnHeight));
  }
  for (; d.length < n; ) d.push(0);
  return d;
}
function na(e, n) {
  let i = 0, a = 0;
  const h = 1e3;
  function d(t, x) {
    var g;
    const k = (g = e.container) == null ? void 0 : g.value;
    if (k) {
      const P = k.scrollTop, S = k.clientHeight;
      i = P - h, a = P + S + h;
    }
    return t + x >= i && t <= a;
  }
  function f(t, x) {
    var r;
    const k = parseInt(t.dataset.left || "0", 10), M = parseInt(t.dataset.top || "0", 10), g = parseInt(t.dataset.index || "0", 10), P = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((r = n == null ? void 0 : n.virtualizing) != null && r.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${k}px, ${M}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "", x();
      return;
    }
    if (!d(M, P)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${k}px, ${M}px, 0) scale(1)`, t.style.transition = "none", x();
      return;
    }
    const S = Math.min(g * 20, 160), T = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${S}ms`), t.style.opacity = "1", t.style.transform = `translate3d(${k}px, ${M}px, 0) scale(1)`;
    const u = () => {
      T ? t.style.setProperty("--masonry-opacity-delay", T) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", u), x();
    };
    t.addEventListener("transitionend", u);
  }
  function l(t) {
    var P;
    const x = parseInt(t.dataset.left || "0", 10), k = parseInt(t.dataset.top || "0", 10);
    if ((P = n == null ? void 0 : n.virtualizing) != null && P.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${k}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    const M = x === 0 && k === 0 ? 0 : x, g = x === 0 && k === 0 ? 0 : k;
    t.style.opacity = "0", t.style.transform = `translate3d(${M}px, ${g + 10}px, 0) scale(0.985)`;
  }
  function s(t) {
    var g;
    const x = parseInt(t.dataset.left || "0", 10), k = parseInt(t.dataset.top || "0", 10), M = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((g = n == null ? void 0 : n.virtualizing) != null && g.value)) {
      if (!d(k, M)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${k}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), t.style.transition = "";
    }
  }
  function w(t, x) {
    var I;
    const k = parseInt(t.dataset.left || "0", 10), M = parseInt(t.dataset.top || "0", 10), g = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((I = n == null ? void 0 : n.virtualizing) != null && I.value) {
      x();
      return;
    }
    if (!d(M, g)) {
      t.style.transition = "none", t.style.opacity = "0", x();
      return;
    }
    const P = typeof (n == null ? void 0 : n.leaveDurationMs) == "number" ? n.leaveDurationMs : Number.NaN;
    let S = Number.isFinite(P) && P > 0 ? P : Number.NaN;
    if (!Number.isFinite(S)) {
      const H = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(H);
      S = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const T = t.style.transitionDuration, u = () => {
      t.removeEventListener("transitionend", r), clearTimeout(y), t.style.transitionDuration = T || "";
    }, r = (m) => {
      (!m || m.target === t) && (u(), x());
    }, y = setTimeout(() => {
      u(), x();
    }, S + 100);
    t.style.transitionDuration = `${S}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${k}px, ${M + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", r);
  }
  return {
    onEnter: f,
    onBeforeEnter: l,
    onBeforeLeave: s,
    onLeave: w
  };
}
function la({
  container: e,
  masonry: n,
  columns: i,
  containerHeight: a,
  isLoading: h,
  pageSize: d,
  refreshLayout: f,
  setItemsRaw: l,
  loadNext: s,
  loadThresholdPx: w
}) {
  let t = 0;
  async function x(k, M = !1) {
    if (!e.value) return;
    const g = k ?? De(n.value, i.value), P = g.length ? Math.max(...g) : 0, S = e.value.scrollTop + e.value.clientHeight, T = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const u = typeof w == "number" ? w : 200, r = u >= 0 ? Math.max(0, P - u) : Math.max(0, P + u);
    if (S >= r && (T || M) && !h.value) {
      await s(), await V();
      return;
    }
  }
  return {
    handleScroll: x
  };
}
function oa(e) {
  const { useSwipeMode: n, masonry: i, isLoading: a, loadNext: h, loadPage: d, paginationHistory: f } = e, l = N(0), s = N(0), w = N(!1), t = N(0), x = N(0), k = N(null), M = Z(() => {
    if (!n.value || i.value.length === 0) return null;
    const E = Math.max(0, Math.min(l.value, i.value.length - 1));
    return i.value[E] || null;
  }), g = Z(() => {
    if (!n.value || !M.value) return null;
    const E = l.value + 1;
    return E >= i.value.length ? null : i.value[E] || null;
  }), P = Z(() => {
    if (!n.value || !M.value) return null;
    const E = l.value - 1;
    return E < 0 ? null : i.value[E] || null;
  });
  function S() {
    if (!k.value) return;
    const E = k.value.clientHeight;
    s.value = -l.value * E;
  }
  function T() {
    if (!g.value) {
      h();
      return;
    }
    l.value++, S(), l.value >= i.value.length - 5 && h();
  }
  function u() {
    P.value && (l.value--, S());
  }
  function r(E) {
    n.value && (w.value = !0, t.value = E.touches[0].clientY, x.value = s.value, E.preventDefault());
  }
  function y(E) {
    if (!n.value || !w.value) return;
    const C = E.touches[0].clientY - t.value;
    s.value = x.value + C, E.preventDefault();
  }
  function I(E) {
    if (!n.value || !w.value) return;
    w.value = !1;
    const C = s.value - x.value;
    Math.abs(C) > 100 ? C > 0 && P.value ? u() : C < 0 && g.value ? T() : S() : S(), E.preventDefault();
  }
  function m(E) {
    n.value && (w.value = !0, t.value = E.clientY, x.value = s.value, E.preventDefault());
  }
  function H(E) {
    if (!n.value || !w.value) return;
    const C = E.clientY - t.value;
    s.value = x.value + C, E.preventDefault();
  }
  function L(E) {
    if (!n.value || !w.value) return;
    w.value = !1;
    const C = s.value - x.value;
    Math.abs(C) > 100 ? C > 0 && P.value ? u() : C < 0 && g.value ? T() : S() : S(), E.preventDefault();
  }
  function $() {
    !n.value && l.value > 0 && (l.value = 0, s.value = 0), n.value && i.value.length === 0 && !a.value && d(f.value[0]), n.value && S();
  }
  function F() {
    l.value = 0, s.value = 0, w.value = !1;
  }
  return {
    // State
    currentSwipeIndex: l,
    swipeOffset: s,
    isDragging: w,
    swipeContainer: k,
    // Computed
    currentItem: M,
    nextItem: g,
    previousItem: P,
    // Functions
    handleTouchStart: r,
    handleTouchMove: y,
    handleTouchEnd: I,
    handleMouseDown: m,
    handleMouseMove: H,
    handleMouseUp: L,
    goToNextItem: T,
    goToPreviousItem: u,
    snapToCurrentItem: S,
    handleWindowResize: $,
    reset: F
  };
}
function ge(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function ra(e) {
  const {
    getPage: n,
    context: i,
    masonry: a,
    isLoading: h,
    hasReachedEnd: d,
    loadError: f,
    currentPage: l,
    paginationHistory: s,
    refreshLayout: w,
    retryMaxAttempts: t,
    retryInitialDelayMs: x,
    retryBackoffStepMs: k,
    mode: M,
    backfillDelayMs: g,
    backfillMaxCalls: P,
    pageSize: S,
    emits: T
  } = e, u = typeof M == "string" ? N(M) : M, r = N(!1);
  let y = !1;
  function I(o) {
    return a.value.filter((v) => v.page === o).length;
  }
  function m(o, v) {
    return new Promise((p) => {
      const B = Math.max(0, o | 0), R = Date.now();
      v(B, B);
      const j = setInterval(() => {
        if (r.value) {
          clearInterval(j), p();
          return;
        }
        const b = Date.now() - R, W = Math.max(0, B - b);
        v(W, B), W <= 0 && (clearInterval(j), p());
      }, 100);
    });
  }
  async function H(o) {
    let v = 0;
    const p = t;
    let B = x;
    for (; ; )
      try {
        const R = await o();
        return v > 0 && T("retry:stop", { attempt: v, success: !0 }), R;
      } catch (R) {
        if (v++, v > p)
          throw T("retry:stop", { attempt: v - 1, success: !1 }), R;
        T("retry:start", { attempt: v, max: p, totalMs: B }), await m(B, (j, b) => {
          T("retry:tick", { attempt: v, remainingMs: j, totalMs: b });
        }), B += k;
      }
  }
  async function L(o) {
    try {
      const v = await H(() => n(o, i == null ? void 0 : i.value)), p = [...a.value, ...v.items];
      return a.value = p, await V(), await V(), w(p), v;
    } catch (v) {
      throw v;
    }
  }
  async function $(o, v = !1) {
    if (!v && u.value !== "backfill" || y || r.value || d.value) return;
    const p = (o || 0) + (S || 0);
    if (!S || S <= 0) return;
    if (s.value[s.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(a.value.length >= p)) {
      y = !0, h.value || (h.value = !0, T("loading:start"));
      try {
        let R = 0;
        const j = l.value, b = s.value[s.value.length - 1];
        for (T("backfill:start", {
          target: p,
          fetched: a.value.length,
          calls: R,
          currentPage: j,
          nextPage: b
        }); a.value.length < p && R < P && s.value[s.value.length - 1] != null && !r.value && !d.value && y; ) {
          const Y = l.value, J = s.value[s.value.length - 1];
          if (await m(g, (q, be) => {
            T("backfill:tick", {
              fetched: a.value.length,
              target: p,
              calls: R,
              remainingMs: q,
              totalMs: be,
              currentPage: Y,
              nextPage: J
            });
          }), r.value || !y) break;
          const le = s.value[s.value.length - 1];
          if (le == null) {
            d.value = !0;
            break;
          }
          try {
            if (r.value || !y) break;
            const q = await L(le);
            if (r.value || !y) break;
            f.value = null, l.value = le, s.value.push(q.nextPage), q.nextPage == null && (d.value = !0);
          } catch (q) {
            if (r.value || !y) break;
            f.value = ge(q);
          }
          R++;
        }
        const W = l.value, z = s.value[s.value.length - 1];
        T("backfill:stop", {
          fetched: a.value.length,
          calls: R,
          currentPage: W,
          nextPage: z
        });
      } finally {
        y = !1, h.value = !1;
        const R = l.value, j = s.value[s.value.length - 1];
        T("loading:stop", {
          fetched: a.value.length,
          currentPage: R,
          nextPage: j
        });
      }
    }
  }
  async function F(o) {
    if (!h.value) {
      r.value = !1, h.value || (h.value = !0, T("loading:start")), d.value = !1, f.value = null;
      try {
        const v = a.value.length;
        if (r.value) return;
        const p = await L(o);
        return r.value ? void 0 : (f.value = null, l.value = o, s.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await $(v), p);
      } catch (v) {
        throw f.value = ge(v), v;
      } finally {
        h.value = !1;
        const v = l.value, p = s.value[s.value.length - 1];
        T("loading:stop", {
          fetched: a.value.length,
          currentPage: v,
          nextPage: p
        });
      }
    }
  }
  async function E() {
    if (!h.value && !d.value) {
      r.value = !1, h.value || (h.value = !0, T("loading:start")), f.value = null;
      try {
        const o = a.value.length;
        if (r.value) return;
        if (u.value === "refresh" && l.value != null && I(l.value) < S) {
          const R = await H(() => n(l.value, i == null ? void 0 : i.value));
          if (r.value) return;
          const j = [...a.value], b = R.items.filter((z) => !z || z.id == null || z.page == null ? !1 : !j.some((Y) => Y && Y.id === z.id && Y.page === z.page));
          if (b.length > 0) {
            const z = [...a.value, ...b];
            a.value = z, await V(), await V(), w(z);
          }
          if (f.value = null, b.length === 0) {
            const z = s.value[s.value.length - 1];
            if (z == null) {
              d.value = !0;
              return;
            }
            const Y = await L(z);
            return r.value ? void 0 : (f.value = null, l.value = z, s.value.push(Y.nextPage), Y.nextPage == null && (d.value = !0), await $(o), Y);
          }
          if (I(l.value) >= S) {
            const z = s.value[s.value.length - 1];
            if (z == null) {
              d.value = !0;
              return;
            }
            const Y = await L(z);
            return r.value ? void 0 : (f.value = null, l.value = z, s.value.push(Y.nextPage), Y.nextPage == null && (d.value = !0), await $(o), Y);
          } else
            return R;
        }
        const v = s.value[s.value.length - 1];
        if (v == null) {
          d.value = !0;
          return;
        }
        const p = await L(v);
        return r.value ? void 0 : (f.value = null, l.value = v, s.value.push(p.nextPage), p.nextPage == null && (d.value = !0), await $(o), p);
      } catch (o) {
        throw f.value = ge(o), o;
      } finally {
        h.value = !1;
        const o = l.value, v = s.value[s.value.length - 1];
        T("loading:stop", {
          fetched: a.value.length,
          currentPage: o,
          nextPage: v
        });
      }
    }
  }
  async function C() {
    if (!h.value) {
      r.value = !1, h.value = !0, T("loading:start");
      try {
        const o = l.value;
        if (o == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", l.value, "paginationHistory:", s.value);
          return;
        }
        a.value = [], d.value = !1, f.value = null, s.value = [o];
        const v = await L(o);
        if (r.value) return;
        f.value = null, l.value = o, s.value.push(v.nextPage), v.nextPage == null && (d.value = !0);
        const p = a.value.length;
        return await $(p), v;
      } catch (o) {
        throw f.value = ge(o), o;
      } finally {
        h.value = !1;
        const o = l.value, v = s.value[s.value.length - 1];
        T("loading:stop", {
          fetched: a.value.length,
          currentPage: o,
          nextPage: v
        });
      }
    }
  }
  function O() {
    const o = y;
    r.value = !0, h.value = !1, y = !1;
    const v = l.value, p = s.value[s.value.length - 1];
    o && T("backfill:stop", {
      fetched: a.value.length,
      calls: 0,
      cancelled: !0,
      currentPage: v,
      nextPage: p
    }), T("loading:stop", {
      fetched: a.value.length,
      currentPage: v,
      nextPage: p
    });
  }
  return {
    loadPage: F,
    loadNext: E,
    refreshCurrentPage: C,
    cancelLoad: O,
    maybeBackfillToTarget: $,
    getContent: L
  };
}
function ia(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    refreshLayout: a,
    loadNext: h,
    maybeBackfillToTarget: d,
    paginationHistory: f
  } = e;
  let l = !1, s = /* @__PURE__ */ new Set(), w = null, t = !1;
  async function x() {
    if (s.size === 0 || t) return;
    t = !0;
    const u = Array.from(s);
    s.clear(), w = null, await M(u), t = !1;
  }
  async function k(u) {
    s.add(u), w && clearTimeout(w), w = setTimeout(() => {
      x();
    }, 16);
  }
  async function M(u) {
    if (!u || u.length === 0) return;
    const r = new Set(u.map((I) => I.id)), y = n.value.filter((I) => !r.has(I.id));
    if (n.value = y, await V(), y.length === 0 && f.value.length > 0) {
      try {
        await h(), await d(0, !0);
      } catch {
      }
      return;
    }
    await V(), a(y);
  }
  async function g(u) {
    !u || u.length === 0 || (u.forEach((r) => s.add(r)), w && clearTimeout(w), w = setTimeout(() => {
      x();
    }, 16));
  }
  async function P(u, r) {
    if (u && !l) {
      l = !0;
      try {
        const y = n.value;
        if (y.findIndex((L) => L.id === u.id) !== -1) return;
        const m = [...y], H = Math.min(r, m.length);
        m.splice(H, 0, u), n.value = m, await V(), i.value || (await V(), a(m));
      } finally {
        l = !1;
      }
    }
  }
  async function S(u, r) {
    var y;
    if (!(!u || u.length === 0)) {
      if (!r || r.length !== u.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      if (!l) {
        l = !0;
        try {
          const I = n.value, m = new Set(I.map((O) => O.id)), H = [];
          for (let O = 0; O < u.length; O++)
            m.has((y = u[O]) == null ? void 0 : y.id) || H.push({ item: u[O], index: r[O] });
          if (H.length === 0) return;
          const L = /* @__PURE__ */ new Map();
          for (const { item: O, index: o } of H)
            L.set(o, O);
          const $ = H.length > 0 ? Math.max(...H.map(({ index: O }) => O)) : -1, F = Math.max(I.length - 1, $), E = [];
          let C = 0;
          for (let O = 0; O <= F; O++)
            L.has(O) ? E.push(L.get(O)) : C < I.length && (E.push(I[C]), C++);
          for (; C < I.length; )
            E.push(I[C]), C++;
          n.value = E, await V(), i.value || (await V(), a(E));
        } finally {
          l = !1;
        }
      }
    }
  }
  async function T() {
    n.value = [];
  }
  return {
    remove: k,
    removeMany: g,
    restore: P,
    restoreMany: S,
    removeAll: T
  };
}
function sa(e) {
  const {
    masonry: n,
    useSwipeMode: i,
    container: a,
    columns: h,
    containerWidth: d,
    masonryContentHeight: f,
    layout: l,
    fixedDimensions: s,
    checkItemDimensions: w
  } = e;
  let t = [];
  function x(P) {
    const S = ea(P);
    let T = 0;
    if (a.value) {
      const { scrollTop: u, clientHeight: r } = a.value;
      T = u + r + 100;
    }
    f.value = Math.max(S, T);
  }
  function k(P) {
    var r, y;
    if (i.value) {
      n.value = P;
      return;
    }
    if (!a.value) {
      n.value !== P && (n.value = P);
      return;
    }
    if (w(P, "refreshLayout"), P.length > 1e3 && t.length > P.length && t.length - P.length < 100) {
      let I = !0;
      for (let m = 0; m < P.length; m++)
        if (((r = P[m]) == null ? void 0 : r.id) !== ((y = t[m]) == null ? void 0 : y.id)) {
          I = !1;
          break;
        }
      if (I) {
        const m = P.map((H, L) => ({
          ...t[L],
          originalIndex: L
        }));
        x(m), n.value = m, t = m;
        return;
      }
    }
    const T = P.map((I, m) => ({
      ...I,
      originalIndex: m
    })), u = a.value;
    if (s.value && s.value.width !== void 0) {
      const I = u.style.width, m = u.style.boxSizing;
      u.style.boxSizing = "border-box", u.style.width = `${s.value.width}px`, u.offsetWidth;
      const H = Ve(T, u, h.value, l.value);
      u.style.width = I, u.style.boxSizing = m, x(H), n.value = H, t = H;
    } else {
      const I = Ve(T, u, h.value, l.value);
      x(I), n.value = I, t = I;
    }
  }
  function M(P, S) {
    s.value = P, P && (P.width !== void 0 && (d.value = P.width), !i.value && a.value && n.value.length > 0 && V(() => {
      h.value = se(l.value, d.value), k(n.value), S && S();
    }));
  }
  function g() {
    h.value = se(l.value, d.value), k(n.value);
  }
  return {
    refreshLayout: k,
    setFixedDimensions: M,
    onResize: g,
    calculateHeight: x
  };
}
function ua(e) {
  const {
    masonry: n,
    container: i,
    columns: a,
    virtualBufferPx: h,
    loadThresholdPx: d
  } = e, f = N(e.handleScroll), l = N(0), s = N(0), w = h, t = N(!1), x = N({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), k = Z(() => {
    const S = l.value - w, T = l.value + s.value + w, u = n.value;
    return !u || u.length === 0 ? [] : u.filter((y) => {
      if (typeof y.top != "number" || typeof y.columnHeight != "number")
        return !0;
      const I = y.top;
      return y.top + y.columnHeight >= S && I <= T;
    });
  });
  function M(S) {
    if (!i.value) return;
    const { scrollTop: T, clientHeight: u } = i.value, r = T + u, y = S ?? De(n.value, a.value), I = y.length ? Math.max(...y) : 0, m = typeof d == "number" ? d : 200, H = m >= 0 ? Math.max(0, I - m) : Math.max(0, I + m), L = Math.max(0, H - r), $ = L <= 100;
    x.value = {
      distanceToTrigger: Math.round(L),
      isNearTrigger: $
    };
  }
  async function g() {
    if (i.value) {
      const T = i.value.scrollTop, u = i.value.clientHeight || window.innerHeight, r = u > 0 ? u : window.innerHeight;
      l.value = T, s.value = r;
    }
    t.value = !0, await V(), await V(), t.value = !1;
    const S = De(n.value, a.value);
    f.value(S), M(S);
  }
  function P() {
    l.value = 0, s.value = 0, t.value = !1, x.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: l,
    viewportHeight: s,
    virtualizing: t,
    scrollProgress: x,
    visibleMasonry: k,
    updateScrollProgress: M,
    updateViewport: g,
    reset: P,
    handleScroll: f
  };
}
function ca(e) {
  const { masonry: n } = e, i = N(/* @__PURE__ */ new Set());
  function a(f) {
    return typeof f == "number" && f > 0 && Number.isFinite(f);
  }
  function h(f, l) {
    try {
      if (!Array.isArray(f) || f.length === 0) return;
      const s = f.filter((t) => !a(t == null ? void 0 : t.width) || !a(t == null ? void 0 : t.height));
      if (s.length === 0) return;
      const w = [];
      for (const t of s) {
        const x = (t == null ? void 0 : t.id) ?? `idx:${n.value.indexOf(t)}`;
        i.value.has(x) || (i.value.add(x), w.push(x));
      }
      if (w.length > 0) {
        const t = w.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: l,
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
    checkItemDimensions: h,
    invalidDimensionIds: i,
    reset: d
  };
}
const va = { class: "flex-1 relative min-h-0" }, fa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, da = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ga = {
  key: 1,
  class: "relative w-full h-full"
}, ha = ["src"], ma = ["src", "autoplay", "controls"], pa = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ya = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, wa = {
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
    const i = e, a = n, h = N(!1), d = N(!1), f = N(null), l = N(!1), s = N(!1), w = N(null), t = N(!1), x = N(!1), k = N(!1), M = N(!1), g = N(!1), P = N(null), S = N(null);
    let T = null;
    const u = Z(() => {
      var o;
      return i.type ?? ((o = i.item) == null ? void 0 : o.type) ?? "image";
    }), r = Z(() => {
      var o;
      return i.notFound ?? ((o = i.item) == null ? void 0 : o.notFound) ?? !1;
    }), y = Z(() => !!i.inSwipeMode);
    function I(o, v) {
      const p = o === "image" ? h.value : l.value;
      x.value && p && !k.value && (k.value = !0, a("in-view-and-loaded", { item: i.item, type: o, src: v }));
    }
    function m(o) {
      a("mouse-enter", { item: i.item, type: o });
    }
    function H(o) {
      a("mouse-leave", { item: i.item, type: o });
    }
    function L(o) {
      if (y.value) return;
      const v = o.target;
      v && (v.paused ? v.play() : v.pause());
    }
    function $(o) {
      const v = o.target;
      v && (y.value || v.play(), m("video"));
    }
    function F(o) {
      const v = o.target;
      v && (y.value || v.pause(), H("video"));
    }
    function E(o) {
      return new Promise((v, p) => {
        if (!o) {
          const b = new Error("No image source provided");
          a("preload:error", { item: i.item, type: "image", src: o, error: b }), p(b);
          return;
        }
        const B = new Image(), R = Date.now(), j = 300;
        B.onload = () => {
          const b = Date.now() - R, W = Math.max(0, j - b);
          setTimeout(async () => {
            h.value = !0, d.value = !1, M.value = !1, await V(), await new Promise((z) => setTimeout(z, 100)), g.value = !0, a("preload:success", { item: i.item, type: "image", src: o }), I("image", o), v();
          }, W);
        }, B.onerror = () => {
          d.value = !0, h.value = !1, M.value = !1;
          const b = new Error("Failed to load image");
          a("preload:error", { item: i.item, type: "image", src: o, error: b }), p(b);
        }, B.src = o;
      });
    }
    function C(o) {
      return new Promise((v, p) => {
        if (!o) {
          const b = new Error("No video source provided");
          a("preload:error", { item: i.item, type: "video", src: o, error: b }), p(b);
          return;
        }
        const B = document.createElement("video"), R = Date.now(), j = 300;
        B.preload = "metadata", B.muted = !0, B.onloadedmetadata = () => {
          const b = Date.now() - R, W = Math.max(0, j - b);
          setTimeout(async () => {
            l.value = !0, s.value = !1, M.value = !1, await V(), await new Promise((z) => setTimeout(z, 100)), g.value = !0, a("preload:success", { item: i.item, type: "video", src: o }), I("video", o), v();
          }, W);
        }, B.onerror = () => {
          s.value = !0, l.value = !1, M.value = !1;
          const b = new Error("Failed to load video");
          a("preload:error", { item: i.item, type: "video", src: o, error: b }), p(b);
        }, B.src = o;
      });
    }
    async function O() {
      var v;
      if (!t.value || M.value || r.value || u.value === "video" && l.value || u.value === "image" && h.value)
        return;
      const o = (v = i.item) == null ? void 0 : v.src;
      if (o)
        if (M.value = !0, g.value = !1, u.value === "video") {
          w.value = o, l.value = !1, s.value = !1;
          try {
            await C(o);
          } catch {
          }
        } else {
          f.value = o, h.value = !1, d.value = !1;
          try {
            await E(o);
          } catch {
          }
        }
    }
    return qe(async () => {
      if (!P.value) return;
      const o = [i.preloadThreshold, 1].filter((p, B, R) => R.indexOf(p) === B).sort((p, B) => p - B);
      T = new IntersectionObserver(
        (p) => {
          p.forEach((B) => {
            const R = B.intersectionRatio, j = R >= 1, b = R >= i.preloadThreshold;
            if (j && !x.value) {
              x.value = !0, a("in-view", { item: i.item, type: u.value });
              const W = u.value === "image" ? f.value : w.value, z = u.value === "image" ? h.value : l.value;
              W && z && I(u.value, W);
            }
            b && !t.value ? (t.value = !0, O()) : B.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: o
        }
      ), T.observe(P.value), await V(), await V(), await V(), v(), setTimeout(() => {
        v();
      }, 100);
      function v() {
        if (!P.value || x.value) return;
        const p = P.value.getBoundingClientRect(), B = window.innerHeight, R = window.innerWidth;
        if (p.top >= 0 && p.bottom <= B && p.left >= 0 && p.right <= R && p.height > 0 && p.width > 0) {
          x.value = !0, a("in-view", { item: i.item, type: u.value });
          const b = u.value === "image" ? f.value : w.value, W = u.value === "image" ? h.value : l.value;
          b && W && I(u.value, b);
        }
      }
    }), Je(() => {
      T && (T.disconnect(), T = null);
    }), ae(
      () => {
        var o;
        return (o = i.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || r.value)) {
          if (u.value === "video") {
            if (o !== w.value && (l.value = !1, s.value = !1, w.value = o, t.value)) {
              M.value = !0;
              try {
                await C(o);
              } catch {
              }
            }
          } else if (o !== f.value && (h.value = !1, d.value = !1, f.value = o, t.value)) {
            M.value = !0;
            try {
              await E(o);
            } catch {
            }
          }
        }
      }
    ), ae(
      () => i.isActive,
      (o) => {
        !y.value || !S.value || (o ? S.value.play() : S.value.pause());
      }
    ), (o, v) => (X(), _("div", {
      ref_key: "containerRef",
      ref: P,
      class: "relative w-full h-full flex flex-col"
    }, [
      o.headerHeight > 0 ? (X(), _("div", {
        key: 0,
        class: "relative z-10",
        style: he({ height: `${o.headerHeight}px` })
      }, [
        Q(o.$slots, "header", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: l.value,
          videoError: s.value,
          showNotFound: r.value,
          isLoading: M.value,
          mediaType: u.value,
          isFullyInView: x.value
        })
      ], 4)) : ne("", !0),
      G("div", va, [
        Q(o.$slots, "default", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: l.value,
          videoError: s.value,
          showNotFound: r.value,
          isLoading: M.value,
          mediaType: u.value,
          imageSrc: f.value,
          videoSrc: w.value,
          showMedia: g.value,
          isFullyInView: x.value
        }, () => [
          G("div", fa, [
            r.value ? (X(), _("div", da, v[3] || (v[3] = [
              G("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              G("span", { class: "font-medium" }, "Not Found", -1),
              G("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (X(), _("div", ga, [
              u.value === "image" && f.value ? (X(), _("img", {
                key: 0,
                src: f.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  h.value && g.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: v[0] || (v[0] = (p) => m("image")),
                onMouseleave: v[1] || (v[1] = (p) => H("image"))
              }, null, 42, ha)) : ne("", !0),
              u.value === "video" && w.value ? (X(), _("video", {
                key: 1,
                ref_key: "videoEl",
                ref: S,
                src: w.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  l.value && g.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: y.value && i.isActive,
                controls: y.value,
                onClick: Ce(L, ["stop"]),
                onTouchend: Ce(L, ["stop", "prevent"]),
                onMouseenter: $,
                onMouseleave: F,
                onError: v[2] || (v[2] = (p) => s.value = !0)
              }, null, 42, ma)) : ne("", !0),
              !h.value && !l.value && !d.value && !s.value ? (X(), _("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  g.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                G("div", pa, [
                  Q(o.$slots, "placeholder-icon", { mediaType: u.value }, () => [
                    G("i", {
                      class: ie(u.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ne("", !0),
              M.value ? (X(), _("div", ya, v[4] || (v[4] = [
                G("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  G("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ne("", !0),
              u.value === "image" && d.value || u.value === "video" && s.value ? (X(), _("div", wa, [
                G("i", {
                  class: ie(u.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                G("span", null, "Failed to load " + He(u.value), 1)
              ])) : ne("", !0)
            ]))
          ])
        ])
      ]),
      o.footerHeight > 0 ? (X(), _("div", {
        key: 1,
        class: "relative z-10",
        style: he({ height: `${o.footerHeight}px` })
      }, [
        Q(o.$slots, "footer", {
          item: o.item,
          remove: o.remove,
          imageLoaded: h.value,
          imageError: d.value,
          videoLoaded: l.value,
          videoError: s.value,
          showNotFound: r.value,
          isLoading: M.value,
          mediaType: u.value,
          isFullyInView: x.value
        })
      ], 4)) : ne("", !0)
    ], 512));
  }
}), xa = {
  key: 0,
  class: "w-full h-full flex items-center justify-center"
}, ba = { class: "w-full h-full flex items-center justify-center p-4" }, Ma = { class: "w-full h-full max-w-full max-h-full relative" }, Ta = {
  key: 0,
  class: "w-full py-8 text-center"
}, Pa = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ia = { class: "text-red-500 dark:text-red-400" }, La = {
  key: 0,
  class: "w-full py-8 text-center"
}, ka = {
  key: 1,
  class: "w-full py-8 text-center"
}, Sa = { class: "text-red-500 dark:text-red-400" }, Ea = /* @__PURE__ */ Ge({
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
  setup(e, { expose: n, emit: i }) {
    const a = e, h = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, d = Z(() => {
      var c;
      return {
        ...h,
        ...a.layout,
        sizes: {
          ...h.sizes,
          ...((c = a.layout) == null ? void 0 : c.sizes) || {}
        }
      };
    }), f = N(null), l = N(typeof window < "u" ? window.innerWidth : 1024), s = N(typeof window < "u" ? window.innerHeight : 768), w = N(null);
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
    const k = Z(() => {
      if (a.layoutMode === "masonry") return !1;
      if (a.layoutMode === "swipe") return !0;
      const c = typeof a.mobileBreakpoint == "string" ? x(a.mobileBreakpoint) : a.mobileBreakpoint;
      return l.value < c;
    }), M = i, g = Z({
      get: () => a.items,
      set: (c) => M("update:items", c)
    }), P = Z({
      get: () => a.context,
      set: (c) => M("update:context", c)
    });
    function S(c) {
      P.value = c;
    }
    const T = Z(() => {
      const c = g.value;
      return (c == null ? void 0 : c.length) ?? 0;
    }), u = N(7), r = N(null), y = N([]), I = N(null), m = N(!1), H = N(0), L = N(!1), $ = N(null), F = N(!1), E = Z(() => Zt(l.value)), C = ca({
      masonry: g
    }), { checkItemDimensions: O, reset: o } = C, v = sa({
      masonry: g,
      useSwipeMode: k,
      container: r,
      columns: u,
      containerWidth: l,
      masonryContentHeight: H,
      layout: d,
      fixedDimensions: w,
      checkItemDimensions: O
    }), { refreshLayout: p, setFixedDimensions: B, onResize: R } = v, j = ua({
      masonry: g,
      container: r,
      columns: u,
      virtualBufferPx: a.virtualBufferPx,
      loadThresholdPx: a.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: b, viewportHeight: W, virtualizing: z, visibleMasonry: Y, updateScrollProgress: J, updateViewport: le, reset: q } = j, { onEnter: be, onBeforeEnter: Ze, onBeforeLeave: et, onLeave: tt } = na(
      { container: r },
      { leaveDurationMs: a.leaveDurationMs, virtualizing: z }
    ), at = be, nt = Ze, lt = et, ot = tt, rt = Z(() => a.mode), it = ra({
      getPage: a.getPage,
      context: P,
      masonry: g,
      isLoading: m,
      hasReachedEnd: L,
      loadError: $,
      currentPage: I,
      paginationHistory: y,
      refreshLayout: p,
      retryMaxAttempts: a.retryMaxAttempts,
      retryInitialDelayMs: a.retryInitialDelayMs,
      retryBackoffStepMs: a.retryBackoffStepMs,
      mode: rt,
      backfillDelayMs: a.backfillDelayMs,
      backfillMaxCalls: a.backfillMaxCalls,
      pageSize: a.pageSize,
      emits: M
    }), { loadPage: Me, loadNext: me, refreshCurrentPage: st, cancelLoad: Te, maybeBackfillToTarget: ut } = it, ee = oa({
      useSwipeMode: k,
      masonry: g,
      isLoading: m,
      loadNext: me,
      loadPage: Me,
      paginationHistory: y
    }), { handleScroll: ct } = la({
      container: r,
      masonry: g,
      columns: u,
      containerHeight: H,
      isLoading: m,
      pageSize: a.pageSize,
      refreshLayout: p,
      setItemsRaw: (c) => {
        g.value = c;
      },
      loadNext: me,
      loadThresholdPx: a.loadThresholdPx
    });
    j.handleScroll.value = ct;
    const vt = ia({
      masonry: g,
      useSwipeMode: k,
      refreshLayout: p,
      loadNext: me,
      maybeBackfillToTarget: ut,
      paginationHistory: y
    }), { remove: ue, removeMany: ft, restore: dt, restoreMany: gt, removeAll: ht } = vt;
    function mt(c) {
      B(c, J), !c && f.value && (l.value = f.value.clientWidth, s.value = f.value.clientHeight);
    }
    n({
      // Cancels any ongoing load operations (page loads, backfills, etc.)
      cancelLoad: Te,
      // Opaque caller context passed through to getPage(page, context). Useful for including filters, service selection, tabId, etc.
      context: P,
      // Container height (wrapper element) in pixels
      containerHeight: s,
      // Container width (wrapper element) in pixels
      containerWidth: l,
      // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
      currentBreakpoint: E,
      // Current page number or cursor being displayed
      currentPage: I,
      // Completely destroys the component, clearing all state and resetting to initial state
      destroy: Pt,
      // Boolean indicating if the end of the list has been reached (no more pages to load)
      hasReachedEnd: L,
      // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
      initialize: It,
      // Boolean indicating if the component has been initialized (first content has loaded)
      isInitialized: F,
      // Boolean indicating if a page load or backfill operation is currently in progress
      isLoading: m,
      // Error object if the last load operation failed, null otherwise
      loadError: $,
      // Loads the next page of items asynchronously
      loadNext: me,
      // Loads a specific page number or cursor asynchronously
      loadPage: Me,
      // Array tracking pagination history (pages/cursors that have been loaded)
      paginationHistory: y,
      // Refreshes the current page by clearing items and reloading from the current page
      refreshCurrentPage: st,
      // Recalculates the layout positions for all items. Call this after manually modifying items.
      refreshLayout: p,
      // Removes a single item from the masonry
      remove: ue,
      // Removes all items from the masonry
      removeAll: ht,
      // Clears all items and pagination history (useful when applying filters)
      clear: Mt,
      // Removes multiple items from the masonry in a single operation
      removeMany: ft,
      // Resets the component to initial state (clears items, resets pagination, scrolls to top)
      reset: Tt,
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
      totalItems: Z(() => g.value.length)
    });
    const ce = ee.currentSwipeIndex, pe = ee.swipeOffset, ye = ee.isDragging, oe = ee.swipeContainer, Ne = ee.handleTouchStart, ze = ee.handleTouchMove, Be = ee.handleTouchEnd, We = ee.handleMouseDown, Pe = ee.handleMouseMove, Ie = ee.handleMouseUp, Le = ee.snapToCurrentItem;
    function pt(c) {
      const D = T.value, U = typeof c == "string" ? parseInt(c, 10) : c;
      return D > 0 ? `${U * (100 / D)}%` : "0%";
    }
    function yt() {
      const c = T.value;
      return c > 0 ? `${100 / c}%` : "0%";
    }
    function wt(c) {
      r.value && r.value.scrollTo({
        top: 0,
        behavior: (c == null ? void 0 : c.behavior) ?? "smooth",
        ...c
      });
    }
    function xt(c) {
      r.value && (r.value.scrollTo({
        top: c.top ?? r.value.scrollTop,
        left: c.left ?? r.value.scrollLeft,
        behavior: c.behavior ?? "auto"
      }), r.value && (b.value = r.value.scrollTop, W.value = r.value.clientHeight || window.innerHeight));
    }
    function bt() {
      R(), r.value && (b.value = r.value.scrollTop, W.value = r.value.clientHeight);
    }
    function Mt() {
      g.value = [], y.value = [];
    }
    function Tt() {
      Te(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), g.value = [], s.value = 0, I.value = a.loadAtPage, y.value = [a.loadAtPage], L.value = !1, $.value = null, F.value = !1, q();
    }
    function Pt() {
      Te(), g.value = [], H.value = 0, I.value = null, y.value = [], L.value = !1, $.value = null, m.value = !1, F.value = !1, ce.value = 0, pe.value = 0, ye.value = !1, q(), o(), r.value && r.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const re = _e(async () => {
      k.value || await le();
    }, 200), Re = _e(bt, 200);
    function Fe() {
      ee.handleWindowResize();
    }
    async function It(c, D, U) {
      I.value = D, y.value = [D], U != null && y.value.push(U), L.value = U === null, O(c, "initialize");
      const te = g.value, A = te.length === 0 ? c : [...te, ...c];
      g.value = A, await V(), k.value ? ce.value === 0 && g.value.length > 0 && (pe.value = 0) : (await V(), p(A), r.value && (b.value = r.value.scrollTop, W.value = r.value.clientHeight || window.innerHeight), V(() => {
        r.value && (b.value = r.value.scrollTop, W.value = r.value.clientHeight || window.innerHeight, J());
      })), c && c.length > 0 && (F.value = !0);
    }
    return ae(
      d,
      () => {
        k.value || r.value && (u.value = se(d.value, l.value), p(g.value));
      },
      { deep: !0 }
    ), ae(() => a.layoutMode, () => {
      w.value && w.value.width !== void 0 ? l.value = w.value.width : f.value && (l.value = f.value.clientWidth);
    }), ae(r, (c) => {
      c && !k.value ? (c.removeEventListener("scroll", re), c.addEventListener("scroll", re, { passive: !0 })) : c && c.removeEventListener("scroll", re);
    }, { immediate: !0 }), ae(
      () => g.value.length,
      (c, D) => {
        a.init === "manual" && !F.value && c > 0 && D === 0 && (F.value = !0);
      },
      { immediate: !1 }
    ), ae(k, (c, D) => {
      D === void 0 && c === !1 || V(() => {
        c ? (document.addEventListener("mousemove", Pe), document.addEventListener("mouseup", Ie), r.value && r.value.removeEventListener("scroll", re), ce.value = 0, pe.value = 0, g.value.length > 0 && Le()) : (document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ie), r.value && f.value && (w.value && w.value.width !== void 0 ? l.value = w.value.width : l.value = f.value.clientWidth, r.value.removeEventListener("scroll", re), r.value.addEventListener("scroll", re, { passive: !0 }), g.value.length > 0 && (u.value = se(d.value, l.value), p(g.value), b.value = r.value.scrollTop, W.value = r.value.clientHeight, J())));
      });
    }, { immediate: !0 }), ae(oe, (c) => {
      c && (c.addEventListener("touchstart", Ne, { passive: !1 }), c.addEventListener("touchmove", ze, { passive: !1 }), c.addEventListener("touchend", Be), c.addEventListener("mousedown", We));
    }), ae(() => g.value.length, (c, D) => {
      k.value && c > 0 && D === 0 && (ce.value = 0, V(() => Le()));
    }), ae(f, (c) => {
      t && (t.disconnect(), t = null), c && typeof ResizeObserver < "u" ? (t = new ResizeObserver((D) => {
        if (!w.value)
          for (const U of D) {
            const te = U.contentRect.width, A = U.contentRect.height;
            l.value !== te && (l.value = te), s.value !== A && (s.value = A);
          }
      }), t.observe(c), w.value || (l.value = c.clientWidth, s.value = c.clientHeight)) : c && (w.value || (l.value = c.clientWidth, s.value = c.clientHeight));
    }, { immediate: !0 }), ae(l, (c, D) => {
      c !== D && c > 0 && !k.value && r.value && g.value.length > 0 && V(() => {
        u.value = se(d.value, c), p(g.value), J();
      });
    }), qe(async () => {
      try {
        await V(), f.value && !t && (l.value = f.value.clientWidth, s.value = f.value.clientHeight), k.value || (u.value = se(d.value, l.value), r.value && (b.value = r.value.scrollTop, W.value = r.value.clientHeight));
        const c = a.loadAtPage;
        if (a.init === "auto" && y.value.length === 0 && (y.value = [c]), a.init === "auto") {
          F.value = !0, await V();
          try {
            await Me(c);
          } catch {
          }
        }
        k.value ? V(() => Le()) : J();
      } catch (c) {
        $.value || (console.error("Error during component initialization:", c), $.value = ge(c)), m.value = !1;
      }
      window.addEventListener("resize", Re), window.addEventListener("resize", Fe);
    }), Je(() => {
      var c;
      t && (t.disconnect(), t = null), (c = r.value) == null || c.removeEventListener("scroll", re), window.removeEventListener("resize", Re), window.removeEventListener("resize", Fe), oe.value && (oe.value.removeEventListener("touchstart", Ne), oe.value.removeEventListener("touchmove", ze), oe.value.removeEventListener("touchend", Be), oe.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Pe), document.removeEventListener("mouseup", Ie);
    }), (c, D) => (X(), _("div", {
      ref_key: "wrapper",
      ref: f,
      class: "w-full h-full flex flex-col relative"
    }, [
      F.value ? k.value ? (X(), _("div", {
        key: 1,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": a.forceMotion, "cursor-grab": !K(ye), "cursor-grabbing": K(ye) }]),
        ref_key: "swipeContainer",
        ref: oe,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        G("div", {
          class: "relative w-full",
          style: he({
            transform: `translateY(${K(pe)}px)`,
            transition: K(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${T.value * 100}%`
          })
        }, [
          (X(!0), _(Oe, null, Ae(g.value, (U, te) => (X(), _("div", {
            key: `${U.page}-${U.id}`,
            class: "absolute top-0 left-0 w-full",
            style: he({
              top: pt(te),
              height: yt()
            })
          }, [
            G("div", ba, [
              G("div", Ma, [
                Q(c.$slots, "default", {
                  item: U,
                  remove: K(ue),
                  index: U.originalIndex ?? te
                }, () => [
                  ke(xe, {
                    item: U,
                    remove: K(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": te === K(ce),
                    "onPreload:success": D[0] || (D[0] = (A) => M("item:preload:success", A)),
                    "onPreload:error": D[1] || (D[1] = (A) => M("item:preload:error", A)),
                    onMouseEnter: D[2] || (D[2] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: D[3] || (D[3] = (A) => M("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      Q(c.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      Q(c.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        L.value && g.value.length > 0 ? (X(), _("div", Ta, [
          Q(c.$slots, "end-message", {}, () => [
            D[9] || (D[9] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        $.value && g.value.length > 0 ? (X(), _("div", Pa, [
          Q(c.$slots, "error-message", { error: $.value }, () => [
            G("p", Ia, "Failed to load content: " + He($.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2)) : (X(), _("div", {
        key: 2,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": a.forceMotion }]),
        ref_key: "container",
        ref: r
      }, [
        G("div", {
          class: "relative",
          style: he({ height: `${H.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          ke(Lt, {
            name: "masonry",
            css: !1,
            onEnter: K(at),
            onBeforeEnter: K(nt),
            onLeave: K(ot),
            onBeforeLeave: K(lt)
          }, {
            default: ve(() => [
              (X(!0), _(Oe, null, Ae(K(Y), (U, te) => (X(), _("div", fe({
                key: `${U.page}-${U.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, K(aa)(U, te)), [
                Q(c.$slots, "default", {
                  item: U,
                  remove: K(ue),
                  index: U.originalIndex ?? te
                }, () => [
                  ke(xe, {
                    item: U,
                    remove: K(ue),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": D[4] || (D[4] = (A) => M("item:preload:success", A)),
                    "onPreload:error": D[5] || (D[5] = (A) => M("item:preload:error", A)),
                    onMouseEnter: D[6] || (D[6] = (A) => M("item:mouse-enter", A)),
                    onMouseLeave: D[7] || (D[7] = (A) => M("item:mouse-leave", A))
                  }, {
                    header: ve((A) => [
                      Q(c.$slots, "item-header", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    footer: ve((A) => [
                      Q(c.$slots, "item-footer", fe({ ref_for: !0 }, A), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        L.value && g.value.length > 0 ? (X(), _("div", La, [
          Q(c.$slots, "end-message", {}, () => [
            D[10] || (D[10] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        $.value && g.value.length > 0 ? (X(), _("div", ka, [
          Q(c.$slots, "error-message", { error: $.value }, () => [
            G("p", Sa, "Failed to load content: " + He($.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2)) : (X(), _("div", xa, [
        Q(c.$slots, "loading-message", {}, () => [
          D[8] || (D[8] = G("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Ha = (e, n) => {
  const i = e.__vccOpts || e;
  for (const [a, h] of n)
    i[a] = h;
  return i;
}, Xe = /* @__PURE__ */ Ha(Ea, [["__scopeId", "data-v-052a520f"]]), Da = {
  install(e) {
    e.component("WyxosMasonry", Xe), e.component("WMasonry", Xe), e.component("WyxosMasonryItem", xe), e.component("WMasonryItem", xe);
  }
};
export {
  Xe as Masonry,
  xe as MasonryItem,
  Da as default
};
