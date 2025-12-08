import { nextTick as J, defineComponent as tt, ref as T, computed as Z, onMounted as at, onUnmounted as nt, watch as re, createElementBlock as D, openBlock as F, createCommentVNode as ne, createElementVNode as O, normalizeStyle as we, renderSlot as Q, normalizeClass as ue, withModifiers as _e, toDisplayString as He, Fragment as Ue, renderList as Ge, createVNode as $e, withCtx as ge, mergeProps as pe, TransitionGroup as Tt, unref as Lt } from "vue";
let Se = null;
function kt() {
  if (Se != null) return Se;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const v = document.createElement("div");
  v.style.width = "100%", t.appendChild(v);
  const c = t.offsetWidth - v.offsetWidth;
  return document.body.removeChild(t), Se = c, c;
}
function Xe(t, v, c, r = {}) {
  const {
    gutterX: L = 0,
    gutterY: p = 0,
    header: l = 0,
    footer: s = 0,
    paddingLeft: b = 0,
    paddingRight: E = 0,
    sizes: S = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: I = "masonry"
  } = r;
  let d = 0, W = 0;
  try {
    if (v && v.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const w = window.getComputedStyle(v);
      d = parseFloat(w.paddingLeft) || 0, W = parseFloat(w.paddingRight) || 0;
    }
  } catch {
  }
  const R = (b || 0) + d, q = (E || 0) + W, g = v.offsetWidth - v.clientWidth, o = g > 0 ? g + 2 : kt() + 2, $ = v.offsetWidth - o - R - q, y = L * (c - 1), x = Math.floor(($ - y) / c), H = t.map((w) => {
    const M = w.width, j = w.height;
    return Math.round(x * j / M) + s + l;
  });
  if (I === "sequential-balanced") {
    const w = H.length;
    if (w === 0) return [];
    const M = (k, z, K) => k + (z > 0 ? p : 0) + K;
    let j = Math.max(...H), n = H.reduce((k, z) => k + z, 0) + p * Math.max(0, w - 1);
    const f = (k) => {
      let z = 1, K = 0, G = 0;
      for (let X = 0; X < w; X++) {
        const ee = H[X], te = M(K, G, ee);
        if (te <= k)
          K = te, G++;
        else if (z++, K = ee, G = 1, ee > k || z > c) return !1;
      }
      return z <= c;
    };
    for (; j < n; ) {
      const k = Math.floor((j + n) / 2);
      f(k) ? n = k : j = k + 1;
    }
    const P = n, A = new Array(c).fill(0);
    let U = c - 1, C = 0, N = 0;
    for (let k = w - 1; k >= 0; k--) {
      const z = H[k], K = k < U;
      !(M(C, N, z) <= P) || K ? (A[U] = k + 1, U--, C = z, N = 1) : (C = M(C, N, z), N++);
    }
    A[0] = 0;
    const oe = [], ie = new Array(c).fill(0);
    for (let k = 0; k < c; k++) {
      const z = A[k], K = k + 1 < c ? A[k + 1] : w, G = k * (x + L);
      for (let X = z; X < K; X++) {
        const te = {
          ...t[X],
          columnWidth: x,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        te.imageHeight = H[X] - (s + l), te.columnHeight = H[X], te.left = G, te.top = ie[k], ie[k] += te.columnHeight + (X + 1 < K ? p : 0), oe.push(te);
      }
    }
    return oe;
  }
  const h = new Array(c).fill(0), B = [];
  for (let w = 0; w < t.length; w++) {
    const M = t[w], j = {
      ...M,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = h.indexOf(Math.min(...h)), f = M.width, P = M.height;
    j.columnWidth = x, j.left = n * (x + L), j.imageHeight = Math.round(x * P / f), j.columnHeight = j.imageHeight + s + l, j.top = h[n], h[n] += j.columnHeight + p, B.push(j);
  }
  return B;
}
var It = typeof global == "object" && global && global.Object === Object && global, $t = typeof self == "object" && self && self.Object === Object && self, lt = It || $t || Function("return this")(), xe = lt.Symbol, rt = Object.prototype, St = rt.hasOwnProperty, Pt = rt.toString, ye = xe ? xe.toStringTag : void 0;
function Ht(t) {
  var v = St.call(t, ye), c = t[ye];
  try {
    t[ye] = void 0;
    var r = !0;
  } catch {
  }
  var L = Pt.call(t);
  return r && (v ? t[ye] = c : delete t[ye]), L;
}
var Nt = Object.prototype, Wt = Nt.toString;
function Dt(t) {
  return Wt.call(t);
}
var Ft = "[object Null]", Bt = "[object Undefined]", Je = xe ? xe.toStringTag : void 0;
function zt(t) {
  return t == null ? t === void 0 ? Bt : Ft : Je && Je in Object(t) ? Ht(t) : Dt(t);
}
function At(t) {
  return t != null && typeof t == "object";
}
var Ot = "[object Symbol]";
function Rt(t) {
  return typeof t == "symbol" || At(t) && zt(t) == Ot;
}
var jt = /\s/;
function Ct(t) {
  for (var v = t.length; v-- && jt.test(t.charAt(v)); )
    ;
  return v;
}
var Yt = /^\s+/;
function qt(t) {
  return t && t.slice(0, Ct(t) + 1).replace(Yt, "");
}
function Ne(t) {
  var v = typeof t;
  return t != null && (v == "object" || v == "function");
}
var Ke = NaN, Vt = /^[-+]0x[0-9a-f]+$/i, _t = /^0b[01]+$/i, Ut = /^0o[0-7]+$/i, Gt = parseInt;
function Qe(t) {
  if (typeof t == "number")
    return t;
  if (Rt(t))
    return Ke;
  if (Ne(t)) {
    var v = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Ne(v) ? v + "" : v;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = qt(t);
  var c = _t.test(t);
  return c || Ut.test(t) ? Gt(t.slice(2), c ? 2 : 8) : Vt.test(t) ? Ke : +t;
}
var Pe = function() {
  return lt.Date.now();
}, Xt = "Expected a function", Jt = Math.max, Kt = Math.min;
function Ze(t, v, c) {
  var r, L, p, l, s, b, E = 0, S = !1, I = !1, d = !0;
  if (typeof t != "function")
    throw new TypeError(Xt);
  v = Qe(v) || 0, Ne(c) && (S = !!c.leading, I = "maxWait" in c, p = I ? Jt(Qe(c.maxWait) || 0, v) : p, d = "trailing" in c ? !!c.trailing : d);
  function W(h) {
    var B = r, w = L;
    return r = L = void 0, E = h, l = t.apply(w, B), l;
  }
  function R(h) {
    return E = h, s = setTimeout(o, v), S ? W(h) : l;
  }
  function q(h) {
    var B = h - b, w = h - E, M = v - B;
    return I ? Kt(M, p - w) : M;
  }
  function g(h) {
    var B = h - b, w = h - E;
    return b === void 0 || B >= v || B < 0 || I && w >= p;
  }
  function o() {
    var h = Pe();
    if (g(h))
      return $(h);
    s = setTimeout(o, q(h));
  }
  function $(h) {
    return s = void 0, d && r ? W(h) : (r = L = void 0, l);
  }
  function y() {
    s !== void 0 && clearTimeout(s), E = 0, r = b = L = s = void 0;
  }
  function x() {
    return s === void 0 ? l : $(Pe());
  }
  function H() {
    var h = Pe(), B = g(h);
    if (r = arguments, L = this, b = h, B) {
      if (s === void 0)
        return R(b);
      if (I)
        return clearTimeout(s), s = setTimeout(o, v), W(b);
    }
    return s === void 0 && (s = setTimeout(o, v)), l;
  }
  return H.cancel = y, H.flush = x, H;
}
function fe(t, v) {
  const c = v ?? (typeof window < "u" ? window.innerWidth : 1024), r = t.sizes;
  return c >= 1536 && r["2xl"] ? r["2xl"] : c >= 1280 && r.xl ? r.xl : c >= 1024 && r.lg ? r.lg : c >= 768 && r.md ? r.md : c >= 640 && r.sm ? r.sm : r.base;
}
function Qt(t) {
  const v = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return v >= 1536 ? "2xl" : v >= 1280 ? "xl" : v >= 1024 ? "lg" : v >= 768 ? "md" : v >= 640 ? "sm" : "base";
}
function Zt(t) {
  return t.reduce((c, r) => Math.max(c, r.top + r.columnHeight), 0) + 500;
}
function ea(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function ta(t, v = 0) {
  return {
    style: ea(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": v
  };
}
function We(t, v) {
  if (!t.length || v <= 0)
    return new Array(Math.max(1, v)).fill(0);
  const r = Array.from(new Set(t.map((l) => l.left))).sort((l, s) => l - s).slice(0, v), L = /* @__PURE__ */ new Map();
  for (let l = 0; l < r.length; l++) L.set(r[l], l);
  const p = new Array(r.length).fill(0);
  for (const l of t) {
    const s = L.get(l.left);
    s != null && (p[s] = Math.max(p[s], l.top + l.columnHeight));
  }
  for (; p.length < v; ) p.push(0);
  return p;
}
function aa(t, v) {
  function c(l, s) {
    const b = parseInt(l.dataset.left || "0", 10), E = parseInt(l.dataset.top || "0", 10), S = parseInt(l.dataset.index || "0", 10), I = Math.min(S * 20, 160), d = l.style.getPropertyValue("--masonry-opacity-delay");
    l.style.setProperty("--masonry-opacity-delay", `${I}ms`), requestAnimationFrame(() => {
      l.style.opacity = "1", l.style.transform = `translate3d(${b}px, ${E}px, 0) scale(1)`;
      const W = () => {
        d ? l.style.setProperty("--masonry-opacity-delay", d) : l.style.removeProperty("--masonry-opacity-delay"), l.removeEventListener("transitionend", W), s();
      };
      l.addEventListener("transitionend", W);
    });
  }
  function r(l) {
    const s = parseInt(l.dataset.left || "0", 10), b = parseInt(l.dataset.top || "0", 10);
    l.style.opacity = "0", l.style.transform = `translate3d(${s}px, ${b + 10}px, 0) scale(0.985)`;
  }
  function L(l) {
    const s = parseInt(l.dataset.left || "0", 10), b = parseInt(l.dataset.top || "0", 10);
    l.style.transition = "none", l.style.opacity = "1", l.style.transform = `translate3d(${s}px, ${b}px, 0) scale(1)`, l.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      l.style.transition = "";
    });
  }
  function p(l, s) {
    const b = parseInt(l.dataset.left || "0", 10), E = parseInt(l.dataset.top || "0", 10), S = typeof (v == null ? void 0 : v.leaveDurationMs) == "number" ? v.leaveDurationMs : NaN;
    let I = Number.isFinite(S) && S > 0 ? S : NaN;
    if (!Number.isFinite(I)) {
      const o = getComputedStyle(l).getPropertyValue("--masonry-leave-duration") || "", $ = parseFloat(o);
      I = Number.isFinite($) && $ > 0 ? $ : 200;
    }
    const d = l.style.transitionDuration, W = () => {
      l.removeEventListener("transitionend", R), clearTimeout(q), l.style.transitionDuration = d || "";
    }, R = (g) => {
      (!g || g.target === l) && (W(), s());
    }, q = setTimeout(() => {
      W(), s();
    }, I + 100);
    requestAnimationFrame(() => {
      l.style.transitionDuration = `${I}ms`, l.style.opacity = "0", l.style.transform = `translate3d(${b}px, ${E + 10}px, 0) scale(0.985)`, l.addEventListener("transitionend", R);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: r,
    onBeforeLeave: L,
    onLeave: p
  };
}
function na({
  container: t,
  masonry: v,
  columns: c,
  containerHeight: r,
  isLoading: L,
  pageSize: p,
  refreshLayout: l,
  setItemsRaw: s,
  loadNext: b,
  loadThresholdPx: E
}) {
  let S = 0;
  async function I(d) {
    if (!t.value) return;
    const W = d ?? We(v.value, c.value), R = W.length ? Math.max(...W) : 0, q = t.value.scrollTop + t.value.clientHeight, g = t.value.scrollTop > S + 1;
    S = t.value.scrollTop;
    const o = typeof E == "number" ? E : 200, $ = o >= 0 ? Math.max(0, R - o) : Math.max(0, R + o);
    if (q >= $ && g && !L.value) {
      await b(), await J();
      return;
    }
  }
  return {
    handleScroll: I
  };
}
const la = { class: "flex-1 relative min-h-0" }, ra = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, oa = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ia = {
  key: 1,
  class: "relative w-full h-full"
}, sa = ["src"], ua = ["src", "autoplay", "controls"], va = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ca = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, fa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Me = /* @__PURE__ */ tt({
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
  setup(t, { emit: v }) {
    const c = t, r = v, L = T(!1), p = T(!1), l = T(null), s = T(!1), b = T(!1), E = T(null), S = T(!1), I = T(!1), d = T(!1), W = T(null), R = T(null);
    let q = null;
    const g = Z(() => {
      var n;
      return c.type ?? ((n = c.item) == null ? void 0 : n.type) ?? "image";
    }), o = Z(() => {
      var n;
      return c.notFound ?? ((n = c.item) == null ? void 0 : n.notFound) ?? !1;
    }), $ = Z(() => !!c.inSwipeMode);
    function y(n) {
      r("mouse-enter", { item: c.item, type: n });
    }
    function x(n) {
      r("mouse-leave", { item: c.item, type: n });
    }
    function H(n) {
      if ($.value) return;
      const f = n.target;
      f && (f.paused ? f.play() : f.pause());
    }
    function h(n) {
      const f = n.target;
      f && ($.value || f.play(), y("video"));
    }
    function B(n) {
      const f = n.target;
      f && ($.value || f.pause(), x("video"));
    }
    function w(n) {
      return new Promise((f, P) => {
        if (!n) {
          const N = new Error("No image source provided");
          r("preload:error", { item: c.item, type: "image", src: n, error: N }), P(N);
          return;
        }
        const A = new Image(), U = Date.now(), C = 300;
        A.onload = () => {
          const N = Date.now() - U, oe = Math.max(0, C - N);
          setTimeout(async () => {
            L.value = !0, p.value = !1, I.value = !1, await J(), await new Promise((ie) => setTimeout(ie, 100)), d.value = !0, r("preload:success", { item: c.item, type: "image", src: n }), f();
          }, oe);
        }, A.onerror = () => {
          p.value = !0, L.value = !1, I.value = !1;
          const N = new Error("Failed to load image");
          r("preload:error", { item: c.item, type: "image", src: n, error: N }), P(N);
        }, A.src = n;
      });
    }
    function M(n) {
      return new Promise((f, P) => {
        if (!n) {
          const N = new Error("No video source provided");
          r("preload:error", { item: c.item, type: "video", src: n, error: N }), P(N);
          return;
        }
        const A = document.createElement("video"), U = Date.now(), C = 300;
        A.preload = "metadata", A.muted = !0, A.onloadedmetadata = () => {
          const N = Date.now() - U, oe = Math.max(0, C - N);
          setTimeout(async () => {
            s.value = !0, b.value = !1, I.value = !1, await J(), await new Promise((ie) => setTimeout(ie, 100)), d.value = !0, r("preload:success", { item: c.item, type: "video", src: n }), f();
          }, oe);
        }, A.onerror = () => {
          b.value = !0, s.value = !1, I.value = !1;
          const N = new Error("Failed to load video");
          r("preload:error", { item: c.item, type: "video", src: n, error: N }), P(N);
        }, A.src = n;
      });
    }
    async function j() {
      var f;
      if (!S.value || I.value || o.value || g.value === "video" && s.value || g.value === "image" && L.value)
        return;
      const n = (f = c.item) == null ? void 0 : f.src;
      if (n)
        if (I.value = !0, d.value = !1, g.value === "video") {
          E.value = n, s.value = !1, b.value = !1;
          try {
            await M(n);
          } catch {
          }
        } else {
          l.value = n, L.value = !1, p.value = !1;
          try {
            await w(n);
          } catch {
          }
        }
    }
    return at(() => {
      W.value && (q = new IntersectionObserver(
        (n) => {
          n.forEach((f) => {
            f.isIntersecting && f.intersectionRatio >= 1 ? S.value || (S.value = !0, j()) : f.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), q.observe(W.value));
    }), nt(() => {
      q && (q.disconnect(), q = null);
    }), re(
      () => {
        var n;
        return (n = c.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || o.value)) {
          if (g.value === "video") {
            if (n !== E.value && (s.value = !1, b.value = !1, E.value = n, S.value)) {
              I.value = !0;
              try {
                await M(n);
              } catch {
              }
            }
          } else if (n !== l.value && (L.value = !1, p.value = !1, l.value = n, S.value)) {
            I.value = !0;
            try {
              await w(n);
            } catch {
            }
          }
        }
      }
    ), re(
      () => c.isActive,
      (n) => {
        !$.value || !R.value || (n ? R.value.play() : R.value.pause());
      }
    ), (n, f) => (F(), D("div", {
      ref_key: "containerRef",
      ref: W,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (F(), D("div", {
        key: 0,
        class: "relative z-10",
        style: we({ height: `${n.headerHeight}px` })
      }, [
        Q(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: L.value,
          imageError: p.value,
          videoLoaded: s.value,
          videoError: b.value,
          showNotFound: o.value,
          isLoading: I.value,
          mediaType: g.value
        })
      ], 4)) : ne("", !0),
      O("div", la, [
        Q(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: L.value,
          imageError: p.value,
          videoLoaded: s.value,
          videoError: b.value,
          showNotFound: o.value,
          isLoading: I.value,
          mediaType: g.value,
          imageSrc: l.value,
          videoSrc: E.value,
          showMedia: d.value
        }, () => [
          O("div", ra, [
            o.value ? (F(), D("div", oa, f[3] || (f[3] = [
              O("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              O("span", { class: "font-medium" }, "Not Found", -1),
              O("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (F(), D("div", ia, [
              g.value === "image" && l.value ? (F(), D("img", {
                key: 0,
                src: l.value,
                class: ue([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  L.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: f[0] || (f[0] = (P) => y("image")),
                onMouseleave: f[1] || (f[1] = (P) => x("image"))
              }, null, 42, sa)) : ne("", !0),
              g.value === "video" && E.value ? (F(), D("video", {
                key: 1,
                ref_key: "videoEl",
                ref: R,
                src: E.value,
                class: ue([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  s.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: $.value && c.isActive,
                controls: $.value,
                onClick: _e(H, ["stop"]),
                onTouchend: _e(H, ["stop", "prevent"]),
                onMouseenter: h,
                onMouseleave: B,
                onError: f[2] || (f[2] = (P) => b.value = !0)
              }, null, 42, ua)) : ne("", !0),
              !L.value && !s.value && !p.value && !b.value ? (F(), D("div", {
                key: 2,
                class: ue([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  d.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                O("div", va, [
                  O("i", {
                    class: ue(g.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : ne("", !0),
              I.value ? (F(), D("div", ca, f[4] || (f[4] = [
                O("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  O("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : ne("", !0),
              g.value === "image" && p.value || g.value === "video" && b.value ? (F(), D("div", fa, [
                O("i", {
                  class: ue(g.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                O("span", null, "Failed to load " + He(g.value), 1)
              ])) : ne("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (F(), D("div", {
        key: 1,
        class: "relative z-10",
        style: we({ height: `${n.footerHeight}px` })
      }, [
        Q(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: L.value,
          imageError: p.value,
          videoLoaded: s.value,
          videoError: b.value,
          showNotFound: o.value,
          isLoading: I.value,
          mediaType: g.value
        })
      ], 4)) : ne("", !0)
    ], 512));
  }
}), da = { class: "w-full h-full flex items-center justify-center p-4" }, ma = { class: "w-full h-full max-w-full max-h-full relative" }, ha = {
  key: 0,
  class: "w-full py-8 text-center"
}, ga = {
  key: 1,
  class: "w-full py-8 text-center"
}, pa = { class: "text-red-500 dark:text-red-400" }, ya = {
  key: 0,
  class: "w-full py-8 text-center"
}, wa = {
  key: 1,
  class: "w-full py-8 text-center"
}, ba = { class: "text-red-500 dark:text-red-400" }, xa = /* @__PURE__ */ tt({
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
      validator: (t) => ["page", "cursor"].includes(t)
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
    },
    // Layout mode: 'auto' (detect from screen size), 'masonry', or 'swipe'
    layoutMode: {
      type: String,
      default: "auto",
      validator: (t) => ["auto", "masonry", "swipe"].includes(t)
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
  setup(t, { expose: v, emit: c }) {
    const r = t, L = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, p = Z(() => {
      var e;
      return {
        ...L,
        ...r.layout,
        sizes: {
          ...L.sizes,
          ...((e = r.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), l = T(null), s = T(typeof window < "u" ? window.innerWidth : 1024), b = T(typeof window < "u" ? window.innerHeight : 768), E = T(null);
    let S = null;
    function I(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const d = Z(() => {
      if (r.layoutMode === "masonry") return !1;
      if (r.layoutMode === "swipe") return !0;
      const e = typeof r.mobileBreakpoint == "string" ? I(r.mobileBreakpoint) : r.mobileBreakpoint;
      return s.value < e;
    }), W = Z(() => {
      if (!d.value || o.value.length === 0) return null;
      const e = Math.max(0, Math.min(n.value, o.value.length - 1));
      return o.value[e] || null;
    }), R = Z(() => {
      if (!d.value || !W.value) return null;
      const e = n.value + 1;
      return e >= o.value.length ? null : o.value[e] || null;
    }), q = Z(() => {
      if (!d.value || !W.value) return null;
      const e = n.value - 1;
      return e < 0 ? null : o.value[e] || null;
    }), g = c, o = Z({
      get: () => r.items,
      set: (e) => g("update:items", e)
    }), $ = T(7), y = T(null), x = T([]), H = T(null), h = T(!1), B = T(0), w = T(!1), M = T(null), j = Z(() => Qt(s.value)), n = T(0), f = T(0), P = T(!1), A = T(0), U = T(0), C = T(null), N = T(/* @__PURE__ */ new Set());
    function oe(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function ie(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const i = e.filter((u) => !oe(u == null ? void 0 : u.width) || !oe(u == null ? void 0 : u.height));
        if (i.length === 0) return;
        const m = [];
        for (const u of i) {
          const Y = (u == null ? void 0 : u.id) ?? `idx:${e.indexOf(u)}`;
          N.value.has(Y) || (N.value.add(Y), m.push(Y));
        }
        if (m.length > 0) {
          const u = m.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: m.length,
              sampleIds: u,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const k = T(0), z = T(0), K = r.virtualBufferPx, G = T(!1), X = T({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), ee = (e) => {
      if (!y.value) return;
      const { scrollTop: a, clientHeight: i } = y.value, m = a + i, u = e ?? We(o.value, $.value), Y = u.length ? Math.max(...u) : 0, _ = typeof r.loadThresholdPx == "number" ? r.loadThresholdPx : 200, ce = _ >= 0 ? Math.max(0, Y - _) : Math.max(0, Y + _), Ve = Math.max(0, ce - m), Et = Ve <= 100;
      X.value = {
        distanceToTrigger: Math.round(Ve),
        isNearTrigger: Et
      };
    }, { onEnter: te, onBeforeEnter: ot, onBeforeLeave: it, onLeave: st } = aa(o, { leaveDurationMs: r.leaveDurationMs });
    function ut(e, a) {
      if (G.value) {
        const i = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${i}px, ${m}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        te(e, a);
    }
    function vt(e) {
      if (G.value) {
        const a = parseInt(e.dataset.left || "0", 10), i = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${i}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ot(e);
    }
    function ct(e) {
      G.value || it(e);
    }
    function ft(e, a) {
      G.value ? a() : st(e, a);
    }
    const dt = Z(() => {
      const e = k.value - K, a = k.value + z.value + K, i = o.value;
      return !i || i.length === 0 ? [] : i.filter((m) => {
        const u = m.top;
        return m.top + m.columnHeight >= e && u <= a;
      });
    }), { handleScroll: mt } = na({
      container: y,
      masonry: o,
      columns: $,
      containerHeight: B,
      isLoading: h,
      pageSize: r.pageSize,
      refreshLayout: ae,
      setItemsRaw: (e) => {
        o.value = e;
      },
      loadNext: ve,
      loadThresholdPx: r.loadThresholdPx
    });
    function ht(e) {
      E.value = e, e ? (e.width !== void 0 && (s.value = e.width), e.height !== void 0 && (b.value = e.height), !d.value && y.value && o.value.length > 0 && J(() => {
        $.value = fe(p.value, s.value), ae(o.value), ee();
      })) : l.value && (s.value = l.value.clientWidth, b.value = l.value.clientHeight);
    }
    v({
      isLoading: h,
      refreshLayout: ae,
      // Container dimensions (wrapper element)
      containerWidth: s,
      containerHeight: b,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: B,
      // Current page
      currentPage: H,
      // End of list tracking
      hasReachedEnd: w,
      // Load error tracking
      loadError: M,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: ht,
      remove: de,
      removeMany: pt,
      removeAll: yt,
      loadNext: ve,
      loadPage: Ee,
      refreshCurrentPage: Te,
      reset: bt,
      destroy: xt,
      init: Mt,
      paginationHistory: x,
      cancelLoad: Le,
      scrollToTop: Be,
      totalItems: Z(() => o.value.length),
      currentBreakpoint: j
    });
    function De(e) {
      const a = Zt(e);
      let i = 0;
      if (y.value) {
        const { scrollTop: m, clientHeight: u } = y.value;
        i = m + u + 100;
      }
      B.value = Math.max(a, i);
    }
    function ae(e) {
      if (d.value) {
        o.value = e;
        return;
      }
      if (!y.value) return;
      ie(e, "refreshLayout");
      const a = e.map((m, u) => ({
        ...m,
        originalIndex: m.originalIndex ?? u
      })), i = y.value;
      if (E.value && E.value.width !== void 0) {
        const m = i.style.width, u = i.style.boxSizing;
        i.style.boxSizing = "border-box", i.style.width = `${E.value.width}px`, i.offsetWidth;
        const Y = Xe(a, i, $.value, p.value);
        i.style.width = m, i.style.boxSizing = u, De(Y), o.value = Y;
      } else {
        const m = Xe(a, i, $.value, p.value);
        De(m), o.value = m;
      }
    }
    function Fe(e, a) {
      return new Promise((i) => {
        const m = Math.max(0, e | 0), u = Date.now();
        a(m, m);
        const Y = setInterval(() => {
          if (V.value) {
            clearInterval(Y), i();
            return;
          }
          const _ = Date.now() - u, ce = Math.max(0, m - _);
          a(ce, m), ce <= 0 && (clearInterval(Y), i());
        }, 100);
      });
    }
    async function be(e) {
      try {
        const a = await gt(() => r.getNextPage(e));
        return ae([...o.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function gt(e) {
      let a = 0;
      const i = r.retryMaxAttempts;
      let m = r.retryInitialDelayMs;
      for (; ; )
        try {
          const u = await e();
          return a > 0 && g("retry:stop", { attempt: a, success: !0 }), u;
        } catch (u) {
          if (a++, a > i)
            throw g("retry:stop", { attempt: a - 1, success: !1 }), u;
          g("retry:start", { attempt: a, max: i, totalMs: m }), await Fe(m, (Y, _) => {
            g("retry:tick", { attempt: a, remainingMs: Y, totalMs: _ });
          }), m += r.retryBackoffStepMs;
        }
    }
    async function Ee(e) {
      if (!h.value) {
        V.value = !1, h.value = !0, w.value = !1, M.value = null;
        try {
          const a = o.value.length;
          if (V.value) return;
          const i = await be(e);
          return V.value ? void 0 : (M.value = null, H.value = e, x.value.push(i.nextPage), i.nextPage == null && (w.value = !0), await he(a), i);
        } catch (a) {
          throw console.error("Error loading page:", a), M.value = a instanceof Error ? a : new Error(String(a)), a;
        } finally {
          h.value = !1;
        }
      }
    }
    async function ve() {
      if (!h.value && !w.value) {
        V.value = !1, h.value = !0, M.value = null;
        try {
          const e = o.value.length;
          if (V.value) return;
          const a = x.value[x.value.length - 1];
          if (a == null) {
            w.value = !0, h.value = !1;
            return;
          }
          const i = await be(a);
          return V.value ? void 0 : (M.value = null, H.value = a, x.value.push(i.nextPage), i.nextPage == null && (w.value = !0), await he(e), i);
        } catch (e) {
          throw console.error("Error loading next page:", e), M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          h.value = !1;
        }
      }
    }
    async function Te() {
      if (!h.value) {
        V.value = !1, h.value = !0;
        try {
          const e = H.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", H.value, "paginationHistory:", x.value);
            return;
          }
          o.value = [], B.value = 0, w.value = !1, M.value = null, x.value = [e], await J();
          const a = await be(e);
          if (V.value) return;
          M.value = null, H.value = e, x.value.push(a.nextPage), a.nextPage == null && (w.value = !0);
          const i = o.value.length;
          return await he(i), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          h.value = !1;
        }
      }
    }
    async function de(e) {
      const a = o.value.filter((i) => i.id !== e.id);
      if (o.value = a, await J(), a.length === 0 && x.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ve(), await he(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        ae(a);
      });
    }
    async function pt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((m) => m.id)), i = o.value.filter((m) => !a.has(m.id));
      if (o.value = i, await J(), i.length === 0 && x.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ve(), await he(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((m) => requestAnimationFrame(() => m())), requestAnimationFrame(() => {
        ae(i);
      });
    }
    function Be(e) {
      y.value && y.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function yt() {
      Be({ behavior: "smooth" }), o.value = [], b.value = 0, await J(), g("remove-all:complete");
    }
    function wt() {
      $.value = fe(p.value, s.value), ae(o.value), y.value && (k.value = y.value.scrollTop, z.value = y.value.clientHeight);
    }
    let me = !1;
    const V = T(!1);
    async function he(e, a = !1) {
      if (!a && !r.backfillEnabled || me || V.value || w.value) return;
      const i = (e || 0) + (r.pageSize || 0);
      if (!r.pageSize || r.pageSize <= 0) return;
      if (x.value[x.value.length - 1] == null) {
        w.value = !0;
        return;
      }
      if (!(o.value.length >= i)) {
        me = !0;
        try {
          let u = 0;
          for (g("backfill:start", { target: i, fetched: o.value.length, calls: u }); o.value.length < i && u < r.backfillMaxCalls && x.value[x.value.length - 1] != null && !V.value && !w.value && (await Fe(r.backfillDelayMs, (_, ce) => {
            g("backfill:tick", {
              fetched: o.value.length,
              target: i,
              calls: u,
              remainingMs: _,
              totalMs: ce
            });
          }), !V.value); ) {
            const Y = x.value[x.value.length - 1];
            if (Y == null) {
              w.value = !0;
              break;
            }
            try {
              h.value = !0;
              const _ = await be(Y);
              if (V.value) break;
              M.value = null, x.value.push(_.nextPage), _.nextPage == null && (w.value = !0);
            } catch (_) {
              M.value = _ instanceof Error ? _ : new Error(String(_));
            } finally {
              h.value = !1;
            }
            u++;
          }
          g("backfill:stop", { fetched: o.value.length, calls: u });
        } finally {
          me = !1;
        }
      }
    }
    function Le() {
      V.value = !0, h.value = !1, me = !1;
    }
    function bt() {
      Le(), V.value = !1, y.value && y.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], b.value = 0, H.value = r.loadAtPage, x.value = [r.loadAtPage], w.value = !1, M.value = null, X.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function xt() {
      Le(), o.value = [], B.value = 0, H.value = null, x.value = [], w.value = !1, M.value = null, h.value = !1, me = !1, V.value = !1, n.value = 0, f.value = 0, P.value = !1, k.value = 0, z.value = 0, G.value = !1, X.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, N.value.clear(), y.value && y.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const se = Ze(async () => {
      if (d.value) return;
      y.value && (k.value = y.value.scrollTop, z.value = y.value.clientHeight), G.value = !0, await J(), await new Promise((a) => requestAnimationFrame(() => a())), G.value = !1;
      const e = We(o.value, $.value);
      mt(e), ee(e);
    }, 200), ze = Ze(wt, 200);
    function Ae(e) {
      d.value && (P.value = !0, A.value = e.touches[0].clientY, U.value = f.value, e.preventDefault());
    }
    function Oe(e) {
      if (!d.value || !P.value) return;
      const a = e.touches[0].clientY - A.value;
      f.value = U.value + a, e.preventDefault();
    }
    function Re(e) {
      if (!d.value || !P.value) return;
      P.value = !1;
      const a = f.value - U.value;
      Math.abs(a) > 100 ? a > 0 && q.value ? Ye() : a < 0 && R.value ? Ce() : le() : le(), e.preventDefault();
    }
    function je(e) {
      d.value && (P.value = !0, A.value = e.clientY, U.value = f.value, e.preventDefault());
    }
    function ke(e) {
      if (!d.value || !P.value) return;
      const a = e.clientY - A.value;
      f.value = U.value + a, e.preventDefault();
    }
    function Ie(e) {
      if (!d.value || !P.value) return;
      P.value = !1;
      const a = f.value - U.value;
      Math.abs(a) > 100 ? a > 0 && q.value ? Ye() : a < 0 && R.value ? Ce() : le() : le(), e.preventDefault();
    }
    function Ce() {
      if (!R.value) {
        ve();
        return;
      }
      n.value++, le(), n.value >= o.value.length - 5 && ve();
    }
    function Ye() {
      q.value && (n.value--, le());
    }
    function le() {
      if (!C.value) return;
      const e = C.value.clientHeight;
      f.value = -n.value * e;
    }
    function qe() {
      !d.value && n.value > 0 && (n.value = 0, f.value = 0), d.value && o.value.length === 0 && !h.value && Ee(x.value[0]), d.value && le();
    }
    function Mt(e, a, i) {
      H.value = a, x.value = [a], x.value.push(i), w.value = i == null, ie(e, "init"), d.value ? (o.value = [...o.value, ...e], n.value === 0 && o.value.length > 0 && (f.value = 0)) : (ae([...o.value, ...e]), ee());
    }
    return re(
      p,
      () => {
        d.value || y.value && ($.value = fe(p.value, s.value), ae(o.value));
      },
      { deep: !0 }
    ), re(() => r.layoutMode, () => {
      E.value && E.value.width !== void 0 ? s.value = E.value.width : l.value && (s.value = l.value.clientWidth);
    }), re(y, (e) => {
      e && !d.value ? (e.removeEventListener("scroll", se), e.addEventListener("scroll", se, { passive: !0 })) : e && e.removeEventListener("scroll", se);
    }, { immediate: !0 }), re(d, (e, a) => {
      a === void 0 && e === !1 || J(() => {
        e ? (document.addEventListener("mousemove", ke), document.addEventListener("mouseup", Ie), y.value && y.value.removeEventListener("scroll", se), n.value = 0, f.value = 0, o.value.length > 0 && le()) : (document.removeEventListener("mousemove", ke), document.removeEventListener("mouseup", Ie), y.value && l.value && (E.value && E.value.width !== void 0 ? s.value = E.value.width : s.value = l.value.clientWidth, y.value.removeEventListener("scroll", se), y.value.addEventListener("scroll", se, { passive: !0 }), o.value.length > 0 && ($.value = fe(p.value, s.value), ae(o.value), k.value = y.value.scrollTop, z.value = y.value.clientHeight, ee())));
      });
    }, { immediate: !0 }), re(C, (e) => {
      e && (e.addEventListener("touchstart", Ae, { passive: !1 }), e.addEventListener("touchmove", Oe, { passive: !1 }), e.addEventListener("touchend", Re), e.addEventListener("mousedown", je));
    }), re(() => o.value.length, (e, a) => {
      d.value && e > 0 && a === 0 && (n.value = 0, J(() => le()));
    }), re(l, (e) => {
      S && (S.disconnect(), S = null), e && typeof ResizeObserver < "u" ? (S = new ResizeObserver((a) => {
        if (!E.value)
          for (const i of a) {
            const m = i.contentRect.width, u = i.contentRect.height;
            s.value !== m && (s.value = m), b.value !== u && (b.value = u);
          }
      }), S.observe(e), E.value || (s.value = e.clientWidth, b.value = e.clientHeight)) : e && (E.value || (s.value = e.clientWidth, b.value = e.clientHeight));
    }, { immediate: !0 }), re(s, (e, a) => {
      e !== a && e > 0 && !d.value && y.value && o.value.length > 0 && J(() => {
        $.value = fe(p.value, e), ae(o.value), ee();
      });
    }), at(async () => {
      try {
        await J(), l.value && !S && (s.value = l.value.clientWidth, b.value = l.value.clientHeight), d.value || ($.value = fe(p.value, s.value), y.value && (k.value = y.value.scrollTop, z.value = y.value.clientHeight));
        const e = r.loadAtPage;
        x.value = [e], r.skipInitialLoad || await Ee(x.value[0]), d.value ? J(() => le()) : ee();
      } catch (e) {
        console.error("Error during component initialization:", e), h.value = !1;
      }
      window.addEventListener("resize", ze), window.addEventListener("resize", qe);
    }), nt(() => {
      var e;
      S && (S.disconnect(), S = null), (e = y.value) == null || e.removeEventListener("scroll", se), window.removeEventListener("resize", ze), window.removeEventListener("resize", qe), C.value && (C.value.removeEventListener("touchstart", Ae), C.value.removeEventListener("touchmove", Oe), C.value.removeEventListener("touchend", Re), C.value.removeEventListener("mousedown", je)), document.removeEventListener("mousemove", ke), document.removeEventListener("mouseup", Ie);
    }), (e, a) => (F(), D("div", {
      ref_key: "wrapper",
      ref: l,
      class: "w-full h-full flex flex-col relative"
    }, [
      d.value ? (F(), D("div", {
        key: 0,
        class: ue(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": r.forceMotion, "cursor-grab": !P.value, "cursor-grabbing": P.value }]),
        ref_key: "swipeContainer",
        ref: C,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        O("div", {
          class: "relative w-full",
          style: we({
            transform: `translateY(${f.value}px)`,
            transition: P.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${o.value.length * 100}%`
          })
        }, [
          (F(!0), D(Ue, null, Ge(o.value, (i, m) => (F(), D("div", {
            key: `${i.page}-${i.id}`,
            class: "absolute top-0 left-0 w-full",
            style: we({
              top: `${m * (100 / o.value.length)}%`,
              height: `${100 / o.value.length}%`
            })
          }, [
            O("div", da, [
              O("div", ma, [
                Q(e.$slots, "default", {
                  item: i,
                  remove: de
                }, () => [
                  $e(Me, {
                    item: i,
                    remove: de,
                    "header-height": p.value.header,
                    "footer-height": p.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": m === n.value,
                    "onPreload:success": a[0] || (a[0] = (u) => g("item:preload:success", u)),
                    "onPreload:error": a[1] || (a[1] = (u) => g("item:preload:error", u)),
                    onMouseEnter: a[2] || (a[2] = (u) => g("item:mouse-enter", u)),
                    onMouseLeave: a[3] || (a[3] = (u) => g("item:mouse-leave", u))
                  }, {
                    header: ge((u) => [
                      Q(e.$slots, "item-header", pe({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: ge((u) => [
                      Q(e.$slots, "item-footer", pe({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        w.value && o.value.length > 0 ? (F(), D("div", ha, [
          Q(e.$slots, "end-message", {}, () => [
            a[8] || (a[8] = O("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        M.value && o.value.length > 0 ? (F(), D("div", ga, [
          Q(e.$slots, "error-message", { error: M.value }, () => [
            O("p", pa, "Failed to load content: " + He(M.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2)) : (F(), D("div", {
        key: 1,
        class: ue(["overflow-auto w-full flex-1 masonry-container", { "force-motion": r.forceMotion }]),
        ref_key: "container",
        ref: y
      }, [
        O("div", {
          class: "relative",
          style: we({ height: `${B.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          $e(Tt, {
            name: "masonry",
            css: !1,
            onEnter: ut,
            onBeforeEnter: vt,
            onLeave: ft,
            onBeforeLeave: ct
          }, {
            default: ge(() => [
              (F(!0), D(Ue, null, Ge(dt.value, (i, m) => (F(), D("div", pe({
                key: `${i.page}-${i.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, Lt(ta)(i, m)), [
                Q(e.$slots, "default", {
                  item: i,
                  remove: de
                }, () => [
                  $e(Me, {
                    item: i,
                    remove: de,
                    "header-height": p.value.header,
                    "footer-height": p.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (u) => g("item:preload:success", u)),
                    "onPreload:error": a[5] || (a[5] = (u) => g("item:preload:error", u)),
                    onMouseEnter: a[6] || (a[6] = (u) => g("item:mouse-enter", u)),
                    onMouseLeave: a[7] || (a[7] = (u) => g("item:mouse-leave", u))
                  }, {
                    header: ge((u) => [
                      Q(e.$slots, "item-header", pe({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: ge((u) => [
                      Q(e.$slots, "item-footer", pe({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        w.value && o.value.length > 0 ? (F(), D("div", ya, [
          Q(e.$slots, "end-message", {}, () => [
            a[9] || (a[9] = O("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : ne("", !0),
        M.value && o.value.length > 0 ? (F(), D("div", wa, [
          Q(e.$slots, "error-message", { error: M.value }, () => [
            O("p", ba, "Failed to load content: " + He(M.value.message), 1)
          ], !0)
        ])) : ne("", !0)
      ], 2))
    ], 512));
  }
}), Ma = (t, v) => {
  const c = t.__vccOpts || t;
  for (const [r, L] of v)
    c[r] = L;
  return c;
}, et = /* @__PURE__ */ Ma(xa, [["__scopeId", "data-v-01598521"]]), Ta = {
  install(t) {
    t.component("WyxosMasonry", et), t.component("WMasonry", et), t.component("WyxosMasonryItem", Me), t.component("WMasonryItem", Me);
  }
};
export {
  et as Masonry,
  Me as MasonryItem,
  Ta as default
};
