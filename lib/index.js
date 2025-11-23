import { nextTick as X, defineComponent as Qe, ref as I, computed as Z, onMounted as Ze, onUnmounted as et, watch as re, createElementBlock as B, openBlock as O, createCommentVNode as le, createElementVNode as q, normalizeStyle as ge, renderSlot as ne, normalizeClass as ie, withModifiers as Ve, toDisplayString as pt, Fragment as Ye, renderList as Ue, createVNode as ke, withCtx as de, mergeProps as me, TransitionGroup as ht, unref as gt } from "vue";
let Pe = null;
function yt() {
  if (Pe != null) return Pe;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const f = document.createElement("div");
  f.style.width = "100%", t.appendChild(f);
  const s = t.offsetWidth - f.offsetWidth;
  return document.body.removeChild(t), Pe = s, s;
}
function wt(t, f, s, r = {}) {
  const {
    gutterX: M = 0,
    gutterY: d = 0,
    header: o = 0,
    footer: u = 0,
    paddingLeft: y = 0,
    paddingRight: $ = 0,
    sizes: m = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: T = "masonry"
  } = r;
  let P = 0, H = 0;
  try {
    if (f && f.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const x = window.getComputedStyle(f);
      P = parseFloat(x.paddingLeft) || 0, H = parseFloat(x.paddingRight) || 0;
    }
  } catch {
  }
  const E = (y || 0) + P, l = ($ || 0) + H, b = f.offsetWidth - f.clientWidth, v = b > 0 ? b + 2 : yt() + 2, p = f.offsetWidth - v - E - l, z = M * (s - 1), k = Math.floor((p - z) / s), D = t.map((x) => {
    const A = x.width, N = x.height;
    return Math.round(k * N / A) + u + o;
  });
  if (T === "sequential-balanced") {
    const x = D.length;
    if (x === 0) return [];
    const A = (L, R, _) => L + (R > 0 ? d : 0) + _;
    let N = Math.max(...D), n = D.reduce((L, R) => L + R, 0) + d * Math.max(0, x - 1);
    const w = (L) => {
      let R = 1, _ = 0, oe = 0;
      for (let J = 0; J < x; J++) {
        const se = D[J], K = A(_, oe, se);
        if (K <= L)
          _ = K, oe++;
        else if (R++, _ = se, oe = 1, se > L || R > s) return !1;
      }
      return R <= s;
    };
    for (; N < n; ) {
      const L = Math.floor((N + n) / 2);
      w(L) ? n = L : N = L + 1;
    }
    const j = n, F = new Array(s).fill(0);
    let V = s - 1, Y = 0, W = 0;
    for (let L = x - 1; L >= 0; L--) {
      const R = D[L], _ = L < V;
      !(A(Y, W, R) <= j) || _ ? (F[V] = L + 1, V--, Y = R, W = 1) : (Y = A(Y, W, R), W++);
    }
    F[0] = 0;
    const G = [], ae = new Array(s).fill(0);
    for (let L = 0; L < s; L++) {
      const R = F[L], _ = L + 1 < s ? F[L + 1] : x, oe = L * (k + M);
      for (let J = R; J < _; J++) {
        const K = {
          ...t[J],
          columnWidth: k,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        K.imageHeight = D[J] - (u + o), K.columnHeight = D[J], K.left = oe, K.top = ae[L], ae[L] += K.columnHeight + (J + 1 < _ ? d : 0), G.push(K);
      }
    }
    return G;
  }
  const g = new Array(s).fill(0), S = [];
  for (let x = 0; x < t.length; x++) {
    const A = t[x], N = {
      ...A,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, n = g.indexOf(Math.min(...g)), w = A.width, j = A.height;
    N.columnWidth = k, N.left = n * (k + M), N.imageHeight = Math.round(k * j / w), N.columnHeight = N.imageHeight + u + o, N.top = g[n], g[n] += N.columnHeight + d, S.push(N);
  }
  return S;
}
var bt = typeof global == "object" && global && global.Object === Object && global, xt = typeof self == "object" && self && self.Object === Object && self, tt = bt || xt || Function("return this")(), be = tt.Symbol, at = Object.prototype, Mt = at.hasOwnProperty, Tt = at.toString, pe = be ? be.toStringTag : void 0;
function Et(t) {
  var f = Mt.call(t, pe), s = t[pe];
  try {
    t[pe] = void 0;
    var r = !0;
  } catch {
  }
  var M = Tt.call(t);
  return r && (f ? t[pe] = s : delete t[pe]), M;
}
var Lt = Object.prototype, It = Lt.toString;
function kt(t) {
  return It.call(t);
}
var Pt = "[object Null]", St = "[object Undefined]", Ge = be ? be.toStringTag : void 0;
function $t(t) {
  return t == null ? t === void 0 ? St : Pt : Ge && Ge in Object(t) ? Et(t) : kt(t);
}
function Ht(t) {
  return t != null && typeof t == "object";
}
var Nt = "[object Symbol]";
function Wt(t) {
  return typeof t == "symbol" || Ht(t) && $t(t) == Nt;
}
var Dt = /\s/;
function At(t) {
  for (var f = t.length; f-- && Dt.test(t.charAt(f)); )
    ;
  return f;
}
var Ft = /^\s+/;
function Bt(t) {
  return t && t.slice(0, At(t) + 1).replace(Ft, "");
}
function $e(t) {
  var f = typeof t;
  return t != null && (f == "object" || f == "function");
}
var Xe = NaN, Ot = /^[-+]0x[0-9a-f]+$/i, zt = /^0b[01]+$/i, jt = /^0o[0-7]+$/i, Rt = parseInt;
function _e(t) {
  if (typeof t == "number")
    return t;
  if (Wt(t))
    return Xe;
  if ($e(t)) {
    var f = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = $e(f) ? f + "" : f;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Bt(t);
  var s = zt.test(t);
  return s || jt.test(t) ? Rt(t.slice(2), s ? 2 : 8) : Ot.test(t) ? Xe : +t;
}
var Se = function() {
  return tt.Date.now();
}, Ct = "Expected a function", qt = Math.max, Vt = Math.min;
function Je(t, f, s) {
  var r, M, d, o, u, y, $ = 0, m = !1, T = !1, P = !0;
  if (typeof t != "function")
    throw new TypeError(Ct);
  f = _e(f) || 0, $e(s) && (m = !!s.leading, T = "maxWait" in s, d = T ? qt(_e(s.maxWait) || 0, f) : d, P = "trailing" in s ? !!s.trailing : P);
  function H(g) {
    var S = r, x = M;
    return r = M = void 0, $ = g, o = t.apply(x, S), o;
  }
  function E(g) {
    return $ = g, u = setTimeout(v, f), m ? H(g) : o;
  }
  function l(g) {
    var S = g - y, x = g - $, A = f - S;
    return T ? Vt(A, d - x) : A;
  }
  function b(g) {
    var S = g - y, x = g - $;
    return y === void 0 || S >= f || S < 0 || T && x >= d;
  }
  function v() {
    var g = Se();
    if (b(g))
      return p(g);
    u = setTimeout(v, l(g));
  }
  function p(g) {
    return u = void 0, P && r ? H(g) : (r = M = void 0, o);
  }
  function z() {
    u !== void 0 && clearTimeout(u), $ = 0, r = y = M = u = void 0;
  }
  function k() {
    return u === void 0 ? o : p(Se());
  }
  function D() {
    var g = Se(), S = b(g);
    if (r = arguments, M = this, y = g, S) {
      if (u === void 0)
        return E(y);
      if (T)
        return clearTimeout(u), u = setTimeout(v, f), H(y);
    }
    return u === void 0 && (u = setTimeout(v, f)), o;
  }
  return D.cancel = z, D.flush = k, D;
}
function he(t, f) {
  const s = f ?? (typeof window < "u" ? window.innerWidth : 1024), r = t.sizes;
  return s >= 1536 && r["2xl"] ? r["2xl"] : s >= 1280 && r.xl ? r.xl : s >= 1024 && r.lg ? r.lg : s >= 768 && r.md ? r.md : s >= 640 && r.sm ? r.sm : r.base;
}
function Yt(t) {
  return t.reduce((s, r) => Math.max(s, r.top + r.columnHeight), 0) + 500;
}
function Ut(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function Gt(t, f = 0) {
  return {
    style: Ut(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": f
  };
}
function He(t, f) {
  if (!t.length || f <= 0)
    return new Array(Math.max(1, f)).fill(0);
  const r = Array.from(new Set(t.map((o) => o.left))).sort((o, u) => o - u).slice(0, f), M = /* @__PURE__ */ new Map();
  for (let o = 0; o < r.length; o++) M.set(r[o], o);
  const d = new Array(r.length).fill(0);
  for (const o of t) {
    const u = M.get(o.left);
    u != null && (d[u] = Math.max(d[u], o.top + o.columnHeight));
  }
  for (; d.length < f; ) d.push(0);
  return d;
}
function Xt(t, f) {
  function s(o, u) {
    const y = parseInt(o.dataset.left || "0", 10), $ = parseInt(o.dataset.top || "0", 10), m = parseInt(o.dataset.index || "0", 10), T = Math.min(m * 20, 160), P = o.style.getPropertyValue("--masonry-opacity-delay");
    o.style.setProperty("--masonry-opacity-delay", `${T}ms`), requestAnimationFrame(() => {
      o.style.opacity = "1", o.style.transform = `translate3d(${y}px, ${$}px, 0) scale(1)`;
      const H = () => {
        P ? o.style.setProperty("--masonry-opacity-delay", P) : o.style.removeProperty("--masonry-opacity-delay"), o.removeEventListener("transitionend", H), u();
      };
      o.addEventListener("transitionend", H);
    });
  }
  function r(o) {
    const u = parseInt(o.dataset.left || "0", 10), y = parseInt(o.dataset.top || "0", 10);
    o.style.opacity = "0", o.style.transform = `translate3d(${u}px, ${y + 10}px, 0) scale(0.985)`;
  }
  function M(o) {
    const u = parseInt(o.dataset.left || "0", 10), y = parseInt(o.dataset.top || "0", 10);
    o.style.transition = "none", o.style.opacity = "1", o.style.transform = `translate3d(${u}px, ${y}px, 0) scale(1)`, o.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      o.style.transition = "";
    });
  }
  function d(o, u) {
    const y = parseInt(o.dataset.left || "0", 10), $ = parseInt(o.dataset.top || "0", 10), m = typeof (f == null ? void 0 : f.leaveDurationMs) == "number" ? f.leaveDurationMs : NaN;
    let T = Number.isFinite(m) && m > 0 ? m : NaN;
    if (!Number.isFinite(T)) {
      const v = getComputedStyle(o).getPropertyValue("--masonry-leave-duration") || "", p = parseFloat(v);
      T = Number.isFinite(p) && p > 0 ? p : 200;
    }
    const P = o.style.transitionDuration, H = () => {
      o.removeEventListener("transitionend", E), clearTimeout(l), o.style.transitionDuration = P || "";
    }, E = (b) => {
      (!b || b.target === o) && (H(), u());
    }, l = setTimeout(() => {
      H(), u();
    }, T + 100);
    requestAnimationFrame(() => {
      o.style.transitionDuration = `${T}ms`, o.style.opacity = "0", o.style.transform = `translate3d(${y}px, ${$ + 10}px, 0) scale(0.985)`, o.addEventListener("transitionend", E);
    });
  }
  return {
    onEnter: s,
    onBeforeEnter: r,
    onBeforeLeave: M,
    onLeave: d
  };
}
function _t({
  container: t,
  masonry: f,
  columns: s,
  containerHeight: r,
  isLoading: M,
  pageSize: d,
  refreshLayout: o,
  setItemsRaw: u,
  loadNext: y,
  loadThresholdPx: $
}) {
  let m = 0;
  async function T(P) {
    if (!t.value) return;
    const H = P ?? He(f.value, s.value), E = H.length ? Math.max(...H) : 0, l = t.value.scrollTop + t.value.clientHeight, b = t.value.scrollTop > m + 1;
    m = t.value.scrollTop;
    const v = typeof $ == "number" ? $ : 200, p = v >= 0 ? Math.max(0, E - v) : Math.max(0, E + v);
    if (l >= p && b && !M.value) {
      await y(), await X();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
const Jt = { class: "flex-1 relative min-h-0" }, Kt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white relative" }, Qt = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, Zt = {
  key: 1,
  class: "relative w-full h-full"
}, ea = ["src"], ta = ["src", "autoplay", "controls"], aa = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, na = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
}, oa = {
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
  setup(t, { emit: f }) {
    const s = t, r = f, M = I(!1), d = I(!1), o = I(null), u = I(!1), y = I(!1), $ = I(null), m = I(!1), T = I(!1), P = I(!1), H = I(null), E = I(null);
    let l = null;
    const b = Z(() => {
      var n;
      return s.type ?? ((n = s.item) == null ? void 0 : n.type) ?? "image";
    }), v = Z(() => {
      var n;
      return s.notFound ?? ((n = s.item) == null ? void 0 : n.notFound) ?? !1;
    }), p = Z(() => !!s.inSwipeMode);
    function z(n) {
      r("mouse-enter", { item: s.item, type: n });
    }
    function k(n) {
      r("mouse-leave", { item: s.item, type: n });
    }
    function D(n) {
      if (p.value) return;
      const w = n.target;
      w && (w.paused ? w.play() : w.pause());
    }
    function g(n) {
      const w = n.target;
      w && (p.value || w.play(), z("video"));
    }
    function S(n) {
      const w = n.target;
      w && (p.value || w.pause(), k("video"));
    }
    function x(n) {
      return new Promise((w, j) => {
        if (!n) {
          const W = new Error("No image source provided");
          r("preload:error", { item: s.item, type: "image", src: n, error: W }), j(W);
          return;
        }
        const F = new Image(), V = Date.now(), Y = 300;
        F.onload = () => {
          const W = Date.now() - V, G = Math.max(0, Y - W);
          setTimeout(async () => {
            M.value = !0, d.value = !1, T.value = !1, await X(), await new Promise((ae) => setTimeout(ae, 100)), P.value = !0, r("preload:success", { item: s.item, type: "image", src: n }), w();
          }, G);
        }, F.onerror = () => {
          d.value = !0, M.value = !1, T.value = !1;
          const W = new Error("Failed to load image");
          r("preload:error", { item: s.item, type: "image", src: n, error: W }), j(W);
        }, F.src = n;
      });
    }
    function A(n) {
      return new Promise((w, j) => {
        if (!n) {
          const W = new Error("No video source provided");
          r("preload:error", { item: s.item, type: "video", src: n, error: W }), j(W);
          return;
        }
        const F = document.createElement("video"), V = Date.now(), Y = 300;
        F.preload = "metadata", F.muted = !0, F.onloadedmetadata = () => {
          const W = Date.now() - V, G = Math.max(0, Y - W);
          setTimeout(async () => {
            u.value = !0, y.value = !1, T.value = !1, await X(), await new Promise((ae) => setTimeout(ae, 100)), P.value = !0, r("preload:success", { item: s.item, type: "video", src: n }), w();
          }, G);
        }, F.onerror = () => {
          y.value = !0, u.value = !1, T.value = !1;
          const W = new Error("Failed to load video");
          r("preload:error", { item: s.item, type: "video", src: n, error: W }), j(W);
        }, F.src = n;
      });
    }
    async function N() {
      var w;
      if (!m.value || T.value || v.value || b.value === "video" && u.value || b.value === "image" && M.value)
        return;
      const n = (w = s.item) == null ? void 0 : w.src;
      if (n)
        if (T.value = !0, P.value = !1, b.value === "video") {
          $.value = n, u.value = !1, y.value = !1;
          try {
            await A(n);
          } catch {
          }
        } else {
          o.value = n, M.value = !1, d.value = !1;
          try {
            await x(n);
          } catch {
          }
        }
    }
    return Ze(() => {
      H.value && (l = new IntersectionObserver(
        (n) => {
          n.forEach((w) => {
            w.isIntersecting && w.intersectionRatio >= 1 ? m.value || (m.value = !0, N()) : w.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), l.observe(H.value));
    }), et(() => {
      l && (l.disconnect(), l = null);
    }), re(
      () => {
        var n;
        return (n = s.item) == null ? void 0 : n.src;
      },
      async (n) => {
        if (!(!n || v.value)) {
          if (b.value === "video") {
            if (n !== $.value && (u.value = !1, y.value = !1, $.value = n, m.value)) {
              T.value = !0;
              try {
                await A(n);
              } catch {
              }
            }
          } else if (n !== o.value && (M.value = !1, d.value = !1, o.value = n, m.value)) {
            T.value = !0;
            try {
              await x(n);
            } catch {
            }
          }
        }
      }
    ), re(
      () => s.isActive,
      (n) => {
        !p.value || !E.value || (n ? E.value.play() : E.value.pause());
      }
    ), (n, w) => (O(), B("div", {
      ref_key: "containerRef",
      ref: H,
      class: "relative w-full h-full flex flex-col"
    }, [
      n.headerHeight > 0 ? (O(), B("div", {
        key: 0,
        class: "relative z-10",
        style: ge({ height: `${n.headerHeight}px` })
      }, [
        ne(n.$slots, "header", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: d.value,
          videoLoaded: u.value,
          videoError: y.value,
          showNotFound: v.value,
          isLoading: T.value,
          mediaType: b.value
        })
      ], 4)) : le("", !0),
      q("div", Jt, [
        ne(n.$slots, "default", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: d.value,
          videoLoaded: u.value,
          videoError: y.value,
          showNotFound: v.value,
          isLoading: T.value,
          mediaType: b.value,
          imageSrc: o.value,
          videoSrc: $.value,
          showMedia: P.value
        }, () => [
          q("div", Kt, [
            v.value ? (O(), B("div", Qt, w[3] || (w[3] = [
              q("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
              q("span", { class: "font-medium" }, "Not Found", -1),
              q("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
            ]))) : (O(), B("div", Zt, [
              b.value === "image" && o.value ? (O(), B("img", {
                key: 0,
                src: o.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  M.value && P.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                loading: "lazy",
                decoding: "async",
                alt: "",
                onMouseenter: w[0] || (w[0] = (j) => z("image")),
                onMouseleave: w[1] || (w[1] = (j) => k("image"))
              }, null, 42, ea)) : le("", !0),
              b.value === "video" && $.value ? (O(), B("video", {
                key: 1,
                ref_key: "videoEl",
                ref: E,
                src: $.value,
                class: ie([
                  "w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                  u.value && P.value ? "opacity-100" : "opacity-0"
                ]),
                style: { position: "absolute", top: "0", left: "0" },
                muted: "",
                loop: "",
                playsinline: "",
                autoplay: p.value && s.isActive,
                controls: p.value,
                onClick: Ve(D, ["stop"]),
                onTouchend: Ve(D, ["stop", "prevent"]),
                onMouseenter: g,
                onMouseleave: S,
                onError: w[2] || (w[2] = (j) => y.value = !0)
              }, null, 42, ta)) : le("", !0),
              !M.value && !u.value && !d.value && !y.value ? (O(), B("div", {
                key: 2,
                class: ie([
                  "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                  P.value ? "opacity-0 pointer-events-none" : "opacity-100"
                ])
              }, [
                q("div", aa, [
                  q("i", {
                    class: ie(b.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                  }, null, 2)
                ])
              ], 2)) : le("", !0),
              T.value ? (O(), B("div", na, w[4] || (w[4] = [
                q("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                  q("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
                ], -1)
              ]))) : le("", !0),
              b.value === "image" && d.value || b.value === "video" && y.value ? (O(), B("div", oa, [
                q("i", {
                  class: ie(b.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
                }, null, 2),
                q("span", null, "Failed to load " + pt(b.value), 1)
              ])) : le("", !0)
            ]))
          ])
        ])
      ]),
      n.footerHeight > 0 ? (O(), B("div", {
        key: 1,
        class: "relative z-10",
        style: ge({ height: `${n.footerHeight}px` })
      }, [
        ne(n.$slots, "footer", {
          item: n.item,
          remove: n.remove,
          imageLoaded: M.value,
          imageError: d.value,
          videoLoaded: u.value,
          videoError: y.value,
          showNotFound: v.value,
          isLoading: T.value,
          mediaType: b.value
        })
      ], 4)) : le("", !0)
    ], 512));
  }
}), ra = { class: "w-full h-full flex items-center justify-center p-4" }, la = { class: "w-full h-full max-w-full max-h-full relative" }, ia = /* @__PURE__ */ Qe({
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
  setup(t, { expose: f, emit: s }) {
    const r = t, M = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, d = Z(() => {
      var e;
      return {
        ...M,
        ...r.layout,
        sizes: {
          ...M.sizes,
          ...((e = r.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), o = I(null), u = I(typeof window < "u" ? window.innerWidth : 1024);
    let y = null;
    function $(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const m = Z(() => {
      if (r.layoutMode === "masonry") return !1;
      if (r.layoutMode === "swipe") return !0;
      const e = typeof r.mobileBreakpoint == "string" ? $(r.mobileBreakpoint) : r.mobileBreakpoint;
      return u.value < e;
    }), T = Z(() => {
      if (!m.value || l.value.length === 0) return null;
      const e = Math.max(0, Math.min(g.value, l.value.length - 1));
      return l.value[e] || null;
    }), P = Z(() => {
      if (!m.value || !T.value) return null;
      const e = g.value + 1;
      return e >= l.value.length ? null : l.value[e] || null;
    }), H = Z(() => {
      if (!m.value || !T.value) return null;
      const e = g.value - 1;
      return e < 0 ? null : l.value[e] || null;
    }), E = s, l = Z({
      get: () => r.items,
      set: (e) => E("update:items", e)
    }), b = I(7), v = I(null), p = I([]), z = I(null), k = I(!1), D = I(0), g = I(0), S = I(0), x = I(!1), A = I(0), N = I(0), n = I(null), w = I(/* @__PURE__ */ new Set());
    function j(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function F(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const i = e.filter((c) => !j(c == null ? void 0 : c.width) || !j(c == null ? void 0 : c.height));
        if (i.length === 0) return;
        const h = [];
        for (const c of i) {
          const U = (c == null ? void 0 : c.id) ?? `idx:${e.indexOf(c)}`;
          w.value.has(U) || (w.value.add(U), h.push(U));
        }
        if (h.length > 0) {
          const c = h.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: h.length,
              sampleIds: c,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const V = I(0), Y = I(0), W = r.virtualBufferPx, G = I(!1), ae = I({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), L = (e) => {
      if (!v.value) return;
      const { scrollTop: a, clientHeight: i } = v.value, h = a + i, c = e ?? He(l.value, b.value), U = c.length ? Math.max(...c) : 0, Q = typeof r.loadThresholdPx == "number" ? r.loadThresholdPx : 200, ce = Q >= 0 ? Math.max(0, U - Q) : Math.max(0, U + Q), qe = Math.max(0, ce - h), mt = qe <= 100;
      ae.value = {
        distanceToTrigger: Math.round(qe),
        isNearTrigger: mt
      };
    }, { onEnter: R, onBeforeEnter: _, onBeforeLeave: oe, onLeave: J } = Xt(l, { leaveDurationMs: r.leaveDurationMs });
    function se(e, a) {
      if (G.value) {
        const i = parseInt(e.dataset.left || "0", 10), h = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${i}px, ${h}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        R(e, a);
    }
    function K(e) {
      if (G.value) {
        const a = parseInt(e.dataset.left || "0", 10), i = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${i}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        _(e);
    }
    function nt(e) {
      G.value || oe(e);
    }
    function ot(e, a) {
      G.value ? a() : J(e, a);
    }
    const rt = Z(() => {
      const e = V.value - W, a = V.value + Y.value + W, i = l.value;
      return !i || i.length === 0 ? [] : i.filter((h) => {
        const c = h.top;
        return h.top + h.columnHeight >= e && c <= a;
      });
    }), { handleScroll: lt } = _t({
      container: v,
      masonry: l,
      columns: b,
      containerHeight: D,
      isLoading: k,
      pageSize: r.pageSize,
      refreshLayout: ee,
      setItemsRaw: (e) => {
        l.value = e;
      },
      loadNext: ue,
      loadThresholdPx: r.loadThresholdPx
    });
    f({
      isLoading: k,
      refreshLayout: ee,
      containerHeight: D,
      remove: fe,
      removeMany: ut,
      removeAll: ct,
      loadNext: ue,
      loadPage: Me,
      refreshCurrentPage: Te,
      reset: vt,
      init: dt,
      paginationHistory: p,
      cancelLoad: De,
      scrollToTop: We,
      totalItems: Z(() => l.value.length)
    });
    function it(e) {
      const a = Yt(e);
      let i = 0;
      if (v.value) {
        const { scrollTop: h, clientHeight: c } = v.value;
        i = h + c + 100;
      }
      D.value = Math.max(a, i);
    }
    function ee(e) {
      if (m.value) {
        l.value = e;
        return;
      }
      if (!v.value) return;
      F(e, "refreshLayout");
      const a = e.map((h, c) => ({
        ...h,
        originalIndex: h.originalIndex ?? c
      })), i = wt(a, v.value, b.value, d.value);
      it(i), l.value = i;
    }
    function Ne(e, a) {
      return new Promise((i) => {
        const h = Math.max(0, e | 0), c = Date.now();
        a(h, h);
        const U = setInterval(() => {
          if (C.value) {
            clearInterval(U), i();
            return;
          }
          const Q = Date.now() - c, ce = Math.max(0, h - Q);
          a(ce, h), ce <= 0 && (clearInterval(U), i());
        }, 100);
      });
    }
    async function ye(e) {
      try {
        const a = await st(() => r.getNextPage(e));
        return ee([...l.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function st(e) {
      let a = 0;
      const i = r.retryMaxAttempts;
      let h = r.retryInitialDelayMs;
      for (; ; )
        try {
          const c = await e();
          return a > 0 && E("retry:stop", { attempt: a, success: !0 }), c;
        } catch (c) {
          if (a++, a > i)
            throw E("retry:stop", { attempt: a - 1, success: !1 }), c;
          E("retry:start", { attempt: a, max: i, totalMs: h }), await Ne(h, (U, Q) => {
            E("retry:tick", { attempt: a, remainingMs: U, totalMs: Q });
          }), h += r.retryBackoffStepMs;
        }
    }
    async function Me(e) {
      if (!k.value) {
        C.value = !1, k.value = !0;
        try {
          const a = l.value.length;
          if (C.value) return;
          const i = await ye(e);
          return C.value ? void 0 : (z.value = e, p.value.push(i.nextPage), await ve(a), i);
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          k.value = !1;
        }
      }
    }
    async function ue() {
      if (!k.value) {
        C.value = !1, k.value = !0;
        try {
          const e = l.value.length;
          if (C.value) return;
          const a = p.value[p.value.length - 1], i = await ye(a);
          return C.value ? void 0 : (z.value = a, p.value.push(i.nextPage), await ve(e), i);
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          k.value = !1;
        }
      }
    }
    async function Te() {
      if (!k.value) {
        C.value = !1, k.value = !0;
        try {
          const e = z.value;
          if (e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", z.value, "paginationHistory:", p.value);
            return;
          }
          l.value = [], D.value = 0, p.value = [e], await X();
          const a = await ye(e);
          if (C.value) return;
          z.value = e, p.value.push(a.nextPage);
          const i = l.value.length;
          return await ve(i), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), e;
        } finally {
          k.value = !1;
        }
      }
    }
    async function fe(e) {
      const a = l.value.filter((i) => i.id !== e.id);
      if (l.value = a, await X(), a.length === 0 && p.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await ve(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        ee(a);
      });
    }
    async function ut(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((h) => h.id)), i = l.value.filter((h) => !a.has(h.id));
      if (l.value = i, await X(), i.length === 0 && p.value.length > 0) {
        if (r.autoRefreshOnEmpty)
          await Te();
        else
          try {
            await ue(), await ve(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((h) => requestAnimationFrame(() => h())), requestAnimationFrame(() => {
        ee(i);
      });
    }
    function We(e) {
      v.value && v.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function ct() {
      We({ behavior: "smooth" }), l.value = [], D.value = 0, await X(), E("remove-all:complete");
    }
    function ft() {
      b.value = he(d.value), ee(l.value), v.value && (V.value = v.value.scrollTop, Y.value = v.value.clientHeight);
    }
    let we = !1;
    const C = I(!1);
    async function ve(e, a = !1) {
      if (!a && !r.backfillEnabled || we || C.value) return;
      const i = (e || 0) + (r.pageSize || 0);
      if (!(!r.pageSize || r.pageSize <= 0 || p.value[p.value.length - 1] == null) && !(l.value.length >= i)) {
        we = !0;
        try {
          let c = 0;
          for (E("backfill:start", { target: i, fetched: l.value.length, calls: c }); l.value.length < i && c < r.backfillMaxCalls && p.value[p.value.length - 1] != null && !C.value && (await Ne(r.backfillDelayMs, (Q, ce) => {
            E("backfill:tick", {
              fetched: l.value.length,
              target: i,
              calls: c,
              remainingMs: Q,
              totalMs: ce
            });
          }), !C.value); ) {
            const U = p.value[p.value.length - 1];
            try {
              k.value = !0;
              const Q = await ye(U);
              if (C.value) break;
              p.value.push(Q.nextPage);
            } finally {
              k.value = !1;
            }
            c++;
          }
          E("backfill:stop", { fetched: l.value.length, calls: c });
        } finally {
          we = !1;
        }
      }
    }
    function De() {
      C.value = !0, k.value = !1, we = !1;
    }
    function vt() {
      De(), C.value = !1, v.value && v.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), l.value = [], D.value = 0, z.value = r.loadAtPage, p.value = [r.loadAtPage], ae.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const Ee = Je(async () => {
      if (m.value) return;
      v.value && (V.value = v.value.scrollTop, Y.value = v.value.clientHeight), G.value = !0, await X(), await new Promise((a) => requestAnimationFrame(() => a())), G.value = !1;
      const e = He(l.value, b.value);
      lt(e), L(e);
    }, 200), Ae = Je(ft, 200);
    function Fe(e) {
      m.value && (x.value = !0, A.value = e.touches[0].clientY, N.value = S.value, e.preventDefault());
    }
    function Be(e) {
      if (!m.value || !x.value) return;
      const a = e.touches[0].clientY - A.value;
      S.value = N.value + a, e.preventDefault();
    }
    function Oe(e) {
      if (!m.value || !x.value) return;
      x.value = !1;
      const a = S.value - N.value;
      Math.abs(a) > 100 ? a > 0 && H.value ? Re() : a < 0 && P.value ? je() : te() : te(), e.preventDefault();
    }
    function ze(e) {
      m.value && (x.value = !0, A.value = e.clientY, N.value = S.value, e.preventDefault());
    }
    function Le(e) {
      if (!m.value || !x.value) return;
      const a = e.clientY - A.value;
      S.value = N.value + a, e.preventDefault();
    }
    function Ie(e) {
      if (!m.value || !x.value) return;
      x.value = !1;
      const a = S.value - N.value;
      Math.abs(a) > 100 ? a > 0 && H.value ? Re() : a < 0 && P.value ? je() : te() : te(), e.preventDefault();
    }
    function je() {
      if (!P.value) {
        ue();
        return;
      }
      g.value++, te(), g.value >= l.value.length - 5 && ue();
    }
    function Re() {
      H.value && (g.value--, te());
    }
    function te() {
      if (!n.value) return;
      const e = n.value.clientHeight;
      S.value = -g.value * e;
    }
    function Ce() {
      o.value ? u.value = o.value.clientWidth : typeof window < "u" && (u.value = window.innerWidth), !m.value && g.value > 0 && (g.value = 0, S.value = 0), m.value && l.value.length === 0 && !k.value && Me(p.value[0]), m.value && te();
    }
    function dt(e, a, i) {
      z.value = a, p.value = [a], p.value.push(i), F(e, "init"), m.value ? (l.value = [...l.value, ...e], g.value === 0 && l.value.length > 0 && (S.value = 0)) : (ee([...l.value, ...e]), L());
    }
    return re(
      d,
      () => {
        m.value || v.value && (b.value = he(d.value, u.value), ee(l.value));
      },
      { deep: !0 }
    ), re(m, (e) => {
      X(() => {
        e ? (document.addEventListener("mousemove", Le), document.addEventListener("mouseup", Ie), g.value = 0, S.value = 0, l.value.length > 0 && te()) : (document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie), v.value && o.value && (u.value = o.value.clientWidth, v.value.removeEventListener("scroll", Ee), v.value.addEventListener("scroll", Ee, { passive: !0 }), l.value.length > 0 && (b.value = he(d.value, u.value), ee(l.value), V.value = v.value.scrollTop, Y.value = v.value.clientHeight, L())));
      });
    }, { immediate: !0 }), re(n, (e) => {
      e && (e.addEventListener("touchstart", Fe, { passive: !1 }), e.addEventListener("touchmove", Be, { passive: !1 }), e.addEventListener("touchend", Oe), e.addEventListener("mousedown", ze));
    }), re(() => l.value.length, (e, a) => {
      m.value && e > 0 && a === 0 && (g.value = 0, X(() => te()));
    }), re(o, (e) => {
      y && (y.disconnect(), y = null), e && typeof ResizeObserver < "u" ? (y = new ResizeObserver((a) => {
        for (const i of a) {
          const h = i.contentRect.width;
          u.value !== h && (u.value = h);
        }
      }), y.observe(e), u.value = e.clientWidth) : e && (u.value = e.clientWidth);
    }, { immediate: !0 }), re(u, (e, a) => {
      e !== a && e > 0 && !m.value && v.value && l.value.length > 0 && X(() => {
        b.value = he(d.value, e), ee(l.value), L();
      });
    }), Ze(async () => {
      try {
        await X(), o.value ? u.value = o.value.clientWidth : typeof window < "u" && (u.value = window.innerWidth), m.value || (b.value = he(d.value, u.value), v.value && (V.value = v.value.scrollTop, Y.value = v.value.clientHeight));
        const e = r.loadAtPage;
        p.value = [e], r.skipInitialLoad || await Me(p.value[0]), m.value ? X(() => te()) : L();
      } catch (e) {
        console.error("Error during component initialization:", e), k.value = !1;
      }
      window.addEventListener("resize", Ae), window.addEventListener("resize", Ce);
    }), et(() => {
      var e;
      y && (y.disconnect(), y = null), (e = v.value) == null || e.removeEventListener("scroll", Ee), window.removeEventListener("resize", Ae), window.removeEventListener("resize", Ce), n.value && (n.value.removeEventListener("touchstart", Fe), n.value.removeEventListener("touchmove", Be), n.value.removeEventListener("touchend", Oe), n.value.removeEventListener("mousedown", ze)), document.removeEventListener("mousemove", Le), document.removeEventListener("mouseup", Ie);
    }), (e, a) => (O(), B("div", {
      ref_key: "wrapper",
      ref: o,
      class: "w-full h-full flex flex-col relative"
    }, [
      m.value ? (O(), B("div", {
        key: 0,
        class: ie(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": r.forceMotion, "cursor-grab": !x.value, "cursor-grabbing": x.value }]),
        ref_key: "swipeContainer",
        ref: n,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        q("div", {
          class: "relative w-full",
          style: ge({
            transform: `translateY(${S.value}px)`,
            transition: x.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${l.value.length * 100}%`
          })
        }, [
          (O(!0), B(Ye, null, Ue(l.value, (i, h) => (O(), B("div", {
            key: `${i.page}-${i.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ge({
              top: `${h * (100 / l.value.length)}%`,
              height: `${100 / l.value.length}%`
            })
          }, [
            q("div", ra, [
              q("div", la, [
                ne(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  ke(xe, {
                    item: i,
                    remove: fe,
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !0,
                    "is-active": h === g.value,
                    "onPreload:success": a[0] || (a[0] = (c) => E("item:preload:success", c)),
                    "onPreload:error": a[1] || (a[1] = (c) => E("item:preload:error", c)),
                    onMouseEnter: a[2] || (a[2] = (c) => E("item:mouse-enter", c)),
                    onMouseLeave: a[3] || (a[3] = (c) => E("item:mouse-leave", c))
                  }, {
                    header: de((c) => [
                      ne(e.$slots, "item-header", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    footer: de((c) => [
                      ne(e.$slots, "item-footer", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    _: 2
                  }, 1032, ["item", "header-height", "footer-height", "is-active"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4)
      ], 2)) : (O(), B("div", {
        key: 1,
        class: ie(["overflow-auto w-full flex-1 masonry-container", { "force-motion": r.forceMotion }]),
        ref_key: "container",
        ref: v
      }, [
        q("div", {
          class: "relative",
          style: ge({ height: `${D.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          ke(ht, {
            name: "masonry",
            css: !1,
            onEnter: se,
            onBeforeEnter: K,
            onLeave: ot,
            onBeforeLeave: nt
          }, {
            default: de(() => [
              (O(!0), B(Ye, null, Ue(rt.value, (i, h) => (O(), B("div", me({
                key: `${i.page}-${i.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, gt(Gt)(i, h)), [
                ne(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  ke(xe, {
                    item: i,
                    remove: fe,
                    "header-height": d.value.header,
                    "footer-height": d.value.footer,
                    "in-swipe-mode": !1,
                    "is-active": !1,
                    "onPreload:success": a[4] || (a[4] = (c) => E("item:preload:success", c)),
                    "onPreload:error": a[5] || (a[5] = (c) => E("item:preload:error", c)),
                    onMouseEnter: a[6] || (a[6] = (c) => E("item:mouse-enter", c)),
                    onMouseLeave: a[7] || (a[7] = (c) => E("item:mouse-leave", c))
                  }, {
                    header: de((c) => [
                      ne(e.$slots, "item-header", me({ ref_for: !0 }, c), void 0, !0)
                    ]),
                    footer: de((c) => [
                      ne(e.$slots, "item-footer", me({ ref_for: !0 }, c), void 0, !0)
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
}), sa = (t, f) => {
  const s = t.__vccOpts || t;
  for (const [r, M] of f)
    s[r] = M;
  return s;
}, Ke = /* @__PURE__ */ sa(ia, [["__scopeId", "data-v-0764371c"]]), ca = {
  install(t) {
    t.component("WyxosMasonry", Ke), t.component("WMasonry", Ke), t.component("WyxosMasonryItem", xe), t.component("WMasonryItem", xe);
  }
};
export {
  Ke as Masonry,
  xe as MasonryItem,
  ca as default
};
