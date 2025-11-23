import { nextTick as Z, defineComponent as Le, ref as E, computed as ee, onMounted as Se, onUnmounted as Ne, watch as He, createElementBlock as B, openBlock as D, renderSlot as $e, createElementVNode as k, createCommentVNode as X, normalizeClass as se, toDisplayString as ie, withModifiers as ze, normalizeStyle as Re, createVNode as Te, TransitionGroup as _e, withCtx as Ce, Fragment as qe, renderList as Ve, mergeProps as Ge, unref as Ue } from "vue";
let fe = null;
function Xe() {
  if (fe != null) return fe;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const o = document.createElement("div");
  o.style.width = "100%", e.appendChild(o);
  const l = e.offsetWidth - o.offsetWidth;
  return document.body.removeChild(e), fe = l, l;
}
function Ye(e, o, l, s = {}) {
  const {
    gutterX: T = 0,
    gutterY: m = 0,
    header: a = 0,
    footer: n = 0,
    paddingLeft: y = 0,
    paddingRight: c = 0,
    sizes: v = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: b = "masonry"
  } = s;
  let f = 0, x = 0;
  try {
    if (o && o.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const M = window.getComputedStyle(o);
      f = parseFloat(M.paddingLeft) || 0, x = parseFloat(M.paddingRight) || 0;
    }
  } catch {
  }
  const $ = (y || 0) + f, z = (c || 0) + x, N = o.offsetWidth - o.clientWidth, i = N > 0 ? N + 2 : Xe() + 2, d = o.offsetWidth - i - $ - z, L = T * (l - 1), I = Math.floor((d - L) / l), P = e.map((M) => {
    const W = M.width, H = M.height;
    return Math.round(I * H / W) + n + a;
  });
  if (b === "sequential-balanced") {
    const M = P.length;
    if (M === 0) return [];
    const W = (w, A, R) => w + (A > 0 ? m : 0) + R;
    let H = Math.max(...P), _ = P.reduce((w, A) => w + A, 0) + m * Math.max(0, M - 1);
    const te = (w) => {
      let A = 1, R = 0, q = 0;
      for (let j = 0; j < M; j++) {
        const U = P[j], V = W(R, q, U);
        if (V <= w)
          R = V, q++;
        else if (A++, R = U, q = 1, U > w || A > l) return !1;
      }
      return A <= l;
    };
    for (; H < _; ) {
      const w = Math.floor((H + _) / 2);
      te(w) ? _ = w : H = w + 1;
    }
    const ae = _, Y = new Array(l).fill(0);
    let ne = l - 1, J = 0, K = 0;
    for (let w = M - 1; w >= 0; w--) {
      const A = P[w], R = w < ne;
      !(W(J, K, A) <= ae) || R ? (Y[ne] = w + 1, ne--, J = A, K = 1) : (J = W(J, K, A), K++);
    }
    Y[0] = 0;
    const C = [], re = new Array(l).fill(0);
    for (let w = 0; w < l; w++) {
      const A = Y[w], R = w + 1 < l ? Y[w + 1] : M, q = w * (I + T);
      for (let j = A; j < R; j++) {
        const V = {
          ...e[j],
          columnWidth: I,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        V.imageHeight = P[j] - (n + a), V.columnHeight = P[j], V.left = q, V.top = re[w], re[w] += V.columnHeight + (j + 1 < R ? m : 0), C.push(V);
      }
    }
    return C;
  }
  const h = new Array(l).fill(0), S = [];
  for (let M = 0; M < e.length; M++) {
    const W = e[M], H = {
      ...W,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, _ = h.indexOf(Math.min(...h)), te = W.width, ae = W.height;
    H.columnWidth = I, H.left = _ * (I + T), H.imageHeight = Math.round(I * ae / te), H.columnHeight = H.imageHeight + n + a, H.top = h[_], h[_] += H.columnHeight + m, S.push(H);
  }
  return S;
}
var Je = typeof global == "object" && global && global.Object === Object && global, Ke = typeof self == "object" && self && self.Object === Object && self, Ae = Je || Ke || Function("return this")(), ce = Ae.Symbol, Fe = Object.prototype, Qe = Fe.hasOwnProperty, Ze = Fe.toString, le = ce ? ce.toStringTag : void 0;
function et(e) {
  var o = Qe.call(e, le), l = e[le];
  try {
    e[le] = void 0;
    var s = !0;
  } catch {
  }
  var T = Ze.call(e);
  return s && (o ? e[le] = l : delete e[le]), T;
}
var tt = Object.prototype, at = tt.toString;
function nt(e) {
  return at.call(e);
}
var rt = "[object Null]", ot = "[object Undefined]", Me = ce ? ce.toStringTag : void 0;
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
  for (var o = e.length; o-- && ct.test(e.charAt(o)); )
    ;
  return o;
}
var dt = /^\s+/;
function vt(e) {
  return e && e.slice(0, ft(e) + 1).replace(dt, "");
}
function me(e) {
  var o = typeof e;
  return e != null && (o == "object" || o == "function");
}
var Ie = NaN, mt = /^[-+]0x[0-9a-f]+$/i, gt = /^0b[01]+$/i, pt = /^0o[0-7]+$/i, yt = parseInt;
function Pe(e) {
  if (typeof e == "number")
    return e;
  if (ut(e))
    return Ie;
  if (me(e)) {
    var o = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = me(o) ? o + "" : o;
  }
  if (typeof e != "string")
    return e === 0 ? e : +e;
  e = vt(e);
  var l = gt.test(e);
  return l || pt.test(e) ? yt(e.slice(2), l ? 2 : 8) : mt.test(e) ? Ie : +e;
}
var de = function() {
  return Ae.Date.now();
}, ht = "Expected a function", bt = Math.max, xt = Math.min;
function ke(e, o, l) {
  var s, T, m, a, n, y, c = 0, v = !1, b = !1, f = !0;
  if (typeof e != "function")
    throw new TypeError(ht);
  o = Pe(o) || 0, me(l) && (v = !!l.leading, b = "maxWait" in l, m = b ? bt(Pe(l.maxWait) || 0, o) : m, f = "trailing" in l ? !!l.trailing : f);
  function x(h) {
    var S = s, M = T;
    return s = T = void 0, c = h, a = e.apply(M, S), a;
  }
  function $(h) {
    return c = h, n = setTimeout(i, o), v ? x(h) : a;
  }
  function z(h) {
    var S = h - y, M = h - c, W = o - S;
    return b ? xt(W, m - M) : W;
  }
  function N(h) {
    var S = h - y, M = h - c;
    return y === void 0 || S >= o || S < 0 || b && M >= m;
  }
  function i() {
    var h = de();
    if (N(h))
      return d(h);
    n = setTimeout(i, z(h));
  }
  function d(h) {
    return n = void 0, f && s ? x(h) : (s = T = void 0, a);
  }
  function L() {
    n !== void 0 && clearTimeout(n), c = 0, s = y = T = n = void 0;
  }
  function I() {
    return n === void 0 ? a : d(de());
  }
  function P() {
    var h = de(), S = N(h);
    if (s = arguments, T = this, y = h, S) {
      if (n === void 0)
        return $(y);
      if (b)
        return clearTimeout(n), n = setTimeout(i, o), x(y);
    }
    return n === void 0 && (n = setTimeout(i, o)), a;
  }
  return P.cancel = L, P.flush = I, P;
}
function ve(e) {
  const o = window.innerWidth, l = e.sizes;
  return o >= 1536 && l["2xl"] ? l["2xl"] : o >= 1280 && l.xl ? l.xl : o >= 1024 && l.lg ? l.lg : o >= 768 && l.md ? l.md : o >= 640 && l.sm ? l.sm : l.base;
}
function wt(e) {
  return e.reduce((l, s) => Math.max(l, s.top + s.columnHeight), 0) + 500;
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
function Mt(e, o = 0) {
  return {
    style: Tt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": o
  };
}
function ge(e, o) {
  if (!e.length || o <= 0)
    return new Array(Math.max(1, o)).fill(0);
  const s = Array.from(new Set(e.map((a) => a.left))).sort((a, n) => a - n).slice(0, o), T = /* @__PURE__ */ new Map();
  for (let a = 0; a < s.length; a++) T.set(s[a], a);
  const m = new Array(s.length).fill(0);
  for (const a of e) {
    const n = T.get(a.left);
    n != null && (m[n] = Math.max(m[n], a.top + a.columnHeight));
  }
  for (; m.length < o; ) m.push(0);
  return m;
}
function It(e, o) {
  function l(a, n) {
    const y = parseInt(a.dataset.left || "0", 10), c = parseInt(a.dataset.top || "0", 10), v = parseInt(a.dataset.index || "0", 10), b = Math.min(v * 20, 160), f = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${b}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${y}px, ${c}px, 0) scale(1)`;
      const x = () => {
        f ? a.style.setProperty("--masonry-opacity-delay", f) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", x), n();
      };
      a.addEventListener("transitionend", x);
    });
  }
  function s(a) {
    const n = parseInt(a.dataset.left || "0", 10), y = parseInt(a.dataset.top || "0", 10);
    a.style.opacity = "0", a.style.transform = `translate3d(${n}px, ${y + 10}px, 0) scale(0.985)`;
  }
  function T(a) {
    const n = parseInt(a.dataset.left || "0", 10), y = parseInt(a.dataset.top || "0", 10);
    a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${n}px, ${y}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      a.style.transition = "";
    });
  }
  function m(a, n) {
    const y = parseInt(a.dataset.left || "0", 10), c = parseInt(a.dataset.top || "0", 10), v = typeof (o == null ? void 0 : o.leaveDurationMs) == "number" ? o.leaveDurationMs : NaN;
    let b = Number.isFinite(v) && v > 0 ? v : NaN;
    if (!Number.isFinite(b)) {
      const i = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", d = parseFloat(i);
      b = Number.isFinite(d) && d > 0 ? d : 200;
    }
    const f = a.style.transitionDuration, x = () => {
      a.removeEventListener("transitionend", $), clearTimeout(z), a.style.transitionDuration = f || "";
    }, $ = (N) => {
      (!N || N.target === a) && (x(), n());
    }, z = setTimeout(() => {
      x(), n();
    }, b + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${b}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${y}px, ${c + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", $);
    });
  }
  return {
    onEnter: l,
    onBeforeEnter: s,
    onBeforeLeave: T,
    onLeave: m
  };
}
function Pt({
  container: e,
  masonry: o,
  columns: l,
  containerHeight: s,
  isLoading: T,
  pageSize: m,
  refreshLayout: a,
  setItemsRaw: n,
  loadNext: y,
  loadThresholdPx: c
}) {
  let v = 0;
  async function b(f) {
    if (!e.value) return;
    const x = f ?? ge(o.value, l.value), $ = x.length ? Math.max(...x) : 0, z = e.value.scrollTop + e.value.clientHeight, N = e.value.scrollTop > v + 1;
    v = e.value.scrollTop;
    const i = typeof c == "number" ? c : 200, d = i >= 0 ? Math.max(0, $ - i) : Math.max(0, $ + i);
    if (z >= d && N && !T.value) {
      await y(), await Z();
      return;
    }
  }
  return {
    handleScroll: b
  };
}
const kt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, Et = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, Lt = {
  key: 1,
  class: "relative w-full h-full"
}, St = ["src"], Nt = ["src"], Ht = {
  key: 2,
  class: "absolute inset-0 bg-slate-100 flex items-center justify-center"
}, $t = { class: "flex flex-col items-center justify-center gap-2 text-slate-400" }, At = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, Ft = { class: "text-xs font-medium uppercase" }, Wt = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
}, jt = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ot = ["title"], Bt = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none" }, Dt = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, pe = /* @__PURE__ */ Le({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 }
  },
  setup(e) {
    const o = e, l = E(!1), s = E(!1), T = E(null), m = E(!1), a = E(!1), n = E(null), y = E(!1), c = E(!1), v = E(null);
    let b = null;
    const f = ee(() => {
      var i;
      return o.type ?? ((i = o.item) == null ? void 0 : i.type) ?? "image";
    }), x = ee(() => {
      var i;
      return o.notFound ?? ((i = o.item) == null ? void 0 : i.notFound) ?? !1;
    });
    function $(i) {
      return new Promise((d, L) => {
        if (!i) {
          L(new Error("No image source provided"));
          return;
        }
        const I = new Image(), P = Date.now(), h = 300;
        I.onload = () => {
          const S = Date.now() - P, M = Math.max(0, h - S);
          setTimeout(() => {
            l.value = !0, s.value = !1, c.value = !1, d();
          }, M);
        }, I.onerror = () => {
          s.value = !0, l.value = !1, c.value = !1, L(new Error("Failed to load image"));
        }, I.src = i;
      });
    }
    function z(i) {
      return new Promise((d, L) => {
        if (!i) {
          L(new Error("No video source provided"));
          return;
        }
        const I = document.createElement("video"), P = Date.now(), h = 300;
        I.preload = "metadata", I.muted = !0, I.onloadedmetadata = () => {
          const S = Date.now() - P, M = Math.max(0, h - S);
          setTimeout(() => {
            m.value = !0, a.value = !1, c.value = !1, d();
          }, M);
        }, I.onerror = () => {
          a.value = !0, m.value = !1, c.value = !1, L(new Error("Failed to load video"));
        }, I.src = i;
      });
    }
    async function N() {
      var d;
      if (!y.value || c.value || x.value || f.value === "video" && m.value || f.value === "image" && l.value)
        return;
      const i = (d = o.item) == null ? void 0 : d.src;
      if (i)
        if (c.value = !0, f.value === "video") {
          n.value = i, m.value = !1, a.value = !1;
          try {
            await z(i);
          } catch {
          }
        } else {
          T.value = i, l.value = !1, s.value = !1;
          try {
            await $(i);
          } catch {
          }
        }
    }
    return Se(() => {
      v.value && (b = new IntersectionObserver(
        (i) => {
          i.forEach((d) => {
            d.isIntersecting && d.intersectionRatio >= 1 ? y.value || (y.value = !0, N()) : d.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), b.observe(v.value));
    }), Ne(() => {
      b && (b.disconnect(), b = null);
    }), He(
      () => {
        var i;
        return (i = o.item) == null ? void 0 : i.src;
      },
      async (i) => {
        if (!(!i || x.value)) {
          if (f.value === "video") {
            if (i !== n.value && (m.value = !1, a.value = !1, n.value = i, y.value)) {
              c.value = !0;
              try {
                await z(i);
              } catch {
              }
            }
          } else if (i !== T.value && (l.value = !1, s.value = !1, T.value = i, y.value)) {
            c.value = !0;
            try {
              await $(i);
            } catch {
            }
          }
        }
      }
    ), (i, d) => (D(), B("div", {
      ref_key: "containerRef",
      ref: v,
      class: "relative w-full h-full group"
    }, [
      $e(i.$slots, "default", {
        item: i.item,
        remove: i.remove,
        imageLoaded: l.value,
        imageError: s.value,
        videoLoaded: m.value,
        videoError: a.value,
        showNotFound: x.value,
        isLoading: c.value,
        mediaType: f.value
      }, () => [
        k("div", kt, [
          x.value ? (D(), B("div", Et, d[4] || (d[4] = [
            k("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
            k("span", { class: "font-medium" }, "Not Found", -1),
            k("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
          ]))) : (D(), B("div", Lt, [
            f.value === "image" && l.value && T.value ? (D(), B("img", {
              key: 0,
              src: T.value,
              class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
              loading: "lazy",
              decoding: "async",
              alt: ""
            }, null, 8, St)) : X("", !0),
            f.value === "video" && m.value && n.value ? (D(), B("video", {
              key: 1,
              src: n.value,
              class: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
              muted: "",
              loop: "",
              playsinline: "",
              onMouseenter: d[0] || (d[0] = (L) => L.target.play()),
              onMouseleave: d[1] || (d[1] = (L) => L.target.pause()),
              onError: d[2] || (d[2] = (L) => a.value = !0)
            }, null, 40, Nt)) : X("", !0),
            !l.value && !m.value && !s.value && !a.value ? (D(), B("div", Ht, [
              k("div", $t, [
                k("div", At, [
                  k("i", {
                    class: se(f.value === "video" ? "fas fa-video text-xl" : "fas fa-image text-xl")
                  }, null, 2)
                ]),
                k("span", Ft, ie(f.value), 1)
              ])
            ])) : X("", !0),
            c.value ? (D(), B("div", Wt, d[5] || (d[5] = [
              k("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                k("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
              ], -1)
            ]))) : X("", !0),
            f.value === "image" && s.value || f.value === "video" && a.value ? (D(), B("div", jt, [
              k("i", {
                class: se(f.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
              }, null, 2),
              k("span", null, "Failed to load " + ie(f.value), 1)
            ])) : X("", !0)
          ])),
          !x.value && (l.value || m.value || c.value) ? (D(), B("div", {
            key: 2,
            class: "absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            title: f.value === "video" ? "Video" : "Image"
          }, [
            k("i", {
              class: se(f.value === "video" ? "fas fa-video text-xs" : "fas fa-image text-xs")
            }, null, 2)
          ], 8, Ot)) : X("", !0),
          d[7] || (d[7] = k("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }, null, -1)),
          i.remove ? (D(), B("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer z-10",
            onClick: d[3] || (d[3] = ze((L) => i.remove(i.item), ["stop"])),
            "aria-label": "Remove item"
          }, d[6] || (d[6] = [
            k("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : X("", !0),
          k("div", Bt, [
            k("p", Dt, "Item #" + ie(String(i.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ], 512));
  }
}), zt = /* @__PURE__ */ Le({
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
  setup(e, { expose: o, emit: l }) {
    const s = e, T = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, m = ee(() => {
      var t;
      return {
        ...T,
        ...s.layout,
        sizes: {
          ...T.sizes,
          ...((t = s.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), a = l, n = ee({
      get: () => s.items,
      set: (t) => a("update:items", t)
    }), y = E(7), c = E(null), v = E([]), b = E(null), f = E(!1), x = E(0), $ = E(/* @__PURE__ */ new Set());
    function z(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function N(t, r) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const u = t.filter((p) => !z(p == null ? void 0 : p.width) || !z(p == null ? void 0 : p.height));
        if (u.length === 0) return;
        const g = [];
        for (const p of u) {
          const O = (p == null ? void 0 : p.id) ?? `idx:${t.indexOf(p)}`;
          $.value.has(O) || ($.value.add(O), g.push(O));
        }
        if (g.length > 0) {
          const p = g.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: r,
              count: g.length,
              sampleIds: p,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const i = E(0), d = E(0), L = s.virtualBufferPx, I = E(!1), P = E({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), h = (t) => {
      if (!c.value) return;
      const { scrollTop: r, clientHeight: u } = c.value, g = r + u, p = t ?? ge(n.value, y.value), O = p.length ? Math.max(...p) : 0, G = typeof s.loadThresholdPx == "number" ? s.loadThresholdPx : 200, Q = G >= 0 ? Math.max(0, O - G) : Math.max(0, O + G), we = Math.max(0, Q - g), De = we <= 100;
      P.value = {
        distanceToTrigger: Math.round(we),
        isNearTrigger: De
      };
    }, { onEnter: S, onBeforeEnter: M, onBeforeLeave: W, onLeave: H } = It(n, { leaveDurationMs: s.leaveDurationMs });
    function _(t, r) {
      if (I.value) {
        const u = parseInt(t.dataset.left || "0", 10), g = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${u}px, ${g}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", r();
        });
      } else
        S(t, r);
    }
    function te(t) {
      if (I.value) {
        const r = parseInt(t.dataset.left || "0", 10), u = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${r}px, ${u}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        M(t);
    }
    function ae(t) {
      I.value || W(t);
    }
    function Y(t, r) {
      I.value ? r() : H(t, r);
    }
    const ne = ee(() => {
      const t = i.value - L, r = i.value + d.value + L, u = n.value;
      return !u || u.length === 0 ? [] : u.filter((g) => {
        const p = g.top;
        return g.top + g.columnHeight >= t && p <= r;
      });
    }), { handleScroll: J } = Pt({
      container: c,
      masonry: n,
      columns: y,
      containerHeight: x,
      isLoading: f,
      pageSize: s.pageSize,
      refreshLayout: C,
      setItemsRaw: (t) => {
        n.value = t;
      },
      loadNext: q,
      loadThresholdPx: s.loadThresholdPx
    });
    o({
      isLoading: f,
      refreshLayout: C,
      containerHeight: x,
      remove: U,
      removeMany: V,
      removeAll: We,
      loadNext: q,
      loadPage: R,
      refreshCurrentPage: j,
      reset: Oe,
      init: Be,
      paginationHistory: v,
      cancelLoad: he,
      scrollToTop: ye,
      totalItems: ee(() => n.value.length)
    });
    function K(t) {
      const r = wt(t);
      let u = 0;
      if (c.value) {
        const { scrollTop: g, clientHeight: p } = c.value;
        u = g + p + 100;
      }
      x.value = Math.max(r, u);
    }
    function C(t) {
      if (!c.value) return;
      N(t, "refreshLayout");
      const r = t.map((g, p) => ({
        ...g,
        originalIndex: g.originalIndex ?? p
      })), u = Ye(r, c.value, y.value, m.value);
      K(u), n.value = u;
    }
    function re(t, r) {
      return new Promise((u) => {
        const g = Math.max(0, t | 0), p = Date.now();
        r(g, g);
        const O = setInterval(() => {
          if (F.value) {
            clearInterval(O), u();
            return;
          }
          const G = Date.now() - p, Q = Math.max(0, g - G);
          r(Q, g), Q <= 0 && (clearInterval(O), u());
        }, 100);
      });
    }
    async function w(t) {
      try {
        const r = await A(() => s.getNextPage(t));
        return C([...n.value, ...r.items]), r;
      } catch (r) {
        throw console.error("Error in getContent:", r), r;
      }
    }
    async function A(t) {
      let r = 0;
      const u = s.retryMaxAttempts;
      let g = s.retryInitialDelayMs;
      for (; ; )
        try {
          const p = await t();
          return r > 0 && a("retry:stop", { attempt: r, success: !0 }), p;
        } catch (p) {
          if (r++, r > u)
            throw a("retry:stop", { attempt: r - 1, success: !1 }), p;
          a("retry:start", { attempt: r, max: u, totalMs: g }), await re(g, (O, G) => {
            a("retry:tick", { attempt: r, remainingMs: O, totalMs: G });
          }), g += s.retryBackoffStepMs;
        }
    }
    async function R(t) {
      if (!f.value) {
        F.value = !1, f.value = !0;
        try {
          const r = n.value.length;
          if (F.value) return;
          const u = await w(t);
          return F.value ? void 0 : (b.value = t, v.value.push(u.nextPage), await oe(r), u);
        } catch (r) {
          throw console.error("Error loading page:", r), r;
        } finally {
          f.value = !1;
        }
      }
    }
    async function q() {
      if (!f.value) {
        F.value = !1, f.value = !0;
        try {
          const t = n.value.length;
          if (F.value) return;
          const r = v.value[v.value.length - 1], u = await w(r);
          return F.value ? void 0 : (b.value = r, v.value.push(u.nextPage), await oe(t), u);
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          f.value = !1;
        }
      }
    }
    async function j() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", f.value, "currentPage:", b.value), !f.value) {
        F.value = !1, f.value = !0;
        try {
          const t = b.value;
          if (console.log("[Masonry] pageToRefresh:", t), t == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", b.value, "paginationHistory:", v.value);
            return;
          }
          n.value = [], x.value = 0, v.value = [t], await Z();
          const r = await w(t);
          if (F.value) return;
          b.value = t, v.value.push(r.nextPage);
          const u = n.value.length;
          return await oe(u), r;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          f.value = !1;
        }
      }
    }
    async function U(t) {
      const r = n.value.filter((u) => u.id !== t.id);
      if (n.value = r, await Z(), console.log("[Masonry] remove - next.length:", r.length, "paginationHistory.length:", v.value.length), r.length === 0 && v.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await j();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await q(), await oe(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((u) => requestAnimationFrame(() => u())), requestAnimationFrame(() => {
        C(r);
      });
    }
    async function V(t) {
      if (!t || t.length === 0) return;
      const r = new Set(t.map((g) => g.id)), u = n.value.filter((g) => !r.has(g.id));
      if (n.value = u, await Z(), u.length === 0 && v.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          await j();
        else
          try {
            await q(), await oe(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((g) => requestAnimationFrame(() => g())), requestAnimationFrame(() => {
        C(u);
      });
    }
    function ye(t) {
      c.value && c.value.scrollTo({
        top: 0,
        behavior: (t == null ? void 0 : t.behavior) ?? "smooth",
        ...t
      });
    }
    async function We() {
      ye({ behavior: "smooth" }), n.value = [], x.value = 0, await Z(), a("remove-all:complete");
    }
    function je() {
      y.value = ve(m.value), C(n.value), c.value && (i.value = c.value.scrollTop, d.value = c.value.clientHeight);
    }
    let ue = !1;
    const F = E(!1);
    async function oe(t, r = !1) {
      if (!r && !s.backfillEnabled || ue || F.value) return;
      const u = (t || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || v.value[v.value.length - 1] == null) && !(n.value.length >= u)) {
        ue = !0;
        try {
          let p = 0;
          for (a("backfill:start", { target: u, fetched: n.value.length, calls: p }); n.value.length < u && p < s.backfillMaxCalls && v.value[v.value.length - 1] != null && !F.value && (await re(s.backfillDelayMs, (G, Q) => {
            a("backfill:tick", {
              fetched: n.value.length,
              target: u,
              calls: p,
              remainingMs: G,
              totalMs: Q
            });
          }), !F.value); ) {
            const O = v.value[v.value.length - 1];
            try {
              f.value = !0;
              const G = await w(O);
              if (F.value) break;
              v.value.push(G.nextPage);
            } finally {
              f.value = !1;
            }
            p++;
          }
          a("backfill:stop", { fetched: n.value.length, calls: p });
        } finally {
          ue = !1;
        }
      }
    }
    function he() {
      F.value = !0, f.value = !1, ue = !1;
    }
    function Oe() {
      he(), F.value = !1, c.value && c.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), n.value = [], x.value = 0, b.value = s.loadAtPage, v.value = [s.loadAtPage], P.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const be = ke(async () => {
      c.value && (i.value = c.value.scrollTop, d.value = c.value.clientHeight), I.value = !0, await Z(), await new Promise((r) => requestAnimationFrame(() => r())), I.value = !1;
      const t = ge(n.value, y.value);
      J(t), h(t);
    }, 200), xe = ke(je, 200);
    function Be(t, r, u) {
      b.value = r, v.value = [r], v.value.push(u), N(t, "init"), C([...n.value, ...t]), h();
    }
    return He(
      m,
      () => {
        c.value && (y.value = ve(m.value), C(n.value));
      },
      { deep: !0 }
    ), Se(async () => {
      var t;
      try {
        y.value = ve(m.value), c.value && (i.value = c.value.scrollTop, d.value = c.value.clientHeight);
        const r = s.loadAtPage;
        v.value = [r], s.skipInitialLoad || await R(v.value[0]), h();
      } catch (r) {
        console.error("Error during component initialization:", r), f.value = !1;
      }
      (t = c.value) == null || t.addEventListener("scroll", be, { passive: !0 }), window.addEventListener("resize", xe);
    }), Ne(() => {
      var t;
      (t = c.value) == null || t.removeEventListener("scroll", be), window.removeEventListener("resize", xe);
    }), (t, r) => (D(), B("div", {
      class: se(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: c
    }, [
      k("div", {
        class: "relative",
        style: Re({ height: `${x.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        Te(_e, {
          name: "masonry",
          css: !1,
          onEnter: _,
          onBeforeEnter: te,
          onLeave: Y,
          onBeforeLeave: ae
        }, {
          default: Ce(() => [
            (D(!0), B(qe, null, Ve(ne.value, (u, g) => (D(), B("div", Ge({
              key: `${u.page}-${u.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, Ue(Mt)(u, g), {
              style: { paddingTop: `${m.value.header}px`, paddingBottom: `${m.value.footer}px` }
            }), [
              $e(t.$slots, "default", {
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
        x.value > 0 ? (D(), B("div", {
          key: 0,
          class: se(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !P.value.isNearTrigger, "opacity-100": P.value.isNearTrigger }])
        }, [
          k("span", null, ie(n.value.length) + " items", 1),
          r[0] || (r[0] = k("span", { class: "mx-2" }, "|", -1)),
          k("span", null, ie(P.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : X("", !0)
      ], 4)
    ], 2));
  }
}), Rt = (e, o) => {
  const l = e.__vccOpts || e;
  for (const [s, T] of o)
    l[s] = T;
  return l;
}, Ee = /* @__PURE__ */ Rt(zt, [["__scopeId", "data-v-110c3294"]]), Ct = {
  install(e) {
    e.component("WyxosMasonry", Ee), e.component("WMasonry", Ee), e.component("WyxosMasonryItem", pe), e.component("WMasonryItem", pe);
  }
};
export {
  Ee as Masonry,
  pe as MasonryItem,
  Ct as default
};
