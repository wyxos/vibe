import { nextTick as G, defineComponent as lt, ref as T, computed as te, onMounted as rt, onUnmounted as ot, watch as oe, createElementBlock as B, openBlock as D, createCommentVNode as le, createElementVNode as j, normalizeStyle as Me, renderSlot as ee, normalizeClass as de, withModifiers as Xe, toDisplayString as Ae, Fragment as Je, renderList as Ke, createVNode as He, withCtx as we, mergeProps as xe, TransitionGroup as St, unref as $t } from "vue";
let Ne = null;
function Ht() {
  if (Ne != null) return Ne;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const v = document.createElement("div");
  v.style.width = "100%", t.appendChild(v);
  const c = t.offsetWidth - v.offsetWidth;
  return document.body.removeChild(t), Ne = c, c;
}
function Qe(t, v, c, i = {}) {
  const {
    gutterX: I = 0,
    gutterY: p = 0,
    header: r = 0,
    footer: u = 0,
    paddingLeft: x = 0,
    paddingRight: E = 0,
    sizes: S = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: k = "masonry"
  } = i;
  let d = 0, A = 0;
  try {
    if (v && v.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const w = window.getComputedStyle(v);
      d = parseFloat(w.paddingLeft) || 0, A = parseFloat(w.paddingRight) || 0;
    }
  } catch {
  }
  const C = (x || 0) + d, U = (E || 0) + A, g = v.offsetWidth - v.clientWidth, o = g > 0 ? g + 2 : Ht() + 2, P = v.offsetWidth - o - C - U, y = I * (c - 1), b = Math.floor((P - y) / c), H = t.map((w) => {
    const M = w.width, q = w.height;
    return Math.round(b * q / M) + u + r;
  });
  if (k === "sequential-balanced") {
    const w = H.length;
    if (w === 0) return [];
    const M = (L, O, Q) => L + (O > 0 ? p : 0) + Q;
    let q = Math.max(...H), n = H.reduce((L, O) => L + O, 0) + p * Math.max(0, w - 1);
    const f = (L) => {
      let O = 1, Q = 0, J = 0;
      for (let K = 0; K < w; K++) {
        const ae = H[K], ne = M(Q, J, ae);
        if (ne <= L)
          Q = ne, J++;
        else if (O++, Q = ae, J = 1, ae > L || O > c) return !1;
      }
      return O <= c;
    };
    for (; q < n; ) {
      const L = Math.floor((q + n) / 2);
      f(L) ? n = L : q = L + 1;
    }
    const $ = n, R = new Array(c).fill(0);
    let X = c - 1, Y = 0, N = 0;
    for (let L = w - 1; L >= 0; L--) {
      const O = H[L], Q = L < X;
      !(M(Y, N, O) <= $) || Q ? (R[X] = L + 1, X--, Y = O, N = 1) : (Y = M(Y, N, O), N++);
    }
    R[0] = 0;
    const ie = [], se = new Array(c).fill(0);
    for (let L = 0; L < c; L++) {
      const O = R[L], Q = L + 1 < c ? R[L + 1] : w, J = L * (b + I);
      for (let K = O; K < Q; K++) {
        const ne = {
          ...t[K],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        ne.imageHeight = H[K] - (u + r), ne.columnHeight = H[K], ne.left = J, ne.top = se[L], se[L] += ne.columnHeight + (K + 1 < Q ? p : 0), ie.push(ne);
      }
    }
    return ie;
  }
  const h = new Array(c).fill(0), z = [];
  for (let w = 0; w < t.length; w++) {
    const M = t[w], q = {
      ...M,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = h.indexOf(Math.min(...h)), f = M.width, $ = M.height;
    q.columnWidth = b, q.left = n * (b + I), q.imageHeight = Math.round(b * $ / f), q.columnHeight = q.imageHeight + u + r, q.top = h[n], h[n] += q.columnHeight + p, z.push(q);
  }
  return z;
}
var Nt = typeof global == "object" && global && global.Object === Object && global, Ft = typeof self == "object" && self && self.Object === Object && self, it = Nt || Ft || Function("return this")(), Te = it.Symbol, st = Object.prototype, At = st.hasOwnProperty, Wt = st.toString, be = Te ? Te.toStringTag : void 0;
function Bt(t) {
  var v = At.call(t, be), c = t[be];
  try {
    t[be] = void 0;
    var i = !0;
  } catch {
  }
  var I = Wt.call(t);
  return i && (v ? t[be] = c : delete t[be]), I;
}
var Dt = Object.prototype, zt = Dt.toString;
function Ot(t) {
  return zt.call(t);
}
var Rt = "[object Null]", jt = "[object Undefined]", Ze = Te ? Te.toStringTag : void 0;
function Ct(t) {
  return t == null ? t === void 0 ? jt : Rt : Ze && Ze in Object(t) ? Bt(t) : Ot(t);
}
function qt(t) {
  return t != null && typeof t == "object";
}
var Yt = "[object Symbol]";
function Vt(t) {
  return typeof t == "symbol" || qt(t) && Ct(t) == Yt;
}
var Ut = /\s/;
function _t(t) {
  for (var v = t.length; v-- && Ut.test(t.charAt(v)); )
    ;
  return v;
}
var Gt = /^\s+/;
function Xt(t) {
  return t && t.slice(0, _t(t) + 1).replace(Gt, "");
}
function We(t) {
  var v = typeof t;
  return t != null && (v == "object" || v == "function");
}
var et = NaN, Jt = /^[-+]0x[0-9a-f]+$/i, Kt = /^0b[01]+$/i, Qt = /^0o[0-7]+$/i, Zt = parseInt;
function tt(t) {
  if (typeof t == "number")
    return t;
  if (Vt(t))
    return et;
  if (We(t)) {
    var v = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = We(v) ? v + "" : v;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Xt(t);
  var c = Kt.test(t);
  return c || Qt.test(t) ? Zt(t.slice(2), c ? 2 : 8) : Jt.test(t) ? et : +t;
}
var Fe = function() {
  return it.Date.now();
}, ea = "Expected a function", ta = Math.max, aa = Math.min;
function at(t, v, c) {
  var i, I, p, r, u, x, E = 0, S = !1, k = !1, d = !0;
  if (typeof t != "function")
    throw new TypeError(ea);
  v = tt(v) || 0, We(c) && (S = !!c.leading, k = "maxWait" in c, p = k ? ta(tt(c.maxWait) || 0, v) : p, d = "trailing" in c ? !!c.trailing : d);
  function A(h) {
    var z = i, w = I;
    return i = I = void 0, E = h, r = t.apply(w, z), r;
  }
  function C(h) {
    return E = h, u = setTimeout(o, v), S ? A(h) : r;
  }
  function U(h) {
    var z = h - x, w = h - E, M = v - z;
    return k ? aa(M, p - w) : M;
  }
  function g(h) {
    var z = h - x, w = h - E;
    return x === void 0 || z >= v || z < 0 || k && w >= p;
  }
  function o() {
    var h = Fe();
    if (g(h))
      return P(h);
    u = setTimeout(o, U(h));
  }
  function P(h) {
    return u = void 0, d && i ? A(h) : (i = I = void 0, r);
  }
  function y() {
    u !== void 0 && clearTimeout(u), E = 0, i = x = I = u = void 0;
  }
  function b() {
    return u === void 0 ? r : P(Fe());
  }
  function H() {
    var h = Fe(), z = g(h);
    if (i = arguments, I = this, x = h, z) {
      if (u === void 0)
        return C(x);
      if (k)
        return clearTimeout(u), u = setTimeout(o, v), A(x);
    }
    return u === void 0 && (u = setTimeout(o, v)), r;
  }
  return H.cancel = y, H.flush = b, H;
}
function he(t, v) {
  const c = v ?? (typeof window < "u" ? window.innerWidth : 1024), i = t.sizes;
  return c >= 1536 && i["2xl"] ? i["2xl"] : c >= 1280 && i.xl ? i.xl : c >= 1024 && i.lg ? i.lg : c >= 768 && i.md ? i.md : c >= 640 && i.sm ? i.sm : i.base;
}
function na(t) {
  const v = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return v >= 1536 ? "2xl" : v >= 1280 ? "xl" : v >= 1024 ? "lg" : v >= 768 ? "md" : v >= 640 ? "sm" : "base";
}
function la(t) {
  return t.reduce((c, i) => Math.max(c, i.top + i.columnHeight), 0) + 500;
}
function ra(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function oa(t, v = 0) {
  return {
    style: ra(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": v
  };
}
function Be(t, v) {
  if (!t.length || v <= 0)
    return new Array(Math.max(1, v)).fill(0);
  const i = Array.from(new Set(t.map((r) => r.left))).sort((r, u) => r - u).slice(0, v), I = /* @__PURE__ */ new Map();
  for (let r = 0; r < i.length; r++) I.set(i[r], r);
  const p = new Array(i.length).fill(0);
  for (const r of t) {
    const u = I.get(r.left);
    u != null && (p[u] = Math.max(p[u], r.top + r.columnHeight));
  }
  for (; p.length < v; ) p.push(0);
  return p;
}
function ia(t, v) {
  function c(r, u) {
    const x = parseInt(r.dataset.left || "0", 10), E = parseInt(r.dataset.top || "0", 10), S = parseInt(r.dataset.index || "0", 10), k = Math.min(S * 20, 160), d = r.style.getPropertyValue("--masonry-opacity-delay");
    r.style.setProperty("--masonry-opacity-delay", `${k}ms`), requestAnimationFrame(() => {
      r.style.opacity = "1", r.style.transform = `translate3d(${x}px, ${E}px, 0) scale(1)`;
      const A = () => {
        d ? r.style.setProperty("--masonry-opacity-delay", d) : r.style.removeProperty("--masonry-opacity-delay"), r.removeEventListener("transitionend", A), u();
      };
      r.addEventListener("transitionend", A);
    });
  }
  function i(r) {
    const u = parseInt(r.dataset.left || "0", 10), x = parseInt(r.dataset.top || "0", 10);
    r.style.opacity = "0", r.style.transform = `translate3d(${u}px, ${x + 10}px, 0) scale(0.985)`;
  }
  function I(r) {
    const u = parseInt(r.dataset.left || "0", 10), x = parseInt(r.dataset.top || "0", 10);
    r.style.transition = "none", r.style.opacity = "1", r.style.transform = `translate3d(${u}px, ${x}px, 0) scale(1)`, r.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      r.style.transition = "";
    });
  }
  function p(r, u) {
    const x = parseInt(r.dataset.left || "0", 10), E = parseInt(r.dataset.top || "0", 10), S = typeof (v == null ? void 0 : v.leaveDurationMs) == "number" ? v.leaveDurationMs : NaN;
    let k = Number.isFinite(S) && S > 0 ? S : NaN;
    if (!Number.isFinite(k)) {
      const o = getComputedStyle(r).getPropertyValue("--masonry-leave-duration") || "", P = parseFloat(o);
      k = Number.isFinite(P) && P > 0 ? P : 200;
    }
    const d = r.style.transitionDuration, A = () => {
      r.removeEventListener("transitionend", C), clearTimeout(U), r.style.transitionDuration = d || "";
    }, C = (g) => {
      (!g || g.target === r) && (A(), u());
    }, U = setTimeout(() => {
      A(), u();
    }, k + 100);
    requestAnimationFrame(() => {
      r.style.transitionDuration = `${k}ms`, r.style.opacity = "0", r.style.transform = `translate3d(${x}px, ${E + 10}px, 0) scale(0.985)`, r.addEventListener("transitionend", C);
    });
  }
  return {
    onEnter: c,
    onBeforeEnter: i,
    onBeforeLeave: I,
    onLeave: p
  };
}
function sa({
  container: t,
  masonry: v,
  columns: c,
  containerHeight: i,
  isLoading: I,
  pageSize: p,
  refreshLayout: r,
  setItemsRaw: u,
  loadNext: x,
  loadThresholdPx: E
}) {
  let S = 0;
  async function k(d) {
    if (!t.value) return;
    const A = d ?? Be(v.value, c.value), C = A.length ? Math.max(...A) : 0, U = t.value.scrollTop + t.value.clientHeight, g = t.value.scrollTop > S + 1;
    S = t.value.scrollTop;
    const o = typeof E == "number" ? E : 200, P = o >= 0 ? Math.max(0, C - o) : Math.max(0, C + o);
    if (U >= P && g && !I.value) {
      await x(), await G();
      return;
    }
  }
  return {
    handleScroll: k
  };
}
const ua = { class: "flex-1 relative min-h-0" }, va = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, ca = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, fa = {
  key: 1,
  class: "relative w-full h-full"
}, da = ["src"], ma = ["src", "autoplay", "controls"], ha = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, ga = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, pa = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ie = /* @__PURE__ */ lt({
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
    const c = t, i = v, I = T(!1), p = T(!1), r = T(null), u = T(!1), x = T(!1), E = T(null), S = T(!1), k = T(!1), d = T(!1), A = T(null), C = T(null);
    let U = null;
    const g = te(() => {
      var n;
      return c.type ?? ((n = c.item) == null ? void 0 : n.type) ?? "image";
    }), o = te(() => {
      var n;
      return c.notFound ?? ((n = c.item) == null ? void 0 : n.notFound) ?? !1;
    }), P = te(() => !!c.inSwipeMode);
    function y(n) {
      i("mouse-enter", { item: c.item, type: n });
    }
    function b(n) {
      i("mouse-leave", { item: c.item, type: n });
    }
    function H(n) {
      if (P.value) return;
      const f = n.target;
      f && (f.paused ? f.play() : f.pause());
    }
    function h(n) {
      const f = n.target;
      f && (P.value || f.play(), y("video"));
    }
    function z(n) {
      const f = n.target;
      f && (P.value || f.pause(), b("video"));
    }
    function w(n) {
      return new Promise((f, $) => {
        if (!n) {
          const N = new Error("No image source provided");
          i("preload:error", { item: c.item, type: "image", src: n, error: N }), $(N);
          return;
        }
        const R = new Image(), X = Date.now(), Y = 300;
        R.onload = () => {
          const N = Date.now() - X, ie = Math.max(0, Y - N);
          setTimeout(async () => {
            I.value = !0, p.value = !1, k.value = !1, await G(), await new Promise((se) => setTimeout(se, 100)), d.value = !0, i("preload:success", { item: c.item, type: "image", src: n }), f();
          }, ie);
        }, R.onerror = () => {
          p.value = !0, I.value = !1, k.value = !1;
          const N = new Error("Failed to load image");
          i("preload:error", { item: c.item, type: "image", src: n, error: N }), $(N);
        }, R.src = n;
      });
    }
    function M(n) {
      return new Promise((f, $) => {
        if (!n) {
          const N = new Error("No video source provided");
          i("preload:error", { item: c.item, type: "video", src: n, error: N }), $(N);
          return;
        }
        const R = document.createElement("video"), X = Date.now(), Y = 300;
        R.preload = "metadata", R.muted = !0, R.onloadedmetadata = () => {
          const N = Date.now() - X, ie = Math.max(0, Y - N);
          setTimeout(async () => {
            u.value = !0, x.value = !1, k.value = !1, await G(), await new Promise((se) => setTimeout(se, 100)), d.value = !0, i("preload:success", { item: c.item, type: "video", src: n }), f();
          }, ie);
        }, R.onerror = () => {
          x.value = !0, u.value = !1, k.value = !1;
          const N = new Error("Failed to load video");
          i("preload:error", { item: c.item, type: "video", src: n, error: N }), $(N);
        }, R.src = n;
      });
    }
    async function q() {
      var f;
      if (!S.value || k.value || o.value || g.value === "video" && u.value || g.value === "image" && I.value)
        return;
      const n = (f = c.item) == null ? void 0 : f.src;
      if (n)
        if (k.value = !0, d.value = !1, g.value === "video") {
          E.value = n, u.value = !1, x.value = !1;
          try {
            await M(n);
          } catch {
          }
        } else {
          r.value = n, I.value = !1, p.value = !1;
          try {
            await w(n);
          } catch {
          }
        }
    }
    return rt(() => {
      A.value && (U = new IntersectionObserver(
        (n) => {
          n.forEach((f) => {
            f.isIntersecting && f.intersectionRatio >= 1 ? S.value || (S.value = !0, q()) : f.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), U.observe(A.value));
    }), ot(() => {
      U && (U.disconnect(), U = null);
    }), oe(
      () => {
        var n;
        return (n = c.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || o.value)) {
          if (g.value === "video") {
            if (n !== E.value && (u.value = !1, x.value = !1, E.value = n, S.value)) {
              k.value = !0;
              try {
                await M(n);
              } catch {
              }
            }
          } else if (n !== r.value && (I.value = !1, p.value = !1, r.value = n, S.value)) {
            k.value = !0;
            try {
              await w(n);
            } catch {
            }
          }
        }
      }
    ), oe(
      () => c.isActive,
      (n) => {
        !P.value || !C.value || (n ? C.value.play() : C.value.pause());
      }
    ), (n, f) => (D(), B("div", {
      ref_key: "containerRef",
      ref: A,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (D(), B("div", {
        key: 0,
        class: "relative z-10",
        style: Me({ height: `${n.headerHeight}px` })
      }, [
        ee(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: p.value,
          videoLoaded: u.value,
          videoError: x.value,
          showNotFound: o.value,
          isLoading: k.value,
          mediaType: g.value
        })
      ], 4)) : le("", !0),
      j("div", ua, [
        ee(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: p.value,
          videoLoaded: u.value,
          videoError: x.value,
          showNotFound: o.value,
          isLoading: k.value,
          mediaType: g.value,
          imageSrc: r.value,
          videoSrc: E.value,
          showMedia: d.value
        }, () => [
          j("div", va, [
            o.value ? (D(), B("div", ca, f[3] || (f[3] = [
              j("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              j("span", { class: "font-medium" }, "Not Found", -1),
              j("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (D(), B("div", fa, [
              g.value === "image" && r.value ? (D(), B("img", {
                key: 0,
                src: r.value,
                class: de([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  I.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: f[0] || (f[0] = ($) => y("image")),
                onMouseleave: f[1] || (f[1] = ($) => b("image"))
              }, null, 42, da)) : le("", !0),
              g.value === "video" && E.value ? (D(), B("video", {
                key: 1,
                ref_key: "videoEl",
                ref: C,
                src: E.value,
                class: de([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  u.value && d.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: P.value && c.isActive,
                controls: P.value,
                onClick: Xe(H, ["stop"]),
                onTouchend: Xe(H, ["stop", "prevent"]),
                onMouseenter: h,
                onMouseleave: z,
                onError: f[2] || (f[2] = ($) => x.value = !0)
              }, null, 42, ma)) : le("", !0),
              !I.value && !u.value && !p.value && !x.value ? (D(), B("div", {
                key: 2,
                class: de([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  d.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                j("div", ha, [
                  j("i", {
                    class: de(g.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : le("", !0),
              k.value ? (D(), B("div", ga, f[4] || (f[4] = [
                j("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  j("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : le("", !0),
              g.value === "image" && p.value || g.value === "video" && x.value ? (D(), B("div", pa, [
                j("i", {
                  class: de(g.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                j("span", null, "Failed to load " + Ae(g.value), 1)
              ])) : le("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (D(), B("div", {
        key: 1,
        class: "relative z-10",
        style: Me({ height: `${n.footerHeight}px` })
      }, [
        ee(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: I.value,
          imageError: p.value,
          videoLoaded: u.value,
          videoError: x.value,
          showNotFound: o.value,
          isLoading: k.value,
          mediaType: g.value
        })
      ], 4)) : le("", !0)
    ], 512));
  }
}), ya = { class: "w-full h-full flex items-center justify-center p-4" }, wa = { class: "w-full h-full max-w-full max-h-full relative" }, xa = {
  key: 0,
  class: "w-full py-8 text-center"
}, ba = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ma = { class: "text-red-500 dark:text-red-400" }, Ea = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ta = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ia = { class: "text-red-500 dark:text-red-400" }, La = /* @__PURE__ */ lt({
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
    const i = t, I = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, p = te(() => {
      var e;
      return {
        ...I,
        ...i.layout,
        sizes: {
          ...I.sizes,
          ...((e = i.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), r = T(null), u = T(typeof window < "u" ? window.innerWidth : 1024), x = T(typeof window < "u" ? window.innerHeight : 768), E = T(null);
    let S = null;
    function k(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const d = te(() => {
      if (i.layoutMode === "masonry") return !1;
      if (i.layoutMode === "swipe") return !0;
      const e = typeof i.mobileBreakpoint == "string" ? k(i.mobileBreakpoint) : i.mobileBreakpoint;
      return u.value < e;
    }), A = te(() => {
      if (!d.value || o.value.length === 0) return null;
      const e = Math.max(0, Math.min(n.value, o.value.length - 1));
      return o.value[e] || null;
    }), C = te(() => {
      if (!d.value || !A.value) return null;
      const e = n.value + 1;
      return e >= o.value.length ? null : o.value[e] || null;
    }), U = te(() => {
      if (!d.value || !A.value) return null;
      const e = n.value - 1;
      return e < 0 ? null : o.value[e] || null;
    }), g = c, o = te({
      get: () => i.items,
      set: (e) => g("update:items", e)
    }), P = T(7), y = T(null), b = T([]), H = T(null), h = T(!1), z = T(0), w = T(!1), M = T(null), q = te(() => na(u.value)), n = T(0), f = T(0), $ = T(!1), R = T(0), X = T(0), Y = T(null), N = T(/* @__PURE__ */ new Set());
    function ie(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function se(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const l = e.filter((s) => !ie(s == null ? void 0 : s.width) || !ie(s == null ? void 0 : s.height));
        if (l.length === 0) return;
        const m = [];
        for (const s of l) {
          const F = (s == null ? void 0 : s.id) ?? `idx:${e.indexOf(s)}`;
          N.value.has(F) || (N.value.add(F), m.push(F));
        }
        if (m.length > 0) {
          const s = m.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: m.length,
              sampleIds: s,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const L = T(0), O = T(0), Q = i.virtualBufferPx, J = T(!1), K = T({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), ae = (e) => {
      if (!y.value) return;
      const { scrollTop: a, clientHeight: l } = y.value, m = a + l, s = e ?? Be(o.value, P.value), F = s.length ? Math.max(...s) : 0, W = typeof i.loadThresholdPx == "number" ? i.loadThresholdPx : 200, ue = W >= 0 ? Math.max(0, F - W) : Math.max(0, F + W), ve = Math.max(0, ue - m), ce = ve <= 100;
      K.value = {
        distanceToTrigger: Math.round(ve),
        isNearTrigger: ce
      };
    }, { onEnter: ne, onBeforeEnter: ut, onBeforeLeave: vt, onLeave: ct } = ia(o, { leaveDurationMs: i.leaveDurationMs });
    function ft(e, a) {
      if (J.value) {
        const l = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${l}px, ${m}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        ne(e, a);
    }
    function dt(e) {
      if (J.value) {
        const a = parseInt(e.dataset.left || "0", 10), l = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${l}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ut(e);
    }
    function mt(e) {
      J.value || vt(e);
    }
    function ht(e, a) {
      J.value ? a() : ct(e, a);
    }
    const gt = te(() => {
      const e = L.value - Q, a = L.value + O.value + Q, l = o.value;
      return !l || l.length === 0 ? [] : l.filter((m) => {
        const s = m.top;
        return m.top + m.columnHeight >= e && s <= a;
      });
    }), { handleScroll: pt } = sa({
      container: y,
      masonry: o,
      columns: P,
      containerHeight: z,
      isLoading: h,
      pageSize: i.pageSize,
      refreshLayout: Z,
      setItemsRaw: (e) => {
        o.value = e;
      },
      loadNext: me,
      loadThresholdPx: i.loadThresholdPx
    });
    function yt(e) {
      E.value = e, e ? (e.width !== void 0 && (u.value = e.width), e.height !== void 0 && (x.value = e.height), !d.value && y.value && o.value.length > 0 && G(() => {
        P.value = he(p.value, u.value), Z(o.value), ae();
      })) : r.value && (u.value = r.value.clientWidth, x.value = r.value.clientHeight);
    }
    v({
      isLoading: h,
      refreshLayout: Z,
      // Container dimensions (wrapper element)
      containerWidth: u,
      containerHeight: x,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: z,
      // Current page
      currentPage: H,
      // End of list tracking
      hasReachedEnd: w,
      // Load error tracking
      loadError: M,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: yt,
      remove: ge,
      removeMany: xt,
      removeAll: Et,
      restore: bt,
      restoreMany: Mt,
      loadNext: me,
      loadPage: Le,
      refreshCurrentPage: ke,
      reset: It,
      destroy: Lt,
      init: kt,
      paginationHistory: b,
      cancelLoad: Pe,
      scrollToTop: Oe,
      totalItems: te(() => o.value.length),
      currentBreakpoint: q
    });
    function De(e) {
      const a = la(e);
      let l = 0;
      if (y.value) {
        const { scrollTop: m, clientHeight: s } = y.value;
        l = m + s + 100;
      }
      z.value = Math.max(a, l);
    }
    function Z(e) {
      if (d.value) {
        o.value = e;
        return;
      }
      if (!y.value) return;
      se(e, "refreshLayout");
      const a = e.map((m, s) => ({
        ...m,
        originalIndex: s
      })), l = y.value;
      if (E.value && E.value.width !== void 0) {
        const m = l.style.width, s = l.style.boxSizing;
        l.style.boxSizing = "border-box", l.style.width = `${E.value.width}px`, l.offsetWidth;
        const F = Qe(a, l, P.value, p.value);
        l.style.width = m, l.style.boxSizing = s, De(F), o.value = F;
      } else {
        const m = Qe(a, l, P.value, p.value);
        De(m), o.value = m;
      }
    }
    function ze(e, a) {
      return new Promise((l) => {
        const m = Math.max(0, e | 0), s = Date.now();
        a(m, m);
        const F = setInterval(() => {
          if (_.value) {
            clearInterval(F), l();
            return;
          }
          const W = Date.now() - s, ue = Math.max(0, m - W);
          a(ue, m), ue <= 0 && (clearInterval(F), l());
        }, 100);
      });
    }
    async function Ee(e) {
      try {
        const a = await wt(() => i.getNextPage(e));
        return Z([...o.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function wt(e) {
      let a = 0;
      const l = i.retryMaxAttempts;
      let m = i.retryInitialDelayMs;
      for (; ; )
        try {
          const s = await e();
          return a > 0 && g("retry:stop", { attempt: a, success: !0 }), s;
        } catch (s) {
          if (a++, a > l)
            throw g("retry:stop", { attempt: a - 1, success: !1 }), s;
          g("retry:start", { attempt: a, max: l, totalMs: m }), await ze(m, (F, W) => {
            g("retry:tick", { attempt: a, remainingMs: F, totalMs: W });
          }), m += i.retryBackoffStepMs;
        }
    }
    async function Le(e) {
      if (!h.value) {
        _.value = !1, h.value = !0, w.value = !1, M.value = null;
        try {
          const a = o.value.length;
          if (_.value) return;
          const l = await Ee(e);
          return _.value ? void 0 : (M.value = null, H.value = e, b.value.push(l.nextPage), l.nextPage == null && (w.value = !0), await ye(a), l);
        } catch (a) {
          throw console.error("Error loading page:", a), M.value = a instanceof Error ? a : new Error(String(a)), a;
        } finally {
          h.value = !1;
        }
      }
    }
    async function me() {
      if (!h.value && !w.value) {
        _.value = !1, h.value = !0, M.value = null;
        try {
          const e = o.value.length;
          if (_.value) return;
          const a = b.value[b.value.length - 1];
          if (a == null) {
            w.value = !0, h.value = !1;
            return;
          }
          const l = await Ee(a);
          return _.value ? void 0 : (M.value = null, H.value = a, b.value.push(l.nextPage), l.nextPage == null && (w.value = !0), await ye(e), l);
        } catch (e) {
          throw console.error("Error loading next page:", e), M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          h.value = !1;
        }
      }
    }
    async function ke() {
      if (!h.value) {
        _.value = !1, h.value = !0;
        try {
          const e = H.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", H.value, "paginationHistory:", b.value);
            return;
          }
          o.value = [], z.value = 0, w.value = !1, M.value = null, b.value = [e], await G();
          const a = await Ee(e);
          if (_.value) return;
          M.value = null, H.value = e, b.value.push(a.nextPage), a.nextPage == null && (w.value = !0);
          const l = o.value.length;
          return await ye(l), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), M.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          h.value = !1;
        }
      }
    }
    async function ge(e) {
      const a = o.value.filter((l) => l.id !== e.id);
      if (o.value = a, await G(), a.length === 0 && b.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          await ke();
        else
          try {
            await me(), await ye(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((l) => requestAnimationFrame(() => l())), requestAnimationFrame(() => {
        Z(a);
      });
    }
    async function xt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((m) => m.id)), l = o.value.filter((m) => !a.has(m.id));
      if (o.value = l, await G(), l.length === 0 && b.value.length > 0) {
        if (i.autoRefreshOnEmpty)
          await ke();
        else
          try {
            await me(), await ye(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((m) => requestAnimationFrame(() => m())), requestAnimationFrame(() => {
        Z(l);
      });
    }
    async function bt(e, a) {
      if (!e) return;
      const l = o.value;
      if (l.findIndex((W) => W.id === e.id) !== -1) return;
      const s = [...l], F = Math.min(a, s.length);
      s.splice(F, 0, e), o.value = s, await G(), d.value || (await new Promise((W) => requestAnimationFrame(() => W())), requestAnimationFrame(() => {
        Z(s);
      }));
    }
    async function Mt(e, a) {
      var Ge;
      if (!e || e.length === 0) return;
      if (!a || a.length !== e.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      const l = o.value, m = new Set(l.map((V) => V.id)), s = [];
      for (let V = 0; V < e.length; V++)
        m.has((Ge = e[V]) == null ? void 0 : Ge.id) || s.push({ item: e[V], index: a[V] });
      if (s.length === 0) return;
      const F = /* @__PURE__ */ new Map();
      for (const { item: V, index: Pt } of s)
        F.set(Pt, V);
      const W = s.length > 0 ? Math.max(...s.map(({ index: V }) => V)) : -1, ue = Math.max(l.length - 1, W), ve = [];
      let ce = 0;
      for (let V = 0; V <= ue; V++)
        F.has(V) ? ve.push(F.get(V)) : ce < l.length && (ve.push(l[ce]), ce++);
      for (; ce < l.length; )
        ve.push(l[ce]), ce++;
      o.value = ve, await G(), d.value || (await new Promise((V) => requestAnimationFrame(() => V())), requestAnimationFrame(() => {
        Z(ve);
      }));
    }
    function Oe(e) {
      y.value && y.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function Et() {
      Oe({ behavior: "smooth" }), o.value = [], x.value = 0, await G(), g("remove-all:complete");
    }
    function Tt() {
      P.value = he(p.value, u.value), Z(o.value), y.value && (L.value = y.value.scrollTop, O.value = y.value.clientHeight);
    }
    let pe = !1;
    const _ = T(!1);
    async function ye(e, a = !1) {
      if (!a && !i.backfillEnabled || pe || _.value || w.value) return;
      const l = (e || 0) + (i.pageSize || 0);
      if (!i.pageSize || i.pageSize <= 0) return;
      if (b.value[b.value.length - 1] == null) {
        w.value = !0;
        return;
      }
      if (!(o.value.length >= l)) {
        pe = !0, h.value = !0;
        try {
          let s = 0;
          for (g("backfill:start", { target: l, fetched: o.value.length, calls: s }); o.value.length < l && s < i.backfillMaxCalls && b.value[b.value.length - 1] != null && !_.value && !w.value && (await ze(i.backfillDelayMs, (W, ue) => {
            g("backfill:tick", {
              fetched: o.value.length,
              target: l,
              calls: s,
              remainingMs: W,
              totalMs: ue
            });
          }), !_.value); ) {
            const F = b.value[b.value.length - 1];
            if (F == null) {
              w.value = !0;
              break;
            }
            try {
              const W = await Ee(F);
              if (_.value) break;
              M.value = null, b.value.push(W.nextPage), W.nextPage == null && (w.value = !0);
            } catch (W) {
              M.value = W instanceof Error ? W : new Error(String(W));
            }
            s++;
          }
          g("backfill:stop", { fetched: o.value.length, calls: s });
        } finally {
          pe = !1, h.value = !1;
        }
      }
    }
    function Pe() {
      _.value = !0, h.value = !1, pe = !1;
    }
    function It() {
      Pe(), _.value = !1, y.value && y.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), o.value = [], x.value = 0, H.value = i.loadAtPage, b.value = [i.loadAtPage], w.value = !1, M.value = null, K.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function Lt() {
      Pe(), o.value = [], z.value = 0, H.value = null, b.value = [], w.value = !1, M.value = null, h.value = !1, pe = !1, _.value = !1, n.value = 0, f.value = 0, $.value = !1, L.value = 0, O.value = 0, J.value = !1, K.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, N.value.clear(), y.value && y.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const fe = at(async () => {
      if (d.value) return;
      y.value && (L.value = y.value.scrollTop, O.value = y.value.clientHeight), J.value = !0, await G(), await new Promise((a) => requestAnimationFrame(() => a())), J.value = !1;
      const e = Be(o.value, P.value);
      pt(e), ae(e);
    }, 200), Re = at(Tt, 200);
    function je(e) {
      d.value && ($.value = !0, R.value = e.touches[0].clientY, X.value = f.value, e.preventDefault());
    }
    function Ce(e) {
      if (!d.value || !$.value) return;
      const a = e.touches[0].clientY - R.value;
      f.value = X.value + a, e.preventDefault();
    }
    function qe(e) {
      if (!d.value || !$.value) return;
      $.value = !1;
      const a = f.value - X.value;
      Math.abs(a) > 100 ? a > 0 && U.value ? Ue() : a < 0 && C.value ? Ve() : re() : re(), e.preventDefault();
    }
    function Ye(e) {
      d.value && ($.value = !0, R.value = e.clientY, X.value = f.value, e.preventDefault());
    }
    function Se(e) {
      if (!d.value || !$.value) return;
      const a = e.clientY - R.value;
      f.value = X.value + a, e.preventDefault();
    }
    function $e(e) {
      if (!d.value || !$.value) return;
      $.value = !1;
      const a = f.value - X.value;
      Math.abs(a) > 100 ? a > 0 && U.value ? Ue() : a < 0 && C.value ? Ve() : re() : re(), e.preventDefault();
    }
    function Ve() {
      if (!C.value) {
        me();
        return;
      }
      n.value++, re(), n.value >= o.value.length - 5 && me();
    }
    function Ue() {
      U.value && (n.value--, re());
    }
    function re() {
      if (!Y.value) return;
      const e = Y.value.clientHeight;
      f.value = -n.value * e;
    }
    function _e() {
      !d.value && n.value > 0 && (n.value = 0, f.value = 0), d.value && o.value.length === 0 && !h.value && Le(b.value[0]), d.value && re();
    }
    function kt(e, a, l) {
      H.value = a, b.value = [a], b.value.push(l), w.value = l == null, se(e, "init"), d.value ? (o.value = [...o.value, ...e], n.value === 0 && o.value.length > 0 && (f.value = 0)) : (Z([...o.value, ...e]), ae());
    }
    return oe(
      p,
      () => {
        d.value || y.value && (P.value = he(p.value, u.value), Z(o.value));
      },
      { deep: !0 }
    ), oe(() => i.layoutMode, () => {
      E.value && E.value.width !== void 0 ? u.value = E.value.width : r.value && (u.value = r.value.clientWidth);
    }), oe(y, (e) => {
      e && !d.value ? (e.removeEventListener("scroll", fe), e.addEventListener("scroll", fe, { passive: !0 })) : e && e.removeEventListener("scroll", fe);
    }, { immediate: !0 }), oe(d, (e, a) => {
      a === void 0 && e === !1 || G(() => {
        e ? (document.addEventListener("mousemove", Se), document.addEventListener("mouseup", $e), y.value && y.value.removeEventListener("scroll", fe), n.value = 0, f.value = 0, o.value.length > 0 && re()) : (document.removeEventListener("mousemove", Se), document.removeEventListener("mouseup", $e), y.value && r.value && (E.value && E.value.width !== void 0 ? u.value = E.value.width : u.value = r.value.clientWidth, y.value.removeEventListener("scroll", fe), y.value.addEventListener("scroll", fe, { passive: !0 }), o.value.length > 0 && (P.value = he(p.value, u.value), Z(o.value), L.value = y.value.scrollTop, O.value = y.value.clientHeight, ae())));
      });
    }, { immediate: !0 }), oe(Y, (e) => {
      e && (e.addEventListener("touchstart", je, { passive: !1 }), e.addEventListener("touchmove", Ce, { passive: !1 }), e.addEventListener("touchend", qe), e.addEventListener("mousedown", Ye));
    }), oe(() => o.value.length, (e, a) => {
      d.value && e > 0 && a === 0 && (n.value = 0, G(() => re()));
    }), oe(r, (e) => {
      S && (S.disconnect(), S = null), e && typeof ResizeObserver < "u" ? (S = new ResizeObserver((a) => {
        if (!E.value)
          for (const l of a) {
            const m = l.contentRect.width, s = l.contentRect.height;
            u.value !== m && (u.value = m), x.value !== s && (x.value = s);
          }
      }), S.observe(e), E.value || (u.value = e.clientWidth, x.value = e.clientHeight)) : e && (E.value || (u.value = e.clientWidth, x.value = e.clientHeight));
    }, { immediate: !0 }), oe(u, (e, a) => {
      e !== a && e > 0 && !d.value && y.value && o.value.length > 0 && G(() => {
        P.value = he(p.value, e), Z(o.value), ae();
      });
    }), rt(async () => {
      try {
        await G(), r.value && !S && (u.value = r.value.clientWidth, x.value = r.value.clientHeight), d.value || (P.value = he(p.value, u.value), y.value && (L.value = y.value.scrollTop, O.value = y.value.clientHeight));
        const e = i.loadAtPage;
        b.value = [e], i.skipInitialLoad || await Le(b.value[0]), d.value ? G(() => re()) : ae();
      } catch (e) {
        console.error("Error during component initialization:", e), h.value = !1;
      }
      window.addEventListener("resize", Re), window.addEventListener("resize", _e);
    }), ot(() => {
      var e;
      S && (S.disconnect(), S = null), (e = y.value) == null || e.removeEventListener("scroll", fe), window.removeEventListener("resize", Re), window.removeEventListener("resize", _e), Y.value && (Y.value.removeEventListener("touchstart", je), Y.value.removeEventListener("touchmove", Ce), Y.value.removeEventListener("touchend", qe), Y.value.removeEventListener("mousedown", Ye)), document.removeEventListener("mousemove", Se), document.removeEventListener("mouseup", $e);
    }), (e, a) => (D(), B("div", {
      ref_key: "wrapper",
      ref: r,
      class: "w-full h-full flex flex-col relative"
    }, [
      d.value ? (D(), B("div", {
        key: 0,
        class: de(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": i.forceMotion, "cursor-grab": !$.value, "cursor-grabbing": $.value }]),
        ref_key: "swipeContainer",
        ref: Y,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        j("div", {
          class: "relative w-full",
          style: Me({
            transform: `translateY(${f.value}px)`,
            transition: $.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${o.value.length * 100}%`
          })
        }, [
          (D(!0), B(Je, null, Ke(o.value, (l, m) => (D(), B("div", {
            key: `${l.page}-${l.id}`,
            class: "absolute top-0 left-0 w-full",
            style: Me({
              top: `${m * (100 / o.value.length)}%`,
              height: `${100 / o.value.length}%`
            })
          }, [
            j("div", ya, [
              j("div", wa, [
                ee(e.$slots, "default", {
                  item: l,
                  remove: ge,
                  index: l.originalIndex ?? i.items.indexOf(l)
                }, () => [
                  He(Ie, {
                    item: l,
                    remove: ge,
                    "header-height": p.value.header,
                    "footer-height": p.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": m === n.value,
                    "onPreload:success": a[0] || (a[0] = (s) => g("item:preload:success", s)),
                    "onPreload:error": a[1] || (a[1] = (s) => g("item:preload:error", s)),
                    onMouseEnter: a[2] || (a[2] = (s) => g("item:mouse-enter", s)),
                    onMouseLeave: a[3] || (a[3] = (s) => g("item:mouse-leave", s))
                  }, {
                    header: we((s) => [
                      ee(e.$slots, "item-header", xe({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    footer: we((s) => [
                      ee(e.$slots, "item-footer", xe({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        w.value && o.value.length > 0 ? (D(), B("div", xa, [
          ee(e.$slots, "end-message", {}, () => [
            a[8] || (a[8] = j("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : le("", !0),
        M.value && o.value.length > 0 ? (D(), B("div", ba, [
          ee(e.$slots, "error-message", { error: M.value }, () => [
            j("p", Ma, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : le("", !0)
      ], 2)) : (D(), B("div", {
        key: 1,
        class: de(["overflow-auto w-full flex-1 masonry-container", { "force-motion": i.forceMotion }]),
        ref_key: "container",
        ref: y
      }, [
        j("div", {
          class: "relative",
          style: Me({ height: `${z.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          He(St, {
            name: "masonry",
            css: !1,
            onEnter: ft,
            onBeforeEnter: dt,
            onLeave: ht,
            onBeforeLeave: mt
          }, {
            default: we(() => [
              (D(!0), B(Je, null, Ke(gt.value, (l, m) => (D(), B("div", xe({
                key: `${l.page}-${l.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, $t(oa)(l, m)), [
                ee(e.$slots, "default", {
                  item: l,
                  remove: ge,
                  index: l.originalIndex ?? t.items.indexOf(l)
                }, () => [
                  He(Ie, {
                    item: l,
                    remove: ge,
                    "header-height": p.value.header,
                    "footer-height": p.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (s) => g("item:preload:success", s)),
                    "onPreload:error": a[5] || (a[5] = (s) => g("item:preload:error", s)),
                    onMouseEnter: a[6] || (a[6] = (s) => g("item:mouse-enter", s)),
                    onMouseLeave: a[7] || (a[7] = (s) => g("item:mouse-leave", s))
                  }, {
                    header: we((s) => [
                      ee(e.$slots, "item-header", xe({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    footer: we((s) => [
                      ee(e.$slots, "item-footer", xe({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        w.value && o.value.length > 0 ? (D(), B("div", Ea, [
          ee(e.$slots, "end-message", {}, () => [
            a[9] || (a[9] = j("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : le("", !0),
        M.value && o.value.length > 0 ? (D(), B("div", Ta, [
          ee(e.$slots, "error-message", { error: M.value }, () => [
            j("p", Ia, "Failed to load content: " + Ae(M.value.message), 1)
          ], !0)
        ])) : le("", !0)
      ], 2))
    ], 512));
  }
}), ka = (t, v) => {
  const c = t.__vccOpts || t;
  for (const [i, I] of v)
    c[i] = I;
  return c;
}, nt = /* @__PURE__ */ ka(La, [["__scopeId", "data-v-2168600e"]]), Sa = {
  install(t) {
    t.component("WyxosMasonry", nt), t.component("WMasonry", nt), t.component("WyxosMasonryItem", Ie), t.component("WMasonryItem", Ie);
  }
};
export {
  nt as Masonry,
  Ie as MasonryItem,
  Sa as default
};
