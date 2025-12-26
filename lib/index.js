import { nextTick as _, ref as D, computed as Q, defineComponent as Ke, onMounted as Qe, onUnmounted as Ze, watch as ae, createElementBlock as q, openBlock as Y, createCommentVNode as ne, createElementVNode as U, normalizeStyle as ge, renderSlot as K, normalizeClass as re, withModifiers as Ve, toDisplayString as $e, unref as J, Fragment as je, renderList as qe, createVNode as Se, withCtx as fe, mergeProps as de, TransitionGroup as St } from "vue";
let ke = null;
function kt() {
  if (ke != null) return ke;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const i = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), ke = i, i;
}
function Ye(e, o, i, l = {}) {
  const {
    gutterX: p = 0,
    gutterY: d = 0,
    header: c = 0,
    footer: s = 0,
    paddingLeft: v = 0,
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
  } = l;
  let E = 0, b = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const T = window.getComputedStyle(o);
      E = parseFloat(T.paddingLeft) || 0, b = parseFloat(T.paddingRight) || 0;
    }
  } catch {
  }
  const h = (v || 0) + E, P = (w || 0) + b, L = o.offsetWidth - o.clientWidth, $ = L > 0 ? L + 2 : kt() + 2, u = o.offsetWidth - $ - h - P, n = p * (i - 1), y = Math.floor((u - n) / i), M = e.map((T) => {
    const H = T.width, A = T.height;
    return Math.round(y * A / H) + s + c;
  });
  if (x === "sequential-balanced") {
    const T = M.length;
    if (T === 0) return [];
    const H = (g, z, R) => g + (z > 0 ? d : 0) + R;
    let A = Math.max(...M), S = M.reduce((g, z) => g + z, 0) + d * Math.max(0, T - 1);
    const O = (g) => {
      let z = 1, R = 0, j = 0;
      for (let X = 0; X < T; X++) {
        const ie = M[X], Z = H(R, j, ie);
        if (Z <= g)
          R = Z, j++;
        else if (z++, R = ie, j = 1, ie > g || z > i) return !1;
      }
      return z <= i;
    };
    for (; A < S; ) {
      const g = Math.floor((A + S) / 2);
      O(g) ? S = g : A = g + 1;
    }
    const G = S, a = new Array(i).fill(0);
    let f = i - 1, I = 0, B = 0;
    for (let g = T - 1; g >= 0; g--) {
      const z = M[g], R = g < f;
      !(H(I, B, z) <= G) || R ? (a[f] = g + 1, f--, I = z, B = 1) : (I = H(I, B, z), B++);
    }
    a[0] = 0;
    const W = [], V = new Array(i).fill(0);
    for (let g = 0; g < i; g++) {
      const z = a[g], R = g + 1 < i ? a[g + 1] : T, j = g * (y + p);
      for (let X = z; X < R; X++) {
        const Z = {
          ...e[X],
          columnWidth: y,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = M[X] - (s + c), Z.columnHeight = M[X], Z.left = j, Z.top = V[g], V[g] += Z.columnHeight + (X + 1 < R ? d : 0), W.push(Z);
      }
    }
    return W;
  }
  const m = new Array(i).fill(0), k = [];
  for (let T = 0; T < e.length; T++) {
    const H = e[T], A = {
      ...H,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, S = m.indexOf(Math.min(...m)), O = H.width, G = H.height;
    A.columnWidth = y, A.left = S * (y + p), A.imageHeight = Math.round(y * G / O), A.columnHeight = A.imageHeight + s + c, A.top = m[S], m[S] += A.columnHeight + d, k.push(A);
  }
  return k;
}
var Ht = typeof global == "object" && global && global.Object === Object && global, $t = typeof self == "object" && self && self.Object === Object && self, et = Ht || $t || Function("return this")(), we = et.Symbol, tt = Object.prototype, Ft = tt.hasOwnProperty, Dt = tt.toString, he = we ? we.toStringTag : void 0;
function zt(e) {
  var o = Ft.call(e, he), i = e[he];
  try {
    e[he] = void 0;
    var l = !0;
  } catch {
  }
  var p = Dt.call(e);
  return l && (o ? e[he] = i : delete e[he]), p;
}
var Bt = Object.prototype, Rt = Bt.toString;
function At(e) {
  return Rt.call(e);
}
var Wt = "[object Null]", Nt = "[object Undefined]", Ue = we ? we.toStringTag : void 0;
function Ot(e) {
  return e == null ? e === void 0 ? Nt : Wt : Ue && Ue in Object(e) ? zt(e) : At(e);
}
function Ct(e) {
  return e != null && typeof e == "object";
}
var Vt = "[object Symbol]";
function jt(e) {
  return typeof e == "symbol" || Ct(e) && Ot(e) == Vt;
}
var qt = /\s/;
function Yt(e) {
  for (var o = e.length; o-- && qt.test(e.charAt(o)); )
    ;
  return o;
}
var Ut = /^\s+/;
function _t(e) {
  return e && e.slice(0, Yt(e) + 1).replace(Ut, "");
}
function Fe(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var _e = NaN, Xt = /^[-+]0x[0-9a-f]+$/i, Gt = /^0b[01]+$/i, Jt = /^0o[0-7]+$/i, Kt = parseInt;
function Xe(e) {
  if (typeof e == "number")
    return e;
  if (jt(e))
    return _e;
  if (Fe(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = Fe(o) ? o + "" : o;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = _t(e);
  var i = Gt.test(e);
  return i || Jt.test(e) ? Kt(e.slice(2), i ? 2 : 8) : Xt.test(e) ? _e : +e;
}
var He = function() {
  return et.Date.now();
}, Qt = "Expected a function", Zt = Math.max, ea = Math.min;
function Ge(e, o, i) {
  var l, p, d, c, s, v, w = 0, t = !1, x = !1, E = !0;
  if (typeof e != "function")
    throw new TypeError(Qt);
  o = Xe(o) || 0, Fe(i) && (t = !!i.leading, x = "maxWait" in i, d = x ? Zt(Xe(i.maxWait) || 0, o) : d, E = "trailing" in i ? !!i.trailing : E);
  function b(m) {
    var k = l, T = p;
    return l = p = void 0, w = m, c = e.apply(T, k), c;
  }
  function h(m) {
    return w = m, s = setTimeout($, o), t ? b(m) : c;
  }
  function P(m) {
    var k = m - v, T = m - w, H = o - k;
    return x ? ea(H, d - T) : H;
  }
  function L(m) {
    var k = m - v, T = m - w;
    return v === void 0 || k >= o || k < 0 || x && T >= d;
  }
  function $() {
    var m = He();
    if (L(m))
      return u(m);
    s = setTimeout($, P(m));
  }
  function u(m) {
    return s = void 0, E && l ? b(m) : (l = p = void 0, c);
  }
  function n() {
    s !== void 0 && clearTimeout(s), w = 0, l = v = p = s = void 0;
  }
  function y() {
    return s === void 0 ? c : u(He());
  }
  function M() {
    var m = He(), k = L(m);
    if (l = arguments, p = this, v = m, k) {
      if (s === void 0)
        return h(v);
      if (x)
        return clearTimeout(s), s = setTimeout($, o), b(v);
    }
    return s === void 0 && (s = setTimeout($, o)), c;
  }
  return M.cancel = n, M.flush = y, M;
}
function ue(e, o) {
  const i = o ?? (typeof window < "u" ? window.innerWidth : 1024), l = e.sizes;
  return i >= 1536 && l["2xl"] ? l["2xl"] : i >= 1280 && l.xl ? l.xl : i >= 1024 && l.lg ? l.lg : i >= 768 && l.md ? l.md : i >= 640 && l.sm ? l.sm : l.base;
}
function ta(e) {
  const o = e ?? (typeof window < "u" ? window.innerWidth : 1024);
  return o >= 1536 ? "2xl" : o >= 1280 ? "xl" : o >= 1024 ? "lg" : o >= 768 ? "md" : o >= 640 ? "sm" : "base";
}
function aa(e) {
  return e.reduce((i, l) => Math.max(i, l.top + l.columnHeight), 0) + 500;
}
function na(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function la(e, o = 0) {
  return {
    style: na(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function xe(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const l = Array.from(new Set(e.map((c) => c.left))).sort((c, s) => c - s).slice(0, o), p = /* @__PURE__ */ new Map();
  for (let c = 0; c < l.length; c++) p.set(l[c], c);
  const d = new Array(l.length).fill(0);
  for (const c of e) {
    const s = p.get(c.left);
    s != null && (d[s] = Math.max(d[s], c.top + c.columnHeight));
  }
  for (; d.length < o; ) d.push(0);
  return d;
}
function oa(e, o) {
  let i = 0, l = 0;
  const p = 1e3;
  function d(t, x) {
    var h;
    const E = (h = e.container) == null ? void 0 : h.value;
    if (E) {
      const P = E.scrollTop, L = E.clientHeight;
      i = P - p, l = P + L + p;
    }
    return t + x >= i && t <= l;
  }
  function c(t, x) {
    var u;
    const E = parseInt(t.dataset.left || "0", 10), b = parseInt(t.dataset.top || "0", 10), h = parseInt(t.dataset.index || "0", 10), P = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((u = o == null ? void 0 : o.virtualizing) != null && u.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${E}px, ${b}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "", x();
      });
      return;
    }
    if (!d(b, P)) {
      t.style.opacity = "1", t.style.transform = `translate3d(${E}px, ${b}px, 0) scale(1)`, t.style.transition = "none", x();
      return;
    }
    const L = Math.min(h * 20, 160), $ = t.style.getPropertyValue("--masonry-opacity-delay");
    t.style.setProperty("--masonry-opacity-delay", `${L}ms`), requestAnimationFrame(() => {
      t.style.opacity = "1", t.style.transform = `translate3d(${E}px, ${b}px, 0) scale(1)`;
      const n = () => {
        $ ? t.style.setProperty("--masonry-opacity-delay", $) : t.style.removeProperty("--masonry-opacity-delay"), t.removeEventListener("transitionend", n), x();
      };
      t.addEventListener("transitionend", n);
    });
  }
  function s(t) {
    var b;
    const x = parseInt(t.dataset.left || "0", 10), E = parseInt(t.dataset.top || "0", 10);
    if ((b = o == null ? void 0 : o.virtualizing) != null && b.value) {
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${E}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      return;
    }
    t.style.opacity = "0", t.style.transform = `translate3d(${x}px, ${E + 10}px, 0) scale(0.985)`;
  }
  function v(t) {
    var h;
    const x = parseInt(t.dataset.left || "0", 10), E = parseInt(t.dataset.top || "0", 10), b = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if (!((h = o == null ? void 0 : o.virtualizing) != null && h.value)) {
      if (!d(E, b)) {
        t.style.transition = "none";
        return;
      }
      t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${x}px, ${E}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
        t.style.transition = "";
      });
    }
  }
  function w(t, x) {
    var M;
    const E = parseInt(t.dataset.left || "0", 10), b = parseInt(t.dataset.top || "0", 10), h = t.offsetHeight || parseInt(getComputedStyle(t).height || "200", 10) || 200;
    if ((M = o == null ? void 0 : o.virtualizing) != null && M.value) {
      x();
      return;
    }
    if (!d(b, h)) {
      t.style.transition = "none", t.style.opacity = "0", x();
      return;
    }
    const P = typeof (o == null ? void 0 : o.leaveDurationMs) == "number" ? o.leaveDurationMs : NaN;
    let L = Number.isFinite(P) && P > 0 ? P : NaN;
    if (!Number.isFinite(L)) {
      const k = getComputedStyle(t).getPropertyValue("--masonry-leave-duration") || "", T = parseFloat(k);
      L = Number.isFinite(T) && T > 0 ? T : 200;
    }
    const $ = t.style.transitionDuration, u = () => {
      t.removeEventListener("transitionend", n), clearTimeout(y), t.style.transitionDuration = $ || "";
    }, n = (m) => {
      (!m || m.target === t) && (u(), x());
    }, y = setTimeout(() => {
      u(), x();
    }, L + 100);
    requestAnimationFrame(() => {
      t.style.transitionDuration = `${L}ms`, t.style.opacity = "0", t.style.transform = `translate3d(${E}px, ${b + 10}px, 0) scale(0.985)`, t.addEventListener("transitionend", n);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: s,
    onBeforeLeave: v,
    onLeave: w
  };
}
function ra({
  container: e,
  masonry: o,
  columns: i,
  containerHeight: l,
  isLoading: p,
  pageSize: d,
  refreshLayout: c,
  setItemsRaw: s,
  loadNext: v,
  loadThresholdPx: w
}) {
  let t = 0;
  async function x(E, b = !1) {
    if (!e.value) return;
    const h = E ?? xe(o.value, i.value), P = h.length ? Math.max(...h) : 0, L = e.value.scrollTop + e.value.clientHeight, $ = e.value.scrollTop > t + 1;
    t = e.value.scrollTop;
    const u = typeof w == "number" ? w : 200, n = u >= 0 ? Math.max(0, P - u) : Math.max(0, P + u);
    if (L >= n && ($ || b) && !p.value) {
      await v(), await _();
      return;
    }
  }
  return {
    handleScroll: x
  };
}
function ia(e) {
  const { useSwipeMode: o, masonry: i, isLoading: l, loadNext: p, loadPage: d, paginationHistory: c } = e, s = D(0), v = D(0), w = D(!1), t = D(0), x = D(0), E = D(null), b = Q(() => {
    if (!o.value || i.value.length === 0) return null;
    const S = Math.max(0, Math.min(s.value, i.value.length - 1));
    return i.value[S] || null;
  }), h = Q(() => {
    if (!o.value || !b.value) return null;
    const S = s.value + 1;
    return S >= i.value.length ? null : i.value[S] || null;
  }), P = Q(() => {
    if (!o.value || !b.value) return null;
    const S = s.value - 1;
    return S < 0 ? null : i.value[S] || null;
  });
  function L() {
    if (!E.value) return;
    const S = E.value.clientHeight;
    v.value = -s.value * S;
  }
  function $() {
    if (!h.value) {
      p();
      return;
    }
    s.value++, L(), s.value >= i.value.length - 5 && p();
  }
  function u() {
    P.value && (s.value--, L());
  }
  function n(S) {
    o.value && (w.value = !0, t.value = S.touches[0].clientY, x.value = v.value, S.preventDefault());
  }
  function y(S) {
    if (!o.value || !w.value) return;
    const O = S.touches[0].clientY - t.value;
    v.value = x.value + O, S.preventDefault();
  }
  function M(S) {
    if (!o.value || !w.value) return;
    w.value = !1;
    const O = v.value - x.value;
    Math.abs(O) > 100 ? O > 0 && P.value ? u() : O < 0 && h.value ? $() : L() : L(), S.preventDefault();
  }
  function m(S) {
    o.value && (w.value = !0, t.value = S.clientY, x.value = v.value, S.preventDefault());
  }
  function k(S) {
    if (!o.value || !w.value) return;
    const O = S.clientY - t.value;
    v.value = x.value + O, S.preventDefault();
  }
  function T(S) {
    if (!o.value || !w.value) return;
    w.value = !1;
    const O = v.value - x.value;
    Math.abs(O) > 100 ? O > 0 && P.value ? u() : O < 0 && h.value ? $() : L() : L(), S.preventDefault();
  }
  function H() {
    !o.value && s.value > 0 && (s.value = 0, v.value = 0), o.value && i.value.length === 0 && !l.value && d(c.value[0]), o.value && L();
  }
  function A() {
    s.value = 0, v.value = 0, w.value = !1;
  }
  return {
    // State
    currentSwipeIndex: s,
    swipeOffset: v,
    isDragging: w,
    swipeContainer: E,
    // Computed
    currentItem: b,
    nextItem: h,
    previousItem: P,
    // Functions
    handleTouchStart: n,
    handleTouchMove: y,
    handleTouchEnd: M,
    handleMouseDown: m,
    handleMouseMove: k,
    handleMouseUp: T,
    goToNextItem: $,
    goToPreviousItem: u,
    snapToCurrentItem: L,
    handleWindowResize: H,
    reset: A
  };
}
function me(e) {
  return e instanceof Error ? e : new Error(String(e));
}
function sa(e) {
  const {
    getPage: o,
    context: i,
    masonry: l,
    isLoading: p,
    hasReachedEnd: d,
    loadError: c,
    currentPage: s,
    paginationHistory: v,
    refreshLayout: w,
    retryMaxAttempts: t,
    retryInitialDelayMs: x,
    retryBackoffStepMs: E,
    mode: b,
    backfillDelayMs: h,
    backfillMaxCalls: P,
    pageSize: L,
    autoRefreshOnEmpty: $,
    emits: u
  } = e, n = D(!1);
  let y = !1;
  function M(a) {
    return l.value.filter((f) => f.page === a).length;
  }
  function m(a, f) {
    return new Promise((I) => {
      const B = Math.max(0, a | 0), W = Date.now();
      f(B, B);
      const V = setInterval(() => {
        if (n.value) {
          clearInterval(V), I();
          return;
        }
        const g = Date.now() - W, z = Math.max(0, B - g);
        f(z, B), z <= 0 && (clearInterval(V), I());
      }, 100);
    });
  }
  async function k(a) {
    let f = 0;
    const I = t;
    let B = x;
    for (; ; )
      try {
        const W = await a();
        return f > 0 && u("retry:stop", { attempt: f, success: !0 }), W;
      } catch (W) {
        if (f++, f > I)
          throw u("retry:stop", { attempt: f - 1, success: !1 }), W;
        u("retry:start", { attempt: f, max: I, totalMs: B }), await m(B, (V, g) => {
          u("retry:tick", { attempt: f, remainingMs: V, totalMs: g });
        }), B += E;
      }
  }
  async function T(a) {
    try {
      const f = await k(() => o(a, i == null ? void 0 : i.value));
      return w([...l.value, ...f.items]), f;
    } catch (f) {
      throw f;
    }
  }
  async function H(a, f = !1) {
    if (!f && b !== "backfill" || y || n.value || d.value) return;
    const I = (a || 0) + (L || 0);
    if (!L || L <= 0) return;
    if (v.value[v.value.length - 1] == null) {
      d.value = !0;
      return;
    }
    if (!(l.value.length >= I)) {
      y = !0, p.value || (p.value = !0, u("loading:start"));
      try {
        let W = 0;
        for (u("backfill:start", { target: I, fetched: l.value.length, calls: W }); l.value.length < I && W < P && v.value[v.value.length - 1] != null && !n.value && !d.value && y && (await m(h, (g, z) => {
          u("backfill:tick", {
            fetched: l.value.length,
            target: I,
            calls: W,
            remainingMs: g,
            totalMs: z
          });
        }), !(n.value || !y)); ) {
          const V = v.value[v.value.length - 1];
          if (V == null) {
            d.value = !0;
            break;
          }
          try {
            if (n.value || !y) break;
            const g = await T(V);
            if (n.value || !y) break;
            c.value = null, v.value.push(g.nextPage), g.nextPage == null && (d.value = !0);
          } catch (g) {
            if (n.value || !y) break;
            c.value = me(g);
          }
          W++;
        }
        u("backfill:stop", { fetched: l.value.length, calls: W });
      } finally {
        y = !1, p.value = !1, u("loading:stop", { fetched: l.value.length });
      }
    }
  }
  async function A(a) {
    if (!p.value) {
      n.value = !1, p.value || (p.value = !0, u("loading:start")), d.value = !1, c.value = null;
      try {
        const f = l.value.length;
        if (n.value) return;
        const I = await T(a);
        return n.value ? void 0 : (c.value = null, s.value = a, v.value.push(I.nextPage), I.nextPage == null && (d.value = !0), await H(f), I);
      } catch (f) {
        throw c.value = me(f), f;
      } finally {
        p.value = !1;
      }
    }
  }
  async function S() {
    if (!p.value && !d.value) {
      n.value = !1, p.value || (p.value = !0, u("loading:start")), c.value = null;
      try {
        const a = l.value.length;
        if (n.value) return;
        if (b === "refresh" && s.value != null && M(s.value) < L) {
          const W = await k(() => o(s.value, i == null ? void 0 : i.value));
          if (n.value) return;
          const V = [...l.value], g = W.items.filter((R) => !R || R.id == null || R.page == null ? !1 : !V.some((j) => j && j.id === R.id && j.page === R.page));
          if (g.length > 0) {
            const R = [...l.value, ...g];
            w(R), await new Promise((j) => setTimeout(j, 0));
          }
          if (c.value = null, g.length === 0) {
            const R = v.value[v.value.length - 1];
            if (R == null) {
              d.value = !0;
              return;
            }
            const j = await T(R);
            return n.value ? void 0 : (c.value = null, s.value = R, v.value.push(j.nextPage), j.nextPage == null && (d.value = !0), await H(a), j);
          }
          if (M(s.value) >= L) {
            const R = v.value[v.value.length - 1];
            if (R == null) {
              d.value = !0;
              return;
            }
            const j = await T(R);
            return n.value ? void 0 : (c.value = null, s.value = R, v.value.push(j.nextPage), j.nextPage == null && (d.value = !0), await H(a), j);
          } else
            return W;
        }
        const f = v.value[v.value.length - 1];
        if (f == null) {
          d.value = !0;
          return;
        }
        const I = await T(f);
        return n.value ? void 0 : (c.value = null, s.value = f, v.value.push(I.nextPage), I.nextPage == null && (d.value = !0), await H(a), I);
      } catch (a) {
        throw c.value = me(a), a;
      } finally {
        p.value = !1, u("loading:stop", { fetched: l.value.length });
      }
    }
  }
  async function O() {
    if (!p.value) {
      n.value = !1, p.value = !0, u("loading:start");
      try {
        const a = s.value;
        if (a == null) {
          console.warn("[Masonry] No current page to refresh - currentPage:", s.value, "paginationHistory:", v.value);
          return;
        }
        l.value = [], d.value = !1, c.value = null, v.value = [a];
        const f = await T(a);
        if (n.value) return;
        c.value = null, s.value = a, v.value.push(f.nextPage), f.nextPage == null && (d.value = !0);
        const I = l.value.length;
        return await H(I), f;
      } catch (a) {
        throw c.value = me(a), a;
      } finally {
        p.value = !1, u("loading:stop", { fetched: l.value.length });
      }
    }
  }
  function G() {
    const a = y;
    n.value = !0, p.value = !1, y = !1, a && u("backfill:stop", { fetched: l.value.length, calls: 0, cancelled: !0 }), u("loading:stop", { fetched: l.value.length });
  }
  return {
    loadPage: A,
    loadNext: S,
    refreshCurrentPage: O,
    cancelLoad: G,
    maybeBackfillToTarget: H,
    getContent: T
  };
}
function ua(e) {
  const {
    masonry: o,
    useSwipeMode: i,
    refreshLayout: l,
    refreshCurrentPage: p,
    loadNext: d,
    maybeBackfillToTarget: c,
    autoRefreshOnEmpty: s,
    paginationHistory: v
  } = e;
  let w = /* @__PURE__ */ new Set(), t = null, x = !1;
  async function E() {
    if (w.size === 0 || x) return;
    x = !0;
    const n = Array.from(w);
    w.clear(), t = null, await h(n), x = !1;
  }
  async function b(n) {
    w.add(n), t && clearTimeout(t), t = setTimeout(() => {
      E();
    }, 16);
  }
  async function h(n) {
    if (!n || n.length === 0) return;
    const y = new Set(n.map((m) => m.id)), M = o.value.filter((m) => !y.has(m.id));
    if (o.value = M, await _(), M.length === 0 && v.value.length > 0) {
      if (s)
        await p();
      else
        try {
          await d(), await c(0, !0);
        } catch {
        }
      return;
    }
    await new Promise((m) => requestAnimationFrame(() => m())), requestAnimationFrame(() => {
      l(M);
    });
  }
  async function P(n) {
    !n || n.length === 0 || (n.forEach((y) => w.add(y)), t && clearTimeout(t), t = setTimeout(() => {
      E();
    }, 16));
  }
  async function L(n, y) {
    if (!n) return;
    const M = o.value;
    if (M.findIndex((H) => H.id === n.id) !== -1) return;
    const k = [...M], T = Math.min(y, k.length);
    k.splice(T, 0, n), o.value = k, await _(), i.value || (await new Promise((H) => requestAnimationFrame(() => H())), requestAnimationFrame(() => {
      l(k);
    }));
  }
  async function $(n, y) {
    var G;
    if (!n || n.length === 0) return;
    if (!y || y.length !== n.length) {
      console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
      return;
    }
    const M = o.value, m = new Set(M.map((a) => a.id)), k = [];
    for (let a = 0; a < n.length; a++)
      m.has((G = n[a]) == null ? void 0 : G.id) || k.push({ item: n[a], index: y[a] });
    if (k.length === 0) return;
    const T = /* @__PURE__ */ new Map();
    for (const { item: a, index: f } of k)
      T.set(f, a);
    const H = k.length > 0 ? Math.max(...k.map(({ index: a }) => a)) : -1, A = Math.max(M.length - 1, H), S = [];
    let O = 0;
    for (let a = 0; a <= A; a++)
      T.has(a) ? S.push(T.get(a)) : O < M.length && (S.push(M[O]), O++);
    for (; O < M.length; )
      S.push(M[O]), O++;
    o.value = S, await _(), i.value || (await new Promise((a) => requestAnimationFrame(() => a())), requestAnimationFrame(() => {
      l(S);
    }));
  }
  async function u() {
    o.value = [];
  }
  return {
    remove: b,
    removeMany: P,
    restore: L,
    restoreMany: $,
    removeAll: u
  };
}
function ca(e) {
  const {
    masonry: o,
    useSwipeMode: i,
    container: l,
    columns: p,
    containerWidth: d,
    masonryContentHeight: c,
    layout: s,
    fixedDimensions: v,
    checkItemDimensions: w
  } = e;
  let t = [];
  function x(P) {
    const L = aa(P);
    let $ = 0;
    if (l.value) {
      const { scrollTop: u, clientHeight: n } = l.value;
      $ = u + n + 100;
    }
    c.value = Math.max(L, $);
  }
  function E(P) {
    var n, y;
    if (i.value) {
      o.value = P;
      return;
    }
    if (o.value = P, !l.value) return;
    if (w(P, "refreshLayout"), P.length > 1e3 && t.length > P.length && t.length - P.length < 100) {
      let M = !0;
      for (let m = 0; m < P.length; m++)
        if (((n = P[m]) == null ? void 0 : n.id) !== ((y = t[m]) == null ? void 0 : y.id)) {
          M = !1;
          break;
        }
      if (M) {
        const m = P.map((k, T) => ({
          ...t[T],
          originalIndex: T
        }));
        x(m), o.value = m, t = m;
        return;
      }
    }
    const $ = P.map((M, m) => ({
      ...M,
      originalIndex: m
    })), u = l.value;
    if (v.value && v.value.width !== void 0) {
      const M = u.style.width, m = u.style.boxSizing;
      u.style.boxSizing = "border-box", u.style.width = `${v.value.width}px`, u.offsetWidth;
      const k = Ye($, u, p.value, s.value);
      u.style.width = M, u.style.boxSizing = m, x(k), o.value = k, t = k;
    } else {
      const M = Ye($, u, p.value, s.value);
      x(M), o.value = M, t = M;
    }
  }
  function b(P, L) {
    v.value = P, P && (P.width !== void 0 && (d.value = P.width), !i.value && l.value && o.value.length > 0 && _(() => {
      p.value = ue(s.value, d.value), E(o.value), L && L();
    }));
  }
  function h() {
    p.value = ue(s.value, d.value), E(o.value);
  }
  return {
    refreshLayout: E,
    setFixedDimensions: b,
    onResize: h,
    calculateHeight: x
  };
}
function va(e) {
  const {
    masonry: o,
    container: i,
    columns: l,
    virtualBufferPx: p,
    loadThresholdPx: d
  } = e, c = D(e.handleScroll), s = D(0), v = D(0), w = p, t = D(!1), x = D({
    distanceToTrigger: 0,
    isNearTrigger: !1
  }), E = Q(() => {
    const L = s.value - w, $ = s.value + v.value + w, u = o.value;
    return !u || u.length === 0 ? [] : u.filter((y) => {
      if (typeof y.top != "number" || typeof y.columnHeight != "number")
        return !0;
      const M = y.top;
      return y.top + y.columnHeight >= L && M <= $;
    });
  });
  function b(L) {
    if (!i.value) return;
    const { scrollTop: $, clientHeight: u } = i.value, n = $ + u, y = L ?? xe(o.value, l.value), M = y.length ? Math.max(...y) : 0, m = typeof d == "number" ? d : 200, k = m >= 0 ? Math.max(0, M - m) : Math.max(0, M + m), T = Math.max(0, k - n), H = T <= 100;
    x.value = {
      distanceToTrigger: Math.round(T),
      isNearTrigger: H
    };
  }
  async function h() {
    if (i.value) {
      const $ = i.value.scrollTop, u = i.value.clientHeight || window.innerHeight, n = u > 0 ? u : window.innerHeight;
      s.value = $, v.value = n;
    }
    t.value = !0, await _(), await new Promise(($) => requestAnimationFrame(() => $())), t.value = !1;
    const L = xe(o.value, l.value);
    c.value(L), b(L);
  }
  function P() {
    s.value = 0, v.value = 0, t.value = !1, x.value = {
      distanceToTrigger: 0,
      isNearTrigger: !1
    };
  }
  return {
    viewportTop: s,
    viewportHeight: v,
    virtualizing: t,
    scrollProgress: x,
    visibleMasonry: E,
    updateScrollProgress: b,
    updateViewport: h,
    reset: P,
    handleScroll: c
  };
}
function fa(e) {
  const { masonry: o } = e, i = D(/* @__PURE__ */ new Set());
  function l(c) {
    return typeof c == "number" && c > 0 && Number.isFinite(c);
  }
  function p(c, s) {
    try {
      if (!Array.isArray(c) || c.length === 0) return;
      const v = c.filter((t) => !l(t == null ? void 0 : t.width) || !l(t == null ? void 0 : t.height));
      if (v.length === 0) return;
      const w = [];
      for (const t of v) {
        const x = (t == null ? void 0 : t.id) ?? `idx:${o.value.indexOf(t)}`;
        i.value.has(x) || (i.value.add(x), w.push(x));
      }
      if (w.length > 0) {
        const t = w.slice(0, 10);
        console.warn(
          "[Masonry] Items missing width/height detected:",
          {
            context: s,
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
    checkItemDimensions: p,
    invalidDimensionIds: i,
    reset: d
  };
}
const da = { class: "flex-1 relative min-h-0" }, ha = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ma = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ga = {
  key: 1,
  class: "relative w-full h-full"
}, pa = ["src"], ya = ["src", "autoplay", "controls"], wa = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, xa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ba = {
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
  setup(e, { emit: o }) {
    const i = e, l = o, p = D(!1), d = D(!1), c = D(null), s = D(!1), v = D(!1), w = D(null), t = D(!1), x = D(!1), E = D(!1), b = D(!1), h = D(!1), P = D(null), L = D(null);
    let $ = null;
    const u = Q(() => {
      var a;
      return i.type ?? ((a = i.item) == null ? void 0 : a.type) ?? "image";
    }), n = Q(() => {
      var a;
      return i.notFound ?? ((a = i.item) == null ? void 0 : a.notFound) ?? !1;
    }), y = Q(() => !!i.inSwipeMode);
    function M(a, f) {
      const I = a === "image" ? p.value : s.value;
      x.value && I && !E.value && (E.value = !0, l("in-view-and-loaded", { item: i.item, type: a, src: f }));
    }
    function m(a) {
      l("mouse-enter", { item: i.item, type: a });
    }
    function k(a) {
      l("mouse-leave", { item: i.item, type: a });
    }
    function T(a) {
      if (y.value) return;
      const f = a.target;
      f && (f.paused ? f.play() : f.pause());
    }
    function H(a) {
      const f = a.target;
      f && (y.value || f.play(), m("video"));
    }
    function A(a) {
      const f = a.target;
      f && (y.value || f.pause(), k("video"));
    }
    function S(a) {
      return new Promise((f, I) => {
        if (!a) {
          const g = new Error("No image source provided");
          l("preload:error", { item: i.item, type: "image", src: a, error: g }), I(g);
          return;
        }
        const B = new Image(), W = Date.now(), V = 300;
        B.onload = () => {
          const g = Date.now() - W, z = Math.max(0, V - g);
          setTimeout(async () => {
            p.value = !0, d.value = !1, b.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), h.value = !0, l("preload:success", { item: i.item, type: "image", src: a }), M("image", a), f();
          }, z);
        }, B.onerror = () => {
          d.value = !0, p.value = !1, b.value = !1;
          const g = new Error("Failed to load image");
          l("preload:error", { item: i.item, type: "image", src: a, error: g }), I(g);
        }, B.src = a;
      });
    }
    function O(a) {
      return new Promise((f, I) => {
        if (!a) {
          const g = new Error("No video source provided");
          l("preload:error", { item: i.item, type: "video", src: a, error: g }), I(g);
          return;
        }
        const B = document.createElement("video"), W = Date.now(), V = 300;
        B.preload = "metadata", B.muted = !0, B.onloadedmetadata = () => {
          const g = Date.now() - W, z = Math.max(0, V - g);
          setTimeout(async () => {
            s.value = !0, v.value = !1, b.value = !1, await _(), await new Promise((R) => setTimeout(R, 100)), h.value = !0, l("preload:success", { item: i.item, type: "video", src: a }), M("video", a), f();
          }, z);
        }, B.onerror = () => {
          v.value = !0, s.value = !1, b.value = !1;
          const g = new Error("Failed to load video");
          l("preload:error", { item: i.item, type: "video", src: a, error: g }), I(g);
        }, B.src = a;
      });
    }
    async function G() {
      var f;
      if (!t.value || b.value || n.value || u.value === "video" && s.value || u.value === "image" && p.value)
        return;
      const a = (f = i.item) == null ? void 0 : f.src;
      if (a)
        if (b.value = !0, h.value = !1, u.value === "video") {
          w.value = a, s.value = !1, v.value = !1;
          try {
            await O(a);
          } catch {
          }
        } else {
          c.value = a, p.value = !1, d.value = !1;
          try {
            await S(a);
          } catch {
          }
        }
    }
    return Qe(async () => {
      if (!P.value) return;
      const a = [i.preloadThreshold, 1].filter((I, B, W) => W.indexOf(I) === B).sort((I, B) => I - B);
      $ = new IntersectionObserver(
        (I) => {
          I.forEach((B) => {
            const W = B.intersectionRatio, V = W >= 1, g = W >= i.preloadThreshold;
            if (V && !x.value) {
              x.value = !0, l("in-view", { item: i.item, type: u.value });
              const z = u.value === "image" ? c.value : w.value, R = u.value === "image" ? p.value : s.value;
              z && R && M(u.value, z);
            }
            g && !t.value ? (t.value = !0, G()) : B.isIntersecting;
          });
        },
        {
          // Trigger at both preloadThreshold and 1.0 (fully in view)
          threshold: a
        }
      ), $.observe(P.value), await _(), requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          f();
        });
      }), setTimeout(() => {
        f();
      }, 100);
      function f() {
        if (!P.value || x.value) return;
        const I = P.value.getBoundingClientRect(), B = window.innerHeight, W = window.innerWidth;
        if (I.top >= 0 && I.bottom <= B && I.left >= 0 && I.right <= W && I.height > 0 && I.width > 0) {
          x.value = !0, l("in-view", { item: i.item, type: u.value });
          const g = u.value === "image" ? c.value : w.value, z = u.value === "image" ? p.value : s.value;
          g && z && M(u.value, g);
        }
      }
    }), Ze(() => {
      $ && ($.disconnect(), $ = null);
    }), ae(
      () => {
        var a;
        return (a = i.item) == null ? void 0 : a.src;
      },
      async (a) => {
        if (!(!a || n.value)) {
          if (u.value === "video") {
            if (a !== w.value && (s.value = !1, v.value = !1, w.value = a, t.value)) {
              b.value = !0;
              try {
                await O(a);
              } catch {
              }
            }
          } else if (a !== c.value && (p.value = !1, d.value = !1, c.value = a, t.value)) {
            b.value = !0;
            try {
              await S(a);
            } catch {
            }
          }
        }
      }
    ), ae(
      () => i.isActive,
      (a) => {
        !y.value || !L.value || (a ? L.value.play() : L.value.pause());
      }
    ), (a, f) => (Y(), q("div", {
      ref_key: "containerRef",
      ref: P,
      class: "relative w-full h-full flex flex-col"
    }, [
      a.headerHeight > 0 ? (Y(), q("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${a.headerHeight}px` })
      }, [
        K(a.$slots, "header", {
          item: a.item,
          remove: a.remove,
          imageLoaded: p.value,
          imageError: d.value,
          videoLoaded: s.value,
          videoError: v.value,
          showNotFound: n.value,
          isLoading: b.value,
          mediaType: u.value,
          isFullyInView: x.value
        })
      ], 4)) : ne("", !0),
      U("div", da, [
        K(a.$slots, "default", {
          item: a.item,
          remove: a.remove,
          imageLoaded: p.value,
          imageError: d.value,
          videoLoaded: s.value,
          videoError: v.value,
          showNotFound: n.value,
          isLoading: b.value,
          mediaType: u.value,
          imageSrc: c.value,
          videoSrc: w.value,
          showMedia: h.value,
          isFullyInView: x.value
        }, () => [
          U("div", ha, [
            n.value ? (Y(), q("div", ma, f[3] || (f[3] = [
              U("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              U("span", { class: "font-medium" }, "Not Found", -1),
              U("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (Y(), q("div", ga, [
              u.value === "image" && c.value ? (Y(), q("img", {
                key: 0,
                src: c.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  p.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: f[0] || (f[0] = (I) => m("image")),
                onMouseleave: f[1] || (f[1] = (I) => k("image"))
              }, null, 42, pa)) : ne("", !0),
              u.value === "video" && w.value ? (Y(), q("video", {
                key: 1,
                ref_key: "videoEl",
                ref: L,
                src: w.value,
                class: re([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  s.value && h.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: y.value && i.isActive,
                controls: y.value,
                onClick: Ve(T, ["stop"]),
                onTouchend: Ve(T, ["stop", "prevent"]),
                onMouseenter: H,
                onMouseleave: A,
                onError: f[2] || (f[2] = (I) => v.value = !0)
              }, null, 42, ya)) : ne("", !0),
              !p.value && !s.value && !d.value && !v.value ? (Y(), q("div", {
                key: 2,
                class: re([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  h.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                U("div", wa, [
                  K(a.$slots, "placeholder-icon", { mediaType: u.value }, () => [
                    U("i", {
                      class: re(u.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : ne("", !0),
              b.value ? (Y(), q("div", xa, f[4] || (f[4] = [
                U("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  U("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ne("", !0),
              u.value === "image" && d.value || u.value === "video" && v.value ? (Y(), q("div", ba, [
                U("i", {
                  class: re(u.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                U("span", null, "Failed to load " + $e(u.value), 1)
              ])) : ne("", !0)
            ]))
          ])
        ])
      ]),
      a.footerHeight > 0 ? (Y(), q("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${a.footerHeight}px` })
      }, [
        K(a.$slots, "footer", {
          item: a.item,
          remove: a.remove,
          imageLoaded: p.value,
          imageError: d.value,
          videoLoaded: s.value,
          videoError: v.value,
          showNotFound: n.value,
          isLoading: b.value,
          mediaType: u.value,
          isFullyInView: x.value
        })
      ], 4)) : ne("", !0)
    ], 512));
  }
}), Ma = {
  key: 0,
  class: "w-full h-full flex items-center justify-center"
}, Ta = { class: "w-full h-full flex items-center justify-center p-4" }, Ia = { class: "w-full h-full max-w-full max-h-full relative" }, Ea = {
  key: 0,
  class: "w-full py-8 text-center"
}, Pa = {
  key: 1,
  class: "w-full py-8 text-center"
}, La = { class: "text-red-500 dark:text-red-400" }, Sa = {
  key: 0,
  class: "w-full py-8 text-center"
}, ka = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ha = { class: "text-red-500 dark:text-red-400" }, $a = /* @__PURE__ */ Ke({
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
  setup(e, { expose: o, emit: i }) {
    const l = e, p = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, d = Q(() => {
      var r;
      return {
        ...p,
        ...l.layout,
        sizes: {
          ...p.sizes,
          ...((r = l.layout) == null ? void 0 : r.sizes) || {}
        }
      };
    }), c = D(null), s = D(typeof window < "u" ? window.innerWidth : 1024), v = D(typeof window < "u" ? window.innerHeight : 768), w = D(null);
    let t = null;
    function x(r) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[r] || 768;
    }
    const E = Q(() => {
      if (l.layoutMode === "masonry") return !1;
      if (l.layoutMode === "swipe") return !0;
      const r = typeof l.mobileBreakpoint == "string" ? x(l.mobileBreakpoint) : l.mobileBreakpoint;
      return s.value < r;
    }), b = i, h = Q({
      get: () => l.items,
      set: (r) => b("update:items", r)
    }), P = Q({
      get: () => l.context,
      set: (r) => b("update:context", r)
    });
    function L(r) {
      P.value = r;
    }
    const $ = Q(() => {
      const r = h.value;
      return (r == null ? void 0 : r.length) ?? 0;
    }), u = D(7), n = D(null), y = D([]), M = D(null), m = D(!1), k = D(0), T = D(!1), H = D(null), A = D(!1), S = Q(() => ta(s.value)), O = fa({
      masonry: h
    }), { checkItemDimensions: G, reset: a } = O, f = ca({
      masonry: h,
      useSwipeMode: E,
      container: n,
      columns: u,
      containerWidth: s,
      masonryContentHeight: k,
      layout: d,
      fixedDimensions: w,
      checkItemDimensions: G
    }), { refreshLayout: I, setFixedDimensions: B, onResize: W } = f, V = va({
      masonry: h,
      container: n,
      columns: u,
      virtualBufferPx: l.virtualBufferPx,
      loadThresholdPx: l.loadThresholdPx,
      handleScroll: () => {
      }
      // Will be set after pagination is initialized
    }), { viewportTop: g, viewportHeight: z, virtualizing: R, visibleMasonry: j, updateScrollProgress: X, updateViewport: ie, reset: Z } = V, { onEnter: at, onBeforeEnter: nt, onBeforeLeave: lt, onLeave: ot } = oa(
      { container: n },
      { leaveDurationMs: l.leaveDurationMs, virtualizing: R }
    ), rt = at, it = nt, st = lt, ut = ot, ct = sa({
      getPage: l.getPage,
      context: P,
      masonry: h,
      isLoading: m,
      hasReachedEnd: T,
      loadError: H,
      currentPage: M,
      paginationHistory: y,
      refreshLayout: I,
      retryMaxAttempts: l.retryMaxAttempts,
      retryInitialDelayMs: l.retryInitialDelayMs,
      retryBackoffStepMs: l.retryBackoffStepMs,
      mode: l.mode,
      backfillDelayMs: l.backfillDelayMs,
      backfillMaxCalls: l.backfillMaxCalls,
      pageSize: l.pageSize,
      autoRefreshOnEmpty: l.autoRefreshOnEmpty,
      emits: b
    }), { loadPage: Me, loadNext: pe, refreshCurrentPage: De, cancelLoad: Te, maybeBackfillToTarget: vt } = ct, ee = ia({
      useSwipeMode: E,
      masonry: h,
      isLoading: m,
      loadNext: pe,
      loadPage: Me,
      paginationHistory: y
    }), { handleScroll: ze } = ra({
      container: n,
      masonry: h,
      columns: u,
      containerHeight: k,
      isLoading: m,
      pageSize: l.pageSize,
      refreshLayout: I,
      setItemsRaw: (r) => {
        h.value = r;
      },
      loadNext: pe,
      loadThresholdPx: l.loadThresholdPx
    });
    V.handleScroll.value = ze;
    const ft = ua({
      masonry: h,
      useSwipeMode: E,
      refreshLayout: I,
      refreshCurrentPage: De,
      loadNext: pe,
      maybeBackfillToTarget: vt,
      autoRefreshOnEmpty: l.autoRefreshOnEmpty,
      paginationHistory: y
    }), { remove: ce, removeMany: dt, restore: ht, restoreMany: mt, removeAll: gt } = ft;
    function pt(r) {
      B(r, X), !r && c.value && (s.value = c.value.clientWidth, v.value = c.value.clientHeight);
    }
    o({
      isLoading: m,
      refreshLayout: I,
      // Opaque caller context passed through to getPage(page, context)
      context: P,
      setContext: L,
      // Container dimensions (wrapper element)
      containerWidth: s,
      containerHeight: v,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: k,
      // Current page
      currentPage: M,
      // End of list tracking
      hasReachedEnd: T,
      // Load error tracking
      loadError: H,
      // Initialization state
      isInitialized: A,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: pt,
      remove: ce,
      removeMany: dt,
      removeAll: gt,
      restore: ht,
      restoreMany: mt,
      loadNext: pe,
      loadPage: Me,
      refreshCurrentPage: De,
      reset: Tt,
      destroy: It,
      init: Ce,
      restoreItems: Et,
      paginationHistory: y,
      cancelLoad: Te,
      scrollToTop: xt,
      scrollTo: bt,
      totalItems: Q(() => h.value.length),
      currentBreakpoint: S
    });
    const se = ee.currentSwipeIndex, ve = ee.swipeOffset, ye = ee.isDragging, le = ee.swipeContainer, Be = ee.handleTouchStart, Re = ee.handleTouchMove, Ae = ee.handleTouchEnd, We = ee.handleMouseDown, Ie = ee.handleMouseMove, Ee = ee.handleMouseUp, Pe = ee.snapToCurrentItem;
    function yt(r) {
      const F = $.value, N = typeof r == "string" ? parseInt(r, 10) : r;
      return F > 0 ? `${N * (100 / F)}%` : "0%";
    }
    function wt() {
      const r = $.value;
      return r > 0 ? `${100 / r}%` : "0%";
    }
    function xt(r) {
      n.value && n.value.scrollTo({
        top: 0,
        behavior: (r == null ? void 0 : r.behavior) ?? "smooth",
        ...r
      });
    }
    function bt(r) {
      n.value && (n.value.scrollTo({
        top: r.top ?? n.value.scrollTop,
        left: r.left ?? n.value.scrollLeft,
        behavior: r.behavior ?? "auto"
      }), n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight || window.innerHeight));
    }
    function Mt() {
      W(), n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight);
    }
    function Tt() {
      Te(), n.value && n.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), h.value = [], v.value = 0, M.value = l.loadAtPage, y.value = [l.loadAtPage], T.value = !1, H.value = null, A.value = !1, Z();
    }
    function It() {
      Te(), h.value = [], k.value = 0, M.value = null, y.value = [], T.value = !1, H.value = null, m.value = !1, A.value = !1, se.value = 0, ve.value = 0, ye.value = !1, Z(), a(), n.value && n.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const oe = Ge(async () => {
      E.value || await ie();
    }, 200), Ne = Ge(Mt, 200);
    function Oe() {
      ee.handleWindowResize();
    }
    function Ce(r, F, N) {
      M.value = F, y.value = [F], N != null && y.value.push(N), T.value = N === null, G(r, "init"), E.value ? (h.value = [...h.value, ...r], se.value === 0 && h.value.length > 0 && (ve.value = 0)) : (I([...h.value, ...r]), n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight || window.innerHeight), _(() => {
        n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight || window.innerHeight, X());
      }));
    }
    async function Et(r, F, N) {
      if (l.init === "manual") {
        Ce(r, F, N), r && r.length > 0 && (A.value = !0);
        return;
      }
      if (M.value = F, y.value = [F], N != null && y.value.push(N), T.value = N === null, H.value = null, G(r, "restoreItems"), E.value)
        h.value = r, se.value === 0 && h.value.length > 0 && (ve.value = 0);
      else if (I(r), n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight || window.innerHeight), await _(), n.value) {
        g.value = n.value.scrollTop, z.value = n.value.clientHeight || window.innerHeight, X(), await _();
        const te = xe(h.value, u.value), C = te.length ? Math.max(...te) : 0, Pt = n.value.scrollTop + n.value.clientHeight, Le = typeof l.loadThresholdPx == "number" ? l.loadThresholdPx : 200, Lt = Le >= 0 ? Math.max(0, C - Le) : Math.max(0, C + Le);
        Pt >= Lt && !T.value && !m.value && y.value.length > 0 && y.value[y.value.length - 1] != null && await ze(te, !0);
      }
      r && r.length > 0 && (A.value = !0);
    }
    return ae(
      d,
      () => {
        E.value || n.value && (u.value = ue(d.value, s.value), I(h.value));
      },
      { deep: !0 }
    ), ae(() => l.layoutMode, () => {
      w.value && w.value.width !== void 0 ? s.value = w.value.width : c.value && (s.value = c.value.clientWidth);
    }), ae(n, (r) => {
      r && !E.value ? (r.removeEventListener("scroll", oe), r.addEventListener("scroll", oe, { passive: !0 })) : r && r.removeEventListener("scroll", oe);
    }, { immediate: !0 }), ae(
      () => h.value.length,
      (r, F) => {
        l.init === "manual" && !A.value && r > 0 && F === 0 && (A.value = !0);
      },
      { immediate: !1 }
    ), ae(E, (r, F) => {
      F === void 0 && r === !1 || _(() => {
        r ? (document.addEventListener("mousemove", Ie), document.addEventListener("mouseup", Ee), n.value && n.value.removeEventListener("scroll", oe), se.value = 0, ve.value = 0, h.value.length > 0 && Pe()) : (document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee), n.value && c.value && (w.value && w.value.width !== void 0 ? s.value = w.value.width : s.value = c.value.clientWidth, n.value.removeEventListener("scroll", oe), n.value.addEventListener("scroll", oe, { passive: !0 }), h.value.length > 0 && (u.value = ue(d.value, s.value), I(h.value), g.value = n.value.scrollTop, z.value = n.value.clientHeight, X())));
      });
    }, { immediate: !0 }), ae(le, (r) => {
      r && (r.addEventListener("touchstart", Be, { passive: !1 }), r.addEventListener("touchmove", Re, { passive: !1 }), r.addEventListener("touchend", Ae), r.addEventListener("mousedown", We));
    }), ae(() => h.value.length, (r, F) => {
      E.value && r > 0 && F === 0 && (se.value = 0, _(() => Pe()));
    }), ae(c, (r) => {
      t && (t.disconnect(), t = null), r && typeof ResizeObserver < "u" ? (t = new ResizeObserver((F) => {
        if (!w.value)
          for (const N of F) {
            const te = N.contentRect.width, C = N.contentRect.height;
            s.value !== te && (s.value = te), v.value !== C && (v.value = C);
          }
      }), t.observe(r), w.value || (s.value = r.clientWidth, v.value = r.clientHeight)) : r && (w.value || (s.value = r.clientWidth, v.value = r.clientHeight));
    }, { immediate: !0 }), ae(s, (r, F) => {
      r !== F && r > 0 && !E.value && n.value && h.value.length > 0 && _(() => {
        u.value = ue(d.value, r), I(h.value), X();
      });
    }), Qe(async () => {
      try {
        await _(), c.value && !t && (s.value = c.value.clientWidth, v.value = c.value.clientHeight), E.value || (u.value = ue(d.value, s.value), n.value && (g.value = n.value.scrollTop, z.value = n.value.clientHeight));
        const r = l.loadAtPage;
        if (y.value = [r], l.init === "auto") {
          A.value = !0, await _();
          try {
            await Me(r);
          } catch {
          }
        }
        E.value ? _(() => Pe()) : X();
      } catch (r) {
        H.value || (console.error("Error during component initialization:", r), H.value = me(r)), m.value = !1;
      }
      window.addEventListener("resize", Ne), window.addEventListener("resize", Oe);
    }), Ze(() => {
      var r;
      t && (t.disconnect(), t = null), (r = n.value) == null || r.removeEventListener("scroll", oe), window.removeEventListener("resize", Ne), window.removeEventListener("resize", Oe), le.value && (le.value.removeEventListener("touchstart", Be), le.value.removeEventListener("touchmove", Re), le.value.removeEventListener("touchend", Ae), le.value.removeEventListener("mousedown", We)), document.removeEventListener("mousemove", Ie), document.removeEventListener("mouseup", Ee);
    }), (r, F) => (Y(), q("div", {
      ref_key: "wrapper",
      ref: c,
      class: "w-full h-full flex flex-col relative"
    }, [
      A.value ? E.value ? (Y(), q("div", {
        key: 1,
        class: re(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": l.forceMotion, "cursor-grab": !J(ye), "cursor-grabbing": J(ye) }]),
        ref_key: "swipeContainer",
        ref: le,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        U("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${J(ve)}px)`,
            transition: J(ye) ? "none" : `transform ${e.transitionDurationMs}ms ${e.transitionEasing}`,
            height: `${$.value * 100}%`
          })
        }, [
          (Y(!0), q(je, null, qe(h.value, (N, te) => (Y(), q("div", {
            key: `${N.page}-${N.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: yt(te),
              height: wt()
            })
          }, [
            U("div", Ta, [
              U("div", Ia, [
                K(r.$slots, "default", {
                  item: N,
                  remove: J(ce),
                  index: N.originalIndex ?? h.value.indexOf(N)
                }, () => [
                  Se(be, {
                    item: N,
                    remove: J(ce),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": te === J(se),
                    "onPreload:success": F[0] || (F[0] = (C) => b("item:preload:success", C)),
                    "onPreload:error": F[1] || (F[1] = (C) => b("item:preload:error", C)),
                    onMouseEnter: F[2] || (F[2] = (C) => b("item:mouse-enter", C)),
                    onMouseLeave: F[3] || (F[3] = (C) => b("item:mouse-leave", C))
                  }, {
                    header: fe((C) => [
                      K(r.$slots, "item-header", de({ ref_for: !0 }, C), void 0, !0)
                    ]),
                    footer: fe((C) => [
                      K(r.$slots, "item-footer", de({ ref_for: !0 }, C), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        T.value && h.value.length > 0 ? (Y(), q("div", Ea, [
          K(r.$slots, "end-message", {}, () => [
            F[9] || (F[9] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        H.value && h.value.length > 0 ? (Y(), q("div", Pa, [
          K(r.$slots, "error-message", { error: H.value }, () => [
            U("p", La, "Failed to load content: " + $e(H.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2)) : (Y(), q("div", {
        key: 2,
        class: re(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
        ref_key: "container",
        ref: n
      }, [
        U("div", {
          class: "relative",
          style: ge({ height: `${k.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
        }, [
          Se(St, {
            name: "masonry",
            css: !1,
            onEnter: J(rt),
            onBeforeEnter: J(it),
            onLeave: J(ut),
            onBeforeLeave: J(st)
          }, {
            default: fe(() => [
              (Y(!0), q(je, null, qe(J(j), (N, te) => (Y(), q("div", de({
                key: `${N.page}-${N.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, J(la)(N, te)), [
                K(r.$slots, "default", {
                  item: N,
                  remove: J(ce),
                  index: N.originalIndex ?? h.value.indexOf(N)
                }, () => [
                  Se(be, {
                    item: N,
                    remove: J(ce),
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": F[4] || (F[4] = (C) => b("item:preload:success", C)),
                    "onPreload:error": F[5] || (F[5] = (C) => b("item:preload:error", C)),
                    onMouseEnter: F[6] || (F[6] = (C) => b("item:mouse-enter", C)),
                    onMouseLeave: F[7] || (F[7] = (C) => b("item:mouse-leave", C))
                  }, {
                    header: fe((C) => [
                      K(r.$slots, "item-header", de({ ref_for: !0 }, C), void 0, !0)
                    ]),
                    footer: fe((C) => [
                      K(r.$slots, "item-footer", de({ ref_for: !0 }, C), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "remove", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"])
        ], 4),
        T.value && h.value.length > 0 ? (Y(), q("div", Sa, [
          K(r.$slots, "end-message", {}, () => [
            F[10] || (F[10] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        H.value && h.value.length > 0 ? (Y(), q("div", ka, [
          K(r.$slots, "error-message", { error: H.value }, () => [
            U("p", Ha, "Failed to load content: " + $e(H.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2)) : (Y(), q("div", Ma, [
        K(r.$slots, "loading-message", {}, () => [
          F[8] || (F[8] = U("p", { class: "text-gray-500 dark:text-gray-400" }, "Waiting for content to load...", -1))
        ], !0)
      ]))
    ], 512));
  }
}), Fa = (e, o) => {
  const i = e.__vccOpts || e;
  for (const [l, p] of o)
    i[l] = p;
  return i;
}, Je = /* @__PURE__ */ Fa($a, [["__scopeId", "data-v-14886876"]]), Ra = {
  install(e) {
    e.component("WyxosMasonry", Je), e.component("WMasonry", Je), e.component("WyxosMasonryItem", be), e.component("WMasonryItem", be);
  }
};
export {
  Je as Masonry,
  be as MasonryItem,
  Ra as default
};
