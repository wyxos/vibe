import { nextTick as G, defineComponent as Qe, ref as M, computed as K, onMounted as Ze, onUnmounted as et, watch as re, createElementBlock as R, openBlock as j, createCommentVNode as le, createElementVNode as q, normalizeStyle as ge, renderSlot as oe, normalizeClass as ie, withModifiers as Ve, toDisplayString as wt, Fragment as Ye, renderList as Ue, createVNode as ke, withCtx as de, mergeProps as me, TransitionGroup as bt, unref as xt } from "vue";
let Pe = null;
function Mt() {
  if (Pe != null) return Pe;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const s = document.createElement("div");
  s.style.width = "100%", t.appendChild(s);
  const u = t.offsetWidth - s.offsetWidth;
  return document.body.removeChild(t), Pe = u, u;
}
function Tt(t, s, u, o = {}) {
  const {
    gutterX: x = 0,
    gutterY: h = 0,
    header: r = 0,
    footer: f = 0,
    paddingLeft: y = 0,
    paddingRight: H = 0,
    sizes: L = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: T = "masonry"
  } = o;
  let v = 0, B = 0;
  try {
    if (s && s.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const S = window.getComputedStyle(s);
      v = parseFloat(S.paddingLeft) || 0, B = parseFloat(S.paddingRight) || 0;
    }
  } catch {
  }
  const O = (y || 0) + v, z = (H || 0) + B, d = s.offsetWidth - s.clientWidth, l = d > 0 ? d + 2 : Mt() + 2, P = s.offsetWidth - l - O - z, w = x * (u - 1), b = Math.floor((P - w) / u), N = t.map((S) => {
    const E = S.width, I = S.height;
    return Math.round(b * I / E) + f + r;
  });
  if (T === "sequential-balanced") {
    const S = N.length;
    if (S === 0) return [];
    const E = (k, F, U) => k + (F > 0 ? h : 0) + U;
    let I = Math.max(...N), n = N.reduce((k, F) => k + F, 0) + h * Math.max(0, S - 1);
    const p = (k) => {
      let F = 1, U = 0, _ = 0;
      for (let J = 0; J < S; J++) {
        const se = N[J], Z = E(U, _, se);
        if (Z <= k)
          U = Z, _++;
        else if (F++, U = se, _ = 1, se > k || F > u) return !1;
      }
      return F <= u;
    };
    for (; I < n; ) {
      const k = Math.floor((I + n) / 2);
      p(k) ? n = k : I = k + 1;
    }
    const A = n, $ = new Array(u).fill(0);
    let te = u - 1, Q = 0, D = 0;
    for (let k = S - 1; k >= 0; k--) {
      const F = N[k], U = k < te;
      !(E(Q, D, F) <= A) || U ? ($[te] = k + 1, te--, Q = F, D = 1) : (Q = E(Q, D, F), D++);
    }
    $[0] = 0;
    const Y = [], X = new Array(u).fill(0);
    for (let k = 0; k < u; k++) {
      const F = $[k], U = k + 1 < u ? $[k + 1] : S, _ = k * (b + x);
      for (let J = F; J < U; J++) {
        const Z = {
          ...t[J],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        Z.imageHeight = N[J] - (f + r), Z.columnHeight = N[J], Z.left = _, Z.top = X[k], X[k] += Z.columnHeight + (J + 1 < U ? h : 0), Y.push(Z);
      }
    }
    return Y;
  }
  const m = new Array(u).fill(0), W = [];
  for (let S = 0; S < t.length; S++) {
    const E = t[S], I = {
      ...E,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = m.indexOf(Math.min(...m)), p = E.width, A = E.height;
    I.columnWidth = b, I.left = n * (b + x), I.imageHeight = Math.round(b * A / p), I.columnHeight = I.imageHeight + f + r, I.top = m[n], m[n] += I.columnHeight + h, W.push(I);
  }
  return W;
}
var Et = typeof global == "object" && global && global.Object === Object && global, Lt = typeof self == "object" && self && self.Object === Object && self, tt = Et || Lt || Function("return this")(), be = tt.Symbol, at = Object.prototype, It = at.hasOwnProperty, kt = at.toString, he = be ? be.toStringTag : void 0;
function Pt(t) {
  var s = It.call(t, he), u = t[he];
  try {
    t[he] = void 0;
    var o = !0;
  } catch {
  }
  var x = kt.call(t);
  return o && (s ? t[he] = u : delete t[he]), x;
}
var Ht = Object.prototype, St = Ht.toString;
function $t(t) {
  return St.call(t);
}
var Nt = "[object Null]", Dt = "[object Undefined]", Ge = be ? be.toStringTag : void 0;
function Bt(t) {
  return t == null ? t === void 0 ? Dt : Nt : Ge && Ge in Object(t) ? Pt(t) : $t(t);
}
function Ft(t) {
  return t != null && typeof t == "object";
}
var Wt = "[object Symbol]";
function At(t) {
  return typeof t == "symbol" || Ft(t) && Bt(t) == Wt;
}
var Ot = /\s/;
function zt(t) {
  for (var s = t.length; s-- && Ot.test(t.charAt(s)); )
    ;
  return s;
}
var Rt = /^\s+/;
function jt(t) {
  return t && t.slice(0, zt(t) + 1).replace(Rt, "");
}
function Se(t) {
  var s = typeof t;
  return t != null && (s == "object" || s == "function");
}
var Xe = NaN, Ct = /^[-+]0x[0-9a-f]+$/i, qt = /^0b[01]+$/i, Vt = /^0o[0-7]+$/i, Yt = parseInt;
function _e(t) {
  if (typeof t == "number")
    return t;
  if (At(t))
    return Xe;
  if (Se(t)) {
    var s = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Se(s) ? s + "" : s;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = jt(t);
  var u = qt.test(t);
  return u || Vt.test(t) ? Yt(t.slice(2), u ? 2 : 8) : Ct.test(t) ? Xe : +t;
}
var He = function() {
  return tt.Date.now();
}, Ut = "Expected a function", Gt = Math.max, Xt = Math.min;
function Je(t, s, u) {
  var o, x, h, r, f, y, H = 0, L = !1, T = !1, v = !0;
  if (typeof t != "function")
    throw new TypeError(Ut);
  s = _e(s) || 0, Se(u) && (L = !!u.leading, T = "maxWait" in u, h = T ? Gt(_e(u.maxWait) || 0, s) : h, v = "trailing" in u ? !!u.trailing : v);
  function B(m) {
    var W = o, S = x;
    return o = x = void 0, H = m, r = t.apply(S, W), r;
  }
  function O(m) {
    return H = m, f = setTimeout(l, s), L ? B(m) : r;
  }
  function z(m) {
    var W = m - y, S = m - H, E = s - W;
    return T ? Xt(E, h - S) : E;
  }
  function d(m) {
    var W = m - y, S = m - H;
    return y === void 0 || W >= s || W < 0 || T && S >= h;
  }
  function l() {
    var m = He();
    if (d(m))
      return P(m);
    f = setTimeout(l, z(m));
  }
  function P(m) {
    return f = void 0, v && o ? B(m) : (o = x = void 0, r);
  }
  function w() {
    f !== void 0 && clearTimeout(f), H = 0, o = y = x = f = void 0;
  }
  function b() {
    return f === void 0 ? r : P(He());
  }
  function N() {
    var m = He(), W = d(m);
    if (o = arguments, x = this, y = m, W) {
      if (f === void 0)
        return O(y);
      if (T)
        return clearTimeout(f), f = setTimeout(l, s), B(y);
    }
    return f === void 0 && (f = setTimeout(l, s)), r;
  }
  return N.cancel = w, N.flush = b, N;
}
function pe(t, s) {
  const u = s ?? (typeof window < "u" ? window.innerWidth : 1024), o = t.sizes;
  return u >= 1536 && o["2xl"] ? o["2xl"] : u >= 1280 && o.xl ? o.xl : u >= 1024 && o.lg ? o.lg : u >= 768 && o.md ? o.md : u >= 640 && o.sm ? o.sm : o.base;
}
function _t(t) {
  const s = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return s >= 1536 ? "2xl" : s >= 1280 ? "xl" : s >= 1024 ? "lg" : s >= 768 ? "md" : s >= 640 ? "sm" : "base";
}
function Jt(t) {
  return t.reduce((u, o) => Math.max(u, o.top + o.columnHeight), 0) + 500;
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
function Qt(t, s = 0) {
  return {
    style: Kt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": s
  };
}
function $e(t, s) {
  if (!t.length || s <= 0)
    return new Array(Math.max(1, s)).fill(0);
  const o = Array.from(new Set(t.map((r) => r.left))).sort((r, f) => r - f).slice(0, s), x = /* @__PURE__ */ new Map();
  for (let r = 0; r < o.length; r++) x.set(o[r], r);
  const h = new Array(o.length).fill(0);
  for (const r of t) {
    const f = x.get(r.left);
    f != null && (h[f] = Math.max(h[f], r.top + r.columnHeight));
  }
  for (; h.length < s; ) h.push(0);
  return h;
}
function Zt(t, s) {
  function u(r, f) {
    const y = parseInt(r.dataset.left || "0", 10), H = parseInt(r.dataset.top || "0", 10), L = parseInt(r.dataset.index || "0", 10), T = Math.min(L * 20, 160), v = r.style.getPropertyValue("--masonry-opacity-delay");
    r.style.setProperty("--masonry-opacity-delay", `${T}ms`), requestAnimationFrame(() => {
      r.style.opacity = "1", r.style.transform = `translate3d(${y}px, ${H}px, 0) scale(1)`;
      const B = () => {
        v ? r.style.setProperty("--masonry-opacity-delay", v) : r.style.removeProperty("--masonry-opacity-delay"), r.removeEventListener("transitionend", B), f();
      };
      r.addEventListener("transitionend", B);
    });
  }
  function o(r) {
    const f = parseInt(r.dataset.left || "0", 10), y = parseInt(r.dataset.top || "0", 10);
    r.style.opacity = "0", r.style.transform = `translate3d(${f}px, ${y + 10}px, 0) scale(0.985)`;
  }
  function x(r) {
    const f = parseInt(r.dataset.left || "0", 10), y = parseInt(r.dataset.top || "0", 10);
    r.style.transition = "none", r.style.opacity = "1", r.style.transform = `translate3d(${f}px, ${y}px, 0) scale(1)`, r.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      r.style.transition = "";
    });
  }
  function h(r, f) {
    const y = parseInt(r.dataset.left || "0", 10), H = parseInt(r.dataset.top || "0", 10), L = typeof (s == null ? void 0 : s.leaveDurationMs) == "number" ? s.leaveDurationMs : NaN;
    let T = Number.isFinite(L) && L > 0 ? L : NaN;
    if (!Number.isFinite(T)) {
      const l = getComputedStyle(r).getPropertyValue("--masonry-leave-duration") || "", P = parseFloat(l);
      T = Number.isFinite(P) && P > 0 ? P : 200;
    }
    const v = r.style.transitionDuration, B = () => {
      r.removeEventListener("transitionend", O), clearTimeout(z), r.style.transitionDuration = v || "";
    }, O = (d) => {
      (!d || d.target === r) && (B(), f());
    }, z = setTimeout(() => {
      B(), f();
    }, T + 100);
    requestAnimationFrame(() => {
      r.style.transitionDuration = `${T}ms`, r.style.opacity = "0", r.style.transform = `translate3d(${y}px, ${H + 10}px, 0) scale(0.985)`, r.addEventListener("transitionend", O);
    });
  }
  return {
    onEnter: u,
    onBeforeEnter: o,
    onBeforeLeave: x,
    onLeave: h
  };
}
function ea({
  container: t,
  masonry: s,
  columns: u,
  containerHeight: o,
  isLoading: x,
  pageSize: h,
  refreshLayout: r,
  setItemsRaw: f,
  loadNext: y,
  loadThresholdPx: H
}) {
  let L = 0;
  async function T(v) {
    if (!t.value) return;
    const B = v ?? $e(s.value, u.value), O = B.length ? Math.max(...B) : 0, z = t.value.scrollTop + t.value.clientHeight, d = t.value.scrollTop > L + 1;
    L = t.value.scrollTop;
    const l = typeof H == "number" ? H : 200, P = l >= 0 ? Math.max(0, O - l) : Math.max(0, O + l);
    if (z >= P && d && !x.value) {
      await y(), await G();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
const ta = { class: "flex-1 relative min-h-0" }, aa = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, na = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, oa = {
  key: 1,
  class: "relative w-full h-full"
}, ra = ["src"], la = ["src", "autoplay", "controls"], ia = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, sa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ua = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, xe = /* @__PURE__ */ Qe({
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
  setup(t, { emit: s }) {
    const u = t, o = s, x = M(!1), h = M(!1), r = M(null), f = M(!1), y = M(!1), H = M(null), L = M(!1), T = M(!1), v = M(!1), B = M(null), O = M(null);
    let z = null;
    const d = K(() => {
      var n;
      return u.type ?? ((n = u.item) == null ? void 0 : n.type) ?? "image";
    }), l = K(() => {
      var n;
      return u.notFound ?? ((n = u.item) == null ? void 0 : n.notFound) ?? !1;
    }), P = K(() => !!u.inSwipeMode);
    function w(n) {
      o("mouse-enter", { item: u.item, type: n });
    }
    function b(n) {
      o("mouse-leave", { item: u.item, type: n });
    }
    function N(n) {
      if (P.value) return;
      const p = n.target;
      p && (p.paused ? p.play() : p.pause());
    }
    function m(n) {
      const p = n.target;
      p && (P.value || p.play(), w("video"));
    }
    function W(n) {
      const p = n.target;
      p && (P.value || p.pause(), b("video"));
    }
    function S(n) {
      return new Promise((p, A) => {
        if (!n) {
          const D = new Error("No image source provided");
          o("preload:error", { item: u.item, type: "image", src: n, error: D }), A(D);
          return;
        }
        const $ = new Image(), te = Date.now(), Q = 300;
        $.onload = () => {
          const D = Date.now() - te, Y = Math.max(0, Q - D);
          setTimeout(async () => {
            x.value = !0, h.value = !1, T.value = !1, await G(), await new Promise((X) => setTimeout(X, 100)), v.value = !0, o("preload:success", { item: u.item, type: "image", src: n }), p();
          }, Y);
        }, $.onerror = () => {
          h.value = !0, x.value = !1, T.value = !1;
          const D = new Error("Failed to load image");
          o("preload:error", { item: u.item, type: "image", src: n, error: D }), A(D);
        }, $.src = n;
      });
    }
    function E(n) {
      return new Promise((p, A) => {
        if (!n) {
          const D = new Error("No video source provided");
          o("preload:error", { item: u.item, type: "video", src: n, error: D }), A(D);
          return;
        }
        const $ = document.createElement("video"), te = Date.now(), Q = 300;
        $.preload = "metadata", $.muted = !0, $.onloadedmetadata = () => {
          const D = Date.now() - te, Y = Math.max(0, Q - D);
          setTimeout(async () => {
            f.value = !0, y.value = !1, T.value = !1, await G(), await new Promise((X) => setTimeout(X, 100)), v.value = !0, o("preload:success", { item: u.item, type: "video", src: n }), p();
          }, Y);
        }, $.onerror = () => {
          y.value = !0, f.value = !1, T.value = !1;
          const D = new Error("Failed to load video");
          o("preload:error", { item: u.item, type: "video", src: n, error: D }), A(D);
        }, $.src = n;
      });
    }
    async function I() {
      var p;
      if (!L.value || T.value || l.value || d.value === "video" && f.value || d.value === "image" && x.value)
        return;
      const n = (p = u.item) == null ? void 0 : p.src;
      if (n)
        if (T.value = !0, v.value = !1, d.value === "video") {
          H.value = n, f.value = !1, y.value = !1;
          try {
            await E(n);
          } catch {
          }
        } else {
          r.value = n, x.value = !1, h.value = !1;
          try {
            await S(n);
          } catch {
          }
        }
    }
    return Ze(() => {
      B.value && (z = new IntersectionObserver(
        (n) => {
          n.forEach((p) => {
            p.isIntersecting && p.intersectionRatio >= 1 ? L.value || (L.value = !0, I()) : p.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), z.observe(B.value));
    }), et(() => {
      z && (z.disconnect(), z = null);
    }), re(
      () => {
        var n;
        return (n = u.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || l.value)) {
          if (d.value === "video") {
            if (n !== H.value && (f.value = !1, y.value = !1, H.value = n, L.value)) {
              T.value = !0;
              try {
                await E(n);
              } catch {
              }
            }
          } else if (n !== r.value && (x.value = !1, h.value = !1, r.value = n, L.value)) {
            T.value = !0;
            try {
              await S(n);
            } catch {
            }
          }
        }
      }
    ), re(
      () => u.isActive,
      (n) => {
        !P.value || !O.value || (n ? O.value.play() : O.value.pause());
      }
    ), (n, p) => (j(), R("div", {
      ref_key: "containerRef",
      ref: B,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (j(), R("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${n.headerHeight}px` })
      }, [
        oe(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: x.value,
          imageError: h.value,
          videoLoaded: f.value,
          videoError: y.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: d.value
        })
      ], 4)) : le("", !0),
      q("div", ta, [
        oe(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: x.value,
          imageError: h.value,
          videoLoaded: f.value,
          videoError: y.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: d.value,
          imageSrc: r.value,
          videoSrc: H.value,
          showMedia: v.value
        }, () => [
          q("div", aa, [
            l.value ? (j(), R("div", na, p[3] || (p[3] = [
              q("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              q("span", { class: "font-medium" }, "Not Found", -1),
              q("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), R("div", oa, [
              d.value === "image" && r.value ? (j(), R("img", {
                key: 0,
                src: r.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  x.value && v.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: p[0] || (p[0] = (A) => w("image")),
                onMouseleave: p[1] || (p[1] = (A) => b("image"))
              }, null, 42, ra)) : le("", !0),
              d.value === "video" && H.value ? (j(), R("video", {
                key: 1,
                ref_key: "videoEl",
                ref: O,
                src: H.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  f.value && v.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: P.value && u.isActive,
                controls: P.value,
                onClick: Ve(N, ["stop"]),
                onTouchend: Ve(N, ["stop", "prevent"]),
                onMouseenter: m,
                onMouseleave: W,
                onError: p[2] || (p[2] = (A) => y.value = !0)
              }, null, 42, la)) : le("", !0),
              !x.value && !f.value && !h.value && !y.value ? (j(), R("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  v.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                q("div", ia, [
                  q("i", {
                    class: ie(d.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : le("", !0),
              T.value ? (j(), R("div", sa, p[4] || (p[4] = [
                q("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  q("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : le("", !0),
              d.value === "image" && h.value || d.value === "video" && y.value ? (j(), R("div", ua, [
                q("i", {
                  class: ie(d.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                q("span", null, "Failed to load " + wt(d.value), 1)
              ])) : le("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (j(), R("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${n.footerHeight}px` })
      }, [
        oe(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: x.value,
          imageError: h.value,
          videoLoaded: f.value,
          videoError: y.value,
          showNotFound: l.value,
          isLoading: T.value,
          mediaType: d.value
        })
      ], 4)) : le("", !0)
    ], 512));
  }
}), ca = { class: "w-full h-full flex items-center justify-center p-4" }, fa = { class: "w-full h-full max-w-full max-h-full relative" }, va = /* @__PURE__ */ Qe({
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
  setup(t, { expose: s, emit: u }) {
    const o = t, x = {
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
        ...x,
        ...o.layout,
        sizes: {
          ...x.sizes,
          ...((e = o.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), r = M(null), f = M(typeof window < "u" ? window.innerWidth : 1024), y = M(typeof window < "u" ? window.innerHeight : 768), H = M(null);
    let L = null;
    function T(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const v = K(() => {
      if (o.layoutMode === "masonry") return !1;
      if (o.layoutMode === "swipe") return !0;
      const e = typeof o.mobileBreakpoint == "string" ? T(o.mobileBreakpoint) : o.mobileBreakpoint;
      return f.value < e;
    }), B = K(() => {
      if (!v.value || l.value.length === 0) return null;
      const e = Math.max(0, Math.min(E.value, l.value.length - 1));
      return l.value[e] || null;
    }), O = K(() => {
      if (!v.value || !B.value) return null;
      const e = E.value + 1;
      return e >= l.value.length ? null : l.value[e] || null;
    }), z = K(() => {
      if (!v.value || !B.value) return null;
      const e = E.value - 1;
      return e < 0 ? null : l.value[e] || null;
    }), d = u, l = K({
      get: () => o.items,
      set: (e) => d("update:items", e)
    }), P = M(7), w = M(null), b = M([]), N = M(null), m = M(!1), W = M(0), S = K(() => _t(f.value)), E = M(0), I = M(0), n = M(!1), p = M(0), A = M(0), $ = M(null), te = M(/* @__PURE__ */ new Set());
    function Q(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function D(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const i = e.filter((c) => !Q(c == null ? void 0 : c.width) || !Q(c == null ? void 0 : c.height));
        if (i.length === 0) return;
        const g = [];
        for (const c of i) {
          const V = (c == null ? void 0 : c.id) ?? `idx:${e.indexOf(c)}`;
          te.value.has(V) || (te.value.add(V), g.push(V));
        }
        if (g.length > 0) {
          const c = g.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: g.length,
              sampleIds: c,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const Y = M(0), X = M(0), k = o.virtualBufferPx, F = M(!1), U = M({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), _ = (e) => {
      if (!w.value) return;
      const { scrollTop: a, clientHeight: i } = w.value, g = a + i, c = e ?? $e(l.value, P.value), V = c.length ? Math.max(...c) : 0, ee = typeof o.loadThresholdPx == "number" ? o.loadThresholdPx : 200, ce = ee >= 0 ? Math.max(0, V - ee) : Math.max(0, V + ee), qe = Math.max(0, ce - g), yt = qe <= 100;
      U.value = {
        distanceToTrigger: Math.round(qe),
        isNearTrigger: yt
      };
    }, { onEnter: J, onBeforeEnter: se, onBeforeLeave: Z, onLeave: nt } = Zt(l, { leaveDurationMs: o.leaveDurationMs });
    function ot(e, a) {
      if (F.value) {
        const i = parseInt(e.dataset.left || "0", 10), g = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${i}px, ${g}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        J(e, a);
    }
    function rt(e) {
      if (F.value) {
        const a = parseInt(e.dataset.left || "0", 10), i = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${i}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        se(e);
    }
    function lt(e) {
      F.value || Z(e);
    }
    function it(e, a) {
      F.value ? a() : nt(e, a);
    }
    const st = K(() => {
      const e = Y.value - k, a = Y.value + X.value + k, i = l.value;
      return !i || i.length === 0 ? [] : i.filter((g) => {
        const c = g.top;
        return g.top + g.columnHeight >= e && c <= a;
      });
    }), { handleScroll: ut } = ea({
      container: w,
      masonry: l,
      columns: P,
      containerHeight: W,
      isLoading: m,
      pageSize: o.pageSize,
      refreshLayout: ae,
      setItemsRaw: (e) => {
        l.value = e;
      },
      loadNext: ue,
      loadThresholdPx: o.loadThresholdPx
    });
    function ct(e) {
      H.value = e, e && (e.width !== void 0 && (f.value = e.width), e.height !== void 0 && (y.value = e.height));
    }
    s({
      isLoading: m,
      refreshLayout: ae,
      // Container dimensions (wrapper element)
      containerWidth: f,
      containerHeight: y,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: W,
      // Current page
      currentPage: N,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: ct,
      remove: fe,
      removeMany: dt,
      removeAll: mt,
      loadNext: ue,
      loadPage: Me,
      refreshCurrentPage: Te,
      reset: pt,
      init: gt,
      paginationHistory: b,
      cancelLoad: Be,
      scrollToTop: De,
      totalItems: K(() => l.value.length),
      currentBreakpoint: S
    });
    function ft(e) {
      const a = Jt(e);
      let i = 0;
      if (w.value) {
        const { scrollTop: g, clientHeight: c } = w.value;
        i = g + c + 100;
      }
      W.value = Math.max(a, i);
    }
    function ae(e) {
      if (v.value) {
        l.value = e;
        return;
      }
      if (!w.value) return;
      D(e, "refreshLayout");
      const a = e.map((g, c) => ({
        ...g,
        originalIndex: g.originalIndex ?? c
      })), i = Tt(a, w.value, P.value, h.value);
      ft(i), l.value = i;
    }
    function Ne(e, a) {
      return new Promise((i) => {
        const g = Math.max(0, e | 0), c = Date.now();
        a(g, g);
        const V = setInterval(() => {
          if (C.value) {
            clearInterval(V), i();
            return;
          }
          const ee = Date.now() - c, ce = Math.max(0, g - ee);
          a(ce, g), ce <= 0 && (clearInterval(V), i());
        }, 100);
      });
    }
    async function ye(e) {
      try {
        const a = await vt(() => o.getNextPage(e));
        return ae([...l.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function vt(e) {
      let a = 0;
      const i = o.retryMaxAttempts;
      let g = o.retryInitialDelayMs;
      for (; ; )
        try {
          const c = await e();
          return a > 0 && d("retry:stop", { attempt: a, success: !0 }), c;
        } catch (c) {
          if (a++, a > i)
            throw d("retry:stop", { attempt: a - 1, success: !1 }), c;
          d("retry:start", { attempt: a, max: i, totalMs: g }), await Ne(g, (V, ee) => {
            d("retry:tick", { attempt: a, remainingMs: V, totalMs: ee });
          }), g += o.retryBackoffStepMs;
        }
    }
    async function Me(e) {
      if (!m.value) {
        C.value = !1, m.value = !0;
        try {
          const a = l.value.length;
          if (C.value) return;
          const i = await ye(e);
          return C.value ? void 0 : (N.value = e, b.value.push(i.nextPage), await ve(a), i);
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          m.value = !1;
        }
      }
    }
    async function ue() {
      if (!m.value) {
        C.value = !1, m.value = !0;
        try {
          const e = l.value.length;
          if (C.value) return;
          const a = b.value[b.value.length - 1], i = await ye(a);
          return C.value ? void 0 : (N.value = a, b.value.push(i.nextPage), await ve(e), i);
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          m.value = !1;
        }
      }
    }
    async function Te() {
      if (!m.value) {
        C.value = !1, m.value = !0;
        try {
          const e = N.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", N.value, "paginationHistory:", b.value);
            return;
          }
          l.value = [], W.value = 0, b.value = [e], await G();
          const a = await ye(e);
          if (C.value) return;
          N.value = e, b.value.push(a.nextPage);
          const i = l.value.length;
          return await ve(i), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), e;
        } finally {
          m.value = !1;
        }
      }
    }
    async function fe(e) {
      const a = l.value.filter((i) => i.id !== e.id);
      if (l.value = a, await G(), a.length === 0 && b.value.length > 0) {
        if (o.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await ve(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        ae(a);
      });
    }
    async function dt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((g) => g.id)), i = l.value.filter((g) => !a.has(g.id));
      if (l.value = i, await G(), i.length === 0 && b.value.length > 0) {
        if (o.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await ve(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((g) => requestAnimationFrame(() => g())), requestAnimationFrame(() => {
        ae(i);
      });
    }
    function De(e) {
      w.value && w.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function mt() {
      De({ behavior: "smooth" }), l.value = [], y.value = 0, await G(), d("remove-all:complete");
    }
    function ht() {
      P.value = pe(h.value, f.value), ae(l.value), w.value && (Y.value = w.value.scrollTop, X.value = w.value.clientHeight);
    }
    let we = !1;
    const C = M(!1);
    async function ve(e, a = !1) {
      if (!a && !o.backfillEnabled || we || C.value) return;
      const i = (e || 0) + (o.pageSize || 0);
      if (!(!o.pageSize || o.pageSize <= 0 || b.value[b.value.length - 1] == null) && !(l.value.length >= i)) {
        we = !0;
        try {
          let c = 0;
          for (d("backfill:start", { target: i, fetched: l.value.length, calls: c }); l.value.length < i && c < o.backfillMaxCalls && b.value[b.value.length - 1] != null && !C.value && (await Ne(o.backfillDelayMs, (ee, ce) => {
            d("backfill:tick", {
              fetched: l.value.length,
              target: i,
              calls: c,
              remainingMs: ee,
              totalMs: ce
            });
          }), !C.value); ) {
            const V = b.value[b.value.length - 1];
            try {
              m.value = !0;
              const ee = await ye(V);
              if (C.value) break;
              b.value.push(ee.nextPage);
            } finally {
              m.value = !1;
            }
            c++;
          }
          d("backfill:stop", { fetched: l.value.length, calls: c });
        } finally {
          we = !1;
        }
      }
    }
    function Be() {
      C.value = !0, m.value = !1, we = !1;
    }
    function pt() {
      Be(), C.value = !1, w.value && w.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), l.value = [], y.value = 0, N.value = o.loadAtPage, b.value = [o.loadAtPage], U.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const Ee = Je(async () => {
      if (v.value) return;
      w.value && (Y.value = w.value.scrollTop, X.value = w.value.clientHeight), F.value = !0, await G(), await new Promise((a) => requestAnimationFrame(() => a())), F.value = !1;
      const e = $e(l.value, P.value);
      ut(e), _(e);
    }, 200), Fe = Je(ht, 200);
    function We(e) {
      v.value && (n.value = !0, p.value = e.touches[0].clientY, A.value = I.value, e.preventDefault());
    }
    function Ae(e) {
      if (!v.value || !n.value) return;
      const a = e.touches[0].clientY - p.value;
      I.value = A.value + a, e.preventDefault();
    }
    function Oe(e) {
      if (!v.value || !n.value) return;
      n.value = !1;
      const a = I.value - A.value;
      Math.abs(a) > 100 ? a > 0 && z.value ? je() : a < 0 && O.value ? Re() : ne() : ne(), e.preventDefault();
    }
    function ze(e) {
      v.value && (n.value = !0, p.value = e.clientY, A.value = I.value, e.preventDefault());
    }
    function Le(e) {
      if (!v.value || !n.value) return;
      const a = e.clientY - p.value;
      I.value = A.value + a, e.preventDefault();
    }
    function Ie(e) {
      if (!v.value || !n.value) return;
      n.value = !1;
      const a = I.value - A.value;
      Math.abs(a) > 100 ? a > 0 && z.value ? je() : a < 0 && O.value ? Re() : ne() : ne(), e.preventDefault();
    }
    function Re() {
      if (!O.value) {
        ue();
        return;
      }
      E.value++, ne(), E.value >= l.value.length - 5 && ue();
    }
    function je() {
      z.value && (E.value--, ne());
    }
    function ne() {
      if (!$.value) return;
      const e = $.value.clientHeight;
      I.value = -E.value * e;
    }
    function Ce() {
      !v.value && E.value > 0 && (E.value = 0, I.value = 0), v.value && l.value.length === 0 && !m.value && Me(b.value[0]), v.value && ne();
    }
    function gt(e, a, i) {
      N.value = a, b.value = [a], b.value.push(i), D(e, "init"), v.value ? (l.value = [...l.value, ...e], E.value === 0 && l.value.length > 0 && (I.value = 0)) : (ae([...l.value, ...e]), _());
    }
    return re(
      h,
      () => {
        v.value || w.value && (P.value = pe(h.value, f.value), ae(l.value));
      },
      { deep: !0 }
    ), re(v, (e) => {
      G(() => {
        e ? (document.addEventListener("mousemove", Le), document.addEventListener("mouseup", Ie), E.value = 0, I.value = 0, l.value.length > 0 && ne()) : (document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie), w.value && r.value && (f.value = r.value.clientWidth, w.value.removeEventListener("scroll", Ee), w.value.addEventListener("scroll", Ee, { passive: !0 }), l.value.length > 0 && (P.value = pe(h.value, f.value), ae(l.value), Y.value = w.value.scrollTop, X.value = w.value.clientHeight, _())));
      });
    }, { immediate: !0 }), re($, (e) => {
      e && (e.addEventListener("touchstart", We, { passive: !1 }), e.addEventListener("touchmove", Ae, { passive: !1 }), e.addEventListener("touchend", Oe), e.addEventListener("mousedown", ze));
    }), re(() => l.value.length, (e, a) => {
      v.value && e > 0 && a === 0 && (E.value = 0, G(() => ne()));
    }), re(r, (e) => {
      L && (L.disconnect(), L = null), e && typeof ResizeObserver < "u" ? (L = new ResizeObserver((a) => {
        if (!H.value)
          for (const i of a) {
            const g = i.contentRect.width, c = i.contentRect.height;
            f.value !== g && (f.value = g), y.value !== c && (y.value = c);
          }
      }), L.observe(e), H.value || (f.value = e.clientWidth, y.value = e.clientHeight)) : e && (H.value || (f.value = e.clientWidth, y.value = e.clientHeight));
    }, { immediate: !0 }), re(f, (e, a) => {
      e !== a && e > 0 && !v.value && w.value && l.value.length > 0 && G(() => {
        P.value = pe(h.value, e), ae(l.value), _();
      });
    }), Ze(async () => {
      try {
        await G(), r.value && !L && (f.value = r.value.clientWidth, y.value = r.value.clientHeight), v.value || (P.value = pe(h.value, f.value), w.value && (Y.value = w.value.scrollTop, X.value = w.value.clientHeight));
        const e = o.loadAtPage;
        b.value = [e], o.skipInitialLoad || await Me(b.value[0]), v.value ? G(() => ne()) : _();
      } catch (e) {
        console.error("Error during component initialization:", e), m.value = !1;
      }
      window.addEventListener("resize", Fe), window.addEventListener("resize", Ce);
    }), et(() => {
      var e;
      L && (L.disconnect(), L = null), (e = w.value) == null || e.removeEventListener("scroll", Ee), window.removeEventListener("resize", Fe), window.removeEventListener("resize", Ce), $.value && ($.value.removeEventListener("touchstart", We), $.value.removeEventListener("touchmove", Ae), $.value.removeEventListener("touchend", Oe), $.value.removeEventListener("mousedown", ze)), document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie);
    }), (e, a) => (j(), R("div", {
      ref_key: "wrapper",
      ref: r,
      class: "w-full h-full flex flex-col relative"
    }, [
      v.value ? (j(), R("div", {
        key: 0,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": o.forceMotion, "cursor-grab": !n.value, "cursor-grabbing": n.value }]),
        ref_key: "swipeContainer",
        ref: $,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        q("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${I.value}px)`,
            transition: n.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${l.value.length * 100}%`
          })
        }, [
          (j(!0), R(Ye, null, Ue(l.value, (i, g) => (j(), R("div", {
            key: `${i.page}-${i.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${g * (100 / l.value.length)}%`,
              height: `${100 / l.value.length}%`
            })
          }, [
            q("div", ca, [
              q("div", fa, [
                oe(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  ke(xe, {
                    item: i,
                    remove: fe,
                    "header-height": h.value.header,
                    "footer-height": h.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": g === E.value,
                    "onPreload:success": a[0] || (a[0] = (c) => d("item:preload:success", c)),
                    "onPreload:error": a[1] || (a[1] = (c) => d("item:preload:error", c)),
                    onMouseEnter: a[2] || (a[2] = (c) => d("item:mouse-enter", c)),
                    onMouseLeave: a[3] || (a[3] = (c) => d("item:mouse-leave", c))
                  }, {
                    header: de((c) => [
                      oe(e.$slots, "item-header", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    footer: de((c) => [
                      oe(e.$slots, "item-footer", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4)
      ], 2)) : (j(), R("div", {
        key: 1,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": o.forceMotion }]),
        ref_key: "container",
        ref: w
      }, [
        q("div", {
          class: "relative",
          style: ge({ height: `${W.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          ke(bt, {
            name: "masonry",
            css: !1,
            onEnter: ot,
            onBeforeEnter: rt,
            onLeave: it,
            onBeforeLeave: lt
          }, {
            default: de(() => [
              (j(!0), R(Ye, null, Ue(st.value, (i, g) => (j(), R("div", me({
                key: `${i.page}-${i.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, xt(Qt)(i, g)), [
                oe(e.$slots, "default", {
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
                    "onPreload:success": a[4] || (a[4] = (c) => d("item:preload:success", c)),
                    "onPreload:error": a[5] || (a[5] = (c) => d("item:preload:error", c)),
                    onMouseEnter: a[6] || (a[6] = (c) => d("item:mouse-enter", c)),
                    onMouseLeave: a[7] || (a[7] = (c) => d("item:mouse-leave", c))
                  }, {
                    header: de((c) => [
                      oe(e.$slots, "item-header", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    footer: de((c) => [
                      oe(e.$slots, "item-footer", me({ ref_for: !0 }, c), void 0, !0)
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
}), da = (t, s) => {
  const u = t.__vccOpts || t;
  for (const [o, x] of s)
    u[o] = x;
  return u;
}, Ke = /* @__PURE__ */ da(va, [["__scopeId", "data-v-5d5437ee"]]), ha = {
  install(t) {
    t.component("WyxosMasonry", Ke), t.component("WMasonry", Ke), t.component("WyxosMasonryItem", xe), t.component("WMasonryItem", xe);
  }
};
export {
  Ke as Masonry,
  xe as MasonryItem,
  ha as default
};
