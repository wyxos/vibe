import { nextTick as J, defineComponent as $e, computed as re, ref as B, onMounted as We, onUnmounted as Oe, createElementBlock as oe, openBlock as le, normalizeClass as ve, createElementVNode as V, normalizeStyle as Be, createVNode as ze, createCommentVNode as Fe, TransitionGroup as De, withCtx as je, Fragment as Re, renderList as Ce, mergeProps as me, unref as _e, renderSlot as qe, toDisplayString as be } from "vue";
let se = null;
function Ve() {
  if (se != null) return se;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const i = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), se = i, i;
}
function Ge(e, o, i, s = {}) {
  const {
    gutterX: b = 0,
    gutterY: x = 0,
    header: n = 0,
    footer: r = 0,
    paddingLeft: y = 0,
    paddingRight: u = 0,
    sizes: c = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: v = "masonry"
  } = s;
  let g = 0, m = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const w = window.getComputedStyle(o);
      g = parseFloat(w.paddingLeft) || 0, m = parseFloat(w.paddingRight) || 0;
    }
  } catch {
  }
  const O = (y || 0) + g, R = (u || 0) + m, E = o.offsetWidth - o.clientWidth, T = E > 0 ? E + 2 : Ve() + 2, I = o.offsetWidth - T - O - R, q = b * (i - 1), S = Math.floor((I - q) / i), M = e.map((w) => {
    const L = w.width, P = w.height;
    return Math.round(S * P / L) + r + n;
  });
  if (v === "sequential-balanced") {
    const w = M.length;
    if (w === 0) return [];
    const L = (h, H, W) => h + (H > 0 ? x : 0) + W;
    let P = Math.max(...M), z = M.reduce((h, H) => h + H, 0) + x * Math.max(0, w - 1);
    const K = (h) => {
      let H = 1, W = 0, F = 0;
      for (let N = 0; N < w; N++) {
        const _ = M[N], D = L(W, F, _);
        if (D <= h)
          W = D, F++;
        else if (H++, W = _, F = 1, _ > h || H > i) return !1;
      }
      return H <= i;
    };
    for (; P < z; ) {
      const h = Math.floor((P + z) / 2);
      K(h) ? z = h : P = h + 1;
    }
    const Q = z, G = new Array(i).fill(0);
    let Z = i - 1, U = 0, X = 0;
    for (let h = w - 1; h >= 0; h--) {
      const H = M[h], W = h < Z;
      !(L(U, X, H) <= Q) || W ? (G[Z] = h + 1, Z--, U = H, X = 1) : (U = L(U, X, H), X++);
    }
    G[0] = 0;
    const C = [], ee = new Array(i).fill(0);
    for (let h = 0; h < i; h++) {
      const H = G[h], W = h + 1 < i ? G[h + 1] : w, F = h * (S + b);
      for (let N = H; N < W; N++) {
        const D = {
          ...e[N],
          columnWidth: S,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        D.imageHeight = M[N] - (r + n), D.columnHeight = M[N], D.left = F, D.top = ee[h], ee[h] += D.columnHeight + (N + 1 < W ? x : 0), C.push(D);
      }
    }
    return C;
  }
  const p = new Array(i).fill(0), $ = [];
  for (let w = 0; w < e.length; w++) {
    const L = e[w], P = {
      ...L,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, z = p.indexOf(Math.min(...p)), K = L.width, Q = L.height;
    P.columnWidth = S, P.left = z * (S + b), P.imageHeight = Math.round(S * Q / K), P.columnHeight = P.imageHeight + r + n, P.top = p[z], p[z] += P.columnHeight + x, $.push(P);
  }
  return $;
}
var Ue = typeof global == "object" && global && global.Object === Object && global, Xe = typeof self == "object" && self && self.Object === Object && self, Se = Ue || Xe || Function("return this")(), ie = Se.Symbol, He = Object.prototype, Ye = He.hasOwnProperty, Je = He.toString, ne = ie ? ie.toStringTag : void 0;
function Ke(e) {
  var o = Ye.call(e, ne), i = e[ne];
  try {
    e[ne] = void 0;
    var s = !0;
  } catch {
  }
  var b = Je.call(e);
  return s && (o ? e[ne] = i : delete e[ne]), b;
}
var Qe = Object.prototype, Ze = Qe.toString;
function et(e) {
  return Ze.call(e);
}
var tt = "[object Null]", nt = "[object Undefined]", xe = ie ? ie.toStringTag : void 0;
function at(e) {
  return e == null ? e === void 0 ? nt : tt : xe && xe in Object(e) ? Ke(e) : et(e);
}
function rt(e) {
  return e != null && typeof e == "object";
}
var ot = "[object Symbol]";
function lt(e) {
  return typeof e == "symbol" || rt(e) && at(e) == ot;
}
var it = /\s/;
function st(e) {
  for (var o = e.length; o-- && it.test(e.charAt(o)); )
    ;
  return o;
}
var ut = /^\s+/;
function ct(e) {
  return e && e.slice(0, st(e) + 1).replace(ut, "");
}
function ce(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var we = NaN, ft = /^[-+]0x[0-9a-f]+$/i, dt = /^0b[01]+$/i, gt = /^0o[0-7]+$/i, ht = parseInt;
function Te(e) {
  if (typeof e == "number")
    return e;
  if (lt(e))
    return we;
  if (ce(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = ce(o) ? o + "" : o;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = ct(e);
  var i = dt.test(e);
  return i || gt.test(e) ? ht(e.slice(2), i ? 2 : 8) : ft.test(e) ? we : +e;
}
var ue = function() {
  return Se.Date.now();
}, pt = "Expected a function", yt = Math.max, vt = Math.min;
function Me(e, o, i) {
  var s, b, x, n, r, y, u = 0, c = !1, v = !1, g = !0;
  if (typeof e != "function")
    throw new TypeError(pt);
  o = Te(o) || 0, ce(i) && (c = !!i.leading, v = "maxWait" in i, x = v ? yt(Te(i.maxWait) || 0, o) : x, g = "trailing" in i ? !!i.trailing : g);
  function m(p) {
    var $ = s, w = b;
    return s = b = void 0, u = p, n = e.apply(w, $), n;
  }
  function O(p) {
    return u = p, r = setTimeout(T, o), c ? m(p) : n;
  }
  function R(p) {
    var $ = p - y, w = p - u, L = o - $;
    return v ? vt(L, x - w) : L;
  }
  function E(p) {
    var $ = p - y, w = p - u;
    return y === void 0 || $ >= o || $ < 0 || v && w >= x;
  }
  function T() {
    var p = ue();
    if (E(p))
      return I(p);
    r = setTimeout(T, R(p));
  }
  function I(p) {
    return r = void 0, g && s ? m(p) : (s = b = void 0, n);
  }
  function q() {
    r !== void 0 && clearTimeout(r), u = 0, s = y = b = r = void 0;
  }
  function S() {
    return r === void 0 ? n : I(ue());
  }
  function M() {
    var p = ue(), $ = E(p);
    if (s = arguments, b = this, y = p, $) {
      if (r === void 0)
        return O(y);
      if (v)
        return clearTimeout(r), r = setTimeout(T, o), m(y);
    }
    return r === void 0 && (r = setTimeout(T, o)), n;
  }
  return M.cancel = q, M.flush = S, M;
}
function Pe(e) {
  const o = window.innerWidth, i = e.sizes;
  return o >= 1536 && i["2xl"] ? i["2xl"] : o >= 1280 && i.xl ? i.xl : o >= 1024 && i.lg ? i.lg : o >= 768 && i.md ? i.md : o >= 640 && i.sm ? i.sm : i.base;
}
function mt(e) {
  return e.reduce((i, s) => Math.max(i, s.top + s.columnHeight), 0) + 500;
}
function bt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function xt(e, o = 0) {
  return {
    style: bt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function fe(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const s = Array.from(new Set(e.map((n) => n.left))).sort((n, r) => n - r).slice(0, o), b = /* @__PURE__ */ new Map();
  for (let n = 0; n < s.length; n++) b.set(s[n], n);
  const x = new Array(s.length).fill(0);
  for (const n of e) {
    const r = b.get(n.left);
    r != null && (x[r] = Math.max(x[r], n.top + n.columnHeight));
  }
  for (; x.length < o; ) x.push(0);
  return x;
}
function wt(e, o) {
  function i(n, r) {
    const y = parseInt(n.dataset.left || "0", 10), u = parseInt(n.dataset.top || "0", 10), c = parseInt(n.dataset.index || "0", 10), v = Math.min(c * 20, 160), g = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${v}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${y}px, ${u}px, 0) scale(1)`;
      const m = () => {
        g ? n.style.setProperty("--masonry-opacity-delay", g) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", m), r();
      };
      n.addEventListener("transitionend", m);
    });
  }
  function s(n) {
    const r = parseInt(n.dataset.left || "0", 10), y = parseInt(n.dataset.top || "0", 10);
    n.style.opacity = "0", n.style.transform = `translate3d(${r}px, ${y + 10}px, 0) scale(0.985)`;
  }
  function b(n) {
    const r = parseInt(n.dataset.left || "0", 10), y = parseInt(n.dataset.top || "0", 10);
    n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${r}px, ${y}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      n.style.transition = "";
    });
  }
  function x(n, r) {
    const y = parseInt(n.dataset.left || "0", 10), u = parseInt(n.dataset.top || "0", 10), c = typeof (o == null ? void 0 : o.leaveDurationMs) == "number" ? o.leaveDurationMs : NaN;
    let v = Number.isFinite(c) && c > 0 ? c : NaN;
    if (!Number.isFinite(v)) {
      const T = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", I = parseFloat(T);
      v = Number.isFinite(I) && I > 0 ? I : 200;
    }
    const g = n.style.transitionDuration, m = () => {
      n.removeEventListener("transitionend", O), clearTimeout(R), n.style.transitionDuration = g || "";
    }, O = (E) => {
      (!E || E.target === n) && (m(), r());
    }, R = setTimeout(() => {
      m(), r();
    }, v + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${v}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${y}px, ${u + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", O);
    });
  }
  return {
    onEnter: i,
    onBeforeEnter: s,
    onBeforeLeave: b,
    onLeave: x
  };
}
function Tt({
  container: e,
  masonry: o,
  columns: i,
  containerHeight: s,
  isLoading: b,
  pageSize: x,
  refreshLayout: n,
  setItemsRaw: r,
  loadNext: y,
  loadThresholdPx: u
}) {
  let c = 0;
  async function v(g) {
    if (!e.value) return;
    const m = g ?? fe(o.value, i.value), O = m.length ? Math.max(...m) : 0, R = e.value.scrollTop + e.value.clientHeight, E = e.value.scrollTop > c + 1;
    c = e.value.scrollTop;
    const T = typeof u == "number" ? u : 200, I = T >= 0 ? Math.max(0, O - T) : Math.max(0, O + T);
    if (R >= I && E && !b.value) {
      await y(), await J();
      return;
    }
  }
  return {
    handleScroll: v
  };
}
const Mt = ["src"], Pt = ["onClick"], It = /* @__PURE__ */ $e({
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
    "remove-all:complete"
  ],
  setup(e, { expose: o, emit: i }) {
    const s = e, b = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, x = re(() => {
      var t;
      return {
        ...b,
        ...s.layout,
        sizes: {
          ...b.sizes,
          ...((t = s.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), n = i, r = re({
      get: () => s.items,
      set: (t) => n("update:items", t)
    }), y = B(7), u = B(null), c = B([]), v = B(null), g = B(!1), m = B(0), O = B(/* @__PURE__ */ new Set());
    function R(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function E(t, a) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const l = t.filter((d) => !R(d == null ? void 0 : d.width) || !R(d == null ? void 0 : d.height));
        if (l.length === 0) return;
        const f = [];
        for (const d of l) {
          const A = (d == null ? void 0 : d.id) ?? `idx:${t.indexOf(d)}`;
          O.value.has(A) || (O.value.add(A), f.push(A));
        }
        if (f.length > 0) {
          const d = f.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: f.length,
              sampleIds: d,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const T = B(0), I = B(0), q = s.virtualBufferPx, S = B(!1), M = B({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), p = (t) => {
      if (!u.value) return;
      const { scrollTop: a, clientHeight: l } = u.value, f = a + l, d = t ?? fe(r.value, y.value), A = d.length ? Math.max(...d) : 0, j = typeof s.loadThresholdPx == "number" ? s.loadThresholdPx : 200, Y = j >= 0 ? Math.max(0, A - j) : Math.max(0, A + j), ye = Math.max(0, Y - f), Ae = ye <= 100;
      M.value = {
        distanceToTrigger: Math.round(ye),
        isNearTrigger: Ae
      };
    }, { onEnter: $, onBeforeEnter: w, onBeforeLeave: L, onLeave: P } = wt(r, { leaveDurationMs: s.leaveDurationMs });
    function z(t, a) {
      if (S.value) {
        const l = parseInt(t.dataset.left || "0", 10), f = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${l}px, ${f}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", a();
        });
      } else
        $(t, a);
    }
    function K(t) {
      if (S.value) {
        const a = parseInt(t.dataset.left || "0", 10), l = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${a}px, ${l}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        w(t);
    }
    function Q(t) {
      S.value || L(t);
    }
    function G(t, a) {
      S.value ? a() : P(t, a);
    }
    const Z = re(() => {
      const t = T.value - q, a = T.value + I.value + q, l = r.value;
      return !l || l.length === 0 ? [] : l.filter((f) => {
        const d = f.top;
        return f.top + f.columnHeight >= t && d <= a;
      });
    }), { handleScroll: U } = Tt({
      container: u,
      masonry: r,
      columns: y,
      containerHeight: m,
      isLoading: g,
      pageSize: s.pageSize,
      refreshLayout: C,
      setItemsRaw: (t) => {
        r.value = t;
      },
      loadNext: F,
      loadThresholdPx: s.loadThresholdPx
    });
    o({
      isLoading: g,
      refreshLayout: C,
      containerHeight: m,
      remove: _,
      removeMany: D,
      removeAll: ke,
      loadNext: F,
      loadPage: W,
      refreshCurrentPage: N,
      reset: Le,
      init: Ne,
      paginationHistory: c,
      cancelLoad: ge,
      scrollToTop: de,
      totalItems: re(() => r.value.length)
    });
    function X(t) {
      const a = mt(t);
      let l = 0;
      if (u.value) {
        const { scrollTop: f, clientHeight: d } = u.value;
        l = f + d + 100;
      }
      m.value = Math.max(a, l);
    }
    function C(t) {
      if (!u.value) return;
      E(t, "refreshLayout");
      const a = t.map((f, d) => ({
        ...f,
        originalIndex: f.originalIndex ?? d
      })), l = Ge(a, u.value, y.value, x.value);
      X(l), r.value = l;
    }
    function ee(t, a) {
      return new Promise((l) => {
        const f = Math.max(0, t | 0), d = Date.now();
        a(f, f);
        const A = setInterval(() => {
          if (k.value) {
            clearInterval(A), l();
            return;
          }
          const j = Date.now() - d, Y = Math.max(0, f - j);
          a(Y, f), Y <= 0 && (clearInterval(A), l());
        }, 100);
      });
    }
    async function h(t) {
      try {
        const a = await H(() => s.getNextPage(t));
        return C([...r.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function H(t) {
      let a = 0;
      const l = s.retryMaxAttempts;
      let f = s.retryInitialDelayMs;
      for (; ; )
        try {
          const d = await t();
          return a > 0 && n("retry:stop", { attempt: a, success: !0 }), d;
        } catch (d) {
          if (a++, a > l)
            throw n("retry:stop", { attempt: a - 1, success: !1 }), d;
          n("retry:start", { attempt: a, max: l, totalMs: f }), await ee(f, (A, j) => {
            n("retry:tick", { attempt: a, remainingMs: A, totalMs: j });
          }), f += s.retryBackoffStepMs;
        }
    }
    async function W(t) {
      if (!g.value) {
        k.value = !1, g.value = !0;
        try {
          const a = r.value.length;
          if (k.value) return;
          const l = await h(t);
          return k.value ? void 0 : (v.value = t, c.value.push(l.nextPage), await te(a), l);
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          g.value = !1;
        }
      }
    }
    async function F() {
      if (!g.value) {
        k.value = !1, g.value = !0;
        try {
          const t = r.value.length;
          if (k.value) return;
          const a = c.value[c.value.length - 1], l = await h(a);
          return k.value ? void 0 : (v.value = a, c.value.push(l.nextPage), await te(t), l);
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          g.value = !1;
        }
      }
    }
    async function N() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", g.value, "currentPage:", v.value), !g.value) {
        k.value = !1, g.value = !0;
        try {
          const t = v.value;
          if (console.log("[Masonry] pageToRefresh:", t), t == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", v.value, "paginationHistory:", c.value);
            return;
          }
          r.value = [], m.value = 0, c.value = [t], await J();
          const a = await h(t);
          if (k.value) return;
          v.value = t, c.value.push(a.nextPage);
          const l = r.value.length;
          return await te(l), a;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          g.value = !1;
        }
      }
    }
    async function _(t) {
      const a = r.value.filter((l) => l.id !== t.id);
      if (r.value = a, await J(), console.log("[Masonry] remove - next.length:", a.length, "paginationHistory.length:", c.value.length), a.length === 0 && c.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await N();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await F(), await te(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((l) => requestAnimationFrame(() => l())), requestAnimationFrame(() => {
        C(a);
      });
    }
    async function D(t) {
      if (!t || t.length === 0) return;
      const a = new Set(t.map((f) => f.id)), l = r.value.filter((f) => !a.has(f.id));
      if (r.value = l, await J(), l.length === 0 && c.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          await N();
        else
          try {
            await F(), await te(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        C(l);
      });
    }
    function de(t) {
      u.value && u.value.scrollTo({
        top: 0,
        behavior: (t == null ? void 0 : t.behavior) ?? "smooth",
        ...t
      });
    }
    async function ke() {
      de({ behavior: "smooth" }), r.value = [], m.value = 0, await J(), n("remove-all:complete");
    }
    function Ee() {
      y.value = Pe(x.value), C(r.value), u.value && (T.value = u.value.scrollTop, I.value = u.value.clientHeight);
    }
    let ae = !1;
    const k = B(!1);
    async function te(t, a = !1) {
      if (!a && !s.backfillEnabled || ae || k.value) return;
      const l = (t || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || c.value[c.value.length - 1] == null) && !(r.value.length >= l)) {
        ae = !0;
        try {
          let d = 0;
          for (n("backfill:start", { target: l, fetched: r.value.length, calls: d }); r.value.length < l && d < s.backfillMaxCalls && c.value[c.value.length - 1] != null && !k.value && (await ee(s.backfillDelayMs, (j, Y) => {
            n("backfill:tick", {
              fetched: r.value.length,
              target: l,
              calls: d,
              remainingMs: j,
              totalMs: Y
            });
          }), !k.value); ) {
            const A = c.value[c.value.length - 1];
            try {
              g.value = !0;
              const j = await h(A);
              if (k.value) break;
              c.value.push(j.nextPage);
            } finally {
              g.value = !1;
            }
            d++;
          }
          n("backfill:stop", { fetched: r.value.length, calls: d });
        } finally {
          ae = !1;
        }
      }
    }
    function ge() {
      k.value = !0, g.value = !1, ae = !1;
    }
    function Le() {
      ge(), k.value = !1, u.value && u.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), r.value = [], m.value = 0, v.value = s.loadAtPage, c.value = [s.loadAtPage], M.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const he = Me(async () => {
      u.value && (T.value = u.value.scrollTop, I.value = u.value.clientHeight), S.value = !0, await J(), await new Promise((a) => requestAnimationFrame(() => a())), S.value = !1;
      const t = fe(r.value, y.value);
      U(t), p(t);
    }, 200), pe = Me(Ee, 200);
    function Ne(t, a, l) {
      v.value = a, c.value = [a], c.value.push(l), E(t, "init"), C([...r.value, ...t]), p();
    }
    return We(async () => {
      var t;
      try {
        y.value = Pe(x.value), u.value && (T.value = u.value.scrollTop, I.value = u.value.clientHeight);
        const a = s.loadAtPage;
        c.value = [a], s.skipInitialLoad || await W(c.value[0]), p();
      } catch (a) {
        console.error("Error during component initialization:", a), g.value = !1;
      }
      (t = u.value) == null || t.addEventListener("scroll", he, { passive: !0 }), window.addEventListener("resize", pe);
    }), Oe(() => {
      var t;
      (t = u.value) == null || t.removeEventListener("scroll", he), window.removeEventListener("resize", pe);
    }), (t, a) => (le(), oe("div", {
      class: ve(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: u
    }, [
      V("div", {
        class: "relative",
        style: Be({ height: `${m.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        ze(De, {
          name: "masonry",
          css: !1,
          onEnter: z,
          onBeforeEnter: K,
          onLeave: G,
          onBeforeLeave: Q
        }, {
          default: je(() => [
            (le(!0), oe(Re, null, Ce(Z.value, (l, f) => (le(), oe("div", me({
              key: `${l.page}-${l.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, _e(xt)(l, f)), [
              qe(t.$slots, "item", me({ ref_for: !0 }, { item: l, remove: _ }), () => [
                V("img", {
                  src: l.src,
                  class: "w-full",
                  loading: "lazy",
                  decoding: "async"
                }, null, 8, Mt),
                V("button", {
                  class: "absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded cursor-pointer",
                  onClick: (d) => _(l)
                }, a[0] || (a[0] = [
                  V("i", { class: "fas fa-trash" }, null, -1)
                ]), 8, Pt)
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }),
        m.value > 0 ? (le(), oe("div", {
          key: 0,
          class: ve(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !M.value.isNearTrigger, "opacity-100": M.value.isNearTrigger }])
        }, [
          V("span", null, be(r.value.length) + " items", 1),
          a[1] || (a[1] = V("span", { class: "mx-2" }, "|", -1)),
          V("span", null, be(M.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : Fe("", !0)
      ], 4)
    ], 2));
  }
}), St = (e, o) => {
  const i = e.__vccOpts || e;
  for (const [s, b] of o)
    i[s] = b;
  return i;
}, Ie = /* @__PURE__ */ St(It, [["__scopeId", "data-v-fa62094f"]]), kt = {
  install(e) {
    e.component("WyxosMasonry", Ie), e.component("WMasonry", Ie);
  }
};
export {
  Ie as Masonry,
  kt as default
};
