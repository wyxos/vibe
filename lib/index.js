import { nextTick as G, defineComponent as it, ref as L, computed as le, onMounted as st, onUnmounted as ut, watch as ce, createElementBlock as j, openBlock as C, createCommentVNode as se, createElementVNode as V, normalizeStyle as Te, renderSlot as ee, normalizeClass as me, withModifiers as Qe, toDisplayString as Ae, Fragment as Ze, renderList as et, createVNode as Fe, withCtx as xe, mergeProps as be, TransitionGroup as Nt, unref as Ft } from "vue";
let Be = null;
function Bt() {
  if (Be != null) return Be;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const c = document.createElement("div");
  c.style.width = "100%", t.appendChild(c);
  const v = t.offsetWidth - c.offsetWidth;
  return document.body.removeChild(t), Be = v, v;
}
function tt(t, c, v, r = {}) {
  const {
    gutterX: I = 0,
    gutterY: w = 0,
    header: y = 0,
    footer: d = 0,
    paddingLeft: k = 0,
    paddingRight: S = 0,
    sizes: s = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: E = "masonry"
  } = r;
  let f = 0, N = 0;
  try {
    if (c && c.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const x = window.getComputedStyle(c);
      f = parseFloat(x.paddingLeft) || 0, N = parseFloat(x.paddingRight) || 0;
    }
  } catch {
  }
  const z = (k || 0) + f, A = (S || 0) + N, m = c.offsetWidth - c.clientWidth, o = m > 0 ? m + 2 : Bt() + 2, P = c.offsetWidth - o - z - A, u = I * (v - 1), b = Math.floor((P - u) / v), $ = t.map((x) => {
    const M = x.width, Y = x.height;
    return Math.round(b * Y / M) + d + y;
  });
  if (E === "sequential-balanced") {
    const x = $.length;
    if (x === 0) return [];
    const M = (T, B, te) => T + (B > 0 ? w : 0) + te;
    let Y = Math.max(...$), l = $.reduce((T, B) => T + B, 0) + w * Math.max(0, x - 1);
    const g = (T) => {
      let B = 1, te = 0, K = 0;
      for (let Q = 0; Q < x; Q++) {
        const ne = $[Q], oe = M(te, K, ne);
        if (oe <= T)
          te = oe, K++;
        else if (B++, te = ne, K = 1, ne > T || B > v) return !1;
      }
      return B <= v;
    };
    for (; Y < l; ) {
      const T = Math.floor((Y + l) / 2);
      g(T) ? l = T : Y = T + 1;
    }
    const F = l, q = new Array(v).fill(0);
    let J = v - 1, U = 0, O = 0;
    for (let T = x - 1; T >= 0; T--) {
      const B = $[T], te = T < J;
      !(M(U, O, B) <= F) || te ? (q[J] = T + 1, J--, U = B, O = 1) : (U = M(U, O, B), O++);
    }
    q[0] = 0;
    const fe = [], ue = new Array(v).fill(0);
    for (let T = 0; T < v; T++) {
      const B = q[T], te = T + 1 < v ? q[T + 1] : x, K = T * (b + I);
      for (let Q = B; Q < te; Q++) {
        const oe = {
          ...t[Q],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        oe.imageHeight = $[Q] - (d + y), oe.columnHeight = $[Q], oe.left = K, oe.top = ue[T], ue[T] += oe.columnHeight + (Q + 1 < te ? w : 0), fe.push(oe);
      }
    }
    return fe;
  }
  const p = new Array(v).fill(0), D = [];
  for (let x = 0; x < t.length; x++) {
    const M = t[x], Y = {
      ...M,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, l = p.indexOf(Math.min(...p)), g = M.width, F = M.height;
    Y.columnWidth = b, Y.left = l * (b + I), Y.imageHeight = Math.round(b * F / g), Y.columnHeight = Y.imageHeight + d + y, Y.top = p[l], p[l] += Y.columnHeight + w, D.push(Y);
  }
  return D;
}
var Wt = typeof global == "object" && global && global.Object === Object && global, At = typeof self == "object" && self && self.Object === Object && self, vt = Wt || At || Function("return this")(), Ie = vt.Symbol, ct = Object.prototype, Dt = ct.hasOwnProperty, Ot = ct.toString, Me = Ie ? Ie.toStringTag : void 0;
function zt(t) {
  var c = Dt.call(t, Me), v = t[Me];
  try {
    t[Me] = void 0;
    var r = !0;
  } catch {
  }
  var I = Ot.call(t);
  return r && (c ? t[Me] = v : delete t[Me]), I;
}
var Rt = Object.prototype, jt = Rt.toString;
function Ct(t) {
  return jt.call(t);
}
var qt = "[object Null]", Vt = "[object Undefined]", at = Ie ? Ie.toStringTag : void 0;
function Yt(t) {
  return t == null ? t === void 0 ? Vt : qt : at && at in Object(t) ? zt(t) : Ct(t);
}
function Ut(t) {
  return t != null && typeof t == "object";
}
var _t = "[object Symbol]";
function Xt(t) {
  return typeof t == "symbol" || Ut(t) && Yt(t) == _t;
}
var Gt = /\s/;
function Jt(t) {
  for (var c = t.length; c-- && Gt.test(t.charAt(c)); )
    ;
  return c;
}
var Kt = /^\s+/;
function Qt(t) {
  return t && t.slice(0, Jt(t) + 1).replace(Kt, "");
}
function De(t) {
  var c = typeof t;
  return t != null && (c == "object" || c == "function");
}
var nt = NaN, Zt = /^[-+]0x[0-9a-f]+$/i, ea = /^0b[01]+$/i, ta = /^0o[0-7]+$/i, aa = parseInt;
function lt(t) {
  if (typeof t == "number")
    return t;
  if (Xt(t))
    return nt;
  if (De(t)) {
    var c = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = De(c) ? c + "" : c;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Qt(t);
  var v = ea.test(t);
  return v || ta.test(t) ? aa(t.slice(2), v ? 2 : 8) : Zt.test(t) ? nt : +t;
}
var We = function() {
  return vt.Date.now();
}, na = "Expected a function", la = Math.max, oa = Math.min;
function ot(t, c, v) {
  var r, I, w, y, d, k, S = 0, s = !1, E = !1, f = !0;
  if (typeof t != "function")
    throw new TypeError(na);
  c = lt(c) || 0, De(v) && (s = !!v.leading, E = "maxWait" in v, w = E ? la(lt(v.maxWait) || 0, c) : w, f = "trailing" in v ? !!v.trailing : f);
  function N(p) {
    var D = r, x = I;
    return r = I = void 0, S = p, y = t.apply(x, D), y;
  }
  function z(p) {
    return S = p, d = setTimeout(o, c), s ? N(p) : y;
  }
  function A(p) {
    var D = p - k, x = p - S, M = c - D;
    return E ? oa(M, w - x) : M;
  }
  function m(p) {
    var D = p - k, x = p - S;
    return k === void 0 || D >= c || D < 0 || E && x >= w;
  }
  function o() {
    var p = We();
    if (m(p))
      return P(p);
    d = setTimeout(o, A(p));
  }
  function P(p) {
    return d = void 0, f && r ? N(p) : (r = I = void 0, y);
  }
  function u() {
    d !== void 0 && clearTimeout(d), S = 0, r = k = I = d = void 0;
  }
  function b() {
    return d === void 0 ? y : P(We());
  }
  function $() {
    var p = We(), D = m(p);
    if (r = arguments, I = this, k = p, D) {
      if (d === void 0)
        return z(k);
      if (E)
        return clearTimeout(d), d = setTimeout(o, c), N(k);
    }
    return d === void 0 && (d = setTimeout(o, c)), y;
  }
  return $.cancel = u, $.flush = b, $;
}
function pe(t, c) {
  const v = c ?? (typeof window < "u" ? window.innerWidth : 1024), r = t.sizes;
  return v >= 1536 && r["2xl"] ? r["2xl"] : v >= 1280 && r.xl ? r.xl : v >= 1024 && r.lg ? r.lg : v >= 768 && r.md ? r.md : v >= 640 && r.sm ? r.sm : r.base;
}
function ra(t) {
  const c = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return c >= 1536 ? "2xl" : c >= 1280 ? "xl" : c >= 1024 ? "lg" : c >= 768 ? "md" : c >= 640 ? "sm" : "base";
}
function ia(t) {
  return t.reduce((v, r) => Math.max(v, r.top + r.columnHeight), 0) + 500;
}
function sa(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function ua(t, c = 0) {
  return {
    style: sa(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": c
  };
}
function Oe(t, c) {
  if (!t.length || c <= 0)
    return new Array(Math.max(1, c)).fill(0);
  const r = Array.from(new Set(t.map((y) => y.left))).sort((y, d) => y - d).slice(0, c), I = /* @__PURE__ */ new Map();
  for (let y = 0; y < r.length; y++) I.set(r[y], y);
  const w = new Array(r.length).fill(0);
  for (const y of t) {
    const d = I.get(y.left);
    d != null && (w[d] = Math.max(w[d], y.top + y.columnHeight));
  }
  for (; w.length < c; ) w.push(0);
  return w;
}
function va(t, c) {
  let v = 0, r = 0;
  const I = 1e3;
  function w(s, E) {
    var z;
    const f = (z = t.container) == null ? void 0 : z.value;
    if (f) {
      const A = f.scrollTop, m = f.clientHeight;
      v = A - I, r = A + m + I;
    }
    return s + E >= v && s <= r;
  }
  function y(s, E) {
    const f = parseInt(s.dataset.left || "0", 10), N = parseInt(s.dataset.top || "0", 10), z = parseInt(s.dataset.index || "0", 10), A = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(N, A)) {
      s.style.opacity = "1", s.style.transform = `translate3d(${f}px, ${N}px, 0) scale(1)`, s.style.transition = "none", E();
      return;
    }
    const m = Math.min(z * 20, 160), o = s.style.getPropertyValue("--masonry-opacity-delay");
    s.style.setProperty("--masonry-opacity-delay", `${m}ms`), requestAnimationFrame(() => {
      s.style.opacity = "1", s.style.transform = `translate3d(${f}px, ${N}px, 0) scale(1)`;
      const P = () => {
        o ? s.style.setProperty("--masonry-opacity-delay", o) : s.style.removeProperty("--masonry-opacity-delay"), s.removeEventListener("transitionend", P), E();
      };
      s.addEventListener("transitionend", P);
    });
  }
  function d(s) {
    const E = parseInt(s.dataset.left || "0", 10), f = parseInt(s.dataset.top || "0", 10);
    s.style.opacity = "0", s.style.transform = `translate3d(${E}px, ${f + 10}px, 0) scale(0.985)`;
  }
  function k(s) {
    const E = parseInt(s.dataset.left || "0", 10), f = parseInt(s.dataset.top || "0", 10), N = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(f, N)) {
      s.style.transition = "none";
      return;
    }
    s.style.transition = "none", s.style.opacity = "1", s.style.transform = `translate3d(${E}px, ${f}px, 0) scale(1)`, s.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      s.style.transition = "";
    });
  }
  function S(s, E) {
    const f = parseInt(s.dataset.left || "0", 10), N = parseInt(s.dataset.top || "0", 10), z = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(N, z)) {
      s.style.transition = "none", s.style.opacity = "0", E();
      return;
    }
    const A = typeof (c == null ? void 0 : c.leaveDurationMs) == "number" ? c.leaveDurationMs : NaN;
    let m = Number.isFinite(A) && A > 0 ? A : NaN;
    if (!Number.isFinite(m)) {
      const p = getComputedStyle(s).getPropertyValue("--masonry-leave-duration") || "", D = parseFloat(p);
      m = Number.isFinite(D) && D > 0 ? D : 200;
    }
    const o = s.style.transitionDuration, P = () => {
      s.removeEventListener("transitionend", u), clearTimeout(b), s.style.transitionDuration = o || "";
    }, u = ($) => {
      (!$ || $.target === s) && (P(), E());
    }, b = setTimeout(() => {
      P(), E();
    }, m + 100);
    requestAnimationFrame(() => {
      s.style.transitionDuration = `${m}ms`, s.style.opacity = "0", s.style.transform = `translate3d(${f}px, ${N + 10}px, 0) scale(0.985)`, s.addEventListener("transitionend", u);
    });
  }
  return {
    onEnter: y,
    onBeforeEnter: d,
    onBeforeLeave: k,
    onLeave: S
  };
}
function ca({
  container: t,
  masonry: c,
  columns: v,
  containerHeight: r,
  isLoading: I,
  pageSize: w,
  refreshLayout: y,
  setItemsRaw: d,
  loadNext: k,
  loadThresholdPx: S
}) {
  let s = 0;
  async function E(f) {
    if (!t.value) return;
    const N = f ?? Oe(c.value, v.value), z = N.length ? Math.max(...N) : 0, A = t.value.scrollTop + t.value.clientHeight, m = t.value.scrollTop > s + 1;
    s = t.value.scrollTop;
    const o = typeof S == "number" ? S : 200, P = o >= 0 ? Math.max(0, z - o) : Math.max(0, z + o);
    if (A >= P && m && !I.value) {
      await k(), await G();
      return;
    }
  }
  return {
    handleScroll: E
  };
}
const fa = { class: "flex-1 relative min-h-0" }, da = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ha = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ma = {
  key: 1,
  class: "relative w-full h-full"
}, ga = ["src"], pa = ["src", "autoplay", "controls"], ya = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, wa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, xa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, ke = /* @__PURE__ */ it({
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
  setup(t, { emit: c }) {
    const v = t, r = c, I = L(!1), w = L(!1), y = L(null), d = L(!1), k = L(!1), S = L(null), s = L(!1), E = L(!1), f = L(!1), N = L(null), z = L(null);
    let A = null;
    const m = le(() => {
      var l;
      return v.type ?? ((l = v.item) == null ? void 0 : l.type) ?? "image";
    }), o = le(() => {
      var l;
      return v.notFound ?? ((l = v.item) == null ? void 0 : l.notFound) ?? !1;
    }), P = le(() => !!v.inSwipeMode);
    function u(l) {
      r("mouse-enter", { item: v.item, type: l });
    }
    function b(l) {
      r("mouse-leave", { item: v.item, type: l });
    }
    function $(l) {
      if (P.value) return;
      const g = l.target;
      g && (g.paused ? g.play() : g.pause());
    }
    function p(l) {
      const g = l.target;
      g && (P.value || g.play(), u("video"));
    }
    function D(l) {
      const g = l.target;
      g && (P.value || g.pause(), b("video"));
    }
    function x(l) {
      return new Promise((g, F) => {
        if (!l) {
          const O = new Error("No image source provided");
          r("preload:error", { item: v.item, type: "image", src: l, error: O }), F(O);
          return;
        }
        const q = new Image(), J = Date.now(), U = 300;
        q.onload = () => {
          const O = Date.now() - J, fe = Math.max(0, U - O);
          setTimeout(async () => {
            I.value = !0, w.value = !1, E.value = !1, await G(), await new Promise((ue) => setTimeout(ue, 100)), f.value = !0, r("preload:success", { item: v.item, type: "image", src: l }), g();
          }, fe);
        }, q.onerror = () => {
          w.value = !0, I.value = !1, E.value = !1;
          const O = new Error("Failed to load image");
          r("preload:error", { item: v.item, type: "image", src: l, error: O }), F(O);
        }, q.src = l;
      });
    }
    function M(l) {
      return new Promise((g, F) => {
        if (!l) {
          const O = new Error("No video source provided");
          r("preload:error", { item: v.item, type: "video", src: l, error: O }), F(O);
          return;
        }
        const q = document.createElement("video"), J = Date.now(), U = 300;
        q.preload = "metadata", q.muted = !0, q.onloadedmetadata = () => {
          const O = Date.now() - J, fe = Math.max(0, U - O);
          setTimeout(async () => {
            d.value = !0, k.value = !1, E.value = !1, await G(), await new Promise((ue) => setTimeout(ue, 100)), f.value = !0, r("preload:success", { item: v.item, type: "video", src: l }), g();
          }, fe);
        }, q.onerror = () => {
          k.value = !0, d.value = !1, E.value = !1;
          const O = new Error("Failed to load video");
          r("preload:error", { item: v.item, type: "video", src: l, error: O }), F(O);
        }, q.src = l;
      });
    }
    async function Y() {
      var g;
      if (!s.value || E.value || o.value || m.value === "video" && d.value || m.value === "image" && I.value)
        return;
      const l = (g = v.item) == null ? void 0 : g.src;
      if (l)
        if (E.value = !0, f.value = !1, m.value === "video") {
          S.value = l, d.value = !1, k.value = !1;
          try {
            await M(l);
          } catch {
          }
        } else {
          y.value = l, I.value = !1, w.value = !1;
          try {
            await x(l);
          } catch {
          }
        }
    }
    return st(() => {
      N.value && (A = new IntersectionObserver(
        (l) => {
          l.forEach((g) => {
            g.isIntersecting && g.intersectionRatio >= 1 ? s.value || (s.value = !0, Y()) : g.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), A.observe(N.value));
    }), ut(() => {
      A && (A.disconnect(), A = null);
    }), ce(
      () => {
        var l;
        return (l = v.item) == null ? void 0 : l.src;
      },
      async (l) => {
        if (!(!l || o.value)) {
          if (m.value === "video") {
            if (l !== S.value && (d.value = !1, k.value = !1, S.value = l, s.value)) {
              E.value = !0;
              try {
                await M(l);
              } catch {
              }
            }
          } else if (l !== y.value && (I.value = !1, w.value = !1, y.value = l, s.value)) {
            E.value = !0;
            try {
              await x(l);
            } catch {
            }
          }
        }
      }
    ), ce(
      () => v.isActive,
      (l) => {
        !P.value || !z.value || (l ? z.value.play() : z.value.pause());
      }
    ), (l, g) => (C(), j("div", {
      ref_key: "containerRef",
      ref: N,
      class: "relative w-full h-full flex flex-col"
    }, [
      l.headerHeight > 0 ? (C(), j("div", {
        key: 0,
        class: "relative z-10",
        style: Te({ height: `${l.headerHeight}px` })
      }, [
        ee(l.$slots, "header", {
          item: l.item,
          remove: l.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: d.value,
          videoError: k.value,
          showNotFound: o.value,
          isLoading: E.value,
          mediaType: m.value
        })
      ], 4)) : se("", !0),
      V("div", fa, [
        ee(l.$slots, "default", {
          item: l.item,
          remove: l.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: d.value,
          videoError: k.value,
          showNotFound: o.value,
          isLoading: E.value,
          mediaType: m.value,
          imageSrc: y.value,
          videoSrc: S.value,
          showMedia: f.value
        }, () => [
          V("div", da, [
            o.value ? (C(), j("div", ha, g[3] || (g[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (C(), j("div", ma, [
              m.value === "image" && y.value ? (C(), j("img", {
                key: 0,
                src: y.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  I.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: g[0] || (g[0] = (F) => u("image")),
                onMouseleave: g[1] || (g[1] = (F) => b("image"))
              }, null, 42, ga)) : se("", !0),
              m.value === "video" && S.value ? (C(), j("video", {
                key: 1,
                ref_key: "videoEl",
                ref: z,
                src: S.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  d.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: P.value && v.isActive,
                controls: P.value,
                onClick: Qe($, ["stop"]),
                onTouchend: Qe($, ["stop", "prevent"]),
                onMouseenter: p,
                onMouseleave: D,
                onError: g[2] || (g[2] = (F) => k.value = !0)
              }, null, 42, pa)) : se("", !0),
              !I.value && !d.value && !w.value && !k.value ? (C(), j("div", {
                key: 2,
                class: me([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  f.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ya, [
                  ee(l.$slots, "placeholder-icon", { mediaType: m.value }, () => [
                    V("i", {
                      class: me(m.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : se("", !0),
              E.value ? (C(), j("div", wa, g[4] || (g[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : se("", !0),
              m.value === "image" && w.value || m.value === "video" && k.value ? (C(), j("div", xa, [
                V("i", {
                  class: me(m.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Ae(m.value), 1)
              ])) : se("", !0)
            ]))
          ])
        ])
      ]),
      l.footerHeight > 0 ? (C(), j("div", {
        key: 1,
        class: "relative z-10",
        style: Te({ height: `${l.footerHeight}px` })
      }, [
        ee(l.$slots, "footer", {
          item: l.item,
          remove: l.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: d.value,
          videoError: k.value,
          showNotFound: o.value,
          isLoading: E.value,
          mediaType: m.value
        })
      ], 4)) : se("", !0)
    ], 512));
  }
}), ba = { class: "w-full h-full flex items-center justify-center p-4" }, Ma = { class: "w-full h-full max-w-full max-h-full relative" }, Ta = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ea = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ia = { class: "text-red-500 dark:text-red-400" }, ka = {
  key: 0,
  class: "w-full py-8 text-center"
}, La = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ha = { class: "text-red-500 dark:text-red-400" }, Sa = /* @__PURE__ */ it({
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
  setup(t, { expose: c, emit: v }) {
    const r = t, I = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, w = le(() => {
      var e;
      return {
        ...I,
        ...r.layout,
        sizes: {
          ...I.sizes,
          ...((e = r.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), y = L(null), d = L(typeof window < "u" ? window.innerWidth : 1024), k = L(typeof window < "u" ? window.innerHeight : 768), S = L(null);
    let s = null;
    function E(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const f = le(() => {
      if (r.layoutMode === "masonry") return !1;
      if (r.layoutMode === "swipe") return !0;
      const e = typeof r.mobileBreakpoint == "string" ? E(r.mobileBreakpoint) : r.mobileBreakpoint;
      return d.value < e;
    }), N = le(() => {
      if (!f.value || o.value.length === 0) return null;
      const e = Math.max(0, Math.min(l.value, o.value.length - 1));
      return o.value[e] || null;
    }), z = le(() => {
      if (!f.value || !N.value) return null;
      const e = l.value + 1;
      return e >= o.value.length ? null : o.value[e] || null;
    }), A = le(() => {
      if (!f.value || !N.value) return null;
      const e = l.value - 1;
      return e < 0 ? null : o.value[e] || null;
    }), m = v, o = le({
      get: () => r.items,
      set: (e) => m("update:items", e)
    }), P = L(7), u = L(null), b = L([]), $ = L(null), p = L(!1), D = L(0), x = L(!1), M = L(null), Y = le(() => ra(d.value)), l = L(0), g = L(0), F = L(!1), q = L(0), J = L(0), U = L(null), O = L(/* @__PURE__ */ new Set());
    function fe(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function ue(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const n = e.filter((i) => !fe(i == null ? void 0 : i.width) || !fe(i == null ? void 0 : i.height));
        if (n.length === 0) return;
        const h = [];
        for (const i of n) {
          const W = (i == null ? void 0 : i.id) ?? `idx:${e.indexOf(i)}`;
          O.value.has(W) || (O.value.add(W), h.push(W));
        }
        if (h.length > 0) {
          const i = h.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: h.length,
              sampleIds: i,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const T = L(0), B = L(0), te = r.virtualBufferPx, K = L(!1), Q = L({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), ne = (e) => {
      if (!u.value) return;
      const { scrollTop: a, clientHeight: n } = u.value, h = a + n, i = e ?? Oe(o.value, P.value), W = i.length ? Math.max(...i) : 0, H = typeof r.loadThresholdPx == "number" ? r.loadThresholdPx : 200, R = H >= 0 ? Math.max(0, W - H) : Math.max(0, W + H), ae = Math.max(0, R - h), ie = ae <= 100;
      Q.value = {
        distanceToTrigger: Math.round(ae),
        isNearTrigger: ie
      };
    }, { onEnter: oe, onBeforeEnter: ft, onBeforeLeave: dt, onLeave: ht } = va(
      { container: u },
      { leaveDurationMs: r.leaveDurationMs }
    );
    function mt(e, a) {
      if (K.value) {
        const n = parseInt(e.dataset.left || "0", 10), h = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${n}px, ${h}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        oe(e, a);
    }
    function gt(e) {
      if (K.value) {
        const a = parseInt(e.dataset.left || "0", 10), n = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${n}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ft(e);
    }
    function pt(e) {
      K.value || dt(e);
    }
    function yt(e, a) {
      K.value ? a() : ht(e, a);
    }
    const wt = le(() => {
      const e = T.value - te, a = T.value + B.value + te, n = o.value;
      return !n || n.length === 0 ? [] : n.filter((i) => {
        if (typeof i.top != "number" || typeof i.columnHeight != "number")
          return !0;
        const W = i.top;
        return i.top + i.columnHeight >= e && W <= a;
      });
    }), { handleScroll: xt } = ca({
      container: u,
      masonry: o,
      columns: P,
      containerHeight: D,
      isLoading: p,
      pageSize: r.pageSize,
      refreshLayout: Z,
      setItemsRaw: (e) => {
        o.value = e;
      },
      loadNext: ge,
      loadThresholdPx: r.loadThresholdPx
    });
    function bt(e) {
      S.value = e, e ? (e.width !== void 0 && (d.value = e.width), e.height !== void 0 && (k.value = e.height), !f.value && u.value && o.value.length > 0 && G(() => {
        P.value = pe(w.value, d.value), Z(o.value), ne();
      })) : y.value && (d.value = y.value.clientWidth, k.value = y.value.clientHeight);
    }
    c({
      isLoading: p,
      refreshLayout: Z,
      // Container dimensions (wrapper element)
      containerWidth: d,
      containerHeight: k,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: D,
      // Current page
      currentPage: $,
      // End of list tracking
      hasReachedEnd: x,
      // Load error tracking
      loadError: M,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: bt,
      remove: ye,
      removeMany: Tt,
      removeAll: Lt,
      restore: Et,
      restoreMany: It,
      loadNext: ge,
      loadPage: He,
      refreshCurrentPage: Se,
      reset: St,
      destroy: Pt,
      init: Ge,
      restoreItems: Je,
      paginationHistory: b,
      cancelLoad: Pe,
      scrollToTop: Re,
      scrollTo: kt,
      totalItems: le(() => o.value.length),
      currentBreakpoint: Y
    });
    function Le(e) {
      const a = ia(e);
      let n = 0;
      if (u.value) {
        const { scrollTop: h, clientHeight: i } = u.value;
        n = h + i + 100;
      }
      D.value = Math.max(a, n);
    }
    let de = [];
    function Z(e) {
      var i, W;
      if (f.value) {
        o.value = e;
        return;
      }
      if (!u.value) return;
      if (ue(e, "refreshLayout"), e.length > 1e3 && de.length > e.length && de.length - e.length < 100) {
        let H = !0;
        for (let R = 0; R < e.length; R++)
          if (((i = e[R]) == null ? void 0 : i.id) !== ((W = de[R]) == null ? void 0 : W.id)) {
            H = !1;
            break;
          }
        if (H) {
          const R = e.map((ae, ie) => ({
            ...de[ie],
            originalIndex: ie
          }));
          Le(R), o.value = R, de = R;
          return;
        }
      }
      const n = e.map((H, R) => ({
        ...H,
        originalIndex: R
      })), h = u.value;
      if (S.value && S.value.width !== void 0) {
        const H = h.style.width, R = h.style.boxSizing;
        h.style.boxSizing = "border-box", h.style.width = `${S.value.width}px`, h.offsetWidth;
        const ae = tt(n, h, P.value, w.value);
        h.style.width = H, h.style.boxSizing = R, Le(ae), o.value = ae, de = ae;
      } else {
        const H = tt(n, h, P.value, w.value);
        Le(H), o.value = H, de = H;
      }
    }
    function ze(e, a) {
      return new Promise((n) => {
        const h = Math.max(0, e | 0), i = Date.now();
        a(h, h);
        const W = setInterval(() => {
          if (_.value) {
            clearInterval(W), n();
            return;
          }
          const H = Date.now() - i, R = Math.max(0, h - H);
          a(R, h), R <= 0 && (clearInterval(W), n());
        }, 100);
      });
    }
    async function Ee(e) {
      try {
        const a = await Mt(() => r.getNextPage(e));
        return Z([...o.value, ...a.items]), a;
      } catch (a) {
        throw a;
      }
    }
    async function Mt(e) {
      let a = 0;
      const n = r.retryMaxAttempts;
      let h = r.retryInitialDelayMs;
      for (; ; )
        try {
          const i = await e();
          return a > 0 && m("retry:stop", { attempt: a, success: !0 }), i;
        } catch (i) {
          if (a++, a > n)
            throw m("retry:stop", { attempt: a - 1, success: !1 }), i;
          m("retry:start", { attempt: a, max: n, totalMs: h }), await ze(h, (W, H) => {
            m("retry:tick", { attempt: a, remainingMs: W, totalMs: H });
          }), h += r.retryBackoffStepMs;
        }
    }
    async function He(e) {
      if (!p.value) {
        _.value = !1, p.value = !0, x.value = !1, M.value = null;
        try {
          const a = o.value.length;
          if (_.value) return;
          const n = await Ee(e);
          return _.value ? void 0 : (M.value = null, $.value = e, b.value.push(n.nextPage), n.nextPage == null && (x.value = !0), await we(a), n);
        } catch (a) {
          throw M.value = a instanceof Error ? a : new Error(String(a)), a;
        } finally {
          p.value = !1;
        }
      }
    }
    async function ge() {
      if (!p.value && !x.value) {
        _.value = !1, p.value = !0, M.value = null;
        try {
          const e = o.value.length;
          if (_.value) return;
          const a = b.value[b.value.length - 1];
          if (a == null) {
            x.value = !0, p.value = !1;
            return;
          }
          const n = await Ee(a);
          return _.value ? void 0 : (M.value = null, $.value = a, b.value.push(n.nextPage), n.nextPage == null && (x.value = !0), await we(e), n);
        } catch (e) {
          throw M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function Se() {
      if (!p.value) {
        _.value = !1, p.value = !0;
        try {
          const e = $.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", $.value, "paginationHistory:", b.value);
            return;
          }
          o.value = [], D.value = 0, x.value = !1, M.value = null, b.value = [e], await G();
          const a = await Ee(e);
          if (_.value) return;
          M.value = null, $.value = e, b.value.push(a.nextPage), a.nextPage == null && (x.value = !0);
          const n = o.value.length;
          return await we(n), a;
        } catch (e) {
          throw M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function ye(e) {
      const a = o.value.filter((n) => n.id !== e.id);
      if (o.value = a, await G(), a.length === 0 && b.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Se();
        else
          try {
            await ge(), await we(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((n) => requestAnimationFrame(() => n())), requestAnimationFrame(() => {
        Z(a);
      });
    }
    async function Tt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((h) => h.id)), n = o.value.filter((h) => !a.has(h.id));
      if (o.value = n, await G(), n.length === 0 && b.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Se();
        else
          try {
            await ge(), await we(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((h) => requestAnimationFrame(() => h())), requestAnimationFrame(() => {
        Z(n);
      });
    }
    async function Et(e, a) {
      if (!e) return;
      const n = o.value;
      if (n.findIndex((H) => H.id === e.id) !== -1) return;
      const i = [...n], W = Math.min(a, i.length);
      i.splice(W, 0, e), o.value = i, await G(), f.value || (await new Promise((H) => requestAnimationFrame(() => H())), requestAnimationFrame(() => {
        Z(i);
      }));
    }
    async function It(e, a) {
      var Ke;
      if (!e || e.length === 0) return;
      if (!a || a.length !== e.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      const n = o.value, h = new Set(n.map((X) => X.id)), i = [];
      for (let X = 0; X < e.length; X++)
        h.has((Ke = e[X]) == null ? void 0 : Ke.id) || i.push({ item: e[X], index: a[X] });
      if (i.length === 0) return;
      const W = /* @__PURE__ */ new Map();
      for (const { item: X, index: $t } of i)
        W.set($t, X);
      const H = i.length > 0 ? Math.max(...i.map(({ index: X }) => X)) : -1, R = Math.max(n.length - 1, H), ae = [];
      let ie = 0;
      for (let X = 0; X <= R; X++)
        W.has(X) ? ae.push(W.get(X)) : ie < n.length && (ae.push(n[ie]), ie++);
      for (; ie < n.length; )
        ae.push(n[ie]), ie++;
      o.value = ae, await G(), f.value || (await new Promise((X) => requestAnimationFrame(() => X())), requestAnimationFrame(() => {
        Z(ae);
      }));
    }
    function Re(e) {
      u.value && u.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    function kt(e) {
      u.value && (u.value.scrollTo({
        top: e.top ?? u.value.scrollTop,
        left: e.left ?? u.value.scrollLeft,
        behavior: e.behavior ?? "auto"
      }), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight || window.innerHeight));
    }
    async function Lt() {
      Re({ behavior: "smooth" }), o.value = [], k.value = 0, await G(), m("remove-all:complete");
    }
    function Ht() {
      P.value = pe(w.value, d.value), Z(o.value), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight);
    }
    let re = !1;
    const _ = L(!1);
    async function we(e, a = !1) {
      if (!a && !r.backfillEnabled || re || _.value || x.value) return;
      const n = (e || 0) + (r.pageSize || 0);
      if (!r.pageSize || r.pageSize <= 0) return;
      if (b.value[b.value.length - 1] == null) {
        x.value = !0;
        return;
      }
      if (!(o.value.length >= n)) {
        re = !0, p.value = !0;
        try {
          let i = 0;
          for (m("backfill:start", { target: n, fetched: o.value.length, calls: i }); o.value.length < n && i < r.backfillMaxCalls && b.value[b.value.length - 1] != null && !_.value && !x.value && re && (await ze(r.backfillDelayMs, (H, R) => {
            m("backfill:tick", {
              fetched: o.value.length,
              target: n,
              calls: i,
              remainingMs: H,
              totalMs: R
            });
          }), !(_.value || !re)); ) {
            const W = b.value[b.value.length - 1];
            if (W == null) {
              x.value = !0;
              break;
            }
            try {
              if (_.value || !re) break;
              const H = await Ee(W);
              if (_.value || !re) break;
              M.value = null, b.value.push(H.nextPage), H.nextPage == null && (x.value = !0);
            } catch (H) {
              if (_.value || !re) break;
              M.value = H instanceof Error ? H : new Error(String(H));
            }
            i++;
          }
          m("backfill:stop", { fetched: o.value.length, calls: i });
        } finally {
          re = !1, p.value = !1;
        }
      }
    }
    function Pe() {
      const e = re;
      _.value = !0, p.value = !1, re = !1, e && m("backfill:stop", { fetched: o.value.length, calls: 0, cancelled: !0 });
    }
    function St() {
      Pe(), _.value = !1, u.value && u.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], k.value = 0, $.value = r.loadAtPage, b.value = [r.loadAtPage], x.value = !1, M.value = null, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function Pt() {
      Pe(), o.value = [], D.value = 0, $.value = null, b.value = [], x.value = !1, M.value = null, p.value = !1, re = !1, _.value = !1, l.value = 0, g.value = 0, F.value = !1, T.value = 0, B.value = 0, K.value = !1, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, O.value.clear(), u.value && u.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const he = ot(async () => {
      if (f.value) return;
      if (u.value) {
        const a = u.value.scrollTop, n = u.value.clientHeight || window.innerHeight, h = n > 0 ? n : window.innerHeight;
        T.value = a, B.value = h;
      }
      K.value = !0, await G(), await new Promise((a) => requestAnimationFrame(() => a())), K.value = !1;
      const e = Oe(o.value, P.value);
      xt(e), ne(e);
    }, 200), je = ot(Ht, 200);
    function Ce(e) {
      f.value && (F.value = !0, q.value = e.touches[0].clientY, J.value = g.value, e.preventDefault());
    }
    function qe(e) {
      if (!f.value || !F.value) return;
      const a = e.touches[0].clientY - q.value;
      g.value = J.value + a, e.preventDefault();
    }
    function Ve(e) {
      if (!f.value || !F.value) return;
      F.value = !1;
      const a = g.value - J.value;
      Math.abs(a) > 100 ? a > 0 && A.value ? _e() : a < 0 && z.value ? Ue() : ve() : ve(), e.preventDefault();
    }
    function Ye(e) {
      f.value && (F.value = !0, q.value = e.clientY, J.value = g.value, e.preventDefault());
    }
    function $e(e) {
      if (!f.value || !F.value) return;
      const a = e.clientY - q.value;
      g.value = J.value + a, e.preventDefault();
    }
    function Ne(e) {
      if (!f.value || !F.value) return;
      F.value = !1;
      const a = g.value - J.value;
      Math.abs(a) > 100 ? a > 0 && A.value ? _e() : a < 0 && z.value ? Ue() : ve() : ve(), e.preventDefault();
    }
    function Ue() {
      if (!z.value) {
        ge();
        return;
      }
      l.value++, ve(), l.value >= o.value.length - 5 && ge();
    }
    function _e() {
      A.value && (l.value--, ve());
    }
    function ve() {
      if (!U.value) return;
      const e = U.value.clientHeight;
      g.value = -l.value * e;
    }
    function Xe() {
      !f.value && l.value > 0 && (l.value = 0, g.value = 0), f.value && o.value.length === 0 && !p.value && He(b.value[0]), f.value && ve();
    }
    function Ge(e, a, n) {
      $.value = a, b.value = [a], b.value.push(n), x.value = n == null, ue(e, "init"), f.value ? (o.value = [...o.value, ...e], l.value === 0 && o.value.length > 0 && (g.value = 0)) : (Z([...o.value, ...e]), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight || window.innerHeight), G(() => {
        u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight || window.innerHeight, ne());
      }));
    }
    async function Je(e, a, n) {
      if (!r.skipInitialLoad) {
        Ge(e, a, n);
        return;
      }
      $.value = a, b.value = [a], n != null && b.value.push(n), x.value = n == null, M.value = null, ue(e, "restoreItems"), f.value ? (o.value = e, l.value === 0 && o.value.length > 0 && (g.value = 0)) : (Z(e), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight || window.innerHeight), await G(), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight || window.innerHeight, ne()));
    }
    return ce(
      w,
      () => {
        f.value || u.value && (P.value = pe(w.value, d.value), Z(o.value));
      },
      { deep: !0 }
    ), ce(() => r.layoutMode, () => {
      S.value && S.value.width !== void 0 ? d.value = S.value.width : y.value && (d.value = y.value.clientWidth);
    }), ce(u, (e) => {
      e && !f.value ? (e.removeEventListener("scroll", he), e.addEventListener("scroll", he, { passive: !0 })) : e && e.removeEventListener("scroll", he);
    }, { immediate: !0 }), ce(f, (e, a) => {
      a === void 0 && e === !1 || G(() => {
        e ? (document.addEventListener("mousemove", $e), document.addEventListener("mouseup", Ne), u.value && u.value.removeEventListener("scroll", he), l.value = 0, g.value = 0, o.value.length > 0 && ve()) : (document.removeEventListener("mousemove", $e), document.removeEventListener("mouseup", Ne), u.value && y.value && (S.value && S.value.width !== void 0 ? d.value = S.value.width : d.value = y.value.clientWidth, u.value.removeEventListener("scroll", he), u.value.addEventListener("scroll", he, { passive: !0 }), o.value.length > 0 && (P.value = pe(w.value, d.value), Z(o.value), T.value = u.value.scrollTop, B.value = u.value.clientHeight, ne())));
      });
    }, { immediate: !0 }), ce(U, (e) => {
      e && (e.addEventListener("touchstart", Ce, { passive: !1 }), e.addEventListener("touchmove", qe, { passive: !1 }), e.addEventListener("touchend", Ve), e.addEventListener("mousedown", Ye));
    }), ce(() => o.value.length, (e, a) => {
      f.value && e > 0 && a === 0 && (l.value = 0, G(() => ve()));
    }), ce(y, (e) => {
      s && (s.disconnect(), s = null), e && typeof ResizeObserver < "u" ? (s = new ResizeObserver((a) => {
        if (!S.value)
          for (const n of a) {
            const h = n.contentRect.width, i = n.contentRect.height;
            d.value !== h && (d.value = h), k.value !== i && (k.value = i);
          }
      }), s.observe(e), S.value || (d.value = e.clientWidth, k.value = e.clientHeight)) : e && (S.value || (d.value = e.clientWidth, k.value = e.clientHeight));
    }, { immediate: !0 }), ce(d, (e, a) => {
      e !== a && e > 0 && !f.value && u.value && o.value.length > 0 && G(() => {
        P.value = pe(w.value, e), Z(o.value), ne();
      });
    }), st(async () => {
      try {
        await G(), y.value && !s && (d.value = y.value.clientWidth, k.value = y.value.clientHeight), f.value || (P.value = pe(w.value, d.value), u.value && (T.value = u.value.scrollTop, B.value = u.value.clientHeight));
        const e = r.loadAtPage;
        if (b.value = [e], !r.skipInitialLoad)
          await He(b.value[0]);
        else if (r.items && r.items.length > 0) {
          const a = r.items[0], n = r.items[r.items.length - 1], h = (a == null ? void 0 : a.page) ?? e ?? 1, i = (n == null ? void 0 : n.next) ?? null;
          await Je(r.items, h, i);
        } else
          $.value = e, b.value = [e];
        f.value ? G(() => ve()) : ne();
      } catch (e) {
        M.value || (console.error("Error during component initialization:", e), M.value = e instanceof Error ? e : new Error(String(e))), p.value = !1;
      }
      window.addEventListener("resize", je), window.addEventListener("resize", Xe);
    }), ut(() => {
      var e;
      s && (s.disconnect(), s = null), (e = u.value) == null || e.removeEventListener("scroll", he), window.removeEventListener("resize", je), window.removeEventListener("resize", Xe), U.value && (U.value.removeEventListener("touchstart", Ce), U.value.removeEventListener("touchmove", qe), U.value.removeEventListener("touchend", Ve), U.value.removeEventListener("mousedown", Ye)), document.removeEventListener("mousemove", $e), document.removeEventListener("mouseup", Ne);
    }), (e, a) => (C(), j("div", {
      ref_key: "wrapper",
      ref: y,
      class: "w-full h-full flex flex-col relative"
    }, [
      f.value ? (C(), j("div", {
        key: 0,
        class: me(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": r.forceMotion, "cursor-grab": !F.value, "cursor-grabbing": F.value }]),
        ref_key: "swipeContainer",
        ref: U,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: Te({
            transform: `translateY(${g.value}px)`,
            transition: F.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${o.value.length * 100}%`
          })
        }, [
          (C(!0), j(Ze, null, et(o.value, (n, h) => (C(), j("div", {
            key: `${n.page}-${n.id}`,
            class: "absolute top-0 left-0 w-full",
            style: Te({
              top: `${h * (100 / o.value.length)}%`,
              height: `${100 / o.value.length}%`
            })
          }, [
            V("div", ba, [
              V("div", Ma, [
                ee(e.$slots, "default", {
                  item: n,
                  remove: ye,
                  index: n.originalIndex ?? r.items.indexOf(n)
                }, () => [
                  Fe(ke, {
                    item: n,
                    remove: ye,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": h === l.value,
                    "onPreload:success": a[0] || (a[0] = (i) => m("item:preload:success", i)),
                    "onPreload:error": a[1] || (a[1] = (i) => m("item:preload:error", i)),
                    onMouseEnter: a[2] || (a[2] = (i) => m("item:mouse-enter", i)),
                    onMouseLeave: a[3] || (a[3] = (i) => m("item:mouse-leave", i))
                  }, {
                    header: xe((i) => [
                      ee(e.$slots, "item-header", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    footer: xe((i) => [
                      ee(e.$slots, "item-footer", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        x.value && o.value.length > 0 ? (C(), j("div", Ta, [
          ee(e.$slots, "end-message", {}, () => [
            a[8] || (a[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        M.value && o.value.length > 0 ? (C(), j("div", Ea, [
          ee(e.$slots, "error-message", { error: M.value }, () => [
            V("p", Ia, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2)) : (C(), j("div", {
        key: 1,
        class: me(["overflow-auto w-full flex-1 masonry-container", { "force-motion": r.forceMotion }]),
        ref_key: "container",
        ref: u
      }, [
        V("div", {
          class: "relative",
          style: Te({ height: `${D.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Fe(Nt, {
            name: "masonry",
            css: !1,
            onEnter: mt,
            onBeforeEnter: gt,
            onLeave: yt,
            onBeforeLeave: pt
          }, {
            default: xe(() => [
              (C(!0), j(Ze, null, et(wt.value, (n, h) => (C(), j("div", be({
                key: `${n.page}-${n.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, Ft(ua)(n, h)), [
                ee(e.$slots, "default", {
                  item: n,
                  remove: ye,
                  index: n.originalIndex ?? t.items.indexOf(n)
                }, () => [
                  Fe(ke, {
                    item: n,
                    remove: ye,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (i) => m("item:preload:success", i)),
                    "onPreload:error": a[5] || (a[5] = (i) => m("item:preload:error", i)),
                    onMouseEnter: a[6] || (a[6] = (i) => m("item:mouse-enter", i)),
                    onMouseLeave: a[7] || (a[7] = (i) => m("item:mouse-leave", i))
                  }, {
                    header: xe((i) => [
                      ee(e.$slots, "item-header", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    footer: xe((i) => [
                      ee(e.$slots, "item-footer", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        x.value && o.value.length > 0 ? (C(), j("div", ka, [
          ee(e.$slots, "end-message", {}, () => [
            a[9] || (a[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        M.value && o.value.length > 0 ? (C(), j("div", La, [
          ee(e.$slots, "error-message", { error: M.value }, () => [
            V("p", Ha, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2))
    ], 512));
  }
}), Pa = (t, c) => {
  const v = t.__vccOpts || t;
  for (const [r, I] of c)
    v[r] = I;
  return v;
}, rt = /* @__PURE__ */ Pa(Sa, [["__scopeId", "data-v-00de67ed"]]), Na = {
  install(t) {
    t.component("WyxosMasonry", rt), t.component("WMasonry", rt), t.component("WyxosMasonryItem", ke), t.component("WMasonryItem", ke);
  }
};
export {
  rt as Masonry,
  ke as MasonryItem,
  Na as default
};
