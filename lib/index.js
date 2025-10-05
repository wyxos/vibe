import { nextTick as Z, defineComponent as me, computed as ne, ref as B, onMounted as ye, onUnmounted as he, createElementBlock as U, openBlock as Y, normalizeClass as ae, createElementVNode as O, normalizeStyle as ve, createVNode as be, createCommentVNode as xe, TransitionGroup as we, unref as V, withCtx as Me, Fragment as Te, renderList as Se, mergeProps as re, renderSlot as Ie, toDisplayString as oe } from "vue";
let K = null;
function ke() {
  if (K != null) return K;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const r = document.createElement("div");
  r.style.width = "100%", e.appendChild(r);
  const i = e.offsetWidth - r.offsetWidth;
  return document.body.removeChild(e), K = i, i;
}
function He(e, r, i, s = {}) {
  const {
    gutterX: m = 0,
    gutterY: y = 0,
    header: n = 0,
    footer: o = 0,
    paddingLeft: p = 0,
    paddingRight: g = 0,
    sizes: u = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: f = "masonry"
  } = s;
  let x = 0, b = 0;
  try {
    if (r && r.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const h = window.getComputedStyle(r);
      x = parseFloat(h.paddingLeft) || 0, b = parseFloat(h.paddingRight) || 0;
    }
  } catch {
  }
  const L = (p || 0) + x, W = (g || 0) + b, k = r.offsetWidth - r.clientWidth, P = k > 0 ? k + 2 : ke() + 2, N = r.offsetWidth - P - L - W, F = m * (i - 1), $ = Math.floor((N - F) / i), w = e.map((h) => {
    const I = h.width, M = h.height;
    return Math.round($ * M / I) + o + n;
  });
  if (f === "sequential-balanced") {
    const h = w.length;
    if (h === 0) return [];
    const I = (t, a, l) => t + (a > 0 ? y : 0) + l;
    let M = Math.max(...w), H = w.reduce((t, a) => t + a, 0) + y * Math.max(0, h - 1);
    const C = (t) => {
      let a = 1, l = 0, c = 0;
      for (let v = 0; v < h; v++) {
        const E = w[v], T = I(l, c, E);
        if (T <= t)
          l = T, c++;
        else if (a++, l = E, c = 1, E > t || a > i) return !1;
      }
      return a <= i;
    };
    for (; M < H; ) {
      const t = Math.floor((M + H) / 2);
      C(t) ? H = t : M = t + 1;
    }
    const R = H, A = new Array(i).fill(0);
    let j = i - 1, D = 0, z = 0;
    for (let t = h - 1; t >= 0; t--) {
      const a = w[t], l = t < j;
      !(I(D, z, a) <= R) || l ? (A[j] = t + 1, j--, D = a, z = 1) : (D = I(D, z, a), z++);
    }
    A[0] = 0;
    const _ = [], X = new Array(i).fill(0);
    for (let t = 0; t < i; t++) {
      const a = A[t], l = t + 1 < i ? A[t + 1] : h, c = t * ($ + m);
      for (let v = a; v < l; v++) {
        const T = {
          ...e[v],
          columnWidth: $,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        T.imageHeight = w[v] - (o + n), T.columnHeight = w[v], T.left = c, T.top = X[t], X[t] += T.columnHeight + (v + 1 < l ? y : 0), _.push(T);
      }
    }
    return _;
  }
  const d = new Array(i).fill(0), S = [];
  for (let h = 0; h < e.length; h++) {
    const I = e[h], M = {
      ...I,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, H = d.indexOf(Math.min(...d)), C = I.width, R = I.height;
    M.columnWidth = $, M.left = H * ($ + m), M.imageHeight = Math.round($ * R / C), M.columnHeight = M.imageHeight + o + n, M.top = d[H], d[H] += M.columnHeight + y, S.push(M);
  }
  return S;
}
var Ee = typeof global == "object" && global && global.Object === Object && global, Le = typeof self == "object" && self && self.Object === Object && self, de = Ee || Le || Function("return this")(), J = de.Symbol, ge = Object.prototype, Pe = ge.hasOwnProperty, Ne = ge.toString, G = J ? J.toStringTag : void 0;
function $e(e) {
  var r = Pe.call(e, G), i = e[G];
  try {
    e[G] = void 0;
    var s = !0;
  } catch {
  }
  var m = Ne.call(e);
  return s && (r ? e[G] = i : delete e[G]), m;
}
var We = Object.prototype, Ae = We.toString;
function ze(e) {
  return Ae.call(e);
}
var Oe = "[object Null]", je = "[object Undefined]", ie = J ? J.toStringTag : void 0;
function De(e) {
  return e == null ? e === void 0 ? je : Oe : ie && ie in Object(e) ? $e(e) : ze(e);
}
function Be(e) {
  return e != null && typeof e == "object";
}
var Fe = "[object Symbol]";
function Ce(e) {
  return typeof e == "symbol" || Be(e) && De(e) == Fe;
}
var Re = /\s/;
function _e(e) {
  for (var r = e.length; r-- && Re.test(e.charAt(r)); )
    ;
  return r;
}
var qe = /^\s+/;
function Ve(e) {
  return e && e.slice(0, _e(e) + 1).replace(qe, "");
}
function ee(e) {
  var r = typeof e;
  return e != null && (r == "object" || r == "function");
}
var se = NaN, Ge = /^[-+]0x[0-9a-f]+$/i, Xe = /^0b[01]+$/i, Ue = /^0o[0-7]+$/i, Ye = parseInt;
function le(e) {
  if (typeof e == "number")
    return e;
  if (Ce(e))
    return se;
  if (ee(e)) {
    var r = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = ee(r) ? r + "" : r;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = Ve(e);
  var i = Xe.test(e);
  return i || Ue.test(e) ? Ye(e.slice(2), i ? 2 : 8) : Ge.test(e) ? se : +e;
}
var Q = function() {
  return de.Date.now();
}, Je = "Expected a function", Ke = Math.max, Qe = Math.min;
function ce(e, r, i) {
  var s, m, y, n, o, p, g = 0, u = !1, f = !1, x = !0;
  if (typeof e != "function")
    throw new TypeError(Je);
  r = le(r) || 0, ee(i) && (u = !!i.leading, f = "maxWait" in i, y = f ? Ke(le(i.maxWait) || 0, r) : y, x = "trailing" in i ? !!i.trailing : x);
  function b(d) {
    var S = s, h = m;
    return s = m = void 0, g = d, n = e.apply(h, S), n;
  }
  function L(d) {
    return g = d, o = setTimeout(P, r), u ? b(d) : n;
  }
  function W(d) {
    var S = d - p, h = d - g, I = r - S;
    return f ? Qe(I, y - h) : I;
  }
  function k(d) {
    var S = d - p, h = d - g;
    return p === void 0 || S >= r || S < 0 || f && h >= y;
  }
  function P() {
    var d = Q();
    if (k(d))
      return N(d);
    o = setTimeout(P, W(d));
  }
  function N(d) {
    return o = void 0, x && s ? b(d) : (s = m = void 0, n);
  }
  function F() {
    o !== void 0 && clearTimeout(o), g = 0, s = p = m = o = void 0;
  }
  function $() {
    return o === void 0 ? n : N(Q());
  }
  function w() {
    var d = Q(), S = k(d);
    if (s = arguments, m = this, p = d, S) {
      if (o === void 0)
        return L(p);
      if (f)
        return clearTimeout(o), o = setTimeout(P, r), b(p);
    }
    return o === void 0 && (o = setTimeout(P, r)), n;
  }
  return w.cancel = F, w.flush = $, w;
}
function ue(e) {
  const r = window.innerWidth, i = e.sizes;
  return r >= 1536 && i["2xl"] ? i["2xl"] : r >= 1280 && i.xl ? i.xl : r >= 1024 && i.lg ? i.lg : r >= 768 && i.md ? i.md : r >= 640 && i.sm ? i.sm : i.base;
}
function Ze(e) {
  return e.reduce((i, s) => Math.max(i, s.top + s.columnHeight), 0) + 500;
}
function et(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function tt(e, r = 0) {
  return {
    style: et(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": r
  };
}
function te(e, r) {
  if (!e.length || r <= 0)
    return new Array(Math.max(1, r)).fill(0);
  const s = Array.from(new Set(e.map((n) => n.left))).sort((n, o) => n - o).slice(0, r), m = /* @__PURE__ */ new Map();
  for (let n = 0; n < s.length; n++) m.set(s[n], n);
  const y = new Array(s.length).fill(0);
  for (const n of e) {
    const o = m.get(n.left);
    o != null && (y[o] = Math.max(y[o], n.top + n.columnHeight));
  }
  for (; y.length < r; ) y.push(0);
  return y;
}
function nt(e, r) {
  function i(n, o) {
    const p = parseInt(n.dataset.left || "0", 10), g = parseInt(n.dataset.top || "0", 10), u = parseInt(n.dataset.index || "0", 10), f = Math.min(u * 20, 160), x = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${f}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${p}px, ${g}px, 0) scale(1)`;
      const b = () => {
        x ? n.style.setProperty("--masonry-opacity-delay", x) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", b), o();
      };
      n.addEventListener("transitionend", b);
    });
  }
  function s(n) {
    const o = parseInt(n.dataset.left || "0", 10), p = parseInt(n.dataset.top || "0", 10);
    n.style.opacity = "0", n.style.transform = `translate3d(${o}px, ${p + 10}px, 0) scale(0.985)`;
  }
  function m(n) {
    const o = parseInt(n.dataset.left || "0", 10), p = parseInt(n.dataset.top || "0", 10);
    n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${o}px, ${p}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      n.style.transition = "";
    });
  }
  function y(n, o) {
    const p = parseInt(n.dataset.left || "0", 10), g = parseInt(n.dataset.top || "0", 10), u = typeof (r == null ? void 0 : r.leaveDurationMs) == "number" ? r.leaveDurationMs : NaN;
    let f = Number.isFinite(u) && u > 0 ? u : NaN;
    if (!Number.isFinite(f)) {
      const P = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", N = parseFloat(P);
      f = Number.isFinite(N) && N > 0 ? N : 200;
    }
    const x = n.style.transitionDuration, b = () => {
      n.removeEventListener("transitionend", L), clearTimeout(W), n.style.transitionDuration = x || "";
    }, L = (k) => {
      (!k || k.target === n) && (b(), o());
    }, W = setTimeout(() => {
      b(), o();
    }, f + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${f}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${p}px, ${g + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", L);
    });
  }
  return {
    onEnter: i,
    onBeforeEnter: s,
    onBeforeLeave: m,
    onLeave: y
  };
}
function at({
  container: e,
  masonry: r,
  columns: i,
  containerHeight: s,
  isLoading: m,
  maxItems: y,
  pageSize: n,
  refreshLayout: o,
  setItemsRaw: p,
  loadNext: g
}) {
  let u = 0;
  async function f(x) {
    if (!e.value) return;
    const b = Math.min(...te(r.value, i.value)), L = e.value.scrollTop + e.value.clientHeight, W = e.value.scrollTop > u + 1, k = b < L + 300;
    if (u = e.value.scrollTop, k && W && !m.value) {
      r.value.length, await g(), await Z(), m.value = !1;
      return;
    }
  }
  return {
    handleScroll: f
  };
}
const rt = ["src"], ot = ["onClick"], it = /* @__PURE__ */ me({
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
    maxItems: {
      type: Number,
      default: 100
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
    }
  },
  emits: [
    "update:items",
    "backfill:start",
    "backfill:tick",
    "backfill:stop",
    "retry:start",
    "retry:tick",
    "retry:stop"
  ],
  setup(e, { expose: r, emit: i }) {
    const s = e, m = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, y = ne(() => {
      var t;
      return {
        ...m,
        ...s.layout,
        sizes: {
          ...m.sizes,
          ...((t = s.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), n = i, o = ne({
      get: () => s.items,
      set: (t) => n("update:items", t)
    }), p = B(7), g = B(null), u = B([]), f = B(!1), x = B(0), b = B({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), L = (t) => {
      if (!g.value) return;
      const { scrollTop: a, clientHeight: l } = g.value, c = a + l, v = t ?? te(o.value, p.value), T = Math.max(...v) + 300, q = Math.max(0, T - c), pe = q <= 100;
      b.value = {
        distanceToTrigger: Math.round(q),
        isNearTrigger: pe
      };
    }, { onEnter: W, onBeforeEnter: k, onBeforeLeave: P, onLeave: N } = nt(o, { leaveDurationMs: s.leaveDurationMs }), { handleScroll: F } = at({
      container: g,
      masonry: o,
      columns: p,
      containerHeight: x,
      isLoading: f,
      maxItems: s.maxItems,
      pageSize: s.pageSize,
      refreshLayout: w,
      setItemsRaw: (t) => {
        o.value = t;
      },
      loadNext: M
    });
    r({
      isLoading: f,
      refreshLayout: w,
      containerHeight: x,
      remove: H,
      removeMany: C,
      loadNext: M,
      loadPage: I,
      reset: D,
      init: X,
      paginationHistory: u
    });
    function $(t) {
      const a = Ze(t);
      let l = 0;
      if (g.value) {
        const { scrollTop: c, clientHeight: v } = g.value;
        l = c + v + 100;
      }
      x.value = Math.max(a, l);
    }
    function w(t) {
      if (!g.value) return;
      const a = He(t, g.value, p.value, y.value);
      $(a), o.value = a;
    }
    function d(t, a) {
      return new Promise((l) => {
        const c = Math.max(0, t | 0), v = Date.now();
        a(c, c);
        const E = setInterval(() => {
          const T = Date.now() - v, q = Math.max(0, c - T);
          a(q, c), q <= 0 && (clearInterval(E), l());
        }, 100);
      });
    }
    async function S(t) {
      try {
        const a = await h(() => s.getNextPage(t));
        return w([...o.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function h(t) {
      let a = 0;
      const l = s.retryMaxAttempts;
      let c = s.retryInitialDelayMs;
      for (; ; )
        try {
          const v = await t();
          return a > 0 && n("retry:stop", { attempt: a, success: !0 }), v;
        } catch (v) {
          if (a++, a > l)
            throw n("retry:stop", { attempt: a - 1, success: !1 }), v;
          n("retry:start", { attempt: a, max: l, totalMs: c }), await d(c, (E, T) => {
            n("retry:tick", { attempt: a, remainingMs: E, totalMs: T });
          }), c += s.retryBackoffStepMs;
        }
    }
    async function I(t) {
      if (!f.value) {
        f.value = !0;
        try {
          const a = o.value.length, l = await S(t);
          return u.value.push(l.nextPage), await j(a), l;
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          f.value = !1;
        }
      }
    }
    async function M() {
      if (!f.value) {
        f.value = !0;
        try {
          const t = o.value.length, a = u.value[u.value.length - 1], l = await S(a);
          return u.value.push(l.nextPage), await j(t), l;
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          f.value = !1;
        }
      }
    }
    async function H(t) {
      const a = o.value.filter((l) => l.id !== t.id);
      o.value = a, await Z(), await new Promise((l) => requestAnimationFrame(() => l())), requestAnimationFrame(() => {
        w(a);
      });
    }
    async function C(t) {
      if (!t || t.length === 0) return;
      const a = new Set(t.map((c) => c.id)), l = o.value.filter((c) => !a.has(c.id));
      o.value = l, await Z(), await new Promise((c) => requestAnimationFrame(() => c())), requestAnimationFrame(() => {
        w(l);
      });
    }
    function R() {
      p.value = ue(y.value), w(o.value);
    }
    let A = !1;
    async function j(t) {
      if (!s.backfillEnabled || A) return;
      const a = (t || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || u.value[u.value.length - 1] == null) && !(o.value.length >= a)) {
        A = !0;
        try {
          let c = 0;
          for (n("backfill:start", { target: a, fetched: o.value.length, calls: c }); o.value.length < a && c < s.backfillMaxCalls && u.value[u.value.length - 1] != null; ) {
            await d(s.backfillDelayMs, (E, T) => {
              n("backfill:tick", {
                fetched: o.value.length,
                target: a,
                calls: c,
                remainingMs: E,
                totalMs: T
              });
            });
            const v = u.value[u.value.length - 1];
            try {
              f.value = !0;
              const E = await S(v);
              u.value.push(E.nextPage);
            } finally {
              f.value = !1;
            }
            c++;
          }
          n("backfill:stop", { fetched: o.value.length, calls: c });
        } finally {
          A = !1;
        }
      }
    }
    function D() {
      g.value && g.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], x.value = 0, u.value = [s.loadAtPage], b.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const z = ce(() => {
      const t = te(o.value, p.value);
      F(t), L(t);
    }, 200), _ = ce(R, 200);
    function X(t, a, l) {
      u.value = [a], u.value.push(l), w([...o.value, ...t]), L();
    }
    return ye(async () => {
      var t;
      try {
        p.value = ue(y.value);
        const a = s.loadAtPage;
        u.value = [a], s.skipInitialLoad || await I(u.value[0]), L();
      } catch (a) {
        console.error("Error during component initialization:", a), f.value = !1;
      }
      (t = g.value) == null || t.addEventListener("scroll", z, { passive: !0 }), window.addEventListener("resize", _);
    }), he(() => {
      var t;
      (t = g.value) == null || t.removeEventListener("scroll", z), window.removeEventListener("resize", _);
    }), (t, a) => (Y(), U("div", {
      class: ae(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: g
    }, [
      O("div", {
        class: "relative",
        style: ve({ height: `${x.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        be(we, {
          name: "masonry",
          css: !1,
          onEnter: V(W),
          onBeforeEnter: V(k),
          onLeave: V(N),
          onBeforeLeave: V(P)
        }, {
          default: Me(() => [
            (Y(!0), U(Te, null, Se(o.value, (l, c) => (Y(), U("div", re({
              key: `${l.page}-${l.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, V(tt)(l, c)), [
              Ie(t.$slots, "item", re({ ref_for: !0 }, { item: l, remove: H }), () => [
                O("img", {
                  src: l.src,
                  class: "w-full",
                  loading: "lazy",
                  decoding: "async"
                }, null, 8, rt),
                O("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (v) => H(l)
                }, a[0] || (a[0] = [
                  O("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, ot)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }, 8, ["onEnter", "onBeforeEnter", "onLeave", "onBeforeLeave"]),
        x.value > 0 ? (Y(), U("div", {
          key: 0,
          class: ae(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !b.value.isNearTrigger, "opacity-100": b.value.isNearTrigger }])
        }, [
          O("span", null, oe(o.value.length) + " items", 1),
          a[1] || (a[1] = O("span", { class: "mx-2" }, "|", -1)),
          O("span", null, oe(b.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : xe("", !0)
      ], 4)
    ], 2));
  }
}), st = (e, r) => {
  const i = e.__vccOpts || e;
  for (const [s, m] of r)
    i[s] = m;
  return i;
}, fe = /* @__PURE__ */ st(it, [["__scopeId", "data-v-f603791f"]]), ct = {
  install(e) {
    e.component("WyxosMasonry", fe), e.component("WMasonry", fe);
  }
};
export {
  fe as Masonry,
  ct as default
};
