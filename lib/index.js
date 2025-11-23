import { nextTick as Q, defineComponent as Se, ref as k, computed as Z, onMounted as Le, watch as Ne, createElementBlock as V, openBlock as G, renderSlot as He, createElementVNode as A, createCommentVNode as le, normalizeClass as ve, toDisplayString as ie, withModifiers as je, onUnmounted as ze, normalizeStyle as Re, createVNode as Te, TransitionGroup as Ce, withCtx as qe, Fragment as _e, renderList as Ve, mergeProps as Ge, unref as Ue } from "vue";
let ce = null;
function Xe() {
  if (ce != null) return ce;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const l = document.createElement("div");
  l.style.width = "100%", e.appendChild(l);
  const s = e.offsetWidth - l.offsetWidth;
  return document.body.removeChild(e), ce = s, s;
}
function Ye(e, l, s, i = {}) {
  const {
    gutterX: h = 0,
    gutterY: m = 0,
    header: a = 0,
    footer: n = 0,
    paddingLeft: v = 0,
    paddingRight: f = 0,
    sizes: d = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: b = "masonry"
  } = i;
  let r = 0, c = 0;
  try {
    if (l && l.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const T = window.getComputedStyle(l);
      r = parseFloat(T.paddingLeft) || 0, c = parseFloat(T.paddingRight) || 0;
    }
  } catch {
  }
  const w = (v || 0) + r, I = (f || 0) + c, E = l.offsetWidth - l.clientWidth, M = E > 0 ? E + 2 : Xe() + 2, P = l.offsetWidth - M - w - I, j = h * (s - 1), N = Math.floor((P - j) / s), S = e.map((T) => {
    const F = T.width, L = T.height;
    return Math.round(N * L / F) + n + a;
  });
  if (b === "sequential-balanced") {
    const T = S.length;
    if (T === 0) return [];
    const F = (y, H, O) => y + (H > 0 ? m : 0) + O;
    let L = Math.max(...S), z = S.reduce((y, H) => y + H, 0) + m * Math.max(0, T - 1);
    const ee = (y) => {
      let H = 1, O = 0, C = 0;
      for (let W = 0; W < T; W++) {
        const U = S[W], q = F(O, C, U);
        if (q <= y)
          O = q, C++;
        else if (H++, O = U, C = 1, U > y || H > s) return !1;
      }
      return H <= s;
    };
    for (; L < z; ) {
      const y = Math.floor((L + z) / 2);
      ee(y) ? z = y : L = y + 1;
    }
    const te = z, X = new Array(s).fill(0);
    let ae = s - 1, Y = 0, J = 0;
    for (let y = T - 1; y >= 0; y--) {
      const H = S[y], O = y < ae;
      !(F(Y, J, H) <= te) || O ? (X[ae] = y + 1, ae--, Y = H, J = 1) : (Y = F(Y, J, H), J++);
    }
    X[0] = 0;
    const R = [], ne = new Array(s).fill(0);
    for (let y = 0; y < s; y++) {
      const H = X[y], O = y + 1 < s ? X[y + 1] : T, C = y * (N + h);
      for (let W = H; W < O; W++) {
        const q = {
          ...e[W],
          columnWidth: N,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        q.imageHeight = S[W] - (n + a), q.columnHeight = S[W], q.left = C, q.top = ne[y], ne[y] += q.columnHeight + (W + 1 < O ? m : 0), R.push(q);
      }
    }
    return R;
  }
  const x = new Array(s).fill(0), D = [];
  for (let T = 0; T < e.length; T++) {
    const F = e[T], L = {
      ...F,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, z = x.indexOf(Math.min(...x)), ee = F.width, te = F.height;
    L.columnWidth = N, L.left = z * (N + h), L.imageHeight = Math.round(N * te / ee), L.columnHeight = L.imageHeight + n + a, L.top = x[z], x[z] += L.columnHeight + m, D.push(L);
  }
  return D;
}
var Je = typeof global == "object" && global && global.Object === Object && global, Ke = typeof self == "object" && self && self.Object === Object && self, $e = Je || Ke || Function("return this")(), ue = $e.Symbol, Ae = Object.prototype, Qe = Ae.hasOwnProperty, Ze = Ae.toString, oe = ue ? ue.toStringTag : void 0;
function et(e) {
  var l = Qe.call(e, oe), s = e[oe];
  try {
    e[oe] = void 0;
    var i = !0;
  } catch {
  }
  var h = Ze.call(e);
  return i && (l ? e[oe] = s : delete e[oe]), h;
}
var tt = Object.prototype, at = tt.toString;
function nt(e) {
  return at.call(e);
}
var rt = "[object Null]", ot = "[object Undefined]", Me = ue ? ue.toStringTag : void 0;
function lt(e) {
  return e == null ? e === void 0 ? ot : rt : Me && Me in Object(e) ? et(e) : nt(e);
}
function st(e) {
  return e != null && typeof e == "object";
}
var it = "[object Symbol]";
function ut(e) {
  return typeof e == "symbol" || st(e) && lt(e) == it;
}
var ct = /\s/;
function ft(e) {
  for (var l = e.length; l-- && ct.test(e.charAt(l)); )
    ;
  return l;
}
var dt = /^\s+/;
function vt(e) {
  return e && e.slice(0, ft(e) + 1).replace(dt, "");
}
function me(e) {
  var l = typeof e;
  return e != null && (l == "object" || l == "function");
}
var Ie = NaN, mt = /^[-+]0x[0-9a-f]+$/i, gt = /^0b[01]+$/i, pt = /^0o[0-7]+$/i, yt = parseInt;
function Pe(e) {
  if (typeof e == "number")
    return e;
  if (ut(e))
    return Ie;
  if (me(e)) {
    var l = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = me(l) ? l + "" : l;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = vt(e);
  var s = gt.test(e);
  return s || pt.test(e) ? yt(e.slice(2), s ? 2 : 8) : mt.test(e) ? Ie : +e;
}
var fe = function() {
  return $e.Date.now();
}, ht = "Expected a function", bt = Math.max, xt = Math.min;
function Ee(e, l, s) {
  var i, h, m, a, n, v, f = 0, d = !1, b = !1, r = !0;
  if (typeof e != "function")
    throw new TypeError(ht);
  l = Pe(l) || 0, me(s) && (d = !!s.leading, b = "maxWait" in s, m = b ? bt(Pe(s.maxWait) || 0, l) : m, r = "trailing" in s ? !!s.trailing : r);
  function c(x) {
    var D = i, T = h;
    return i = h = void 0, f = x, a = e.apply(T, D), a;
  }
  function w(x) {
    return f = x, n = setTimeout(M, l), d ? c(x) : a;
  }
  function I(x) {
    var D = x - v, T = x - f, F = l - D;
    return b ? xt(F, m - T) : F;
  }
  function E(x) {
    var D = x - v, T = x - f;
    return v === void 0 || D >= l || D < 0 || b && T >= m;
  }
  function M() {
    var x = fe();
    if (E(x))
      return P(x);
    n = setTimeout(M, I(x));
  }
  function P(x) {
    return n = void 0, r && i ? c(x) : (i = h = void 0, a);
  }
  function j() {
    n !== void 0 && clearTimeout(n), f = 0, i = v = h = n = void 0;
  }
  function N() {
    return n === void 0 ? a : P(fe());
  }
  function S() {
    var x = fe(), D = E(x);
    if (i = arguments, h = this, v = x, D) {
      if (n === void 0)
        return w(v);
      if (b)
        return clearTimeout(n), n = setTimeout(M, l), c(v);
    }
    return n === void 0 && (n = setTimeout(M, l)), a;
  }
  return S.cancel = j, S.flush = N, S;
}
function de(e) {
  const l = window.innerWidth, s = e.sizes;
  return l >= 1536 && s["2xl"] ? s["2xl"] : l >= 1280 && s.xl ? s.xl : l >= 1024 && s.lg ? s.lg : l >= 768 && s.md ? s.md : l >= 640 && s.sm ? s.sm : s.base;
}
function wt(e) {
  return e.reduce((s, i) => Math.max(s, i.top + i.columnHeight), 0) + 500;
}
function Tt(e) {
  return {
    transform: `translate3d(${e.left}px, ${e.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${e.columnWidth}px`,
    height: `${e.columnHeight}px`
  };
}
function Mt(e, l = 0) {
  return {
    style: Tt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": l
  };
}
function ge(e, l) {
  if (!e.length || l <= 0)
    return new Array(Math.max(1, l)).fill(0);
  const i = Array.from(new Set(e.map((a) => a.left))).sort((a, n) => a - n).slice(0, l), h = /* @__PURE__ */ new Map();
  for (let a = 0; a < i.length; a++) h.set(i[a], a);
  const m = new Array(i.length).fill(0);
  for (const a of e) {
    const n = h.get(a.left);
    n != null && (m[n] = Math.max(m[n], a.top + a.columnHeight));
  }
  for (; m.length < l; ) m.push(0);
  return m;
}
function It(e, l) {
  function s(a, n) {
    const v = parseInt(a.dataset.left || "0", 10), f = parseInt(a.dataset.top || "0", 10), d = parseInt(a.dataset.index || "0", 10), b = Math.min(d * 20, 160), r = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${b}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${v}px, ${f}px, 0) scale(1)`;
      const c = () => {
        r ? a.style.setProperty("--masonry-opacity-delay", r) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", c), n();
      };
      a.addEventListener("transitionend", c);
    });
  }
  function i(a) {
    const n = parseInt(a.dataset.left || "0", 10), v = parseInt(a.dataset.top || "0", 10);
    a.style.opacity = "0", a.style.transform = `translate3d(${n}px, ${v + 10}px, 0) scale(0.985)`;
  }
  function h(a) {
    const n = parseInt(a.dataset.left || "0", 10), v = parseInt(a.dataset.top || "0", 10);
    a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${n}px, ${v}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      a.style.transition = "";
    });
  }
  function m(a, n) {
    const v = parseInt(a.dataset.left || "0", 10), f = parseInt(a.dataset.top || "0", 10), d = typeof (l == null ? void 0 : l.leaveDurationMs) == "number" ? l.leaveDurationMs : NaN;
    let b = Number.isFinite(d) && d > 0 ? d : NaN;
    if (!Number.isFinite(b)) {
      const M = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", P = parseFloat(M);
      b = Number.isFinite(P) && P > 0 ? P : 200;
    }
    const r = a.style.transitionDuration, c = () => {
      a.removeEventListener("transitionend", w), clearTimeout(I), a.style.transitionDuration = r || "";
    }, w = (E) => {
      (!E || E.target === a) && (c(), n());
    }, I = setTimeout(() => {
      c(), n();
    }, b + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${b}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${v}px, ${f + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", w);
    });
  }
  return {
    onEnter: s,
    onBeforeEnter: i,
    onBeforeLeave: h,
    onLeave: m
  };
}
function Pt({
  container: e,
  masonry: l,
  columns: s,
  containerHeight: i,
  isLoading: h,
  pageSize: m,
  refreshLayout: a,
  setItemsRaw: n,
  loadNext: v,
  loadThresholdPx: f
}) {
  let d = 0;
  async function b(r) {
    if (!e.value) return;
    const c = r ?? ge(l.value, s.value), w = c.length ? Math.max(...c) : 0, I = e.value.scrollTop + e.value.clientHeight, E = e.value.scrollTop > d + 1;
    d = e.value.scrollTop;
    const M = typeof f == "number" ? f : 200, P = M >= 0 ? Math.max(0, w - M) : Math.max(0, w + M);
    if (I >= P && E && !h.value) {
      await v(), await Q();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
const Et = { class: "relative w-full h-full group" }, kt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, St = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, Lt = {
  key: 1,
  class: "absolute inset-0 flex items-center justify-center bg-slate-100"
}, Nt = {
  key: 2,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ht = ["src"], $t = ["src"], At = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none" }, Ft = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, pe = /* @__PURE__ */ Se({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 }
  },
  setup(e) {
    const l = e, s = k(!1), i = k(!1), h = k(null), m = k(!1), a = k(!1), n = k(null), v = Z(() => {
      var r;
      return l.type ?? ((r = l.item) == null ? void 0 : r.type) ?? "image";
    }), f = Z(() => {
      var r;
      return l.notFound ?? ((r = l.item) == null ? void 0 : r.notFound) ?? !1;
    });
    function d(r) {
      return new Promise((c, w) => {
        if (!r) {
          w(new Error("No image source provided"));
          return;
        }
        const I = new Image(), E = Date.now(), M = 300;
        I.onload = () => {
          const P = Date.now() - E, j = Math.max(0, M - P);
          setTimeout(() => {
            s.value = !0, i.value = !1, c();
          }, j);
        }, I.onerror = () => {
          i.value = !0, s.value = !1, w(new Error("Failed to load image"));
        }, I.src = r;
      });
    }
    function b(r) {
      return new Promise((c, w) => {
        if (!r) {
          w(new Error("No video source provided"));
          return;
        }
        const I = document.createElement("video"), E = Date.now(), M = 300;
        I.preload = "metadata", I.muted = !0, I.onloadedmetadata = () => {
          const P = Date.now() - E, j = Math.max(0, M - P);
          setTimeout(() => {
            m.value = !0, a.value = !1, c();
          }, j);
        }, I.onerror = () => {
          a.value = !0, m.value = !1, w(new Error("Failed to load video"));
        }, I.src = r;
      });
    }
    return Le(async () => {
      var c, w;
      if (console.log("[MasonryItem] Component mounted", (c = l.item) == null ? void 0 : c.id), f.value)
        return;
      const r = (w = l.item) == null ? void 0 : w.src;
      if (r)
        if (v.value === "video") {
          n.value = r, m.value = !1, a.value = !1;
          try {
            await b(r);
          } catch {
          }
        } else {
          h.value = r, s.value = !1, i.value = !1;
          try {
            await d(r);
          } catch {
          }
        }
    }), Ne(
      () => {
        var r;
        return (r = l.item) == null ? void 0 : r.src;
      },
      async (r) => {
        if (!(!r || f.value)) {
          if (v.value === "video") {
            if (r !== n.value) {
              m.value = !1, a.value = !1, n.value = r;
              try {
                await b(r);
              } catch {
              }
            }
          } else if (r !== h.value) {
            s.value = !1, i.value = !1, h.value = r;
            try {
              await d(r);
            } catch {
            }
          }
        }
      }
    ), (r, c) => (G(), V("div", Et, [
      He(r.$slots, "default", {
        item: r.item,
        remove: r.remove,
        imageLoaded: s.value,
        imageError: i.value,
        videoLoaded: m.value,
        videoError: a.value,
        showNotFound: f.value
      }, () => [
        A("div", kt, [
          f.value ? (G(), V("div", St, c[4] || (c[4] = [
            A("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
            A("span", { class: "font-medium" }, "Not Found", -1),
            A("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
          ]))) : v.value === "image" && !s.value && !i.value || v.value === "video" && !m.value && !a.value ? (G(), V("div", Lt, c[5] || (c[5] = [
            A("div", { class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }, null, -1)
          ]))) : v.value === "image" && i.value || v.value === "video" && a.value ? (G(), V("div", Nt, [
            A("i", {
              class: ve(v.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
            }, null, 2),
            A("span", null, "Failed to load " + ie(v.value), 1)
          ])) : le("", !0),
          v.value === "image" && s.value && h.value && !f.value ? (G(), V("img", {
            key: 3,
            src: h.value,
            class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            loading: "lazy",
            decoding: "async"
          }, null, 8, Ht)) : le("", !0),
          v.value === "video" && m.value && n.value && !f.value ? (G(), V("video", {
            key: 4,
            src: n.value,
            class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
            muted: "",
            loop: "",
            playsinline: "",
            onMouseenter: c[0] || (c[0] = (w) => w.target.play()),
            onMouseleave: c[1] || (c[1] = (w) => w.target.pause()),
            onError: c[2] || (c[2] = (w) => a.value = !0)
          }, null, 40, $t)) : le("", !0),
          c[7] || (c[7] = A("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }, null, -1)),
          r.remove ? (G(), V("button", {
            key: 5,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer",
            onClick: c[3] || (c[3] = je((w) => r.remove(r.item), ["stop"])),
            "aria-label": "Remove item"
          }, c[6] || (c[6] = [
            A("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : le("", !0),
          A("div", At, [
            A("p", Ft, "Item #" + ie(String(r.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ]));
  }
}), Wt = /* @__PURE__ */ Se({
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
  setup(e, { expose: l, emit: s }) {
    const i = e, h = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, m = Z(() => {
      var t;
      return {
        ...h,
        ...i.layout,
        sizes: {
          ...h.sizes,
          ...((t = i.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), a = s, n = Z({
      get: () => i.items,
      set: (t) => a("update:items", t)
    }), v = k(7), f = k(null), d = k([]), b = k(null), r = k(!1), c = k(0), w = k(/* @__PURE__ */ new Set());
    function I(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function E(t, o) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const u = t.filter((p) => !I(p == null ? void 0 : p.width) || !I(p == null ? void 0 : p.height));
        if (u.length === 0) return;
        const g = [];
        for (const p of u) {
          const B = (p == null ? void 0 : p.id) ?? `idx:${t.indexOf(p)}`;
          w.value.has(B) || (w.value.add(B), g.push(B));
        }
        if (g.length > 0) {
          const p = g.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: o,
              count: g.length,
              sampleIds: p,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const M = k(0), P = k(0), j = i.virtualBufferPx, N = k(!1), S = k({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), x = (t) => {
      if (!f.value) return;
      const { scrollTop: o, clientHeight: u } = f.value, g = o + u, p = t ?? ge(n.value, v.value), B = p.length ? Math.max(...p) : 0, _ = typeof i.loadThresholdPx == "number" ? i.loadThresholdPx : 200, K = _ >= 0 ? Math.max(0, B - _) : Math.max(0, B + _), we = Math.max(0, K - g), Oe = we <= 100;
      S.value = {
        distanceToTrigger: Math.round(we),
        isNearTrigger: Oe
      };
    }, { onEnter: D, onBeforeEnter: T, onBeforeLeave: F, onLeave: L } = It(n, { leaveDurationMs: i.leaveDurationMs });
    function z(t, o) {
      if (N.value) {
        const u = parseInt(t.dataset.left || "0", 10), g = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${u}px, ${g}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", o();
        });
      } else
        D(t, o);
    }
    function ee(t) {
      if (N.value) {
        const o = parseInt(t.dataset.left || "0", 10), u = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${o}px, ${u}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        T(t);
    }
    function te(t) {
      N.value || F(t);
    }
    function X(t, o) {
      N.value ? o() : L(t, o);
    }
    const ae = Z(() => {
      const t = M.value - j, o = M.value + P.value + j, u = n.value;
      return !u || u.length === 0 ? [] : u.filter((g) => {
        const p = g.top;
        return g.top + g.columnHeight >= t && p <= o;
      });
    }), { handleScroll: Y } = Pt({
      container: f,
      masonry: n,
      columns: v,
      containerHeight: c,
      isLoading: r,
      pageSize: i.pageSize,
      refreshLayout: R,
      setItemsRaw: (t) => {
        n.value = t;
      },
      loadNext: C,
      loadThresholdPx: i.loadThresholdPx
    });
    l({
      isLoading: r,
      refreshLayout: R,
      containerHeight: c,
      remove: U,
      removeMany: q,
      removeAll: Fe,
      loadNext: C,
      loadPage: O,
      refreshCurrentPage: W,
      reset: Be,
      init: De,
      paginationHistory: d,
      cancelLoad: he,
      scrollToTop: ye,
      totalItems: Z(() => n.value.length)
    });
    function J(t) {
      const o = wt(t);
      let u = 0;
      if (f.value) {
        const { scrollTop: g, clientHeight: p } = f.value;
        u = g + p + 100;
      }
      c.value = Math.max(o, u);
    }
    function R(t) {
      if (!f.value) return;
      E(t, "refreshLayout");
      const o = t.map((g, p) => ({
        ...g,
        originalIndex: g.originalIndex ?? p
      })), u = Ye(o, f.value, v.value, m.value);
      J(u), n.value = u;
    }
    function ne(t, o) {
      return new Promise((u) => {
        const g = Math.max(0, t | 0), p = Date.now();
        o(g, g);
        const B = setInterval(() => {
          if ($.value) {
            clearInterval(B), u();
            return;
          }
          const _ = Date.now() - p, K = Math.max(0, g - _);
          o(K, g), K <= 0 && (clearInterval(B), u());
        }, 100);
      });
    }
    async function y(t) {
      try {
        const o = await H(() => i.getNextPage(t));
        return R([...n.value, ...o.items]), o;
      } catch (o) {
        throw console.error("Error in getContent:", o), o;
      }
    }
    async function H(t) {
      let o = 0;
      const u = i.retryMaxAttempts;
      let g = i.retryInitialDelayMs;
      for (; ; )
        try {
          const p = await t();
          return o > 0 && a("retry:stop", { attempt: o, success: !0 }), p;
        } catch (p) {
          if (o++, o > u)
            throw a("retry:stop", { attempt: o - 1, success: !1 }), p;
          a("retry:start", { attempt: o, max: u, totalMs: g }), await ne(g, (B, _) => {
            a("retry:tick", { attempt: o, remainingMs: B, totalMs: _ });
          }), g += i.retryBackoffStepMs;
        }
    }
    async function O(t) {
      if (!r.value) {
        $.value = !1, r.value = !0;
        try {
          const o = n.value.length;
          if ($.value) return;
          const u = await y(t);
          return $.value ? void 0 : (b.value = t, d.value.push(u.nextPage), await re(o), u);
        } catch (o) {
          throw console.error("Error loading page:", o), o;
        } finally {
          r.value = !1;
        }
      }
    }
    async function C() {
      if (!r.value) {
        $.value = !1, r.value = !0;
        try {
          const t = n.value.length;
          if ($.value) return;
          const o = d.value[d.value.length - 1], u = await y(o);
          return $.value ? void 0 : (b.value = o, d.value.push(u.nextPage), await re(t), u);
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          r.value = !1;
        }
      }
    }
    async function W() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", r.value, "currentPage:", b.value), !r.value) {
        $.value = !1, r.value = !0;
        try {
          const t = b.value;
          if (console.log("[Masonry] pageToRefresh:", t), t == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", b.value, "paginationHistory:", d.value);
            return;
          }
          n.value = [], c.value = 0, d.value = [t], await Q();
          const o = await y(t);
          if ($.value) return;
          b.value = t, d.value.push(o.nextPage);
          const u = n.value.length;
          return await re(u), o;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          r.value = !1;
        }
      }
    }
    async function U(t) {
      const o = n.value.filter((u) => u.id !== t.id);
      if (n.value = o, await Q(), console.log("[Masonry] remove - next.length:", o.length, "paginationHistory.length:", d.value.length), o.length === 0 && d.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await W();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await C(), await re(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((u) => requestAnimationFrame(() => u())), requestAnimationFrame(() => {
        R(o);
      });
    }
    async function q(t) {
      if (!t || t.length === 0) return;
      const o = new Set(t.map((g) => g.id)), u = n.value.filter((g) => !o.has(g.id));
      if (n.value = u, await Q(), u.length === 0 && d.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          await W();
        else
          try {
            await C(), await re(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((g) => requestAnimationFrame(() => g())), requestAnimationFrame(() => {
        R(u);
      });
    }
    function ye(t) {
      f.value && f.value.scrollTo({
        top: 0,
        behavior: (t == null ? void 0 : t.behavior) ?? "smooth",
        ...t
      });
    }
    async function Fe() {
      ye({ behavior: "smooth" }), n.value = [], c.value = 0, await Q(), a("remove-all:complete");
    }
    function We() {
      v.value = de(m.value), R(n.value), f.value && (M.value = f.value.scrollTop, P.value = f.value.clientHeight);
    }
    let se = !1;
    const $ = k(!1);
    async function re(t, o = !1) {
      if (!o && !i.backfillEnabled || se || $.value) return;
      const u = (t || 0) + (i.pageSize || 0);
      if (!(!i.pageSize || i.pageSize <= 0 || d.value[d.value.length - 1] == null) && !(n.value.length >= u)) {
        se = !0;
        try {
          let p = 0;
          for (a("backfill:start", { target: u, fetched: n.value.length, calls: p }); n.value.length < u && p < i.backfillMaxCalls && d.value[d.value.length - 1] != null && !$.value && (await ne(i.backfillDelayMs, (_, K) => {
            a("backfill:tick", {
              fetched: n.value.length,
              target: u,
              calls: p,
              remainingMs: _,
              totalMs: K
            });
          }), !$.value); ) {
            const B = d.value[d.value.length - 1];
            try {
              r.value = !0;
              const _ = await y(B);
              if ($.value) break;
              d.value.push(_.nextPage);
            } finally {
              r.value = !1;
            }
            p++;
          }
          a("backfill:stop", { fetched: n.value.length, calls: p });
        } finally {
          se = !1;
        }
      }
    }
    function he() {
      $.value = !0, r.value = !1, se = !1;
    }
    function Be() {
      he(), $.value = !1, f.value && f.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), n.value = [], c.value = 0, b.value = i.loadAtPage, d.value = [i.loadAtPage], S.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const be = Ee(async () => {
      f.value && (M.value = f.value.scrollTop, P.value = f.value.clientHeight), N.value = !0, await Q(), await new Promise((o) => requestAnimationFrame(() => o())), N.value = !1;
      const t = ge(n.value, v.value);
      Y(t), x(t);
    }, 200), xe = Ee(We, 200);
    function De(t, o, u) {
      b.value = o, d.value = [o], d.value.push(u), E(t, "init"), R([...n.value, ...t]), x();
    }
    return Ne(
      m,
      () => {
        f.value && (v.value = de(m.value), R(n.value));
      },
      { deep: !0 }
    ), Le(async () => {
      var t;
      try {
        v.value = de(m.value), f.value && (M.value = f.value.scrollTop, P.value = f.value.clientHeight);
        const o = i.loadAtPage;
        d.value = [o], i.skipInitialLoad || await O(d.value[0]), x();
      } catch (o) {
        console.error("Error during component initialization:", o), r.value = !1;
      }
      (t = f.value) == null || t.addEventListener("scroll", be, { passive: !0 }), window.addEventListener("resize", xe);
    }), ze(() => {
      var t;
      (t = f.value) == null || t.removeEventListener("scroll", be), window.removeEventListener("resize", xe);
    }), (t, o) => (G(), V("div", {
      class: ve(["overflow-auto w-full flex-1 masonry-container", { "force-motion": i.forceMotion }]),
      ref_key: "container",
      ref: f
    }, [
      A("div", {
        class: "relative",
        style: Re({ height: `${c.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        Te(Ce, {
          name: "masonry",
          css: !1,
          onEnter: z,
          onBeforeEnter: ee,
          onLeave: X,
          onBeforeLeave: te
        }, {
          default: qe(() => [
            (G(!0), V(_e, null, Ve(ae.value, (u, g) => (G(), V("div", Ge({
              key: `${u.page}-${u.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, Ue(Mt)(u, g), {
              style: { paddingTop: `${m.value.header}px`, paddingBottom: `${m.value.footer}px` }
            }), [
              He(t.$slots, "default", {
                item: u,
                remove: U
              }, () => [
                Te(pe, {
                  item: u,
                  remove: U
                }, null, 8, ["item"])
              ], !0)
            ], 16))), 128))
          ]),
          _: 3
        }),
        c.value > 0 ? (G(), V("div", {
          key: 0,
          class: ve(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !S.value.isNearTrigger, "opacity-100": S.value.isNearTrigger }])
        }, [
          A("span", null, ie(n.value.length) + " items", 1),
          o[0] || (o[0] = A("span", { class: "mx-2" }, "|", -1)),
          A("span", null, ie(S.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : le("", !0)
      ], 4)
    ], 2));
  }
}), Bt = (e, l) => {
  const s = e.__vccOpts || e;
  for (const [i, h] of l)
    s[i] = h;
  return s;
}, ke = /* @__PURE__ */ Bt(Wt, [["__scopeId", "data-v-110c3294"]]), Ot = {
  install(e) {
    e.component("WyxosMasonry", ke), e.component("WMasonry", ke), e.component("WyxosMasonryItem", pe), e.component("WMasonryItem", pe);
  }
};
export {
  ke as Masonry,
  pe as MasonryItem,
  Ot as default
};
