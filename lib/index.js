import { nextTick as J, defineComponent as Le, ref as k, computed as te, onMounted as Se, onUnmounted as Ne, watch as He, createElementBlock as B, openBlock as D, renderSlot as $e, createElementVNode as S, createCommentVNode as X, normalizeClass as Y, toDisplayString as ue, withModifiers as ze, normalizeStyle as Re, createVNode as Te, TransitionGroup as _e, withCtx as Ce, Fragment as qe, renderList as Ve, mergeProps as Ge, unref as Ue } from "vue";
let fe = null;
function Xe() {
  if (fe != null) return fe;
  const e = document.createElement("div");
  e.style.visibility = "hidden", e.style.overflow = "scroll", e.style.msOverflowStyle = "scrollbar", e.style.width = "100px", e.style.height = "100px", document.body.appendChild(e);
  const r = document.createElement("div");
  r.style.width = "100%", e.appendChild(r);
  const l = e.offsetWidth - r.offsetWidth;
  return document.body.removeChild(e), fe = l, l;
}
function Ye(e, r, l, s = {}) {
  const {
    gutterX: w = 0,
    gutterY: v = 0,
    header: a = 0,
    footer: n = 0,
    paddingLeft: h = 0,
    paddingRight: c = 0,
    sizes: f = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: T = "masonry"
  } = s;
  let m = 0, d = 0;
  try {
    if (r && r.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const P = window.getComputedStyle(r);
      m = parseFloat(P.paddingLeft) || 0, d = parseFloat(P.paddingRight) || 0;
    }
  } catch {
  }
  const N = (h || 0) + m, z = (c || 0) + d, $ = r.offsetWidth - r.clientWidth, E = $ > 0 ? $ + 2 : Xe() + 2, i = r.offsetWidth - E - N - z, g = w * (l - 1), M = Math.floor((i - g) / l), I = e.map((P) => {
    const H = P.width, L = P.height;
    return Math.round(M * L / H) + n + a;
  });
  if (T === "sequential-balanced") {
    const P = I.length;
    if (P === 0) return [];
    const H = (x, F, R) => x + (F > 0 ? v : 0) + R;
    let L = Math.max(...I), _ = I.reduce((x, F) => x + F, 0) + v * Math.max(0, P - 1);
    const ae = (x) => {
      let F = 1, R = 0, q = 0;
      for (let O = 0; O < P; O++) {
        const U = I[O], V = H(R, q, U);
        if (V <= x)
          R = V, q++;
        else if (F++, R = U, q = 1, U > x || F > l) return !1;
      }
      return F <= l;
    };
    for (; L < _; ) {
      const x = Math.floor((L + _) / 2);
      ae(x) ? _ = x : L = x + 1;
    }
    const ne = _, K = new Array(l).fill(0);
    let oe = l - 1, Q = 0, Z = 0;
    for (let x = P - 1; x >= 0; x--) {
      const F = I[x], R = x < oe;
      !(H(Q, Z, F) <= ne) || R ? (K[oe] = x + 1, oe--, Q = F, Z = 1) : (Q = H(Q, Z, F), Z++);
    }
    K[0] = 0;
    const C = [], re = new Array(l).fill(0);
    for (let x = 0; x < l; x++) {
      const F = K[x], R = x + 1 < l ? K[x + 1] : P, q = x * (M + w);
      for (let O = F; O < R; O++) {
        const V = {
          ...e[O],
          columnWidth: M,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        V.imageHeight = I[O] - (n + a), V.columnHeight = I[O], V.left = q, V.top = re[x], re[x] += V.columnHeight + (O + 1 < R ? v : 0), C.push(V);
      }
    }
    return C;
  }
  const b = new Array(l).fill(0), A = [];
  for (let P = 0; P < e.length; P++) {
    const H = e[P], L = {
      ...H,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, _ = b.indexOf(Math.min(...b)), ae = H.width, ne = H.height;
    L.columnWidth = M, L.left = _ * (M + w), L.imageHeight = Math.round(M * ne / ae), L.columnHeight = L.imageHeight + n + a, L.top = b[_], b[_] += L.columnHeight + v, A.push(L);
  }
  return A;
}
var Je = typeof global == "object" && global && global.Object === Object && global, Ke = typeof self == "object" && self && self.Object === Object && self, Ae = Je || Ke || Function("return this")(), ce = Ae.Symbol, Fe = Object.prototype, Qe = Fe.hasOwnProperty, Ze = Fe.toString, se = ce ? ce.toStringTag : void 0;
function et(e) {
  var r = Qe.call(e, se), l = e[se];
  try {
    e[se] = void 0;
    var s = !0;
  } catch {
  }
  var w = Ze.call(e);
  return s && (r ? e[se] = l : delete e[se]), w;
}
var tt = Object.prototype, at = tt.toString;
function nt(e) {
  return at.call(e);
}
var ot = "[object Null]", rt = "[object Undefined]", Me = ce ? ce.toStringTag : void 0;
function lt(e) {
  return e == null ? e === void 0 ? rt : ot : Me && Me in Object(e) ? et(e) : nt(e);
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
  for (var r = e.length; r-- && ct.test(e.charAt(r)); )
    ;
  return r;
}
var dt = /^\s+/;
function vt(e) {
  return e && e.slice(0, ft(e) + 1).replace(dt, "");
}
function me(e) {
  var r = typeof e;
  return e != null && (r == "object" || r == "function");
}
var Ie = NaN, mt = /^[-+]0x[0-9a-f]+$/i, gt = /^0b[01]+$/i, pt = /^0o[0-7]+$/i, yt = parseInt;
function Pe(e) {
  if (typeof e == "number")
    return e;
  if (ut(e))
    return Ie;
  if (me(e)) {
    var r = typeof e.valueOf == "function" ? e.valueOf() : e;
    e = me(r) ? r + "" : r;
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
function ke(e, r, l) {
  var s, w, v, a, n, h, c = 0, f = !1, T = !1, m = !0;
  if (typeof e != "function")
    throw new TypeError(ht);
  r = Pe(r) || 0, me(l) && (f = !!l.leading, T = "maxWait" in l, v = T ? bt(Pe(l.maxWait) || 0, r) : v, m = "trailing" in l ? !!l.trailing : m);
  function d(b) {
    var A = s, P = w;
    return s = w = void 0, c = b, a = e.apply(P, A), a;
  }
  function N(b) {
    return c = b, n = setTimeout(E, r), f ? d(b) : a;
  }
  function z(b) {
    var A = b - h, P = b - c, H = r - A;
    return T ? xt(H, v - P) : H;
  }
  function $(b) {
    var A = b - h, P = b - c;
    return h === void 0 || A >= r || A < 0 || T && P >= v;
  }
  function E() {
    var b = de();
    if ($(b))
      return i(b);
    n = setTimeout(E, z(b));
  }
  function i(b) {
    return n = void 0, m && s ? d(b) : (s = w = void 0, a);
  }
  function g() {
    n !== void 0 && clearTimeout(n), c = 0, s = h = w = n = void 0;
  }
  function M() {
    return n === void 0 ? a : i(de());
  }
  function I() {
    var b = de(), A = $(b);
    if (s = arguments, w = this, h = b, A) {
      if (n === void 0)
        return N(h);
      if (T)
        return clearTimeout(n), n = setTimeout(E, r), d(h);
    }
    return n === void 0 && (n = setTimeout(E, r)), a;
  }
  return I.cancel = g, I.flush = M, I;
}
function ve(e) {
  const r = window.innerWidth, l = e.sizes;
  return r >= 1536 && l["2xl"] ? l["2xl"] : r >= 1280 && l.xl ? l.xl : r >= 1024 && l.lg ? l.lg : r >= 768 && l.md ? l.md : r >= 640 && l.sm ? l.sm : l.base;
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
function Mt(e, r = 0) {
  return {
    style: Tt(e),
    "data-top": e.top,
    "data-left": e.left,
    "data-id": `${e.page}-${e.id}`,
    "data-index": r
  };
}
function ge(e, r) {
  if (!e.length || r <= 0)
    return new Array(Math.max(1, r)).fill(0);
  const s = Array.from(new Set(e.map((a) => a.left))).sort((a, n) => a - n).slice(0, r), w = /* @__PURE__ */ new Map();
  for (let a = 0; a < s.length; a++) w.set(s[a], a);
  const v = new Array(s.length).fill(0);
  for (const a of e) {
    const n = w.get(a.left);
    n != null && (v[n] = Math.max(v[n], a.top + a.columnHeight));
  }
  for (; v.length < r; ) v.push(0);
  return v;
}
function It(e, r) {
  function l(a, n) {
    const h = parseInt(a.dataset.left || "0", 10), c = parseInt(a.dataset.top || "0", 10), f = parseInt(a.dataset.index || "0", 10), T = Math.min(f * 20, 160), m = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${T}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${h}px, ${c}px, 0) scale(1)`;
      const d = () => {
        m ? a.style.setProperty("--masonry-opacity-delay", m) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", d), n();
      };
      a.addEventListener("transitionend", d);
    });
  }
  function s(a) {
    const n = parseInt(a.dataset.left || "0", 10), h = parseInt(a.dataset.top || "0", 10);
    a.style.opacity = "0", a.style.transform = `translate3d(${n}px, ${h + 10}px, 0) scale(0.985)`;
  }
  function w(a) {
    const n = parseInt(a.dataset.left || "0", 10), h = parseInt(a.dataset.top || "0", 10);
    a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${n}px, ${h}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      a.style.transition = "";
    });
  }
  function v(a, n) {
    const h = parseInt(a.dataset.left || "0", 10), c = parseInt(a.dataset.top || "0", 10), f = typeof (r == null ? void 0 : r.leaveDurationMs) == "number" ? r.leaveDurationMs : NaN;
    let T = Number.isFinite(f) && f > 0 ? f : NaN;
    if (!Number.isFinite(T)) {
      const E = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", i = parseFloat(E);
      T = Number.isFinite(i) && i > 0 ? i : 200;
    }
    const m = a.style.transitionDuration, d = () => {
      a.removeEventListener("transitionend", N), clearTimeout(z), a.style.transitionDuration = m || "";
    }, N = ($) => {
      (!$ || $.target === a) && (d(), n());
    }, z = setTimeout(() => {
      d(), n();
    }, T + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${T}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${h}px, ${c + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", N);
    });
  }
  return {
    onEnter: l,
    onBeforeEnter: s,
    onBeforeLeave: w,
    onLeave: v
  };
}
function Pt({
  container: e,
  masonry: r,
  columns: l,
  containerHeight: s,
  isLoading: w,
  pageSize: v,
  refreshLayout: a,
  setItemsRaw: n,
  loadNext: h,
  loadThresholdPx: c
}) {
  let f = 0;
  async function T(m) {
    if (!e.value) return;
    const d = m ?? ge(r.value, l.value), N = d.length ? Math.max(...d) : 0, z = e.value.scrollTop + e.value.clientHeight, $ = e.value.scrollTop > f + 1;
    f = e.value.scrollTop;
    const E = typeof c == "number" ? c : 200, i = E >= 0 ? Math.max(0, N - E) : Math.max(0, N + E);
    if (z >= i && $ && !w.value) {
      await h(), await J();
      return;
    }
  }
  return {
    handleScroll: T
  };
}
const kt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, Et = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, Lt = {
  key: 1,
  class: "relative w-full h-full"
}, St = ["src"], Nt = ["src"], Ht = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, $t = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
}, At = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, Ft = ["title"], Wt = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none" }, Ot = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, pe = /* @__PURE__ */ Le({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 }
  },
  setup(e) {
    const r = e, l = k(!1), s = k(!1), w = k(null), v = k(!1), a = k(!1), n = k(null), h = k(!1), c = k(!1), f = k(!1), T = k(null);
    let m = null;
    const d = te(() => {
      var i;
      return r.type ?? ((i = r.item) == null ? void 0 : i.type) ?? "image";
    }), N = te(() => {
      var i;
      return r.notFound ?? ((i = r.item) == null ? void 0 : i.notFound) ?? !1;
    });
    function z(i) {
      return new Promise((g, M) => {
        if (!i) {
          M(new Error("No image source provided"));
          return;
        }
        const I = new Image(), b = Date.now(), A = 300;
        I.onload = () => {
          const P = Date.now() - b, H = Math.max(0, A - P);
          setTimeout(async () => {
            l.value = !0, s.value = !1, c.value = !1, await J(), await new Promise((L) => setTimeout(L, 100)), f.value = !0, g();
          }, H);
        }, I.onerror = () => {
          s.value = !0, l.value = !1, c.value = !1, M(new Error("Failed to load image"));
        }, I.src = i;
      });
    }
    function $(i) {
      return new Promise((g, M) => {
        if (!i) {
          M(new Error("No video source provided"));
          return;
        }
        const I = document.createElement("video"), b = Date.now(), A = 300;
        I.preload = "metadata", I.muted = !0, I.onloadedmetadata = () => {
          const P = Date.now() - b, H = Math.max(0, A - P);
          setTimeout(async () => {
            v.value = !0, a.value = !1, c.value = !1, await J(), await new Promise((L) => setTimeout(L, 100)), f.value = !0, g();
          }, H);
        }, I.onerror = () => {
          a.value = !0, v.value = !1, c.value = !1, M(new Error("Failed to load video"));
        }, I.src = i;
      });
    }
    async function E() {
      var g;
      if (!h.value || c.value || N.value || d.value === "video" && v.value || d.value === "image" && l.value)
        return;
      const i = (g = r.item) == null ? void 0 : g.src;
      if (i)
        if (c.value = !0, f.value = !1, d.value === "video") {
          n.value = i, v.value = !1, a.value = !1;
          try {
            await $(i);
          } catch {
          }
        } else {
          w.value = i, l.value = !1, s.value = !1;
          try {
            await z(i);
          } catch {
          }
        }
    }
    return Se(() => {
      T.value && (m = new IntersectionObserver(
        (i) => {
          i.forEach((g) => {
            g.isIntersecting && g.intersectionRatio >= 1 ? h.value || (h.value = !0, E()) : g.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), m.observe(T.value));
    }), Ne(() => {
      m && (m.disconnect(), m = null);
    }), He(
      () => {
        var i;
        return (i = r.item) == null ? void 0 : i.src;
      },
      async (i) => {
        if (!(!i || N.value)) {
          if (d.value === "video") {
            if (i !== n.value && (v.value = !1, a.value = !1, n.value = i, h.value)) {
              c.value = !0;
              try {
                await $(i);
              } catch {
              }
            }
          } else if (i !== w.value && (l.value = !1, s.value = !1, w.value = i, h.value)) {
            c.value = !0;
            try {
              await z(i);
            } catch {
            }
          }
        }
      }
    ), (i, g) => (D(), B("div", {
      ref_key: "containerRef",
      ref: T,
      class: "relative w-full h-full group"
    }, [
      $e(i.$slots, "default", {
        item: i.item,
        remove: i.remove,
        imageLoaded: l.value,
        imageError: s.value,
        videoLoaded: v.value,
        videoError: a.value,
        showNotFound: N.value,
        isLoading: c.value,
        mediaType: d.value
      }, () => [
        S("div", kt, [
          N.value ? (D(), B("div", Et, g[4] || (g[4] = [
            S("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
            S("span", { class: "font-medium" }, "Not Found", -1),
            S("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
          ]))) : (D(), B("div", Lt, [
            d.value === "image" && w.value ? (D(), B("img", {
              key: 0,
              src: w.value,
              class: Y([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                l.value && f.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              loading: "lazy",
              decoding: "async",
              alt: ""
            }, null, 10, St)) : X("", !0),
            d.value === "video" && n.value ? (D(), B("video", {
              key: 1,
              src: n.value,
              class: Y([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                v.value && f.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              muted: "",
              loop: "",
              playsinline: "",
              onMouseenter: g[0] || (g[0] = (M) => M.target.play()),
              onMouseleave: g[1] || (g[1] = (M) => M.target.pause()),
              onError: g[2] || (g[2] = (M) => a.value = !0)
            }, null, 42, Nt)) : X("", !0),
            !l.value && !v.value && !s.value && !a.value ? (D(), B("div", {
              key: 2,
              class: Y([
                "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                f.value ? "opacity-0 pointer-events-none" : "opacity-100"
              ])
            }, [
              S("div", Ht, [
                S("i", {
                  class: Y(d.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                }, null, 2)
              ])
            ], 2)) : X("", !0),
            c.value ? (D(), B("div", $t, g[5] || (g[5] = [
              S("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                S("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
              ], -1)
            ]))) : X("", !0),
            d.value === "image" && s.value || d.value === "video" && a.value ? (D(), B("div", At, [
              S("i", {
                class: Y(d.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
              }, null, 2),
              S("span", null, "Failed to load " + ue(d.value), 1)
            ])) : X("", !0)
          ])),
          !N.value && (l.value || v.value || c.value) ? (D(), B("div", {
            key: 2,
            class: "absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            title: d.value === "video" ? "Video" : "Image"
          }, [
            S("i", {
              class: Y(d.value === "video" ? "fas fa-video text-xs" : "fas fa-image text-xs")
            }, null, 2)
          ], 8, Ft)) : X("", !0),
          g[7] || (g[7] = S("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }, null, -1)),
          i.remove ? (D(), B("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer z-10",
            onClick: g[3] || (g[3] = ze((M) => i.remove(i.item), ["stop"])),
            "aria-label": "Remove item"
          }, g[6] || (g[6] = [
            S("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : X("", !0),
          S("div", Wt, [
            S("p", Ot, "Item #" + ue(String(i.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ], 512));
  }
}), jt = /* @__PURE__ */ Le({
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
  setup(e, { expose: r, emit: l }) {
    const s = e, w = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, v = te(() => {
      var t;
      return {
        ...w,
        ...s.layout,
        sizes: {
          ...w.sizes,
          ...((t = s.layout) == null ? void 0 : t.sizes) || {}
        }
      };
    }), a = l, n = te({
      get: () => s.items,
      set: (t) => a("update:items", t)
    }), h = k(7), c = k(null), f = k([]), T = k(null), m = k(!1), d = k(0), N = k(/* @__PURE__ */ new Set());
    function z(t) {
      return typeof t == "number" && Number.isFinite(t) && t > 0;
    }
    function $(t, o) {
      try {
        if (!Array.isArray(t) || t.length === 0) return;
        const u = t.filter((y) => !z(y == null ? void 0 : y.width) || !z(y == null ? void 0 : y.height));
        if (u.length === 0) return;
        const p = [];
        for (const y of u) {
          const j = (y == null ? void 0 : y.id) ?? `idx:${t.indexOf(y)}`;
          N.value.has(j) || (N.value.add(j), p.push(j));
        }
        if (p.length > 0) {
          const y = p.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: o,
              count: p.length,
              sampleIds: y,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const E = k(0), i = k(0), g = s.virtualBufferPx, M = k(!1), I = k({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), b = (t) => {
      if (!c.value) return;
      const { scrollTop: o, clientHeight: u } = c.value, p = o + u, y = t ?? ge(n.value, h.value), j = y.length ? Math.max(...y) : 0, G = typeof s.loadThresholdPx == "number" ? s.loadThresholdPx : 200, ee = G >= 0 ? Math.max(0, j - G) : Math.max(0, j + G), we = Math.max(0, ee - p), De = we <= 100;
      I.value = {
        distanceToTrigger: Math.round(we),
        isNearTrigger: De
      };
    }, { onEnter: A, onBeforeEnter: P, onBeforeLeave: H, onLeave: L } = It(n, { leaveDurationMs: s.leaveDurationMs });
    function _(t, o) {
      if (M.value) {
        const u = parseInt(t.dataset.left || "0", 10), p = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${u}px, ${p}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          t.style.transition = "", o();
        });
      } else
        A(t, o);
    }
    function ae(t) {
      if (M.value) {
        const o = parseInt(t.dataset.left || "0", 10), u = parseInt(t.dataset.top || "0", 10);
        t.style.transition = "none", t.style.opacity = "1", t.style.transform = `translate3d(${o}px, ${u}px, 0) scale(1)`, t.style.removeProperty("--masonry-opacity-delay");
      } else
        P(t);
    }
    function ne(t) {
      M.value || H(t);
    }
    function K(t, o) {
      M.value ? o() : L(t, o);
    }
    const oe = te(() => {
      const t = E.value - g, o = E.value + i.value + g, u = n.value;
      return !u || u.length === 0 ? [] : u.filter((p) => {
        const y = p.top;
        return p.top + p.columnHeight >= t && y <= o;
      });
    }), { handleScroll: Q } = Pt({
      container: c,
      masonry: n,
      columns: h,
      containerHeight: d,
      isLoading: m,
      pageSize: s.pageSize,
      refreshLayout: C,
      setItemsRaw: (t) => {
        n.value = t;
      },
      loadNext: q,
      loadThresholdPx: s.loadThresholdPx
    });
    r({
      isLoading: m,
      refreshLayout: C,
      containerHeight: d,
      remove: U,
      removeMany: V,
      removeAll: We,
      loadNext: q,
      loadPage: R,
      refreshCurrentPage: O,
      reset: je,
      init: Be,
      paginationHistory: f,
      cancelLoad: he,
      scrollToTop: ye,
      totalItems: te(() => n.value.length)
    });
    function Z(t) {
      const o = wt(t);
      let u = 0;
      if (c.value) {
        const { scrollTop: p, clientHeight: y } = c.value;
        u = p + y + 100;
      }
      d.value = Math.max(o, u);
    }
    function C(t) {
      if (!c.value) return;
      $(t, "refreshLayout");
      const o = t.map((p, y) => ({
        ...p,
        originalIndex: p.originalIndex ?? y
      })), u = Ye(o, c.value, h.value, v.value);
      Z(u), n.value = u;
    }
    function re(t, o) {
      return new Promise((u) => {
        const p = Math.max(0, t | 0), y = Date.now();
        o(p, p);
        const j = setInterval(() => {
          if (W.value) {
            clearInterval(j), u();
            return;
          }
          const G = Date.now() - y, ee = Math.max(0, p - G);
          o(ee, p), ee <= 0 && (clearInterval(j), u());
        }, 100);
      });
    }
    async function x(t) {
      try {
        const o = await F(() => s.getNextPage(t));
        return C([...n.value, ...o.items]), o;
      } catch (o) {
        throw console.error("Error in getContent:", o), o;
      }
    }
    async function F(t) {
      let o = 0;
      const u = s.retryMaxAttempts;
      let p = s.retryInitialDelayMs;
      for (; ; )
        try {
          const y = await t();
          return o > 0 && a("retry:stop", { attempt: o, success: !0 }), y;
        } catch (y) {
          if (o++, o > u)
            throw a("retry:stop", { attempt: o - 1, success: !1 }), y;
          a("retry:start", { attempt: o, max: u, totalMs: p }), await re(p, (j, G) => {
            a("retry:tick", { attempt: o, remainingMs: j, totalMs: G });
          }), p += s.retryBackoffStepMs;
        }
    }
    async function R(t) {
      if (!m.value) {
        W.value = !1, m.value = !0;
        try {
          const o = n.value.length;
          if (W.value) return;
          const u = await x(t);
          return W.value ? void 0 : (T.value = t, f.value.push(u.nextPage), await le(o), u);
        } catch (o) {
          throw console.error("Error loading page:", o), o;
        } finally {
          m.value = !1;
        }
      }
    }
    async function q() {
      if (!m.value) {
        W.value = !1, m.value = !0;
        try {
          const t = n.value.length;
          if (W.value) return;
          const o = f.value[f.value.length - 1], u = await x(o);
          return W.value ? void 0 : (T.value = o, f.value.push(u.nextPage), await le(t), u);
        } catch (t) {
          throw console.error("Error loading next page:", t), t;
        } finally {
          m.value = !1;
        }
      }
    }
    async function O() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", m.value, "currentPage:", T.value), !m.value) {
        W.value = !1, m.value = !0;
        try {
          const t = T.value;
          if (console.log("[Masonry] pageToRefresh:", t), t == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", T.value, "paginationHistory:", f.value);
            return;
          }
          n.value = [], d.value = 0, f.value = [t], await J();
          const o = await x(t);
          if (W.value) return;
          T.value = t, f.value.push(o.nextPage);
          const u = n.value.length;
          return await le(u), o;
        } catch (t) {
          throw console.error("[Masonry] Error refreshing current page:", t), t;
        } finally {
          m.value = !1;
        }
      }
    }
    async function U(t) {
      const o = n.value.filter((u) => u.id !== t.id);
      if (n.value = o, await J(), console.log("[Masonry] remove - next.length:", o.length, "paginationHistory.length:", f.value.length), o.length === 0 && f.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await O();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await q(), await le(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((u) => requestAnimationFrame(() => u())), requestAnimationFrame(() => {
        C(o);
      });
    }
    async function V(t) {
      if (!t || t.length === 0) return;
      const o = new Set(t.map((p) => p.id)), u = n.value.filter((p) => !o.has(p.id));
      if (n.value = u, await J(), u.length === 0 && f.value.length > 0) {
        if (s.autoRefreshOnEmpty)
          await O();
        else
          try {
            await q(), await le(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((p) => requestAnimationFrame(() => p())), requestAnimationFrame(() => {
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
      ye({ behavior: "smooth" }), n.value = [], d.value = 0, await J(), a("remove-all:complete");
    }
    function Oe() {
      h.value = ve(v.value), C(n.value), c.value && (E.value = c.value.scrollTop, i.value = c.value.clientHeight);
    }
    let ie = !1;
    const W = k(!1);
    async function le(t, o = !1) {
      if (!o && !s.backfillEnabled || ie || W.value) return;
      const u = (t || 0) + (s.pageSize || 0);
      if (!(!s.pageSize || s.pageSize <= 0 || f.value[f.value.length - 1] == null) && !(n.value.length >= u)) {
        ie = !0;
        try {
          let y = 0;
          for (a("backfill:start", { target: u, fetched: n.value.length, calls: y }); n.value.length < u && y < s.backfillMaxCalls && f.value[f.value.length - 1] != null && !W.value && (await re(s.backfillDelayMs, (G, ee) => {
            a("backfill:tick", {
              fetched: n.value.length,
              target: u,
              calls: y,
              remainingMs: G,
              totalMs: ee
            });
          }), !W.value); ) {
            const j = f.value[f.value.length - 1];
            try {
              m.value = !0;
              const G = await x(j);
              if (W.value) break;
              f.value.push(G.nextPage);
            } finally {
              m.value = !1;
            }
            y++;
          }
          a("backfill:stop", { fetched: n.value.length, calls: y });
        } finally {
          ie = !1;
        }
      }
    }
    function he() {
      W.value = !0, m.value = !1, ie = !1;
    }
    function je() {
      he(), W.value = !1, c.value && c.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), n.value = [], d.value = 0, T.value = s.loadAtPage, f.value = [s.loadAtPage], I.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const be = ke(async () => {
      c.value && (E.value = c.value.scrollTop, i.value = c.value.clientHeight), M.value = !0, await J(), await new Promise((o) => requestAnimationFrame(() => o())), M.value = !1;
      const t = ge(n.value, h.value);
      Q(t), b(t);
    }, 200), xe = ke(Oe, 200);
    function Be(t, o, u) {
      T.value = o, f.value = [o], f.value.push(u), $(t, "init"), C([...n.value, ...t]), b();
    }
    return He(
      v,
      () => {
        c.value && (h.value = ve(v.value), C(n.value));
      },
      { deep: !0 }
    ), Se(async () => {
      var t;
      try {
        h.value = ve(v.value), c.value && (E.value = c.value.scrollTop, i.value = c.value.clientHeight);
        const o = s.loadAtPage;
        f.value = [o], s.skipInitialLoad || await R(f.value[0]), b();
      } catch (o) {
        console.error("Error during component initialization:", o), m.value = !1;
      }
      (t = c.value) == null || t.addEventListener("scroll", be, { passive: !0 }), window.addEventListener("resize", xe);
    }), Ne(() => {
      var t;
      (t = c.value) == null || t.removeEventListener("scroll", be), window.removeEventListener("resize", xe);
    }), (t, o) => (D(), B("div", {
      class: Y(["overflow-auto w-full flex-1 masonry-container", { "force-motion": s.forceMotion }]),
      ref_key: "container",
      ref: c
    }, [
      S("div", {
        class: "relative",
        style: Re({ height: `${d.value}px`, "--masonry-duration": `${e.transitionDurationMs}ms`, "--masonry-leave-duration": `${e.leaveDurationMs}ms`, "--masonry-ease": e.transitionEasing })
      }, [
        Te(_e, {
          name: "masonry",
          css: !1,
          onEnter: _,
          onBeforeEnter: ae,
          onLeave: K,
          onBeforeLeave: ne
        }, {
          default: Ce(() => [
            (D(!0), B(qe, null, Ve(oe.value, (u, p) => (D(), B("div", Ge({
              key: `${u.page}-${u.id}`,
              class: "absolute masonry-item",
              ref_for: !0
            }, Ue(Mt)(u, p), {
              style: { paddingTop: `${v.value.header}px`, paddingBottom: `${v.value.footer}px` }
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
        d.value > 0 ? (D(), B("div", {
          key: 0,
          class: Y(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !I.value.isNearTrigger, "opacity-100": I.value.isNearTrigger }])
        }, [
          S("span", null, ue(n.value.length) + " items", 1),
          o[0] || (o[0] = S("span", { class: "mx-2" }, "|", -1)),
          S("span", null, ue(I.value.distanceToTrigger) + "px to load", 1)
        ], 2)) : X("", !0)
      ], 4)
    ], 2));
  }
}), Bt = (e, r) => {
  const l = e.__vccOpts || e;
  for (const [s, w] of r)
    l[s] = w;
  return l;
}, Ee = /* @__PURE__ */ Bt(jt, [["__scopeId", "data-v-110c3294"]]), zt = {
  install(e) {
    e.component("WyxosMasonry", Ee), e.component("WMasonry", Ee), e.component("WyxosMasonryItem", pe), e.component("WMasonryItem", pe);
  }
};
export {
  Ee as Masonry,
  pe as MasonryItem,
  zt as default
};
