import { nextTick as G, defineComponent as rt, ref as L, computed as ne, onMounted as ot, onUnmounted as it, watch as ce, createElementBlock as j, openBlock as C, createCommentVNode as se, createElementVNode as V, normalizeStyle as Te, renderSlot as Z, normalizeClass as me, withModifiers as Je, toDisplayString as Ae, Fragment as Ke, renderList as Qe, createVNode as Fe, withCtx as xe, mergeProps as be, TransitionGroup as $t, unref as Nt } from "vue";
let Be = null;
function Ft() {
  if (Be != null) return Be;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const c = document.createElement("div");
  c.style.width = "100%", t.appendChild(c);
  const u = t.offsetWidth - c.offsetWidth;
  return document.body.removeChild(t), Be = u, u;
}
function Ze(t, c, u, o = {}) {
  const {
    gutterX: I = 0,
    gutterY: w = 0,
    header: y = 0,
    footer: f = 0,
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
    placement: T = "masonry"
  } = o;
  let d = 0, N = 0;
  try {
    if (c && c.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const x = window.getComputedStyle(c);
      d = parseFloat(x.paddingLeft) || 0, N = parseFloat(x.paddingRight) || 0;
    }
  } catch {
  }
  const z = (k || 0) + d, W = (S || 0) + N, h = c.offsetWidth - c.clientWidth, l = h > 0 ? h + 2 : Ft() + 2, P = c.offsetWidth - l - z - W, v = I * (u - 1), b = Math.floor((P - v) / u), $ = t.map((x) => {
    const M = x.width, Y = x.height;
    return Math.round(b * Y / M) + f + y;
  });
  if (T === "sequential-balanced") {
    const x = $.length;
    if (x === 0) return [];
    const M = (E, O, ee) => E + (O > 0 ? w : 0) + ee;
    let Y = Math.max(...$), n = $.reduce((E, O) => E + O, 0) + w * Math.max(0, x - 1);
    const g = (E) => {
      let O = 1, ee = 0, K = 0;
      for (let Q = 0; Q < x; Q++) {
        const le = $[Q], re = M(ee, K, le);
        if (re <= E)
          ee = re, K++;
        else if (O++, ee = le, K = 1, le > E || O > u) return !1;
      }
      return O <= u;
    };
    for (; Y < n; ) {
      const E = Math.floor((Y + n) / 2);
      g(E) ? n = E : Y = E + 1;
    }
    const F = n, q = new Array(u).fill(0);
    let J = u - 1, U = 0, D = 0;
    for (let E = x - 1; E >= 0; E--) {
      const O = $[E], ee = E < J;
      !(M(U, D, O) <= F) || ee ? (q[J] = E + 1, J--, U = O, D = 1) : (U = M(U, D, O), D++);
    }
    q[0] = 0;
    const ve = [], fe = new Array(u).fill(0);
    for (let E = 0; E < u; E++) {
      const O = q[E], ee = E + 1 < u ? q[E + 1] : x, K = E * (b + I);
      for (let Q = O; Q < ee; Q++) {
        const re = {
          ...t[Q],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        re.imageHeight = $[Q] - (f + y), re.columnHeight = $[Q], re.left = K, re.top = fe[E], fe[E] += re.columnHeight + (Q + 1 < ee ? w : 0), ve.push(re);
      }
    }
    return ve;
  }
  const p = new Array(u).fill(0), A = [];
  for (let x = 0; x < t.length; x++) {
    const M = t[x], Y = {
      ...M,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = p.indexOf(Math.min(...p)), g = M.width, F = M.height;
    Y.columnWidth = b, Y.left = n * (b + I), Y.imageHeight = Math.round(b * F / g), Y.columnHeight = Y.imageHeight + f + y, Y.top = p[n], p[n] += Y.columnHeight + w, A.push(Y);
  }
  return A;
}
var Bt = typeof global == "object" && global && global.Object === Object && global, Wt = typeof self == "object" && self && self.Object === Object && self, st = Bt || Wt || Function("return this")(), Ie = st.Symbol, ut = Object.prototype, At = ut.hasOwnProperty, Dt = ut.toString, Me = Ie ? Ie.toStringTag : void 0;
function Ot(t) {
  var c = At.call(t, Me), u = t[Me];
  try {
    t[Me] = void 0;
    var o = !0;
  } catch {
  }
  var I = Dt.call(t);
  return o && (c ? t[Me] = u : delete t[Me]), I;
}
var zt = Object.prototype, Rt = zt.toString;
function jt(t) {
  return Rt.call(t);
}
var Ct = "[object Null]", qt = "[object Undefined]", et = Ie ? Ie.toStringTag : void 0;
function Vt(t) {
  return t == null ? t === void 0 ? qt : Ct : et && et in Object(t) ? Ot(t) : jt(t);
}
function Yt(t) {
  return t != null && typeof t == "object";
}
var Ut = "[object Symbol]";
function _t(t) {
  return typeof t == "symbol" || Yt(t) && Vt(t) == Ut;
}
var Xt = /\s/;
function Gt(t) {
  for (var c = t.length; c-- && Xt.test(t.charAt(c)); )
    ;
  return c;
}
var Jt = /^\s+/;
function Kt(t) {
  return t && t.slice(0, Gt(t) + 1).replace(Jt, "");
}
function De(t) {
  var c = typeof t;
  return t != null && (c == "object" || c == "function");
}
var tt = NaN, Qt = /^[-+]0x[0-9a-f]+$/i, Zt = /^0b[01]+$/i, ea = /^0o[0-7]+$/i, ta = parseInt;
function at(t) {
  if (typeof t == "number")
    return t;
  if (_t(t))
    return tt;
  if (De(t)) {
    var c = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = De(c) ? c + "" : c;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Kt(t);
  var u = Zt.test(t);
  return u || ea.test(t) ? ta(t.slice(2), u ? 2 : 8) : Qt.test(t) ? tt : +t;
}
var We = function() {
  return st.Date.now();
}, aa = "Expected a function", na = Math.max, la = Math.min;
function nt(t, c, u) {
  var o, I, w, y, f, k, S = 0, s = !1, T = !1, d = !0;
  if (typeof t != "function")
    throw new TypeError(aa);
  c = at(c) || 0, De(u) && (s = !!u.leading, T = "maxWait" in u, w = T ? na(at(u.maxWait) || 0, c) : w, d = "trailing" in u ? !!u.trailing : d);
  function N(p) {
    var A = o, x = I;
    return o = I = void 0, S = p, y = t.apply(x, A), y;
  }
  function z(p) {
    return S = p, f = setTimeout(l, c), s ? N(p) : y;
  }
  function W(p) {
    var A = p - k, x = p - S, M = c - A;
    return T ? la(M, w - x) : M;
  }
  function h(p) {
    var A = p - k, x = p - S;
    return k === void 0 || A >= c || A < 0 || T && x >= w;
  }
  function l() {
    var p = We();
    if (h(p))
      return P(p);
    f = setTimeout(l, W(p));
  }
  function P(p) {
    return f = void 0, d && o ? N(p) : (o = I = void 0, y);
  }
  function v() {
    f !== void 0 && clearTimeout(f), S = 0, o = k = I = f = void 0;
  }
  function b() {
    return f === void 0 ? y : P(We());
  }
  function $() {
    var p = We(), A = h(p);
    if (o = arguments, I = this, k = p, A) {
      if (f === void 0)
        return z(k);
      if (T)
        return clearTimeout(f), f = setTimeout(l, c), N(k);
    }
    return f === void 0 && (f = setTimeout(l, c)), y;
  }
  return $.cancel = v, $.flush = b, $;
}
function pe(t, c) {
  const u = c ?? (typeof window < "u" ? window.innerWidth : 1024), o = t.sizes;
  return u >= 1536 && o["2xl"] ? o["2xl"] : u >= 1280 && o.xl ? o.xl : u >= 1024 && o.lg ? o.lg : u >= 768 && o.md ? o.md : u >= 640 && o.sm ? o.sm : o.base;
}
function ra(t) {
  const c = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return c >= 1536 ? "2xl" : c >= 1280 ? "xl" : c >= 1024 ? "lg" : c >= 768 ? "md" : c >= 640 ? "sm" : "base";
}
function oa(t) {
  return t.reduce((u, o) => Math.max(u, o.top + o.columnHeight), 0) + 500;
}
function ia(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function sa(t, c = 0) {
  return {
    style: ia(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": c
  };
}
function Oe(t, c) {
  if (!t.length || c <= 0)
    return new Array(Math.max(1, c)).fill(0);
  const o = Array.from(new Set(t.map((y) => y.left))).sort((y, f) => y - f).slice(0, c), I = /* @__PURE__ */ new Map();
  for (let y = 0; y < o.length; y++) I.set(o[y], y);
  const w = new Array(o.length).fill(0);
  for (const y of t) {
    const f = I.get(y.left);
    f != null && (w[f] = Math.max(w[f], y.top + y.columnHeight));
  }
  for (; w.length < c; ) w.push(0);
  return w;
}
function ua(t, c) {
  let u = 0, o = 0;
  const I = 1e3;
  function w(s, T) {
    var z;
    const d = (z = t.container) == null ? void 0 : z.value;
    if (d) {
      const W = d.scrollTop, h = d.clientHeight;
      u = W - I, o = W + h + I;
    }
    return s + T >= u && s <= o;
  }
  function y(s, T) {
    const d = parseInt(s.dataset.left || "0", 10), N = parseInt(s.dataset.top || "0", 10), z = parseInt(s.dataset.index || "0", 10), W = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(N, W)) {
      s.style.opacity = "1", s.style.transform = `translate3d(${d}px, ${N}px, 0) scale(1)`, s.style.transition = "none", T();
      return;
    }
    const h = Math.min(z * 20, 160), l = s.style.getPropertyValue("--masonry-opacity-delay");
    s.style.setProperty("--masonry-opacity-delay", `${h}ms`), requestAnimationFrame(() => {
      s.style.opacity = "1", s.style.transform = `translate3d(${d}px, ${N}px, 0) scale(1)`;
      const P = () => {
        l ? s.style.setProperty("--masonry-opacity-delay", l) : s.style.removeProperty("--masonry-opacity-delay"), s.removeEventListener("transitionend", P), T();
      };
      s.addEventListener("transitionend", P);
    });
  }
  function f(s) {
    const T = parseInt(s.dataset.left || "0", 10), d = parseInt(s.dataset.top || "0", 10);
    s.style.opacity = "0", s.style.transform = `translate3d(${T}px, ${d + 10}px, 0) scale(0.985)`;
  }
  function k(s) {
    const T = parseInt(s.dataset.left || "0", 10), d = parseInt(s.dataset.top || "0", 10), N = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(d, N)) {
      s.style.transition = "none";
      return;
    }
    s.style.transition = "none", s.style.opacity = "1", s.style.transform = `translate3d(${T}px, ${d}px, 0) scale(1)`, s.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      s.style.transition = "";
    });
  }
  function S(s, T) {
    const d = parseInt(s.dataset.left || "0", 10), N = parseInt(s.dataset.top || "0", 10), z = s.offsetHeight || parseInt(getComputedStyle(s).height || "200", 10) || 200;
    if (!w(N, z)) {
      s.style.transition = "none", s.style.opacity = "0", T();
      return;
    }
    const W = typeof (c == null ? void 0 : c.leaveDurationMs) == "number" ? c.leaveDurationMs : NaN;
    let h = Number.isFinite(W) && W > 0 ? W : NaN;
    if (!Number.isFinite(h)) {
      const p = getComputedStyle(s).getPropertyValue("--masonry-leave-duration") || "", A = parseFloat(p);
      h = Number.isFinite(A) && A > 0 ? A : 200;
    }
    const l = s.style.transitionDuration, P = () => {
      s.removeEventListener("transitionend", v), clearTimeout(b), s.style.transitionDuration = l || "";
    }, v = ($) => {
      (!$ || $.target === s) && (P(), T());
    }, b = setTimeout(() => {
      P(), T();
    }, h + 100);
    requestAnimationFrame(() => {
      s.style.transitionDuration = `${h}ms`, s.style.opacity = "0", s.style.transform = `translate3d(${d}px, ${N + 10}px, 0) scale(0.985)`, s.addEventListener("transitionend", v);
    });
  }
  return {
    onEnter: y,
    onBeforeEnter: f,
    onBeforeLeave: k,
    onLeave: S
  };
}
function ca({
  container: t,
  masonry: c,
  columns: u,
  containerHeight: o,
  isLoading: I,
  pageSize: w,
  refreshLayout: y,
  setItemsRaw: f,
  loadNext: k,
  loadThresholdPx: S
}) {
  let s = 0;
  async function T(d) {
    if (!t.value) return;
    const N = d ?? Oe(c.value, u.value), z = N.length ? Math.max(...N) : 0, W = t.value.scrollTop + t.value.clientHeight, h = t.value.scrollTop > s + 1;
    s = t.value.scrollTop;
    const l = typeof S == "number" ? S : 200, P = l >= 0 ? Math.max(0, z - l) : Math.max(0, z + l);
    if (W >= P && h && !I.value) {
      await k(), await G();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
const va = { class: "flex-1 relative min-h-0" }, fa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, da = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, ha = {
  key: 1,
  class: "relative w-full h-full"
}, ma = ["src"], ga = ["src", "autoplay", "controls"], pa = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ya = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, wa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, ke = /* @__PURE__ */ rt({
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
    const u = t, o = c, I = L(!1), w = L(!1), y = L(null), f = L(!1), k = L(!1), S = L(null), s = L(!1), T = L(!1), d = L(!1), N = L(null), z = L(null);
    let W = null;
    const h = ne(() => {
      var n;
      return u.type ?? ((n = u.item) == null ? void 0 : n.type) ?? "image";
    }), l = ne(() => {
      var n;
      return u.notFound ?? ((n = u.item) == null ? void 0 : n.notFound) ?? !1;
    }), P = ne(() => !!u.inSwipeMode);
    function v(n) {
      o("mouse-enter", { item: u.item, type: n });
    }
    function b(n) {
      o("mouse-leave", { item: u.item, type: n });
    }
    function $(n) {
      if (P.value) return;
      const g = n.target;
      g && (g.paused ? g.play() : g.pause());
    }
    function p(n) {
      const g = n.target;
      g && (P.value || g.play(), v("video"));
    }
    function A(n) {
      const g = n.target;
      g && (P.value || g.pause(), b("video"));
    }
    function x(n) {
      return new Promise((g, F) => {
        if (!n) {
          const D = new Error("No image source provided");
          o("preload:error", { item: u.item, type: "image", src: n, error: D }), F(D);
          return;
        }
        const q = new Image(), J = Date.now(), U = 300;
        q.onload = () => {
          const D = Date.now() - J, ve = Math.max(0, U - D);
          setTimeout(async () => {
            I.value = !0, w.value = !1, T.value = !1, await G(), await new Promise((fe) => setTimeout(fe, 100)), d.value = !0, o("preload:success", { item: u.item, type: "image", src: n }), g();
          }, ve);
        }, q.onerror = () => {
          w.value = !0, I.value = !1, T.value = !1;
          const D = new Error("Failed to load image");
          o("preload:error", { item: u.item, type: "image", src: n, error: D }), F(D);
        }, q.src = n;
      });
    }
    function M(n) {
      return new Promise((g, F) => {
        if (!n) {
          const D = new Error("No video source provided");
          o("preload:error", { item: u.item, type: "video", src: n, error: D }), F(D);
          return;
        }
        const q = document.createElement("video"), J = Date.now(), U = 300;
        q.preload = "metadata", q.muted = !0, q.onloadedmetadata = () => {
          const D = Date.now() - J, ve = Math.max(0, U - D);
          setTimeout(async () => {
            f.value = !0, k.value = !1, T.value = !1, await G(), await new Promise((fe) => setTimeout(fe, 100)), d.value = !0, o("preload:success", { item: u.item, type: "video", src: n }), g();
          }, ve);
        }, q.onerror = () => {
          k.value = !0, f.value = !1, T.value = !1;
          const D = new Error("Failed to load video");
          o("preload:error", { item: u.item, type: "video", src: n, error: D }), F(D);
        }, q.src = n;
      });
    }
    async function Y() {
      var g;
      if (!s.value || T.value || l.value || h.value === "video" && f.value || h.value === "image" && I.value)
        return;
      const n = (g = u.item) == null ? void 0 : g.src;
      if (n)
        if (T.value = !0, d.value = !1, h.value === "video") {
          S.value = n, f.value = !1, k.value = !1;
          try {
            await M(n);
          } catch {
          }
        } else {
          y.value = n, I.value = !1, w.value = !1;
          try {
            await x(n);
          } catch {
          }
        }
    }
    return ot(() => {
      N.value && (W = new IntersectionObserver(
        (n) => {
          n.forEach((g) => {
            g.isIntersecting && g.intersectionRatio >= 1 ? s.value || (s.value = !0, Y()) : g.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), W.observe(N.value));
    }), it(() => {
      W && (W.disconnect(), W = null);
    }), ce(
      () => {
        var n;
        return (n = u.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || l.value)) {
          if (h.value === "video") {
            if (n !== S.value && (f.value = !1, k.value = !1, S.value = n, s.value)) {
              T.value = !0;
              try {
                await M(n);
              } catch {
              }
            }
          } else if (n !== y.value && (I.value = !1, w.value = !1, y.value = n, s.value)) {
            T.value = !0;
            try {
              await x(n);
            } catch {
            }
          }
        }
      }
    ), ce(
      () => u.isActive,
      (n) => {
        !P.value || !z.value || (n ? z.value.play() : z.value.pause());
      }
    ), (n, g) => (C(), j("div", {
      ref_key: "containerRef",
      ref: N,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (C(), j("div", {
        key: 0,
        class: "relative z-10",
        style: Te({ height: `${n.headerHeight}px` })
      }, [
        Z(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: k.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: h.value
        })
      ], 4)) : se("", !0),
      V("div", va, [
        Z(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: k.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: h.value,
          imageSrc: y.value,
          videoSrc: S.value,
          showMedia: d.value
        }, () => [
          V("div", fa, [
            l.value ? (C(), j("div", da, g[3] || (g[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (C(), j("div", ha, [
              h.value === "image" && y.value ? (C(), j("img", {
                key: 0,
                src: y.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  I.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: g[0] || (g[0] = (F) => v("image")),
                onMouseleave: g[1] || (g[1] = (F) => b("image"))
              }, null, 42, ma)) : se("", !0),
              h.value === "video" && S.value ? (C(), j("video", {
                key: 1,
                ref_key: "videoEl",
                ref: z,
                src: S.value,
                class: me([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  f.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: P.value && u.isActive,
                controls: P.value,
                onClick: Je($, ["stop"]),
                onTouchend: Je($, ["stop", "prevent"]),
                onMouseenter: p,
                onMouseleave: A,
                onError: g[2] || (g[2] = (F) => k.value = !0)
              }, null, 42, ga)) : se("", !0),
              !I.value && !f.value && !w.value && !k.value ? (C(), j("div", {
                key: 2,
                class: me([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  d.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", pa, [
                  Z(n.$slots, "placeholder-icon", { mediaType: h.value }, () => [
                    V("i", {
                      class: me(h.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                    }, null, 2)
                  ])
                ])
              ], 2)) : se("", !0),
              T.value ? (C(), j("div", ya, g[4] || (g[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : se("", !0),
              h.value === "image" && w.value || h.value === "video" && k.value ? (C(), j("div", wa, [
                V("i", {
                  class: me(h.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Ae(h.value), 1)
              ])) : se("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (C(), j("div", {
        key: 1,
        class: "relative z-10",
        style: Te({ height: `${n.footerHeight}px` })
      }, [
        Z(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: w.value,
          videoLoaded: f.value,
          videoError: k.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: h.value
        })
      ], 4)) : se("", !0)
    ], 512));
  }
}), xa = { class: "w-full h-full flex items-center justify-center p-4" }, ba = { class: "w-full h-full max-w-full max-h-full relative" }, Ma = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ta = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ea = { class: "text-red-500 dark:text-red-400" }, Ia = {
  key: 0,
  class: "w-full py-8 text-center"
}, ka = {
  key: 1,
  class: "w-full py-8 text-center"
}, La = { class: "text-red-500 dark:text-red-400" }, Ha = /* @__PURE__ */ rt({
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
  setup(t, { expose: c, emit: u }) {
    const o = t, I = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, w = ne(() => {
      var e;
      return {
        ...I,
        ...o.layout,
        sizes: {
          ...I.sizes,
          ...((e = o.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), y = L(null), f = L(typeof window < "u" ? window.innerWidth : 1024), k = L(typeof window < "u" ? window.innerHeight : 768), S = L(null);
    let s = null;
    function T(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const d = ne(() => {
      if (o.layoutMode === "masonry") return !1;
      if (o.layoutMode === "swipe") return !0;
      const e = typeof o.mobileBreakpoint == "string" ? T(o.mobileBreakpoint) : o.mobileBreakpoint;
      return f.value < e;
    }), N = ne(() => {
      if (!d.value || l.value.length === 0) return null;
      const e = Math.max(0, Math.min(n.value, l.value.length - 1));
      return l.value[e] || null;
    }), z = ne(() => {
      if (!d.value || !N.value) return null;
      const e = n.value + 1;
      return e >= l.value.length ? null : l.value[e] || null;
    }), W = ne(() => {
      if (!d.value || !N.value) return null;
      const e = n.value - 1;
      return e < 0 ? null : l.value[e] || null;
    }), h = u, l = ne({
      get: () => o.items,
      set: (e) => h("update:items", e)
    }), P = L(7), v = L(null), b = L([]), $ = L(null), p = L(!1), A = L(0), x = L(!1), M = L(null), Y = ne(() => ra(f.value)), n = L(0), g = L(0), F = L(!1), q = L(0), J = L(0), U = L(null), D = L(/* @__PURE__ */ new Set());
    function ve(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function fe(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const r = e.filter((i) => !ve(i == null ? void 0 : i.width) || !ve(i == null ? void 0 : i.height));
        if (r.length === 0) return;
        const m = [];
        for (const i of r) {
          const B = (i == null ? void 0 : i.id) ?? `idx:${e.indexOf(i)}`;
          D.value.has(B) || (D.value.add(B), m.push(B));
        }
        if (m.length > 0) {
          const i = m.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: m.length,
              sampleIds: i,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const E = L(0), O = L(0), ee = o.virtualBufferPx, K = L(!1), Q = L({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), le = (e) => {
      if (!v.value) return;
      const { scrollTop: a, clientHeight: r } = v.value, m = a + r, i = e ?? Oe(l.value, P.value), B = i.length ? Math.max(...i) : 0, H = typeof o.loadThresholdPx == "number" ? o.loadThresholdPx : 200, R = H >= 0 ? Math.max(0, B - H) : Math.max(0, B + H), ae = Math.max(0, R - m), ie = ae <= 100;
      Q.value = {
        distanceToTrigger: Math.round(ae),
        isNearTrigger: ie
      };
    }, { onEnter: re, onBeforeEnter: ct, onBeforeLeave: vt, onLeave: ft } = ua(
      { container: v },
      { leaveDurationMs: o.leaveDurationMs }
    );
    function dt(e, a) {
      if (K.value) {
        const r = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${r}px, ${m}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        re(e, a);
    }
    function ht(e) {
      if (K.value) {
        const a = parseInt(e.dataset.left || "0", 10), r = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${r}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ct(e);
    }
    function mt(e) {
      K.value || vt(e);
    }
    function gt(e, a) {
      K.value ? a() : ft(e, a);
    }
    const pt = ne(() => {
      const e = E.value - ee, a = E.value + O.value + ee, r = l.value;
      return !r || r.length === 0 ? [] : r.filter((i) => {
        if (typeof i.top != "number" || typeof i.columnHeight != "number")
          return !0;
        const B = i.top;
        return i.top + i.columnHeight >= e && B <= a;
      });
    }), { handleScroll: yt } = ca({
      container: v,
      masonry: l,
      columns: P,
      containerHeight: A,
      isLoading: p,
      pageSize: o.pageSize,
      refreshLayout: te,
      setItemsRaw: (e) => {
        l.value = e;
      },
      loadNext: ge,
      loadThresholdPx: o.loadThresholdPx
    });
    function wt(e) {
      S.value = e, e ? (e.width !== void 0 && (f.value = e.width), e.height !== void 0 && (k.value = e.height), !d.value && v.value && l.value.length > 0 && G(() => {
        P.value = pe(w.value, f.value), te(l.value), le();
      })) : y.value && (f.value = y.value.clientWidth, k.value = y.value.clientHeight);
    }
    c({
      isLoading: p,
      refreshLayout: te,
      // Container dimensions (wrapper element)
      containerWidth: f,
      containerHeight: k,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: A,
      // Current page
      currentPage: $,
      // End of list tracking
      hasReachedEnd: x,
      // Load error tracking
      loadError: M,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: wt,
      remove: ye,
      removeMany: bt,
      removeAll: It,
      restore: Mt,
      restoreMany: Tt,
      loadNext: ge,
      loadPage: He,
      refreshCurrentPage: Se,
      reset: Lt,
      destroy: Ht,
      init: St,
      paginationHistory: b,
      cancelLoad: Pe,
      scrollToTop: Re,
      scrollTo: Et,
      totalItems: ne(() => l.value.length),
      currentBreakpoint: Y
    });
    function Le(e) {
      const a = oa(e);
      let r = 0;
      if (v.value) {
        const { scrollTop: m, clientHeight: i } = v.value;
        r = m + i + 100;
      }
      A.value = Math.max(a, r);
    }
    let de = [];
    function te(e) {
      var i, B;
      if (d.value) {
        l.value = e;
        return;
      }
      if (!v.value) return;
      if (fe(e, "refreshLayout"), e.length > 1e3 && de.length > e.length && de.length - e.length < 100) {
        let H = !0;
        for (let R = 0; R < e.length; R++)
          if (((i = e[R]) == null ? void 0 : i.id) !== ((B = de[R]) == null ? void 0 : B.id)) {
            H = !1;
            break;
          }
        if (H) {
          const R = e.map((ae, ie) => ({
            ...de[ie],
            originalIndex: ie
          }));
          Le(R), l.value = R, de = R;
          return;
        }
      }
      const r = e.map((H, R) => ({
        ...H,
        originalIndex: R
      })), m = v.value;
      if (S.value && S.value.width !== void 0) {
        const H = m.style.width, R = m.style.boxSizing;
        m.style.boxSizing = "border-box", m.style.width = `${S.value.width}px`, m.offsetWidth;
        const ae = Ze(r, m, P.value, w.value);
        m.style.width = H, m.style.boxSizing = R, Le(ae), l.value = ae, de = ae;
      } else {
        const H = Ze(r, m, P.value, w.value);
        Le(H), l.value = H, de = H;
      }
    }
    function ze(e, a) {
      return new Promise((r) => {
        const m = Math.max(0, e | 0), i = Date.now();
        a(m, m);
        const B = setInterval(() => {
          if (_.value) {
            clearInterval(B), r();
            return;
          }
          const H = Date.now() - i, R = Math.max(0, m - H);
          a(R, m), R <= 0 && (clearInterval(B), r());
        }, 100);
      });
    }
    async function Ee(e) {
      try {
        const a = await xt(() => o.getNextPage(e));
        return te([...l.value, ...a.items]), a;
      } catch (a) {
        throw a;
      }
    }
    async function xt(e) {
      let a = 0;
      const r = o.retryMaxAttempts;
      let m = o.retryInitialDelayMs;
      for (; ; )
        try {
          const i = await e();
          return a > 0 && h("retry:stop", { attempt: a, success: !0 }), i;
        } catch (i) {
          if (a++, a > r)
            throw h("retry:stop", { attempt: a - 1, success: !1 }), i;
          h("retry:start", { attempt: a, max: r, totalMs: m }), await ze(m, (B, H) => {
            h("retry:tick", { attempt: a, remainingMs: B, totalMs: H });
          }), m += o.retryBackoffStepMs;
        }
    }
    async function He(e) {
      if (!p.value) {
        _.value = !1, p.value = !0, x.value = !1, M.value = null;
        try {
          const a = l.value.length;
          if (_.value) return;
          const r = await Ee(e);
          return _.value ? void 0 : (M.value = null, $.value = e, b.value.push(r.nextPage), r.nextPage == null && (x.value = !0), await we(a), r);
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
          const e = l.value.length;
          if (_.value) return;
          const a = b.value[b.value.length - 1];
          if (a == null) {
            x.value = !0, p.value = !1;
            return;
          }
          const r = await Ee(a);
          return _.value ? void 0 : (M.value = null, $.value = a, b.value.push(r.nextPage), r.nextPage == null && (x.value = !0), await we(e), r);
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
          l.value = [], A.value = 0, x.value = !1, M.value = null, b.value = [e], await G();
          const a = await Ee(e);
          if (_.value) return;
          M.value = null, $.value = e, b.value.push(a.nextPage), a.nextPage == null && (x.value = !0);
          const r = l.value.length;
          return await we(r), a;
        } catch (e) {
          throw M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function ye(e) {
      const a = l.value.filter((r) => r.id !== e.id);
      if (l.value = a, await G(), a.length === 0 && b.value.length > 0) {
        if (o.autoRefreshOnEmpty)
          await Se();
        else
          try {
            await ge(), await we(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((r) => requestAnimationFrame(() => r())), requestAnimationFrame(() => {
        te(a);
      });
    }
    async function bt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((m) => m.id)), r = l.value.filter((m) => !a.has(m.id));
      if (l.value = r, await G(), r.length === 0 && b.value.length > 0) {
        if (o.autoRefreshOnEmpty)
          await Se();
        else
          try {
            await ge(), await we(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((m) => requestAnimationFrame(() => m())), requestAnimationFrame(() => {
        te(r);
      });
    }
    async function Mt(e, a) {
      if (!e) return;
      const r = l.value;
      if (r.findIndex((H) => H.id === e.id) !== -1) return;
      const i = [...r], B = Math.min(a, i.length);
      i.splice(B, 0, e), l.value = i, await G(), d.value || (await new Promise((H) => requestAnimationFrame(() => H())), requestAnimationFrame(() => {
        te(i);
      }));
    }
    async function Tt(e, a) {
      var Ge;
      if (!e || e.length === 0) return;
      if (!a || a.length !== e.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      const r = l.value, m = new Set(r.map((X) => X.id)), i = [];
      for (let X = 0; X < e.length; X++)
        m.has((Ge = e[X]) == null ? void 0 : Ge.id) || i.push({ item: e[X], index: a[X] });
      if (i.length === 0) return;
      const B = /* @__PURE__ */ new Map();
      for (const { item: X, index: Pt } of i)
        B.set(Pt, X);
      const H = i.length > 0 ? Math.max(...i.map(({ index: X }) => X)) : -1, R = Math.max(r.length - 1, H), ae = [];
      let ie = 0;
      for (let X = 0; X <= R; X++)
        B.has(X) ? ae.push(B.get(X)) : ie < r.length && (ae.push(r[ie]), ie++);
      for (; ie < r.length; )
        ae.push(r[ie]), ie++;
      l.value = ae, await G(), d.value || (await new Promise((X) => requestAnimationFrame(() => X())), requestAnimationFrame(() => {
        te(ae);
      }));
    }
    function Re(e) {
      v.value && v.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    function Et(e) {
      v.value && (v.value.scrollTo({
        top: e.top ?? v.value.scrollTop,
        left: e.left ?? v.value.scrollLeft,
        behavior: e.behavior ?? "auto"
      }), v.value && (E.value = v.value.scrollTop, O.value = v.value.clientHeight || window.innerHeight));
    }
    async function It() {
      Re({ behavior: "smooth" }), l.value = [], k.value = 0, await G(), h("remove-all:complete");
    }
    function kt() {
      P.value = pe(w.value, f.value), te(l.value), v.value && (E.value = v.value.scrollTop, O.value = v.value.clientHeight);
    }
    let oe = !1;
    const _ = L(!1);
    async function we(e, a = !1) {
      if (!a && !o.backfillEnabled || oe || _.value || x.value) return;
      const r = (e || 0) + (o.pageSize || 0);
      if (!o.pageSize || o.pageSize <= 0) return;
      if (b.value[b.value.length - 1] == null) {
        x.value = !0;
        return;
      }
      if (!(l.value.length >= r)) {
        oe = !0, p.value = !0;
        try {
          let i = 0;
          for (h("backfill:start", { target: r, fetched: l.value.length, calls: i }); l.value.length < r && i < o.backfillMaxCalls && b.value[b.value.length - 1] != null && !_.value && !x.value && oe && (await ze(o.backfillDelayMs, (H, R) => {
            h("backfill:tick", {
              fetched: l.value.length,
              target: r,
              calls: i,
              remainingMs: H,
              totalMs: R
            });
          }), !(_.value || !oe)); ) {
            const B = b.value[b.value.length - 1];
            if (B == null) {
              x.value = !0;
              break;
            }
            try {
              if (_.value || !oe) break;
              const H = await Ee(B);
              if (_.value || !oe) break;
              M.value = null, b.value.push(H.nextPage), H.nextPage == null && (x.value = !0);
            } catch (H) {
              if (_.value || !oe) break;
              M.value = H instanceof Error ? H : new Error(String(H));
            }
            i++;
          }
          h("backfill:stop", { fetched: l.value.length, calls: i });
        } finally {
          oe = !1, p.value = !1;
        }
      }
    }
    function Pe() {
      const e = oe;
      _.value = !0, p.value = !1, oe = !1, e && h("backfill:stop", { fetched: l.value.length, calls: 0, cancelled: !0 });
    }
    function Lt() {
      Pe(), _.value = !1, v.value && v.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), l.value = [], k.value = 0, $.value = o.loadAtPage, b.value = [o.loadAtPage], x.value = !1, M.value = null, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function Ht() {
      Pe(), l.value = [], A.value = 0, $.value = null, b.value = [], x.value = !1, M.value = null, p.value = !1, oe = !1, _.value = !1, n.value = 0, g.value = 0, F.value = !1, E.value = 0, O.value = 0, K.value = !1, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, D.value.clear(), v.value && v.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const he = nt(async () => {
      if (d.value) return;
      if (v.value) {
        const a = v.value.scrollTop, r = v.value.clientHeight || window.innerHeight, m = r > 0 ? r : window.innerHeight;
        E.value = a, O.value = m;
      }
      K.value = !0, await G(), await new Promise((a) => requestAnimationFrame(() => a())), K.value = !1;
      const e = Oe(l.value, P.value);
      yt(e), le(e);
    }, 200), je = nt(kt, 200);
    function Ce(e) {
      d.value && (F.value = !0, q.value = e.touches[0].clientY, J.value = g.value, e.preventDefault());
    }
    function qe(e) {
      if (!d.value || !F.value) return;
      const a = e.touches[0].clientY - q.value;
      g.value = J.value + a, e.preventDefault();
    }
    function Ve(e) {
      if (!d.value || !F.value) return;
      F.value = !1;
      const a = g.value - J.value;
      Math.abs(a) > 100 ? a > 0 && W.value ? _e() : a < 0 && z.value ? Ue() : ue() : ue(), e.preventDefault();
    }
    function Ye(e) {
      d.value && (F.value = !0, q.value = e.clientY, J.value = g.value, e.preventDefault());
    }
    function $e(e) {
      if (!d.value || !F.value) return;
      const a = e.clientY - q.value;
      g.value = J.value + a, e.preventDefault();
    }
    function Ne(e) {
      if (!d.value || !F.value) return;
      F.value = !1;
      const a = g.value - J.value;
      Math.abs(a) > 100 ? a > 0 && W.value ? _e() : a < 0 && z.value ? Ue() : ue() : ue(), e.preventDefault();
    }
    function Ue() {
      if (!z.value) {
        ge();
        return;
      }
      n.value++, ue(), n.value >= l.value.length - 5 && ge();
    }
    function _e() {
      W.value && (n.value--, ue());
    }
    function ue() {
      if (!U.value) return;
      const e = U.value.clientHeight;
      g.value = -n.value * e;
    }
    function Xe() {
      !d.value && n.value > 0 && (n.value = 0, g.value = 0), d.value && l.value.length === 0 && !p.value && He(b.value[0]), d.value && ue();
    }
    function St(e, a, r) {
      $.value = a, b.value = [a], b.value.push(r), x.value = r == null, fe(e, "init"), d.value ? (l.value = [...l.value, ...e], n.value === 0 && l.value.length > 0 && (g.value = 0)) : (te([...l.value, ...e]), v.value && (E.value = v.value.scrollTop, O.value = v.value.clientHeight || window.innerHeight), G(() => {
        v.value && (E.value = v.value.scrollTop, O.value = v.value.clientHeight || window.innerHeight, le());
      }));
    }
    return ce(
      w,
      () => {
        d.value || v.value && (P.value = pe(w.value, f.value), te(l.value));
      },
      { deep: !0 }
    ), ce(() => o.layoutMode, () => {
      S.value && S.value.width !== void 0 ? f.value = S.value.width : y.value && (f.value = y.value.clientWidth);
    }), ce(v, (e) => {
      e && !d.value ? (e.removeEventListener("scroll", he), e.addEventListener("scroll", he, { passive: !0 })) : e && e.removeEventListener("scroll", he);
    }, { immediate: !0 }), ce(d, (e, a) => {
      a === void 0 && e === !1 || G(() => {
        e ? (document.addEventListener("mousemove", $e), document.addEventListener("mouseup", Ne), v.value && v.value.removeEventListener("scroll", he), n.value = 0, g.value = 0, l.value.length > 0 && ue()) : (document.removeEventListener("mousemove", $e), document.removeEventListener("mouseup", Ne), v.value && y.value && (S.value && S.value.width !== void 0 ? f.value = S.value.width : f.value = y.value.clientWidth, v.value.removeEventListener("scroll", he), v.value.addEventListener("scroll", he, { passive: !0 }), l.value.length > 0 && (P.value = pe(w.value, f.value), te(l.value), E.value = v.value.scrollTop, O.value = v.value.clientHeight, le())));
      });
    }, { immediate: !0 }), ce(U, (e) => {
      e && (e.addEventListener("touchstart", Ce, { passive: !1 }), e.addEventListener("touchmove", qe, { passive: !1 }), e.addEventListener("touchend", Ve), e.addEventListener("mousedown", Ye));
    }), ce(() => l.value.length, (e, a) => {
      d.value && e > 0 && a === 0 && (n.value = 0, G(() => ue()));
    }), ce(y, (e) => {
      s && (s.disconnect(), s = null), e && typeof ResizeObserver < "u" ? (s = new ResizeObserver((a) => {
        if (!S.value)
          for (const r of a) {
            const m = r.contentRect.width, i = r.contentRect.height;
            f.value !== m && (f.value = m), k.value !== i && (k.value = i);
          }
      }), s.observe(e), S.value || (f.value = e.clientWidth, k.value = e.clientHeight)) : e && (S.value || (f.value = e.clientWidth, k.value = e.clientHeight));
    }, { immediate: !0 }), ce(f, (e, a) => {
      e !== a && e > 0 && !d.value && v.value && l.value.length > 0 && G(() => {
        P.value = pe(w.value, e), te(l.value), le();
      });
    }), ot(async () => {
      try {
        await G(), y.value && !s && (f.value = y.value.clientWidth, k.value = y.value.clientHeight), d.value || (P.value = pe(w.value, f.value), v.value && (E.value = v.value.scrollTop, O.value = v.value.clientHeight));
        const e = o.loadAtPage;
        b.value = [e], o.skipInitialLoad || await He(b.value[0]), d.value ? G(() => ue()) : le();
      } catch (e) {
        M.value || (console.error("Error during component initialization:", e), M.value = e instanceof Error ? e : new Error(String(e))), p.value = !1;
      }
      window.addEventListener("resize", je), window.addEventListener("resize", Xe);
    }), it(() => {
      var e;
      s && (s.disconnect(), s = null), (e = v.value) == null || e.removeEventListener("scroll", he), window.removeEventListener("resize", je), window.removeEventListener("resize", Xe), U.value && (U.value.removeEventListener("touchstart", Ce), U.value.removeEventListener("touchmove", qe), U.value.removeEventListener("touchend", Ve), U.value.removeEventListener("mousedown", Ye)), document.removeEventListener("mousemove", $e), document.removeEventListener("mouseup", Ne);
    }), (e, a) => (C(), j("div", {
      ref_key: "wrapper",
      ref: y,
      class: "w-full h-full flex flex-col relative"
    }, [
      d.value ? (C(), j("div", {
        key: 0,
        class: me(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": o.forceMotion, "cursor-grab": !F.value, "cursor-grabbing": F.value }]),
        ref_key: "swipeContainer",
        ref: U,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: Te({
            transform: `translateY(${g.value}px)`,
            transition: F.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${l.value.length * 100}%`
          })
        }, [
          (C(!0), j(Ke, null, Qe(l.value, (r, m) => (C(), j("div", {
            key: `${r.page}-${r.id}`,
            class: "absolute top-0 left-0 w-full",
            style: Te({
              top: `${m * (100 / l.value.length)}%`,
              height: `${100 / l.value.length}%`
            })
          }, [
            V("div", xa, [
              V("div", ba, [
                Z(e.$slots, "default", {
                  item: r,
                  remove: ye,
                  index: r.originalIndex ?? o.items.indexOf(r)
                }, () => [
                  Fe(ke, {
                    item: r,
                    remove: ye,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": m === n.value,
                    "onPreload:success": a[0] || (a[0] = (i) => h("item:preload:success", i)),
                    "onPreload:error": a[1] || (a[1] = (i) => h("item:preload:error", i)),
                    onMouseEnter: a[2] || (a[2] = (i) => h("item:mouse-enter", i)),
                    onMouseLeave: a[3] || (a[3] = (i) => h("item:mouse-leave", i))
                  }, {
                    header: xe((i) => [
                      Z(e.$slots, "item-header", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    footer: xe((i) => [
                      Z(e.$slots, "item-footer", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        x.value && l.value.length > 0 ? (C(), j("div", Ma, [
          Z(e.$slots, "end-message", {}, () => [
            a[8] || (a[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        M.value && l.value.length > 0 ? (C(), j("div", Ta, [
          Z(e.$slots, "error-message", { error: M.value }, () => [
            V("p", Ea, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2)) : (C(), j("div", {
        key: 1,
        class: me(["overflow-auto w-full flex-1 masonry-container", { "force-motion": o.forceMotion }]),
        ref_key: "container",
        ref: v
      }, [
        V("div", {
          class: "relative",
          style: Te({ height: `${A.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Fe($t, {
            name: "masonry",
            css: !1,
            onEnter: dt,
            onBeforeEnter: ht,
            onLeave: gt,
            onBeforeLeave: mt
          }, {
            default: xe(() => [
              (C(!0), j(Ke, null, Qe(pt.value, (r, m) => (C(), j("div", be({
                key: `${r.page}-${r.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, Nt(sa)(r, m)), [
                Z(e.$slots, "default", {
                  item: r,
                  remove: ye,
                  index: r.originalIndex ?? t.items.indexOf(r)
                }, () => [
                  Fe(ke, {
                    item: r,
                    remove: ye,
                    "header-height": w.value.header,
                    "footer-height": w.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (i) => h("item:preload:success", i)),
                    "onPreload:error": a[5] || (a[5] = (i) => h("item:preload:error", i)),
                    onMouseEnter: a[6] || (a[6] = (i) => h("item:mouse-enter", i)),
                    onMouseLeave: a[7] || (a[7] = (i) => h("item:mouse-leave", i))
                  }, {
                    header: xe((i) => [
                      Z(e.$slots, "item-header", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    footer: xe((i) => [
                      Z(e.$slots, "item-footer", be({ ref_for: !0 }, i), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        x.value && l.value.length > 0 ? (C(), j("div", Ia, [
          Z(e.$slots, "end-message", {}, () => [
            a[9] || (a[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        M.value && l.value.length > 0 ? (C(), j("div", ka, [
          Z(e.$slots, "error-message", { error: M.value }, () => [
            V("p", La, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2))
    ], 512));
  }
}), Sa = (t, c) => {
  const u = t.__vccOpts || t;
  for (const [o, I] of c)
    u[o] = I;
  return u;
}, lt = /* @__PURE__ */ Sa(Ha, [["__scopeId", "data-v-f8a121f7"]]), $a = {
  install(t) {
    t.component("WyxosMasonry", lt), t.component("WMasonry", lt), t.component("WyxosMasonryItem", ke), t.component("WMasonryItem", ke);
  }
};
export {
  lt as Masonry,
  ke as MasonryItem,
  $a as default
};
