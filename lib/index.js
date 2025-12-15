import { nextTick as G, defineComponent as rt, ref as k, computed as ne, onMounted as ot, onUnmounted as it, watch as ce, createElementBlock as R, openBlock as j, createCommentVNode as se, createElementVNode as V, normalizeStyle as Ee, renderSlot as ae, normalizeClass as he, withModifiers as Je, toDisplayString as Ae, Fragment as Ke, renderList as Qe, createVNode as Fe, withCtx as xe, mergeProps as be, TransitionGroup as $t, unref as Ht } from "vue";
let Be = null;
function Nt() {
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
    gutterX: T = 0,
    gutterY: w = 0,
    header: y = 0,
    footer: v = 0,
    paddingLeft: I = 0,
    paddingRight: L = 0,
    sizes: i = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: M = "masonry"
  } = o;
  let f = 0, N = 0;
  try {
    if (c && c.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const x = window.getComputedStyle(c);
      f = parseFloat(x.paddingLeft) || 0, N = parseFloat(x.paddingRight) || 0;
    }
  } catch {
  }
  const O = (I || 0) + f, B = (L || 0) + N, m = c.offsetWidth - c.clientWidth, l = m > 0 ? m + 2 : Nt() + 2, $ = c.offsetWidth - l - O - B, g = T * (u - 1), b = Math.floor(($ - g) / u), H = t.map((x) => {
    const E = x.width, Y = x.height;
    return Math.round(b * Y / E) + v + y;
  });
  if (M === "sequential-balanced") {
    const x = H.length;
    if (x === 0) return [];
    const E = (P, C, Z) => P + (C > 0 ? w : 0) + Z;
    let Y = Math.max(...H), n = H.reduce((P, C) => P + C, 0) + w * Math.max(0, x - 1);
    const h = (P) => {
      let C = 1, Z = 0, K = 0;
      for (let Q = 0; Q < x; Q++) {
        const le = H[Q], re = E(Z, K, le);
        if (re <= P)
          Z = re, K++;
        else if (C++, Z = le, K = 1, le > P || C > u) return !1;
      }
      return C <= u;
    };
    for (; Y < n; ) {
      const P = Math.floor((Y + n) / 2);
      h(P) ? n = P : Y = P + 1;
    }
    const F = n, q = new Array(u).fill(0);
    let J = u - 1, U = 0, A = 0;
    for (let P = x - 1; P >= 0; P--) {
      const C = H[P], Z = P < J;
      !(E(U, A, C) <= F) || Z ? (q[J] = P + 1, J--, U = C, A = 1) : (U = E(U, A, C), A++);
    }
    q[0] = 0;
    const ve = [], fe = new Array(u).fill(0);
    for (let P = 0; P < u; P++) {
      const C = q[P], Z = P + 1 < u ? q[P + 1] : x, K = P * (b + T);
      for (let Q = C; Q < Z; Q++) {
        const re = {
          ...t[Q],
          columnWidth: b,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        re.imageHeight = H[Q] - (v + y), re.columnHeight = H[Q], re.left = K, re.top = fe[P], fe[P] += re.columnHeight + (Q + 1 < Z ? w : 0), ve.push(re);
      }
    }
    return ve;
  }
  const p = new Array(u).fill(0), W = [];
  for (let x = 0; x < t.length; x++) {
    const E = t[x], Y = {
      ...E,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = p.indexOf(Math.min(...p)), h = E.width, F = E.height;
    Y.columnWidth = b, Y.left = n * (b + T), Y.imageHeight = Math.round(b * F / h), Y.columnHeight = Y.imageHeight + v + y, Y.top = p[n], p[n] += Y.columnHeight + w, W.push(Y);
  }
  return W;
}
var Ft = typeof global == "object" && global && global.Object === Object && global, Bt = typeof self == "object" && self && self.Object === Object && self, st = Ft || Bt || Function("return this")(), Ie = st.Symbol, ut = Object.prototype, Wt = ut.hasOwnProperty, At = ut.toString, Me = Ie ? Ie.toStringTag : void 0;
function Dt(t) {
  var c = Wt.call(t, Me), u = t[Me];
  try {
    t[Me] = void 0;
    var o = !0;
  } catch {
  }
  var T = At.call(t);
  return o && (c ? t[Me] = u : delete t[Me]), T;
}
var Ot = Object.prototype, zt = Ot.toString;
function Rt(t) {
  return zt.call(t);
}
var jt = "[object Null]", Ct = "[object Undefined]", et = Ie ? Ie.toStringTag : void 0;
function qt(t) {
  return t == null ? t === void 0 ? Ct : jt : et && et in Object(t) ? Dt(t) : Rt(t);
}
function Vt(t) {
  return t != null && typeof t == "object";
}
var Yt = "[object Symbol]";
function Ut(t) {
  return typeof t == "symbol" || Vt(t) && qt(t) == Yt;
}
var _t = /\s/;
function Xt(t) {
  for (var c = t.length; c-- && _t.test(t.charAt(c)); )
    ;
  return c;
}
var Gt = /^\s+/;
function Jt(t) {
  return t && t.slice(0, Xt(t) + 1).replace(Gt, "");
}
function De(t) {
  var c = typeof t;
  return t != null && (c == "object" || c == "function");
}
var tt = NaN, Kt = /^[-+]0x[0-9a-f]+$/i, Qt = /^0b[01]+$/i, Zt = /^0o[0-7]+$/i, ea = parseInt;
function at(t) {
  if (typeof t == "number")
    return t;
  if (Ut(t))
    return tt;
  if (De(t)) {
    var c = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = De(c) ? c + "" : c;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Jt(t);
  var u = Qt.test(t);
  return u || Zt.test(t) ? ea(t.slice(2), u ? 2 : 8) : Kt.test(t) ? tt : +t;
}
var We = function() {
  return st.Date.now();
}, ta = "Expected a function", aa = Math.max, na = Math.min;
function nt(t, c, u) {
  var o, T, w, y, v, I, L = 0, i = !1, M = !1, f = !0;
  if (typeof t != "function")
    throw new TypeError(ta);
  c = at(c) || 0, De(u) && (i = !!u.leading, M = "maxWait" in u, w = M ? aa(at(u.maxWait) || 0, c) : w, f = "trailing" in u ? !!u.trailing : f);
  function N(p) {
    var W = o, x = T;
    return o = T = void 0, L = p, y = t.apply(x, W), y;
  }
  function O(p) {
    return L = p, v = setTimeout(l, c), i ? N(p) : y;
  }
  function B(p) {
    var W = p - I, x = p - L, E = c - W;
    return M ? na(E, w - x) : E;
  }
  function m(p) {
    var W = p - I, x = p - L;
    return I === void 0 || W >= c || W < 0 || M && x >= w;
  }
  function l() {
    var p = We();
    if (m(p))
      return $(p);
    v = setTimeout(l, B(p));
  }
  function $(p) {
    return v = void 0, f && o ? N(p) : (o = T = void 0, y);
  }
  function g() {
    v !== void 0 && clearTimeout(v), L = 0, o = I = T = v = void 0;
  }
  function b() {
    return v === void 0 ? y : $(We());
  }
  function H() {
    var p = We(), W = m(p);
    if (o = arguments, T = this, I = p, W) {
      if (v === void 0)
        return O(I);
      if (M)
        return clearTimeout(v), v = setTimeout(l, c), N(I);
    }
    return v === void 0 && (v = setTimeout(l, c)), y;
  }
  return H.cancel = g, H.flush = b, H;
}
function pe(t, c) {
  const u = c ?? (typeof window < "u" ? window.innerWidth : 1024), o = t.sizes;
  return u >= 1536 && o["2xl"] ? o["2xl"] : u >= 1280 && o.xl ? o.xl : u >= 1024 && o.lg ? o.lg : u >= 768 && o.md ? o.md : u >= 640 && o.sm ? o.sm : o.base;
}
function la(t) {
  const c = t ?? (typeof window < "u" ? window.innerWidth : 1024);
  return c >= 1536 ? "2xl" : c >= 1280 ? "xl" : c >= 1024 ? "lg" : c >= 768 ? "md" : c >= 640 ? "sm" : "base";
}
function ra(t) {
  return t.reduce((u, o) => Math.max(u, o.top + o.columnHeight), 0) + 500;
}
function oa(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function ia(t, c = 0) {
  return {
    style: oa(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": c
  };
}
function Oe(t, c) {
  if (!t.length || c <= 0)
    return new Array(Math.max(1, c)).fill(0);
  const o = Array.from(new Set(t.map((y) => y.left))).sort((y, v) => y - v).slice(0, c), T = /* @__PURE__ */ new Map();
  for (let y = 0; y < o.length; y++) T.set(o[y], y);
  const w = new Array(o.length).fill(0);
  for (const y of t) {
    const v = T.get(y.left);
    v != null && (w[v] = Math.max(w[v], y.top + y.columnHeight));
  }
  for (; w.length < c; ) w.push(0);
  return w;
}
function sa(t, c) {
  let u = 0, o = 0;
  const T = 1e3;
  function w(i, M) {
    var O;
    const f = (O = t.container) == null ? void 0 : O.value;
    if (f) {
      const B = f.scrollTop, m = f.clientHeight;
      u = B - T, o = B + m + T;
    }
    return i + M >= u && i <= o;
  }
  function y(i, M) {
    const f = parseInt(i.dataset.left || "0", 10), N = parseInt(i.dataset.top || "0", 10), O = parseInt(i.dataset.index || "0", 10), B = i.offsetHeight || parseInt(getComputedStyle(i).height || "200", 10) || 200;
    if (!w(N, B)) {
      i.style.opacity = "1", i.style.transform = `translate3d(${f}px, ${N}px, 0) scale(1)`, i.style.transition = "none", M();
      return;
    }
    const m = Math.min(O * 20, 160), l = i.style.getPropertyValue("--masonry-opacity-delay");
    i.style.setProperty("--masonry-opacity-delay", `${m}ms`), requestAnimationFrame(() => {
      i.style.opacity = "1", i.style.transform = `translate3d(${f}px, ${N}px, 0) scale(1)`;
      const $ = () => {
        l ? i.style.setProperty("--masonry-opacity-delay", l) : i.style.removeProperty("--masonry-opacity-delay"), i.removeEventListener("transitionend", $), M();
      };
      i.addEventListener("transitionend", $);
    });
  }
  function v(i) {
    const M = parseInt(i.dataset.left || "0", 10), f = parseInt(i.dataset.top || "0", 10);
    i.style.opacity = "0", i.style.transform = `translate3d(${M}px, ${f + 10}px, 0) scale(0.985)`;
  }
  function I(i) {
    const M = parseInt(i.dataset.left || "0", 10), f = parseInt(i.dataset.top || "0", 10), N = i.offsetHeight || parseInt(getComputedStyle(i).height || "200", 10) || 200;
    if (!w(f, N)) {
      i.style.transition = "none";
      return;
    }
    i.style.transition = "none", i.style.opacity = "1", i.style.transform = `translate3d(${M}px, ${f}px, 0) scale(1)`, i.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      i.style.transition = "";
    });
  }
  function L(i, M) {
    const f = parseInt(i.dataset.left || "0", 10), N = parseInt(i.dataset.top || "0", 10), O = i.offsetHeight || parseInt(getComputedStyle(i).height || "200", 10) || 200;
    if (!w(N, O)) {
      i.style.transition = "none", i.style.opacity = "0", M();
      return;
    }
    const B = typeof (c == null ? void 0 : c.leaveDurationMs) == "number" ? c.leaveDurationMs : NaN;
    let m = Number.isFinite(B) && B > 0 ? B : NaN;
    if (!Number.isFinite(m)) {
      const p = getComputedStyle(i).getPropertyValue("--masonry-leave-duration") || "", W = parseFloat(p);
      m = Number.isFinite(W) && W > 0 ? W : 200;
    }
    const l = i.style.transitionDuration, $ = () => {
      i.removeEventListener("transitionend", g), clearTimeout(b), i.style.transitionDuration = l || "";
    }, g = (H) => {
      (!H || H.target === i) && ($(), M());
    }, b = setTimeout(() => {
      $(), M();
    }, m + 100);
    requestAnimationFrame(() => {
      i.style.transitionDuration = `${m}ms`, i.style.opacity = "0", i.style.transform = `translate3d(${f}px, ${N + 10}px, 0) scale(0.985)`, i.addEventListener("transitionend", g);
    });
  }
  return {
    onEnter: y,
    onBeforeEnter: v,
    onBeforeLeave: I,
    onLeave: L
  };
}
function ua({
  container: t,
  masonry: c,
  columns: u,
  containerHeight: o,
  isLoading: T,
  pageSize: w,
  refreshLayout: y,
  setItemsRaw: v,
  loadNext: I,
  loadThresholdPx: L
}) {
  let i = 0;
  async function M(f) {
    if (!t.value) return;
    const N = f ?? Oe(c.value, u.value), O = N.length ? Math.max(...N) : 0, B = t.value.scrollTop + t.value.clientHeight, m = t.value.scrollTop > i + 1;
    i = t.value.scrollTop;
    const l = typeof L == "number" ? L : 200, $ = l >= 0 ? Math.max(0, O - l) : Math.max(0, O + l);
    if (B >= $ && m && !T.value) {
      await I(), await G();
      return;
    }
  }
  return {
    handleScroll: M
  };
}
const ca = { class: "flex-1 relative min-h-0" }, va = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, fa = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, da = {
  key: 1,
  class: "relative w-full h-full"
}, ma = ["src"], ha = ["src", "autoplay", "controls"], ga = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, pa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, ya = {
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
    const u = t, o = c, T = k(!1), w = k(!1), y = k(null), v = k(!1), I = k(!1), L = k(null), i = k(!1), M = k(!1), f = k(!1), N = k(null), O = k(null);
    let B = null;
    const m = ne(() => {
      var n;
      return u.type ?? ((n = u.item) == null ? void 0 : n.type) ?? "image";
    }), l = ne(() => {
      var n;
      return u.notFound ?? ((n = u.item) == null ? void 0 : n.notFound) ?? !1;
    }), $ = ne(() => !!u.inSwipeMode);
    function g(n) {
      o("mouse-enter", { item: u.item, type: n });
    }
    function b(n) {
      o("mouse-leave", { item: u.item, type: n });
    }
    function H(n) {
      if ($.value) return;
      const h = n.target;
      h && (h.paused ? h.play() : h.pause());
    }
    function p(n) {
      const h = n.target;
      h && ($.value || h.play(), g("video"));
    }
    function W(n) {
      const h = n.target;
      h && ($.value || h.pause(), b("video"));
    }
    function x(n) {
      return new Promise((h, F) => {
        if (!n) {
          const A = new Error("No image source provided");
          o("preload:error", { item: u.item, type: "image", src: n, error: A }), F(A);
          return;
        }
        const q = new Image(), J = Date.now(), U = 300;
        q.onload = () => {
          const A = Date.now() - J, ve = Math.max(0, U - A);
          setTimeout(async () => {
            T.value = !0, w.value = !1, M.value = !1, await G(), await new Promise((fe) => setTimeout(fe, 100)), f.value = !0, o("preload:success", { item: u.item, type: "image", src: n }), h();
          }, ve);
        }, q.onerror = () => {
          w.value = !0, T.value = !1, M.value = !1;
          const A = new Error("Failed to load image");
          o("preload:error", { item: u.item, type: "image", src: n, error: A }), F(A);
        }, q.src = n;
      });
    }
    function E(n) {
      return new Promise((h, F) => {
        if (!n) {
          const A = new Error("No video source provided");
          o("preload:error", { item: u.item, type: "video", src: n, error: A }), F(A);
          return;
        }
        const q = document.createElement("video"), J = Date.now(), U = 300;
        q.preload = "metadata", q.muted = !0, q.onloadedmetadata = () => {
          const A = Date.now() - J, ve = Math.max(0, U - A);
          setTimeout(async () => {
            v.value = !0, I.value = !1, M.value = !1, await G(), await new Promise((fe) => setTimeout(fe, 100)), f.value = !0, o("preload:success", { item: u.item, type: "video", src: n }), h();
          }, ve);
        }, q.onerror = () => {
          I.value = !0, v.value = !1, M.value = !1;
          const A = new Error("Failed to load video");
          o("preload:error", { item: u.item, type: "video", src: n, error: A }), F(A);
        }, q.src = n;
      });
    }
    async function Y() {
      var h;
      if (!i.value || M.value || l.value || m.value === "video" && v.value || m.value === "image" && T.value)
        return;
      const n = (h = u.item) == null ? void 0 : h.src;
      if (n)
        if (M.value = !0, f.value = !1, m.value === "video") {
          L.value = n, v.value = !1, I.value = !1;
          try {
            await E(n);
          } catch {
          }
        } else {
          y.value = n, T.value = !1, w.value = !1;
          try {
            await x(n);
          } catch {
          }
        }
    }
    return ot(() => {
      N.value && (B = new IntersectionObserver(
        (n) => {
          n.forEach((h) => {
            h.isIntersecting && h.intersectionRatio >= 1 ? i.value || (i.value = !0, Y()) : h.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), B.observe(N.value));
    }), it(() => {
      B && (B.disconnect(), B = null);
    }), ce(
      () => {
        var n;
        return (n = u.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || l.value)) {
          if (m.value === "video") {
            if (n !== L.value && (v.value = !1, I.value = !1, L.value = n, i.value)) {
              M.value = !0;
              try {
                await E(n);
              } catch {
              }
            }
          } else if (n !== y.value && (T.value = !1, w.value = !1, y.value = n, i.value)) {
            M.value = !0;
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
        !$.value || !O.value || (n ? O.value.play() : O.value.pause());
      }
    ), (n, h) => (j(), R("div", {
      ref_key: "containerRef",
      ref: N,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (j(), R("div", {
        key: 0,
        class: "relative z-10",
        style: Ee({ height: `${n.headerHeight}px` })
      }, [
        ae(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: T.value,
          imageError: w.value,
          videoLoaded: v.value,
          videoError: I.value,
          showNotFound: l.value,
          isLoading: M.value,
          mediaType: m.value
        })
      ], 4)) : se("", !0),
      V("div", ca, [
        ae(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: T.value,
          imageError: w.value,
          videoLoaded: v.value,
          videoError: I.value,
          showNotFound: l.value,
          isLoading: M.value,
          mediaType: m.value,
          imageSrc: y.value,
          videoSrc: L.value,
          showMedia: f.value
        }, () => [
          V("div", va, [
            l.value ? (j(), R("div", fa, h[3] || (h[3] = [
              V("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              V("span", { class: "font-medium" }, "Not Found", -1),
              V("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (j(), R("div", da, [
              m.value === "image" && y.value ? (j(), R("img", {
                key: 0,
                src: y.value,
                class: he([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  T.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: h[0] || (h[0] = (F) => g("image")),
                onMouseleave: h[1] || (h[1] = (F) => b("image"))
              }, null, 42, ma)) : se("", !0),
              m.value === "video" && L.value ? (j(), R("video", {
                key: 1,
                ref_key: "videoEl",
                ref: O,
                src: L.value,
                class: he([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  v.value && f.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: $.value && u.isActive,
                controls: $.value,
                onClick: Je(H, ["stop"]),
                onTouchend: Je(H, ["stop", "prevent"]),
                onMouseenter: p,
                onMouseleave: W,
                onError: h[2] || (h[2] = (F) => I.value = !0)
              }, null, 42, ha)) : se("", !0),
              !T.value && !v.value && !w.value && !I.value ? (j(), R("div", {
                key: 2,
                class: he([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  f.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                V("div", ga, [
                  V("i", {
                    class: he(m.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : se("", !0),
              M.value ? (j(), R("div", pa, h[4] || (h[4] = [
                V("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  V("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : se("", !0),
              m.value === "image" && w.value || m.value === "video" && I.value ? (j(), R("div", ya, [
                V("i", {
                  class: he(m.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                V("span", null, "Failed to load " + Ae(m.value), 1)
              ])) : se("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (j(), R("div", {
        key: 1,
        class: "relative z-10",
        style: Ee({ height: `${n.footerHeight}px` })
      }, [
        ae(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: T.value,
          imageError: w.value,
          videoLoaded: v.value,
          videoError: I.value,
          showNotFound: l.value,
          isLoading: M.value,
          mediaType: m.value
        })
      ], 4)) : se("", !0)
    ], 512));
  }
}), wa = { class: "w-full h-full flex items-center justify-center p-4" }, xa = { class: "w-full h-full max-w-full max-h-full relative" }, ba = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ma = {
  key: 1,
  class: "w-full py-8 text-center"
}, Ea = { class: "text-red-500 dark:text-red-400" }, Ta = {
  key: 0,
  class: "w-full py-8 text-center"
}, Ia = {
  key: 1,
  class: "w-full py-8 text-center"
}, ka = { class: "text-red-500 dark:text-red-400" }, La = /* @__PURE__ */ rt({
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
    const o = t, T = {
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
        ...T,
        ...o.layout,
        sizes: {
          ...T.sizes,
          ...((e = o.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), y = k(null), v = k(typeof window < "u" ? window.innerWidth : 1024), I = k(typeof window < "u" ? window.innerHeight : 768), L = k(null);
    let i = null;
    function M(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const f = ne(() => {
      if (o.layoutMode === "masonry") return !1;
      if (o.layoutMode === "swipe") return !0;
      const e = typeof o.mobileBreakpoint == "string" ? M(o.mobileBreakpoint) : o.mobileBreakpoint;
      return v.value < e;
    }), N = ne(() => {
      if (!f.value || l.value.length === 0) return null;
      const e = Math.max(0, Math.min(n.value, l.value.length - 1));
      return l.value[e] || null;
    }), O = ne(() => {
      if (!f.value || !N.value) return null;
      const e = n.value + 1;
      return e >= l.value.length ? null : l.value[e] || null;
    }), B = ne(() => {
      if (!f.value || !N.value) return null;
      const e = n.value - 1;
      return e < 0 ? null : l.value[e] || null;
    }), m = u, l = ne({
      get: () => o.items,
      set: (e) => m("update:items", e)
    }), $ = k(7), g = k(null), b = k([]), H = k(null), p = k(!1), W = k(0), x = k(!1), E = k(null), Y = ne(() => la(v.value)), n = k(0), h = k(0), F = k(!1), q = k(0), J = k(0), U = k(null), A = k(/* @__PURE__ */ new Set());
    function ve(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function fe(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const r = e.filter((s) => !ve(s == null ? void 0 : s.width) || !ve(s == null ? void 0 : s.height));
        if (r.length === 0) return;
        const d = [];
        for (const s of r) {
          const D = (s == null ? void 0 : s.id) ?? `idx:${e.indexOf(s)}`;
          A.value.has(D) || (A.value.add(D), d.push(D));
        }
        if (d.length > 0) {
          const s = d.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: d.length,
              sampleIds: s,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const P = k(0), C = k(0), Z = o.virtualBufferPx, K = k(!1), Q = k({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), le = (e) => {
      if (!g.value) return;
      const { scrollTop: a, clientHeight: r } = g.value, d = a + r, s = e ?? Oe(l.value, $.value), D = s.length ? Math.max(...s) : 0, S = typeof o.loadThresholdPx == "number" ? o.loadThresholdPx : 200, z = S >= 0 ? Math.max(0, D - S) : Math.max(0, D + S), te = Math.max(0, z - d), ie = te <= 100;
      Q.value = {
        distanceToTrigger: Math.round(te),
        isNearTrigger: ie
      };
    }, { onEnter: re, onBeforeEnter: ct, onBeforeLeave: vt, onLeave: ft } = sa(
      { container: g },
      { leaveDurationMs: o.leaveDurationMs }
    );
    function dt(e, a) {
      if (K.value) {
        const r = parseInt(e.dataset.left || "0", 10), d = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${r}px, ${d}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        re(e, a);
    }
    function mt(e) {
      if (K.value) {
        const a = parseInt(e.dataset.left || "0", 10), r = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${r}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        ct(e);
    }
    function ht(e) {
      K.value || vt(e);
    }
    function gt(e, a) {
      K.value ? a() : ft(e, a);
    }
    const pt = ne(() => {
      const e = P.value - Z, a = P.value + C.value + Z, r = l.value;
      return !r || r.length === 0 ? [] : r.filter((d) => {
        const s = d.top;
        return d.top + d.columnHeight >= e && s <= a;
      });
    }), { handleScroll: yt } = ua({
      container: g,
      masonry: l,
      columns: $,
      containerHeight: W,
      isLoading: p,
      pageSize: o.pageSize,
      refreshLayout: ee,
      setItemsRaw: (e) => {
        l.value = e;
      },
      loadNext: ge,
      loadThresholdPx: o.loadThresholdPx
    });
    function wt(e) {
      L.value = e, e ? (e.width !== void 0 && (v.value = e.width), e.height !== void 0 && (I.value = e.height), !f.value && g.value && l.value.length > 0 && G(() => {
        $.value = pe(w.value, v.value), ee(l.value), le();
      })) : y.value && (v.value = y.value.clientWidth, I.value = y.value.clientHeight);
    }
    c({
      isLoading: p,
      refreshLayout: ee,
      // Container dimensions (wrapper element)
      containerWidth: v,
      containerHeight: I,
      // Masonry content height (for backward compatibility, old containerHeight)
      contentHeight: W,
      // Current page
      currentPage: H,
      // End of list tracking
      hasReachedEnd: x,
      // Load error tracking
      loadError: E,
      // Set fixed dimensions (overrides ResizeObserver)
      setFixedDimensions: wt,
      remove: ye,
      removeMany: bt,
      removeAll: Tt,
      restore: Mt,
      restoreMany: Et,
      loadNext: ge,
      loadPage: Pe,
      refreshCurrentPage: Se,
      reset: kt,
      destroy: Lt,
      init: Pt,
      paginationHistory: b,
      cancelLoad: $e,
      scrollToTop: Re,
      totalItems: ne(() => l.value.length),
      currentBreakpoint: Y
    });
    function Le(e) {
      const a = ra(e);
      let r = 0;
      if (g.value) {
        const { scrollTop: d, clientHeight: s } = g.value;
        r = d + s + 100;
      }
      W.value = Math.max(a, r);
    }
    let de = [];
    function ee(e) {
      var s, D;
      if (f.value) {
        l.value = e;
        return;
      }
      if (!g.value) return;
      if (fe(e, "refreshLayout"), e.length > 1e3 && de.length > e.length && de.length - e.length < 100) {
        let S = !0;
        for (let z = 0; z < e.length; z++)
          if (((s = e[z]) == null ? void 0 : s.id) !== ((D = de[z]) == null ? void 0 : D.id)) {
            S = !1;
            break;
          }
        if (S) {
          const z = e.map((te, ie) => ({
            ...de[ie],
            originalIndex: ie
          }));
          Le(z), l.value = z, de = z;
          return;
        }
      }
      const r = e.map((S, z) => ({
        ...S,
        originalIndex: z
      })), d = g.value;
      if (L.value && L.value.width !== void 0) {
        const S = d.style.width, z = d.style.boxSizing;
        d.style.boxSizing = "border-box", d.style.width = `${L.value.width}px`, d.offsetWidth;
        const te = Ze(r, d, $.value, w.value);
        d.style.width = S, d.style.boxSizing = z, Le(te), l.value = te, de = te;
      } else {
        const S = Ze(r, d, $.value, w.value);
        Le(S), l.value = S, de = S;
      }
    }
    function ze(e, a) {
      return new Promise((r) => {
        const d = Math.max(0, e | 0), s = Date.now();
        a(d, d);
        const D = setInterval(() => {
          if (_.value) {
            clearInterval(D), r();
            return;
          }
          const S = Date.now() - s, z = Math.max(0, d - S);
          a(z, d), z <= 0 && (clearInterval(D), r());
        }, 100);
      });
    }
    async function Te(e) {
      try {
        const a = await xt(() => o.getNextPage(e));
        return ee([...l.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function xt(e) {
      let a = 0;
      const r = o.retryMaxAttempts;
      let d = o.retryInitialDelayMs;
      for (; ; )
        try {
          const s = await e();
          return a > 0 && m("retry:stop", { attempt: a, success: !0 }), s;
        } catch (s) {
          if (a++, a > r)
            throw m("retry:stop", { attempt: a - 1, success: !1 }), s;
          m("retry:start", { attempt: a, max: r, totalMs: d }), await ze(d, (D, S) => {
            m("retry:tick", { attempt: a, remainingMs: D, totalMs: S });
          }), d += o.retryBackoffStepMs;
        }
    }
    async function Pe(e) {
      if (!p.value) {
        _.value = !1, p.value = !0, x.value = !1, E.value = null;
        try {
          const a = l.value.length;
          if (_.value) return;
          const r = await Te(e);
          return _.value ? void 0 : (E.value = null, H.value = e, b.value.push(r.nextPage), r.nextPage == null && (x.value = !0), await we(a), r);
        } catch (a) {
          throw console.error("Error loading page:", a), E.value = a instanceof Error ? a : new Error(String(a)), a;
        } finally {
          p.value = !1;
        }
      }
    }
    async function ge() {
      if (!p.value && !x.value) {
        _.value = !1, p.value = !0, E.value = null;
        try {
          const e = l.value.length;
          if (_.value) return;
          const a = b.value[b.value.length - 1];
          if (a == null) {
            x.value = !0, p.value = !1;
            return;
          }
          const r = await Te(a);
          return _.value ? void 0 : (E.value = null, H.value = a, b.value.push(r.nextPage), r.nextPage == null && (x.value = !0), await we(e), r);
        } catch (e) {
          throw console.error("Error loading next page:", e), E.value = e instanceof Error ? e : new Error(String(e)), e;
        } finally {
          p.value = !1;
        }
      }
    }
    async function Se() {
      if (!p.value) {
        _.value = !1, p.value = !0;
        try {
          const e = H.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", H.value, "paginationHistory:", b.value);
            return;
          }
          l.value = [], W.value = 0, x.value = !1, E.value = null, b.value = [e], await G();
          const a = await Te(e);
          if (_.value) return;
          E.value = null, H.value = e, b.value.push(a.nextPage), a.nextPage == null && (x.value = !0);
          const r = l.value.length;
          return await we(r), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), E.value = e instanceof Error ? e : new Error(String(e)), e;
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
        ee(a);
      });
    }
    async function bt(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((d) => d.id)), r = l.value.filter((d) => !a.has(d.id));
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
      await new Promise((d) => requestAnimationFrame(() => d())), requestAnimationFrame(() => {
        ee(r);
      });
    }
    async function Mt(e, a) {
      if (!e) return;
      const r = l.value;
      if (r.findIndex((S) => S.id === e.id) !== -1) return;
      const s = [...r], D = Math.min(a, s.length);
      s.splice(D, 0, e), l.value = s, await G(), f.value || (await new Promise((S) => requestAnimationFrame(() => S())), requestAnimationFrame(() => {
        ee(s);
      }));
    }
    async function Et(e, a) {
      var Ge;
      if (!e || e.length === 0) return;
      if (!a || a.length !== e.length) {
        console.warn("[Masonry] restoreMany: items and indices arrays must have the same length");
        return;
      }
      const r = l.value, d = new Set(r.map((X) => X.id)), s = [];
      for (let X = 0; X < e.length; X++)
        d.has((Ge = e[X]) == null ? void 0 : Ge.id) || s.push({ item: e[X], index: a[X] });
      if (s.length === 0) return;
      const D = /* @__PURE__ */ new Map();
      for (const { item: X, index: St } of s)
        D.set(St, X);
      const S = s.length > 0 ? Math.max(...s.map(({ index: X }) => X)) : -1, z = Math.max(r.length - 1, S), te = [];
      let ie = 0;
      for (let X = 0; X <= z; X++)
        D.has(X) ? te.push(D.get(X)) : ie < r.length && (te.push(r[ie]), ie++);
      for (; ie < r.length; )
        te.push(r[ie]), ie++;
      l.value = te, await G(), f.value || (await new Promise((X) => requestAnimationFrame(() => X())), requestAnimationFrame(() => {
        ee(te);
      }));
    }
    function Re(e) {
      g.value && g.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function Tt() {
      Re({ behavior: "smooth" }), l.value = [], I.value = 0, await G(), m("remove-all:complete");
    }
    function It() {
      $.value = pe(w.value, v.value), ee(l.value), g.value && (P.value = g.value.scrollTop, C.value = g.value.clientHeight);
    }
    let oe = !1;
    const _ = k(!1);
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
          let s = 0;
          for (m("backfill:start", { target: r, fetched: l.value.length, calls: s }); l.value.length < r && s < o.backfillMaxCalls && b.value[b.value.length - 1] != null && !_.value && !x.value && oe && (await ze(o.backfillDelayMs, (S, z) => {
            m("backfill:tick", {
              fetched: l.value.length,
              target: r,
              calls: s,
              remainingMs: S,
              totalMs: z
            });
          }), !(_.value || !oe)); ) {
            const D = b.value[b.value.length - 1];
            if (D == null) {
              x.value = !0;
              break;
            }
            try {
              if (_.value || !oe) break;
              const S = await Te(D);
              if (_.value || !oe) break;
              E.value = null, b.value.push(S.nextPage), S.nextPage == null && (x.value = !0);
            } catch (S) {
              if (_.value || !oe) break;
              E.value = S instanceof Error ? S : new Error(String(S));
            }
            s++;
          }
          m("backfill:stop", { fetched: l.value.length, calls: s });
        } finally {
          oe = !1, p.value = !1;
        }
      }
    }
    function $e() {
      const e = oe;
      _.value = !0, p.value = !1, oe = !1, e && m("backfill:stop", { fetched: l.value.length, calls: 0, cancelled: !0 });
    }
    function kt() {
      $e(), _.value = !1, g.value && g.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), l.value = [], I.value = 0, H.value = o.loadAtPage, b.value = [o.loadAtPage], x.value = !1, E.value = null, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    function Lt() {
      $e(), l.value = [], W.value = 0, H.value = null, b.value = [], x.value = !1, E.value = null, p.value = !1, oe = !1, _.value = !1, n.value = 0, h.value = 0, F.value = !1, P.value = 0, C.value = 0, K.value = !1, Q.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      }, A.value.clear(), g.value && g.value.scrollTo({
        top: 0,
        behavior: "auto"
        // Instant scroll for destroy
      });
    }
    const me = nt(async () => {
      if (f.value) return;
      g.value && (P.value = g.value.scrollTop, C.value = g.value.clientHeight), K.value = !0, await G(), await new Promise((a) => requestAnimationFrame(() => a())), K.value = !1;
      const e = Oe(l.value, $.value);
      yt(e), le(e);
    }, 200), je = nt(It, 200);
    function Ce(e) {
      f.value && (F.value = !0, q.value = e.touches[0].clientY, J.value = h.value, e.preventDefault());
    }
    function qe(e) {
      if (!f.value || !F.value) return;
      const a = e.touches[0].clientY - q.value;
      h.value = J.value + a, e.preventDefault();
    }
    function Ve(e) {
      if (!f.value || !F.value) return;
      F.value = !1;
      const a = h.value - J.value;
      Math.abs(a) > 100 ? a > 0 && B.value ? _e() : a < 0 && O.value ? Ue() : ue() : ue(), e.preventDefault();
    }
    function Ye(e) {
      f.value && (F.value = !0, q.value = e.clientY, J.value = h.value, e.preventDefault());
    }
    function He(e) {
      if (!f.value || !F.value) return;
      const a = e.clientY - q.value;
      h.value = J.value + a, e.preventDefault();
    }
    function Ne(e) {
      if (!f.value || !F.value) return;
      F.value = !1;
      const a = h.value - J.value;
      Math.abs(a) > 100 ? a > 0 && B.value ? _e() : a < 0 && O.value ? Ue() : ue() : ue(), e.preventDefault();
    }
    function Ue() {
      if (!O.value) {
        ge();
        return;
      }
      n.value++, ue(), n.value >= l.value.length - 5 && ge();
    }
    function _e() {
      B.value && (n.value--, ue());
    }
    function ue() {
      if (!U.value) return;
      const e = U.value.clientHeight;
      h.value = -n.value * e;
    }
    function Xe() {
      !f.value && n.value > 0 && (n.value = 0, h.value = 0), f.value && l.value.length === 0 && !p.value && Pe(b.value[0]), f.value && ue();
    }
    function Pt(e, a, r) {
      H.value = a, b.value = [a], b.value.push(r), x.value = r == null, fe(e, "init"), f.value ? (l.value = [...l.value, ...e], n.value === 0 && l.value.length > 0 && (h.value = 0)) : (ee([...l.value, ...e]), le());
    }
    return ce(
      w,
      () => {
        f.value || g.value && ($.value = pe(w.value, v.value), ee(l.value));
      },
      { deep: !0 }
    ), ce(() => o.layoutMode, () => {
      L.value && L.value.width !== void 0 ? v.value = L.value.width : y.value && (v.value = y.value.clientWidth);
    }), ce(g, (e) => {
      e && !f.value ? (e.removeEventListener("scroll", me), e.addEventListener("scroll", me, { passive: !0 })) : e && e.removeEventListener("scroll", me);
    }, { immediate: !0 }), ce(f, (e, a) => {
      a === void 0 && e === !1 || G(() => {
        e ? (document.addEventListener("mousemove", He), document.addEventListener("mouseup", Ne), g.value && g.value.removeEventListener("scroll", me), n.value = 0, h.value = 0, l.value.length > 0 && ue()) : (document.removeEventListener("mousemove", He), document.removeEventListener("mouseup", Ne), g.value && y.value && (L.value && L.value.width !== void 0 ? v.value = L.value.width : v.value = y.value.clientWidth, g.value.removeEventListener("scroll", me), g.value.addEventListener("scroll", me, { passive: !0 }), l.value.length > 0 && ($.value = pe(w.value, v.value), ee(l.value), P.value = g.value.scrollTop, C.value = g.value.clientHeight, le())));
      });
    }, { immediate: !0 }), ce(U, (e) => {
      e && (e.addEventListener("touchstart", Ce, { passive: !1 }), e.addEventListener("touchmove", qe, { passive: !1 }), e.addEventListener("touchend", Ve), e.addEventListener("mousedown", Ye));
    }), ce(() => l.value.length, (e, a) => {
      f.value && e > 0 && a === 0 && (n.value = 0, G(() => ue()));
    }), ce(y, (e) => {
      i && (i.disconnect(), i = null), e && typeof ResizeObserver < "u" ? (i = new ResizeObserver((a) => {
        if (!L.value)
          for (const r of a) {
            const d = r.contentRect.width, s = r.contentRect.height;
            v.value !== d && (v.value = d), I.value !== s && (I.value = s);
          }
      }), i.observe(e), L.value || (v.value = e.clientWidth, I.value = e.clientHeight)) : e && (L.value || (v.value = e.clientWidth, I.value = e.clientHeight));
    }, { immediate: !0 }), ce(v, (e, a) => {
      e !== a && e > 0 && !f.value && g.value && l.value.length > 0 && G(() => {
        $.value = pe(w.value, e), ee(l.value), le();
      });
    }), ot(async () => {
      try {
        await G(), y.value && !i && (v.value = y.value.clientWidth, I.value = y.value.clientHeight), f.value || ($.value = pe(w.value, v.value), g.value && (P.value = g.value.scrollTop, C.value = g.value.clientHeight));
        const e = o.loadAtPage;
        b.value = [e], o.skipInitialLoad || await Pe(b.value[0]), f.value ? G(() => ue()) : le();
      } catch (e) {
        console.error("Error during component initialization:", e), p.value = !1;
      }
      window.addEventListener("resize", je), window.addEventListener("resize", Xe);
    }), it(() => {
      var e;
      i && (i.disconnect(), i = null), (e = g.value) == null || e.removeEventListener("scroll", me), window.removeEventListener("resize", je), window.removeEventListener("resize", Xe), U.value && (U.value.removeEventListener("touchstart", Ce), U.value.removeEventListener("touchmove", qe), U.value.removeEventListener("touchend", Ve), U.value.removeEventListener("mousedown", Ye)), document.removeEventListener("mousemove", He), document.removeEventListener("mouseup", Ne);
    }), (e, a) => (j(), R("div", {
      ref_key: "wrapper",
      ref: y,
      class: "w-full h-full flex flex-col relative"
    }, [
      f.value ? (j(), R("div", {
        key: 0,
        class: he(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": o.forceMotion, "cursor-grab": !F.value, "cursor-grabbing": F.value }]),
        ref_key: "swipeContainer",
        ref: U,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        V("div", {
          class: "relative w-full",
          style: Ee({
            transform: `translateY(${h.value}px)`,
            transition: F.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${l.value.length * 100}%`
          })
        }, [
          (j(!0), R(Ke, null, Qe(l.value, (r, d) => (j(), R("div", {
            key: `${r.page}-${r.id}`,
            class: "absolute top-0 left-0 w-full",
            style: Ee({
              top: `${d * (100 / l.value.length)}%`,
              height: `${100 / l.value.length}%`
            })
          }, [
            V("div", wa, [
              V("div", xa, [
                ae(e.$slots, "default", {
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
                    "is-active": d === n.value,
                    "onPreload:success": a[0] || (a[0] = (s) => m("item:preload:success", s)),
                    "onPreload:error": a[1] || (a[1] = (s) => m("item:preload:error", s)),
                    onMouseEnter: a[2] || (a[2] = (s) => m("item:mouse-enter", s)),
                    onMouseLeave: a[3] || (a[3] = (s) => m("item:mouse-leave", s))
                  }, {
                    header: xe((s) => [
                      ae(e.$slots, "item-header", be({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    footer: xe((s) => [
                      ae(e.$slots, "item-footer", be({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        x.value && l.value.length > 0 ? (j(), R("div", ba, [
          ae(e.$slots, "end-message", {}, () => [
            a[8] || (a[8] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        E.value && l.value.length > 0 ? (j(), R("div", Ma, [
          ae(e.$slots, "error-message", { error: E.value }, () => [
            V("p", Ea, "Failed to load content: " + Ae(E.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2)) : (j(), R("div", {
        key: 1,
        class: he(["overflow-auto w-full flex-1 masonry-container", { "force-motion": o.forceMotion }]),
        ref_key: "container",
        ref: g
      }, [
        V("div", {
          class: "relative",
          style: Ee({ height: `${W.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Fe($t, {
            name: "masonry",
            css: !1,
            onEnter: dt,
            onBeforeEnter: mt,
            onLeave: gt,
            onBeforeLeave: ht
          }, {
            default: xe(() => [
              (j(!0), R(Ke, null, Qe(pt.value, (r, d) => (j(), R("div", be({
                key: `${r.page}-${r.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, Ht(ia)(r, d)), [
                ae(e.$slots, "default", {
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
                    "onPreload:success": a[4] || (a[4] = (s) => m("item:preload:success", s)),
                    "onPreload:error": a[5] || (a[5] = (s) => m("item:preload:error", s)),
                    onMouseEnter: a[6] || (a[6] = (s) => m("item:mouse-enter", s)),
                    onMouseLeave: a[7] || (a[7] = (s) => m("item:mouse-leave", s))
                  }, {
                    header: xe((s) => [
                      ae(e.$slots, "item-header", be({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    footer: xe((s) => [
                      ae(e.$slots, "item-footer", be({ ref_for: !0 }, s), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4),
        x.value && l.value.length > 0 ? (j(), R("div", Ta, [
          ae(e.$slots, "end-message", {}, () => [
            a[9] || (a[9] = V("p", { class: "text-gray-500 dark:text-gray-400" }, "You've reached the end", -1))
          ], !0)
        ])) : se("", !0),
        E.value && l.value.length > 0 ? (j(), R("div", Ia, [
          ae(e.$slots, "error-message", { error: E.value }, () => [
            V("p", ka, "Failed to load content: " + Ae(E.value.message), 1)
          ], !0)
        ])) : se("", !0)
      ], 2))
    ], 512));
  }
}), Pa = (t, c) => {
  const u = t.__vccOpts || t;
  for (const [o, T] of c)
    u[o] = T;
  return u;
}, lt = /* @__PURE__ */ Pa(La, [["__scopeId", "data-v-c8dcbdca"]]), $a = {
  install(t) {
    t.component("WyxosMasonry", lt), t.component("WMasonry", lt), t.component("WyxosMasonryItem", ke), t.component("WMasonryItem", ke);
  }
};
export {
  lt as Masonry,
  ke as MasonryItem,
  $a as default
};
