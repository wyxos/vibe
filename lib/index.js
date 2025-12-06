import { nextTick as Y, defineComponent as et, ref as T, computed as K, onMounted as tt, onUnmounted as at, watch as oe, createElementBlock as j, openBlock as C, createCommentVNode as re, createElementVNode as V, normalizeStyle as ge, renderSlot as le, normalizeClass as ie, withModifiers as Ye, toDisplayString as bt, Fragment as Ue, renderList as Ge, createVNode as ke, withCtx as me, mergeProps as he, TransitionGroup as xt, unref as Mt } from "vue";
let Se = null;
function Tt() {
  if (Se != null) return Se;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const c = document.createElement("div");
  c.style.width = "100%", t.appendChild(c);
  const v = t.offsetWidth - c.offsetWidth;
  return document.body.removeChild(t), Se = v, v;
}
function Xe(t, c, v, l = {}) {
  const {
    gutterX: M = 0,
    gutterY: h = 0,
    header: o = 0,
    footer: s = 0,
    paddingLeft: g = 0,
    paddingRight: b = 0,
    sizes: k = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: E = "masonry"
  } = l;
  let d = 0, D = 0;
  try {
    if (c && c.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const H = window.getComputedStyle(c);
      d = parseFloat(H.paddingLeft) || 0, D = parseFloat(H.paddingRight) || 0;
    }
  } catch {
  }
  const A = (g || 0) + d, O = (b || 0) + D, m = c.offsetWidth - c.clientWidth, r = m > 0 ? m + 2 : Tt() + 2, L = c.offsetWidth - r - A - O, w = M * (v - 1), x = Math.floor((L - w) / v), N = t.map((H) => {
    const I = H.width, S = H.height;
    return Math.round(x * S / I) + s + o;
  });
  if (E === "sequential-balanced") {
    const H = N.length;
    if (H === 0) return [];
    const I = (P, B, G) => P + (B > 0 ? h : 0) + G;
    let S = Math.max(...N), n = N.reduce((P, B) => P + B, 0) + h * Math.max(0, H - 1);
    const y = (P) => {
      let B = 1, G = 0, X = 0;
      for (let J = 0; J < H; J++) {
        const se = N[J], Z = I(G, X, se);
        if (Z <= P)
          G = Z, X++;
        else if (B++, G = se, X = 1, se > P || B > v) return !1;
      }
      return B <= v;
    };
    for (; S < n; ) {
      const P = Math.floor((S + n) / 2);
      y(P) ? n = P : S = P + 1;
    }
    const F = n, $ = new Array(v).fill(0);
    let ae = v - 1, Q = 0, W = 0;
    for (let P = H - 1; P >= 0; P--) {
      const B = N[P], G = P < ae;
      !(I(Q, W, B) <= F) || G ? ($[ae] = P + 1, ae--, Q = B, W = 1) : (Q = I(Q, W, B), W++);
    }
    $[0] = 0;
    const U = [], _ = new Array(v).fill(0);
    for (let P = 0; P < v; P++) {
      const B = $[P], G = P + 1 < v ? $[P + 1] : H, X = P * (x + M);
      for (let J = B; J < G; J++) {
        const Z = {
          ...t[J],
          columnWidth: x,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = N[J] - (s + o), Z.columnHeight = N[J], Z.left = X, Z.top = _[P], _[P] += Z.columnHeight + (J + 1 < G ? h : 0), U.push(Z);
      }
    }
    return U;
  }
  const p = new Array(v).fill(0), z = [];
  for (let H = 0; H < t.length; H++) {
    const I = t[H], S = {
      ...I,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = p.indexOf(Math.min(...p)), y = I.width, F = I.height;
    S.columnWidth = x, S.left = n * (x + M), S.imageHeight = Math.round(x * F / y), S.columnHeight = S.imageHeight + s + o, S.top = p[n], p[n] += S.columnHeight + h, z.push(S);
  }
  return z;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Lt = typeof self == "object" && self && self.Object === Object && self, nt = Et || Lt || Function("return this")(), be = nt.Symbol, ot = Object.prototype, It = ot.hasOwnProperty, kt = ot.toString, pe = be ? be.toStringTag : void 0;
function St(t) {
  var c = It.call(t, pe), v = t[pe];
  try {
    t[pe] = void 0;
    var l = !0;
  } catch {
  }
  var M = kt.call(t);
  return l && (c ? t[pe] = v : delete t[pe]), M;
}
var Pt = Object.prototype, Ht = Pt.toString;
function $t(t) {
  return Ht.call(t);
}
var Nt = "[object Null]", Wt = "[object Undefined]", _e = be ? be.toStringTag : void 0;
function Dt(t) {
  return t == null ? t === void 0 ? Wt : Nt : _e && _e in Object(t) ? St(t) : $t(t);
}
function Bt(t) {
  return t != null && typeof t == "object";
}
var zt = "[object Symbol]";
function Ft(t) {
  return typeof t == "symbol" || Bt(t) && Dt(t) == zt;
}
var At = /\s/;
function Ot(t) {
  for (var c = t.length; c-- && At.test(t.charAt(c)); )
    ;
  return c;
}
var Rt = /^\s+/;
function jt(t) {
  return t && t.slice(0, Ot(t) + 1).replace(Rt, "");
}
function He(t) {
  var c = typeof t;
  return t != null && (c == "object" || c == "function");
}
var Je = NaN, Ct = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Vt = /^0o[0-7]+$/i, Yt = parseInt;
function Ke(t) {
  if (typeof t == "number")
    return t;
  if (Ft(t))
    return Je;
  if (He(t)) {
    var c = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = He(c) ? c + "" : c;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = jt(t);
  var v = qt.test(t);
  return v || Vt.test(t) ? Yt(t.slice(2), v ? 2 : 8) : Ct.test(t) ? Je : +t;
}
var Pe = function() {
  return nt.Date.now();
}, Ut = "Expected a function", Gt = Math.max, Xt = Math.min;
function Qe(t, c, v) {
  var l, M, h, o, s, g, b = 0, k = !1, E = !1, d = !0;
  if (typeof t != "function")
    throw new TypeError(Ut);
  c = Ke(c) || 0, He(v) && (k = !!v.leading, E = "maxWait" in v, h = E ? Gt(Ke(v.maxWait) || 0, c) : h, d = "trailing" in v ? !!v.trailing : d);
  function D(p) {
    var z = l, H = M;
    return l = M = void 0, b = p, o = t.apply(H, z), o;
  }
  function A(p) {
    return b = p, s = setTimeout(r, c), k ? D(p) : o;
  }
  function O(p) {
    var z = p - g, H = p - b, I = c - z;
    return E ? Xt(I, h - H) : I;
  }
  function m(p) {
    var z = p - g, H = p - b;
    return g === void 0 || z >= c || z < 0 || E && H >= h;
  }
  function r() {
    var p = Pe();
    if (m(p))
      return L(p);
    s = setTimeout(r, O(p));
  }
  function L(p) {
    return s = void 0, d && l ? D(p) : (l = M = void 0, o);
  }
  function w() {
    s !== void 0 && clearTimeout(s), b = 0, l = g = M = s = void 0;
  }
  function x() {
    return s === void 0 ? o : L(Pe());
  }
  function N() {
    var p = Pe(), z = m(p);
    if (l = arguments, M = this, g = p, z) {
      if (s === void 0)
        return A(g);
      if (E)
        return clearTimeout(s), s = setTimeout(r, c), D(g);
    }
    return s === void 0 && (s = setTimeout(r, c)), o;
  }
  return N.cancel = w, N.flush = x, N;
}
function ve(t, c) {
  const v = c ?? (typeof window < "u" ? window.innerWidth : 1024), l = t.sizes;
  return v >= 1536 && l["2xl"] ? l["2xl"] : v >= 1280 && l.xl ? l.xl : v >= 1024 && l.lg ? l.lg : v >= 768 && l.md ? l.md : v >= 640 && l.sm ? l.sm : l.base;
}
function _t(t) {
  const c = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return c >= 1536 ? "2xl" : c >= 1280 ? "xl" : c >= 1024 ? "lg" : c >= 768 ? "md" : c >= 640 ? "sm" : "base";
}
function Jt(t) {
  return t.reduce((v, l) => Math.max(v, l.top + l.columnHeight), 0) + 500;
}
function Kt(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function Qt(t, c = 0) {
  return {
    style: Kt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": c
  };
}
function $e(t, c) {
  if (!t.length || c <= 0)
    return new Array(Math.max(1, c)).fill(0);
  const l = Array.from(new Set(t.map((o) => o.left))).sort((o, s) => o - s).slice(0, c), M = /* @__PURE__ */ new Map();
  for (let o = 0; o < l.length; o++) M.set(l[o], o);
  const h = new Array(l.length).fill(0);
  for (const o of t) {
    const s = M.get(o.left);
    s != null && (h[s] = Math.max(h[s], o.top + o.columnHeight));
  }
  for (; h.length < c; ) h.push(0);
  return h;
}
function Zt(t, c) {
  function v(o, s) {
    const g = parseInt(o.dataset.left || "0", 10), b = parseInt(o.dataset.top || "0", 10), k = parseInt(o.dataset.index || "0", 10), E = Math.min(k * 20, 160), d = o.style.getPropertyValue("--masonry-opacity-delay");
    o.style.setProperty("--masonry-opacity-delay", `${E}ms`), requestAnimationFrame(() => {
      o.style.opacity = "1", o.style.transform = `translate3d(${g}px, ${b}px, 0) scale(1)`;
      const D = () => {
        d ? o.style.setProperty("--masonry-opacity-delay", d) : o.style.removeProperty("--masonry-opacity-delay"), o.removeEventListener("transitionend", D), s();
      };
      o.addEventListener("transitionend", D);
    });
  }
  function l(o) {
    const s = parseInt(o.dataset.left || "0", 10), g = parseInt(o.dataset.top || "0", 10);
    o.style.opacity = "0", o.style.transform = `translate3d(${s}px, ${g + 10}px, 0) scale(0.985)`;
  }
  function M(o) {
    const s = parseInt(o.dataset.left || "0", 10), g = parseInt(o.dataset.top || "0", 10);
    o.style.transition = "none", o.style.opacity = "1", o.style.transform = `translate3d(${s}px, ${g}px, 0) scale(1)`, o.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      o.style.transition = "";
    });
  }
  function h(o, s) {
    const g = parseInt(o.dataset.left || "0", 10), b = parseInt(o.dataset.top || "0", 10), k = typeof (c == null ? void 0 : c.leaveDurationMs) == "number" ? c.leaveDurationMs : NaN;
    let E = Number.isFinite(k) && k > 0 ? k : NaN;
    if (!Number.isFinite(E)) {
      const r = getComputedStyle(o).getPropertyValue("--masonry-leave-duration") || "", L = parseFloat(r);
      E = Number.isFinite(L) && L > 0 ? L : 200;
    }
    const d = o.style.transitionDuration, D = () => {
      o.removeEventListener("transitionend", A), clearTimeout(O), o.style.transitionDuration = d || "";
    }, A = (m) => {
      (!m || m.target === o) && (D(), s());
    }, O = setTimeout(() => {
      D(), s();
    }, E + 100);
    requestAnimationFrame(() => {
      o.style.transitionDuration = `${E}ms`, o.style.opacity = "0", o.style.transform = `translate3d(${g}px, ${b + 10}px, 0) scale(0.985)`, o.addEventListener("transitionend", A);
    });
  }
  return {
    onEnter: v,
    onBeforeEnter: l,
    onBeforeLeave: M,
    onLeave: h
  };
}
function ea({
  container: t,
  masonry: c,
  columns: v,
  containerHeight: l,
  isLoading: M,
  pageSize: h,
  refreshLayout: o,
  setItemsRaw: s,
  loadNext: g,
  loadThresholdPx: b
}) {
  let k = 0;
  async function E(d) {
    if (!t.value) return;
    const D = d ?? $e(c.value, v.value), A = D.length ? Math.max(...D) : 0, O = t.value.scrollTop + t.value.clientHeight, m = t.value.scrollTop > k + 1;
    k = t.value.scrollTop;
    const r = typeof b == "number" ? b : 200, L = r >= 0 ? Math.max(0, A - r) : Math.max(0, A + r);
    if (O >= L && m && !M.value) {
      await g(), await Y();
      return;
    }
  }
  return {
    handleScroll: E
  };
}
const ta = { class: "flex-1 relative min-h-0" }, aa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, na = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, oa = {
  key: 1,
  class: "relative w-full h-full"
}, la = ["src"], ra = ["src", "autoplay", "controls"], ia = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, sa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ua = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ et({
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
    const v = t, l = c, M = T(!1), h = T(!1), o = T(null), s = T(!1), g = T(!1), b = T(null), k = T(!1), E = T(!1), d = T(!1), D = T(null), A = T(null);
    let O = null;
    const m = K(() => {
      var n;
      return v.type ?? ((n = v.item) == null ? void 0 : n.type) ?? "image";
    }), r = K(() => {
      var n;
      return v.notFound ?? ((n = v.item) == null ? void 0 : n.notFound) ?? !1;
    }), L = K(() => !!v.inSwipeMode);
    function w(n) {
      l("mouse-enter", { item: v.item, type: n });
    }
    function x(n) {
      l("mouse-leave", { item: v.item, type: n });
    }
    function N(n) {
      if (L.value) return;
      const y = n.target;
      y && (y.paused ? y.play() : y.pause());
    }
    function p(n) {
      const y = n.target;
      y && (L.value || y.play(), w("video"));
    }
    function z(n) {
      const y = n.target;
      y && (L.value || y.pause(), x("video"));
    }
    function H(n) {
      return new Promise((y, F) => {
        if (!n) {
          const W = new Error("No image source provided");
          l("preload:error", { item: v.item, type: "image", src: n, error: W }), F(W);
          return;
        }
        const $ = new Image(), ae = Date.now(), Q = 300;
        $.onload = () => {
          const W = Date.now() - ae, U = Math.max(0, Q - W);
          setTimeout(async () => {
            M.value = !0, h.value = !1, E.value = !1, await Y(), await new Promise((_) => setTimeout(_, 100)), d.value = !0, l("preload:success", { item: v.item, type: "image", src: n }), y();
          }, U);
        }, $.onerror = () => {
          h.value = !0, M.value = !1, E.value = !1;
          const W = new Error("Failed to load image");
          l("preload:error", { item: v.item, type: "image", src: n, error: W }), F(W);
        }, $.src = n;
      });
    }
    function I(n) {
      return new Promise((y, F) => {
        if (!n) {
          const W = new Error("No video source provided");
          l("preload:error", { item: v.item, type: "video", src: n, error: W }), F(W);
          return;
        }
        const $ = document.createElement("video"), ae = Date.now(), Q = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const W = Date.now() - ae, U = Math.max(0, Q - W);
          setTimeout(async () => {
            s.value = !0, g.value = !1, E.value = !1, await Y(), await new Promise((_) => setTimeout(_, 100)), d.value = !0, l("preload:success", { item: v.item, type: "video", src: n }), y();
          }, U);
        }, $.onerror = () => {
          g.value = !0, s.value = !1, E.value = !1;
          const W = new Error("Failed to load video");
          l("preload:error", { item: v.item, type: "video", src: n, error: W }), F(W);
        }, $.src = n;
      });
    }
    async function S() {
      var y;
      if (!k.value || E.value || r.value || m.value === "video" && s.value || m.value === "image" && M.value)
        return;
      const n = (y = v.item) == null ? void 0 : y.src;
      if (n)
        if (E.value = !0, d.value = !1, m.value === "video") {
          b.value = n, s.value = !1, g.value = !1;
          try {
            await I(n);
          } catch {
          }
        } else {
          o.value = n, M.value = !1, h.value = !1;
          try {
            await H(n);
          } catch {
          }
        }
    }
    return tt(() => {
      D.value && (O = new IntersectionObserver(
        (n) => {
          n.forEach((y) => {
            y.isIntersecting && y.intersectionRatio >= 1 ? k.value || (k.value = !0, S()) : y.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), O.observe(D.value));
    }), at(() => {
      O && (O.disconnect(), O = null);
    }), oe(
      () => {
        var n;
        return (n = v.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || r.value)) {
          if (m.value === "video") {
            if (n !== b.value && (s.value = !1, g.value = !1, b.value = n, k.value)) {
              E.value = !0;
              try {
                await I(n);
              } catch {
              }
            }
          } else if (n !== o.value && (M.value = !1, h.value = !1, o.value = n, k.value)) {
            E.value = !0;
            try {
              await H(n);
            } catch {
            }
          }
        }
      }
    ), oe(
      () => v.isActive,
      (n) => {
        !L.value || !A.value || (n ? A.value.play() : A.value.pause());
      }
    ), (n, y) => (C(), j("div", {
      ref_key: "containerRef",
      ref: D,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (C(), j("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${n.headerHeight}px` })
      }, [
        le(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: h.value,
          videoLoaded: s.value,
          videoError: g.value,
          showNotFound: r.value,
          isLoading: E.value,
          mediaType: m.value
        })
      ], 4)) : re("", !0),
      V("div", ta, [
        le(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: h.value,
          videoLoaded: s.value,
          videoError: g.value,
          showNotFound: r.value,
          isLoading: E.value,
          mediaType: m.value,
          imageSrc: o.value,
          videoSrc: b.value,
          showMedia: d.value
        }, () => [
          V("div", aa, [
            r.value ? (C(), j("div", na, y[3] || (y[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (C(), j("div", oa, [
              m.value === "image" && o.value ? (C(), j("img", {
                key: 0,
                src: o.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  M.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: y[0] || (y[0] = (F) => w("image")),
                onMouseleave: y[1] || (y[1] = (F) => x("image"))
              }, null, 42, la)) : re("", !0),
              m.value === "video" && b.value ? (C(), j("video", {
                key: 1,
                ref_key: "videoEl",
                ref: A,
                src: b.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  s.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: L.value && v.isActive,
                controls: L.value,
                onClick: Ye(N, ["stop"]),
                onTouchend: Ye(N, ["stop", "prevent"]),
                onMouseenter: p,
                onMouseleave: z,
                onError: y[2] || (y[2] = (F) => g.value = !0)
              }, null, 42, ra)) : re("", !0),
              !M.value && !s.value && !h.value && !g.value ? (C(), j("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  d.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ia, [
                  V("i", {
                    class: ie(m.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : re("", !0),
              E.value ? (C(), j("div", sa, y[4] || (y[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : re("", !0),
              m.value === "image" && h.value || m.value === "video" && g.value ? (C(), j("div", ua, [
                V("i", {
                  class: ie(m.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + bt(m.value), 1)
              ])) : re("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (C(), j("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${n.footerHeight}px` })
      }, [
        le(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: h.value,
          videoLoaded: s.value,
          videoError: g.value,
          showNotFound: r.value,
          isLoading: E.value,
          mediaType: m.value
        })
      ], 4)) : re("", !0)
    ], 512));
  }
}), ca = { class: "w-full h-full flex items-center justify-center p-4" }, va = { class: "w-full h-full max-w-full max-h-full relative" }, fa = /* @__PURE__ */ et({
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
    const l = t, M = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = K(() => {
      var e;
      return {
        ...M,
        ...l.layout,
        sizes: {
          ...M.sizes,
          ...((e = l.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), o = T(null), s = T(typeof window < "u" ? window.innerWidth : 1024), g = T(typeof window < "u" ? window.innerHeight : 768), b = T(null);
    let k = null;
    function E(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const d = K(() => {
      if (l.layoutMode === "masonry") return !1;
      if (l.layoutMode === "swipe") return !0;
      const e = typeof l.mobileBreakpoint == "string" ? E(l.mobileBreakpoint) : l.mobileBreakpoint;
      return s.value < e;
    }), D = K(() => {
      if (!d.value || r.value.length === 0) return null;
      const e = Math.max(0, Math.min(I.value, r.value.length - 1));
      return r.value[e] || null;
    }), A = K(() => {
      if (!d.value || !D.value) return null;
      const e = I.value + 1;
      return e >= r.value.length ? null : r.value[e] || null;
    }), O = K(() => {
      if (!d.value || !D.value) return null;
      const e = I.value - 1;
      return e < 0 ? null : r.value[e] || null;
    }), m = v, r = K({
      get: () => l.items,
      set: (e) => m("update:items", e)
    }), L = T(7), w = T(null), x = T([]), N = T(null), p = T(!1), z = T(0), H = K(() => _t(s.value)), I = T(0), S = T(0), n = T(!1), y = T(0), F = T(0), $ = T(null), ae = T(/* @__PURE__ */ new Set());
    function Q(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function W(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const i = e.filter((u) => !Q(u == null ? void 0 : u.width) || !Q(u == null ? void 0 : u.height));
        if (i.length === 0) return;
        const f = [];
        for (const u of i) {
          const R = (u == null ? void 0 : u.id) ?? `idx:${e.indexOf(u)}`;
          ae.value.has(R) || (ae.value.add(R), f.push(R));
        }
        if (f.length > 0) {
          const u = f.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: f.length,
              sampleIds: u,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const U = T(0), _ = T(0), P = l.virtualBufferPx, B = T(!1), G = T({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), X = (e) => {
      if (!w.value) return;
      const { scrollTop: a, clientHeight: i } = w.value, f = a + i, u = e ?? $e(r.value, L.value), R = u.length ? Math.max(...u) : 0, te = typeof l.loadThresholdPx == "number" ? l.loadThresholdPx : 200, ce = te >= 0 ? Math.max(0, R - te) : Math.max(0, R + te), Ve = Math.max(0, ce - f), wt = Ve <= 100;
      G.value = {
        distanceToTrigger: Math.round(Ve),
        isNearTrigger: wt
      };
    }, { onEnter: J, onBeforeEnter: se, onBeforeLeave: Z, onLeave: lt } = Zt(r, { leaveDurationMs: l.leaveDurationMs });
    function rt(e, a) {
      if (B.value) {
        const i = parseInt(e.dataset.left || "0", 10), f = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${i}px, ${f}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        J(e, a);
    }
    function it(e) {
      if (B.value) {
        const a = parseInt(e.dataset.left || "0", 10), i = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${i}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        se(e);
    }
    function st(e) {
      B.value || Z(e);
    }
    function ut(e, a) {
      B.value ? a() : lt(e, a);
    }
    const ct = K(() => {
      const e = U.value - P, a = U.value + _.value + P, i = r.value;
      return !i || i.length === 0 ? [] : i.filter((f) => {
        const u = f.top;
        return f.top + f.columnHeight >= e && u <= a;
      });
    }), { handleScroll: vt } = ea({
      container: w,
      masonry: r,
      columns: L,
      containerHeight: z,
      isLoading: p,
      pageSize: l.pageSize,
      refreshLayout: ee,
      setItemsRaw: (e) => {
        r.value = e;
      },
      loadNext: ue,
      loadThresholdPx: l.loadThresholdPx
    });
    function ft(e) {
      b.value = e, e ? (e.width !== void 0 && (s.value = e.width), e.height !== void 0 && (g.value = e.height), !d.value && w.value && r.value.length > 0 && Y(() => {
        L.value = ve(h.value, s.value), ee(r.value), X();
      })) : o.value && (s.value = o.value.clientWidth, g.value = o.value.clientHeight);
    }
    c({
      isLoading: p,
      refreshLayout: ee,
      // Container dimensions (wrapper element)
      containerWidth: s,
      containerHeight: g,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: z,
      // Current page
      currentPage: N,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: ft,
      remove: fe,
      removeMany: mt,
      removeAll: ht,
      loadNext: ue,
      loadPage: Me,
      refreshCurrentPage: Te,
      reset: gt,
      init: yt,
      paginationHistory: x,
      cancelLoad: Be,
      scrollToTop: De,
      totalItems: K(() => r.value.length),
      currentBreakpoint: H
    });
    function Ne(e) {
      const a = Jt(e);
      let i = 0;
      if (w.value) {
        const { scrollTop: f, clientHeight: u } = w.value;
        i = f + u + 100;
      }
      z.value = Math.max(a, i);
    }
    function ee(e) {
      if (d.value) {
        r.value = e;
        return;
      }
      if (!w.value) return;
      W(e, "refreshLayout");
      const a = e.map((f, u) => ({
        ...f,
        originalIndex: f.originalIndex ?? u
      })), i = w.value;
      if (b.value && b.value.width !== void 0) {
        const f = i.style.width, u = i.style.boxSizing;
        i.style.boxSizing = "border-box", i.style.width = `${b.value.width}px`, i.offsetWidth;
        const R = Xe(a, i, L.value, h.value);
        i.style.width = f, i.style.boxSizing = u, Ne(R), r.value = R;
      } else {
        const f = Xe(a, i, L.value, h.value);
        Ne(f), r.value = f;
      }
    }
    function We(e, a) {
      return new Promise((i) => {
        const f = Math.max(0, e | 0), u = Date.now();
        a(f, f);
        const R = setInterval(() => {
          if (q.value) {
            clearInterval(R), i();
            return;
          }
          const te = Date.now() - u, ce = Math.max(0, f - te);
          a(ce, f), ce <= 0 && (clearInterval(R), i());
        }, 100);
      });
    }
    async function ye(e) {
      try {
        const a = await dt(() => l.getNextPage(e));
        return ee([...r.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function dt(e) {
      let a = 0;
      const i = l.retryMaxAttempts;
      let f = l.retryInitialDelayMs;
      for (; ; )
        try {
          const u = await e();
          return a > 0 && m("retry:stop", { attempt: a, success: !0 }), u;
        } catch (u) {
          if (a++, a > i)
            throw m("retry:stop", { attempt: a - 1, success: !1 }), u;
          m("retry:start", { attempt: a, max: i, totalMs: f }), await We(f, (R, te) => {
            m("retry:tick", { attempt: a, remainingMs: R, totalMs: te });
          }), f += l.retryBackoffStepMs;
        }
    }
    async function Me(e) {
      if (!p.value) {
        q.value = !1, p.value = !0;
        try {
          const a = r.value.length;
          if (q.value) return;
          const i = await ye(e);
          return q.value ? void 0 : (N.value = e, x.value.push(i.nextPage), await de(a), i);
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          p.value = !1;
        }
      }
    }
    async function ue() {
      if (!p.value) {
        q.value = !1, p.value = !0;
        try {
          const e = r.value.length;
          if (q.value) return;
          const a = x.value[x.value.length - 1], i = await ye(a);
          return q.value ? void 0 : (N.value = a, x.value.push(i.nextPage), await de(e), i);
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function Te() {
      if (!p.value) {
        q.value = !1, p.value = !0;
        try {
          const e = N.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", N.value, "paginationHistory:", x.value);
            return;
          }
          r.value = [], z.value = 0, x.value = [e], await Y();
          const a = await ye(e);
          if (q.value) return;
          N.value = e, x.value.push(a.nextPage);
          const i = r.value.length;
          return await de(i), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function fe(e) {
      const a = r.value.filter((i) => i.id !== e.id);
      if (r.value = a, await Y(), a.length === 0 && x.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await de(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        ee(a);
      });
    }
    async function mt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((f) => f.id)), i = r.value.filter((f) => !a.has(f.id));
      if (r.value = i, await Y(), i.length === 0 && x.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await de(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((f) => requestAnimationFrame(() => f())), requestAnimationFrame(() => {
        ee(i);
      });
    }
    function De(e) {
      w.value && w.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function ht() {
      De({ behavior: "smooth" }), r.value = [], g.value = 0, await Y(), m("remove-all:complete");
    }
    function pt() {
      L.value = ve(h.value, s.value), ee(r.value), w.value && (U.value = w.value.scrollTop, _.value = w.value.clientHeight);
    }
    let we = !1;
    const q = T(!1);
    async function de(e, a = !1) {
      if (!a && !l.backfillEnabled || we || q.value) return;
      const i = (e || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || x.value[x.value.length - 1] == null) && !(r.value.length >= i)) {
        we = !0;
        try {
          let u = 0;
          for (m("backfill:start", { target: i, fetched: r.value.length, calls: u }); r.value.length < i && u < l.backfillMaxCalls && x.value[x.value.length - 1] != null && !q.value && (await We(l.backfillDelayMs, (te, ce) => {
            m("backfill:tick", {
              fetched: r.value.length,
              target: i,
              calls: u,
              remainingMs: te,
              totalMs: ce
            });
          }), !q.value); ) {
            const R = x.value[x.value.length - 1];
            try {
              p.value = !0;
              const te = await ye(R);
              if (q.value) break;
              x.value.push(te.nextPage);
            } finally {
              p.value = !1;
            }
            u++;
          }
          m("backfill:stop", { fetched: r.value.length, calls: u });
        } finally {
          we = !1;
        }
      }
    }
    function Be() {
      q.value = !0, p.value = !1, we = !1;
    }
    function gt() {
      Be(), q.value = !1, w.value && w.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), r.value = [], g.value = 0, N.value = l.loadAtPage, x.value = [l.loadAtPage], G.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const Ee = Qe(async () => {
      if (d.value) return;
      w.value && (U.value = w.value.scrollTop, _.value = w.value.clientHeight), B.value = !0, await Y(), await new Promise((a) => requestAnimationFrame(() => a())), B.value = !1;
      const e = $e(r.value, L.value);
      vt(e), X(e);
    }, 200), ze = Qe(pt, 200);
    function Fe(e) {
      d.value && (n.value = !0, y.value = e.touches[0].clientY, F.value = S.value, e.preventDefault());
    }
    function Ae(e) {
      if (!d.value || !n.value) return;
      const a = e.touches[0].clientY - y.value;
      S.value = F.value + a, e.preventDefault();
    }
    function Oe(e) {
      if (!d.value || !n.value) return;
      n.value = !1;
      const a = S.value - F.value;
      Math.abs(a) > 100 ? a > 0 && O.value ? Ce() : a < 0 && A.value ? je() : ne() : ne(), e.preventDefault();
    }
    function Re(e) {
      d.value && (n.value = !0, y.value = e.clientY, F.value = S.value, e.preventDefault());
    }
    function Le(e) {
      if (!d.value || !n.value) return;
      const a = e.clientY - y.value;
      S.value = F.value + a, e.preventDefault();
    }
    function Ie(e) {
      if (!d.value || !n.value) return;
      n.value = !1;
      const a = S.value - F.value;
      Math.abs(a) > 100 ? a > 0 && O.value ? Ce() : a < 0 && A.value ? je() : ne() : ne(), e.preventDefault();
    }
    function je() {
      if (!A.value) {
        ue();
        return;
      }
      I.value++, ne(), I.value >= r.value.length - 5 && ue();
    }
    function Ce() {
      O.value && (I.value--, ne());
    }
    function ne() {
      if (!$.value) return;
      const e = $.value.clientHeight;
      S.value = -I.value * e;
    }
    function qe() {
      !d.value && I.value > 0 && (I.value = 0, S.value = 0), d.value && r.value.length === 0 && !p.value && Me(x.value[0]), d.value && ne();
    }
    function yt(e, a, i) {
      N.value = a, x.value = [a], x.value.push(i), W(e, "init"), d.value ? (r.value = [...r.value, ...e], I.value === 0 && r.value.length > 0 && (S.value = 0)) : (ee([...r.value, ...e]), X());
    }
    return oe(
      h,
      () => {
        d.value || w.value && (L.value = ve(h.value, s.value), ee(r.value));
      },
      { deep: !0 }
    ), oe(() => l.layoutMode, () => {
      b.value && b.value.width !== void 0 ? s.value = b.value.width : o.value && (s.value = o.value.clientWidth);
    }), oe(d, (e, a) => {
      a === void 0 && e === !1 || Y(() => {
        e ? (document.addEventListener("mousemove", Le), document.addEventListener("mouseup", Ie), I.value = 0, S.value = 0, r.value.length > 0 && ne()) : (document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie), w.value && o.value && (b.value && b.value.width !== void 0 ? s.value = b.value.width : s.value = o.value.clientWidth, w.value.removeEventListener("scroll", Ee), w.value.addEventListener("scroll", Ee, { passive: !0 }), r.value.length > 0 && (L.value = ve(h.value, s.value), ee(r.value), U.value = w.value.scrollTop, _.value = w.value.clientHeight, X())));
      });
    }, { immediate: !0 }), oe($, (e) => {
      e && (e.addEventListener("touchstart", Fe, { passive: !1 }), e.addEventListener("touchmove", Ae, { passive: !1 }), e.addEventListener("touchend", Oe), e.addEventListener("mousedown", Re));
    }), oe(() => r.value.length, (e, a) => {
      d.value && e > 0 && a === 0 && (I.value = 0, Y(() => ne()));
    }), oe(o, (e) => {
      k && (k.disconnect(), k = null), e && typeof ResizeObserver < "u" ? (k = new ResizeObserver((a) => {
        if (!b.value)
          for (const i of a) {
            const f = i.contentRect.width, u = i.contentRect.height;
            s.value !== f && (s.value = f), g.value !== u && (g.value = u);
          }
      }), k.observe(e), b.value || (s.value = e.clientWidth, g.value = e.clientHeight)) : e && (b.value || (s.value = e.clientWidth, g.value = e.clientHeight));
    }, { immediate: !0 }), oe(s, (e, a) => {
      e !== a && e > 0 && !d.value && w.value && r.value.length > 0 && Y(() => {
        L.value = ve(h.value, e), ee(r.value), X();
      });
    }), tt(async () => {
      try {
        await Y(), o.value && !k && (s.value = o.value.clientWidth, g.value = o.value.clientHeight), d.value || (L.value = ve(h.value, s.value), w.value && (U.value = w.value.scrollTop, _.value = w.value.clientHeight));
        const e = l.loadAtPage;
        x.value = [e], l.skipInitialLoad || await Me(x.value[0]), d.value ? Y(() => ne()) : X();
      } catch (e) {
        console.error("Error during component initialization:", e), p.value = !1;
      }
      window.addEventListener("resize", ze), window.addEventListener("resize", qe);
    }), at(() => {
      var e;
      k && (k.disconnect(), k = null), (e = w.value) == null || e.removeEventListener("scroll", Ee), window.removeEventListener("resize", ze), window.removeEventListener("resize", qe), $.value && ($.value.removeEventListener("touchstart", Fe), $.value.removeEventListener("touchmove", Ae), $.value.removeEventListener("touchend", Oe), $.value.removeEventListener("mousedown", Re)), document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie);
    }), (e, a) => (C(), j("div", {
      ref_key: "wrapper",
      ref: o,
      class: "w-full h-full flex flex-col relative"
    }, [
      d.value ? (C(), j("div", {
        key: 0,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": l.forceMotion, "cursor-grab": !n.value, "cursor-grabbing": n.value }]),
        ref_key: "swipeContainer",
        ref: $,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${S.value}px)`,
            transition: n.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${r.value.length * 100}%`
          })
        }, [
          (C(!0), j(Ue, null, Ge(r.value, (i, f) => (C(), j("div", {
            key: `${i.page}-${i.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${f * (100 / r.value.length)}%`,
              height: `${100 / r.value.length}%`
            })
          }, [
            V("div", ca, [
              V("div", va, [
                le(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  ke(xe, {
                    item: i,
                    remove: fe,
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": f === I.value,
                    "onPreload:success": a[0] || (a[0] = (u) => m("item:preload:success", u)),
                    "onPreload:error": a[1] || (a[1] = (u) => m("item:preload:error", u)),
                    onMouseEnter: a[2] || (a[2] = (u) => m("item:mouse-enter", u)),
                    onMouseLeave: a[3] || (a[3] = (u) => m("item:mouse-leave", u))
                  }, {
                    header: me((u) => [
                      le(e.$slots, "item-header", he({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: me((u) => [
                      le(e.$slots, "item-footer", he({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4)
      ], 2)) : (C(), j("div", {
        key: 1,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
        ref_key: "container",
        ref: w
      }, [
        V("div", {
          class: "relative",
          style: ge({ height: `${z.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          ke(xt, {
            name: "masonry",
            css: !1,
            onEnter: rt,
            onBeforeEnter: it,
            onLeave: ut,
            onBeforeLeave: st
          }, {
            default: me(() => [
              (C(!0), j(Ue, null, Ge(ct.value, (i, f) => (C(), j("div", he({
                key: `${i.page}-${i.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, Mt(Qt)(i, f)), [
                le(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  ke(xe, {
                    item: i,
                    remove: fe,
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (u) => m("item:preload:success", u)),
                    "onPreload:error": a[5] || (a[5] = (u) => m("item:preload:error", u)),
                    onMouseEnter: a[6] || (a[6] = (u) => m("item:mouse-enter", u)),
                    onMouseLeave: a[7] || (a[7] = (u) => m("item:mouse-leave", u))
                  }, {
                    header: me((u) => [
                      le(e.$slots, "item-header", he({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    footer: me((u) => [
                      le(e.$slots, "item-footer", he({ ref_for: !0 }, u), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4)
      ], 2))
    ], 512));
  }
}), da = (t, c) => {
  const v = t.__vccOpts || t;
  for (const [l, M] of c)
    v[l] = M;
  return v;
}, Ze = /* @__PURE__ */ da(fa, [["__scopeId", "data-v-510fa495"]]), ha = {
  install(t) {
    t.component("WyxosMasonry", Ze), t.component("WMasonry", Ze), t.component("WyxosMasonryItem", xe), t.component("WMasonryItem", xe);
  }
};
export {
  Ze as Masonry,
  xe as MasonryItem,
  ha as default
};
