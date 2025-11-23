import { nextTick as R, defineComponent as Je, ref as T, computed as J, onMounted as Ke, onUnmounted as Qe, watch as ne, createElementBlock as O, openBlock as B, renderSlot as Le, createElementVNode as A, createCommentVNode as ae, normalizeClass as Z, toDisplayString as _e, withModifiers as dt, normalizeStyle as Te, Fragment as Ce, renderList as qe, createVNode as Ie, TransitionGroup as mt, withCtx as pt, mergeProps as ht, unref as gt } from "vue";
let Ee = null;
function yt() {
  if (Ee != null) return Ee;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const i = document.createElement("div");
  i.style.width = "100%", t.appendChild(i);
  const u = t.offsetWidth - i.offsetWidth;
  return document.body.removeChild(t), Ee = u, u;
}
function wt(t, i, u, l = {}) {
  const {
    gutterX: I = 0,
    gutterY: h = 0,
    header: a = 0,
    footer: c = 0,
    paddingLeft: w = 0,
    paddingRight: k = 0,
    sizes: v = {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      "2xl": 6
    },
    placement: H = "masonry"
  } = l;
  let N = 0, b = 0;
  try {
    if (i && i.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const y = window.getComputedStyle(i);
      N = parseFloat(y.paddingLeft) || 0, b = parseFloat(y.paddingRight) || 0;
    }
  } catch {
  }
  const P = (w || 0) + N, s = (k || 0) + b, $ = i.offsetWidth - i.clientWidth, f = $ > 0 ? $ + 2 : yt() + 2, o = i.offsetWidth - f - P - s, d = I * (u - 1), g = Math.floor((o - d) / u), E = t.map((y) => {
    const W = y.width, S = y.height;
    return Math.round(g * S / W) + c + a;
  });
  if (H === "sequential-balanced") {
    const y = E.length;
    if (y === 0) return [];
    const W = (M, F, _) => M + (F > 0 ? h : 0) + _;
    let S = Math.max(...E), D = E.reduce((M, F) => M + F, 0) + h * Math.max(0, y - 1);
    const le = (M) => {
      let F = 1, _ = 0, Q = 0;
      for (let C = 0; C < y; C++) {
        const re = E[C], q = W(_, Q, re);
        if (q <= M)
          _ = q, Q++;
        else if (F++, _ = re, Q = 1, re > M || F > u) return !1;
      }
      return F <= u;
    };
    for (; S < D; ) {
      const M = Math.floor((S + D) / 2);
      le(M) ? D = M : S = M + 1;
    }
    const oe = D, ee = new Array(u).fill(0);
    let V = u - 1, U = 0, te = 0;
    for (let M = y - 1; M >= 0; M--) {
      const F = E[M], _ = M < V;
      !(W(U, te, F) <= oe) || _ ? (ee[V] = M + 1, V--, U = F, te = 1) : (U = W(U, te, F), te++);
    }
    ee[0] = 0;
    const K = [], ue = new Array(u).fill(0);
    for (let M = 0; M < u; M++) {
      const F = ee[M], _ = M + 1 < u ? ee[M + 1] : y, Q = M * (g + I);
      for (let C = F; C < _; C++) {
        const q = {
          ...t[C],
          columnWidth: g,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        q.imageHeight = E[C] - (c + a), q.columnHeight = E[C], q.left = Q, q.top = ue[M], ue[M] += q.columnHeight + (C + 1 < _ ? h : 0), K.push(q);
      }
    }
    return K;
  }
  const m = new Array(u).fill(0), L = [];
  for (let y = 0; y < t.length; y++) {
    const W = t[y], S = {
      ...W,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, D = m.indexOf(Math.min(...m)), le = W.width, oe = W.height;
    S.columnWidth = g, S.left = D * (g + I), S.imageHeight = Math.round(g * oe / le), S.columnHeight = S.imageHeight + c + a, S.top = m[D], m[D] += S.columnHeight + h, L.push(S);
  }
  return L;
}
var bt = typeof global == "object" && global && global.Object === Object && global, xt = typeof self == "object" && self && self.Object === Object && self, Ze = bt || xt || Function("return this")(), he = Ze.Symbol, et = Object.prototype, Mt = et.hasOwnProperty, Tt = et.toString, ve = he ? he.toStringTag : void 0;
function It(t) {
  var i = Mt.call(t, ve), u = t[ve];
  try {
    t[ve] = void 0;
    var l = !0;
  } catch {
  }
  var I = Tt.call(t);
  return l && (i ? t[ve] = u : delete t[ve]), I;
}
var Et = Object.prototype, kt = Et.toString;
function Lt(t) {
  return kt.call(t);
}
var Pt = "[object Null]", St = "[object Undefined]", Ye = he ? he.toStringTag : void 0;
function $t(t) {
  return t == null ? t === void 0 ? St : Pt : Ye && Ye in Object(t) ? It(t) : Lt(t);
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
  for (var i = t.length; i-- && Dt.test(t.charAt(i)); )
    ;
  return i;
}
var Ot = /^\s+/;
function Bt(t) {
  return t && t.slice(0, At(t) + 1).replace(Ot, "");
}
function Pe(t) {
  var i = typeof t;
  return t != null && (i == "object" || i == "function");
}
var Ve = NaN, Ft = /^[-+]0x[0-9a-f]+$/i, zt = /^0b[01]+$/i, jt = /^0o[0-7]+$/i, Rt = parseInt;
function Ue(t) {
  if (typeof t == "number")
    return t;
  if (Wt(t))
    return Ve;
  if (Pe(t)) {
    var i = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = Pe(i) ? i + "" : i;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = Bt(t);
  var u = zt.test(t);
  return u || jt.test(t) ? Rt(t.slice(2), u ? 2 : 8) : Ft.test(t) ? Ve : +t;
}
var ke = function() {
  return Ze.Date.now();
}, _t = "Expected a function", Ct = Math.max, qt = Math.min;
function Ge(t, i, u) {
  var l, I, h, a, c, w, k = 0, v = !1, H = !1, N = !0;
  if (typeof t != "function")
    throw new TypeError(_t);
  i = Ue(i) || 0, Pe(u) && (v = !!u.leading, H = "maxWait" in u, h = H ? Ct(Ue(u.maxWait) || 0, i) : h, N = "trailing" in u ? !!u.trailing : N);
  function b(m) {
    var L = l, y = I;
    return l = I = void 0, k = m, a = t.apply(y, L), a;
  }
  function P(m) {
    return k = m, c = setTimeout(f, i), v ? b(m) : a;
  }
  function s(m) {
    var L = m - w, y = m - k, W = i - L;
    return H ? qt(W, h - y) : W;
  }
  function $(m) {
    var L = m - w, y = m - k;
    return w === void 0 || L >= i || L < 0 || H && y >= h;
  }
  function f() {
    var m = ke();
    if ($(m))
      return o(m);
    c = setTimeout(f, s(m));
  }
  function o(m) {
    return c = void 0, N && l ? b(m) : (l = I = void 0, a);
  }
  function d() {
    c !== void 0 && clearTimeout(c), k = 0, l = w = I = c = void 0;
  }
  function g() {
    return c === void 0 ? a : o(ke());
  }
  function E() {
    var m = ke(), L = $(m);
    if (l = arguments, I = this, w = m, L) {
      if (c === void 0)
        return P(w);
      if (H)
        return clearTimeout(c), c = setTimeout(f, i), b(w);
    }
    return c === void 0 && (c = setTimeout(f, i)), a;
  }
  return E.cancel = d, E.flush = g, E;
}
function de(t, i) {
  const u = i ?? (typeof window < "u" ? window.innerWidth : 1024), l = t.sizes;
  return u >= 1536 && l["2xl"] ? l["2xl"] : u >= 1280 && l.xl ? l.xl : u >= 1024 && l.lg ? l.lg : u >= 768 && l.md ? l.md : u >= 640 && l.sm ? l.sm : l.base;
}
function Yt(t) {
  return t.reduce((u, l) => Math.max(u, l.top + l.columnHeight), 0) + 500;
}
function Vt(t) {
  return {
    transform: `translate3d(${t.left}px, ${t.top}px, 0)`,
    top: "0px",
    left: "0px",
    width: `${t.columnWidth}px`,
    height: `${t.columnHeight}px`
  };
}
function Ut(t, i = 0) {
  return {
    style: Vt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": i
  };
}
function Se(t, i) {
  if (!t.length || i <= 0)
    return new Array(Math.max(1, i)).fill(0);
  const l = Array.from(new Set(t.map((a) => a.left))).sort((a, c) => a - c).slice(0, i), I = /* @__PURE__ */ new Map();
  for (let a = 0; a < l.length; a++) I.set(l[a], a);
  const h = new Array(l.length).fill(0);
  for (const a of t) {
    const c = I.get(a.left);
    c != null && (h[c] = Math.max(h[c], a.top + a.columnHeight));
  }
  for (; h.length < i; ) h.push(0);
  return h;
}
function Gt(t, i) {
  function u(a, c) {
    const w = parseInt(a.dataset.left || "0", 10), k = parseInt(a.dataset.top || "0", 10), v = parseInt(a.dataset.index || "0", 10), H = Math.min(v * 20, 160), N = a.style.getPropertyValue("--masonry-opacity-delay");
    a.style.setProperty("--masonry-opacity-delay", `${H}ms`), requestAnimationFrame(() => {
      a.style.opacity = "1", a.style.transform = `translate3d(${w}px, ${k}px, 0) scale(1)`;
      const b = () => {
        N ? a.style.setProperty("--masonry-opacity-delay", N) : a.style.removeProperty("--masonry-opacity-delay"), a.removeEventListener("transitionend", b), c();
      };
      a.addEventListener("transitionend", b);
    });
  }
  function l(a) {
    const c = parseInt(a.dataset.left || "0", 10), w = parseInt(a.dataset.top || "0", 10);
    a.style.opacity = "0", a.style.transform = `translate3d(${c}px, ${w + 10}px, 0) scale(0.985)`;
  }
  function I(a) {
    const c = parseInt(a.dataset.left || "0", 10), w = parseInt(a.dataset.top || "0", 10);
    a.style.transition = "none", a.style.opacity = "1", a.style.transform = `translate3d(${c}px, ${w}px, 0) scale(1)`, a.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      a.style.transition = "";
    });
  }
  function h(a, c) {
    const w = parseInt(a.dataset.left || "0", 10), k = parseInt(a.dataset.top || "0", 10), v = typeof (i == null ? void 0 : i.leaveDurationMs) == "number" ? i.leaveDurationMs : NaN;
    let H = Number.isFinite(v) && v > 0 ? v : NaN;
    if (!Number.isFinite(H)) {
      const f = getComputedStyle(a).getPropertyValue("--masonry-leave-duration") || "", o = parseFloat(f);
      H = Number.isFinite(o) && o > 0 ? o : 200;
    }
    const N = a.style.transitionDuration, b = () => {
      a.removeEventListener("transitionend", P), clearTimeout(s), a.style.transitionDuration = N || "";
    }, P = ($) => {
      (!$ || $.target === a) && (b(), c());
    }, s = setTimeout(() => {
      b(), c();
    }, H + 100);
    requestAnimationFrame(() => {
      a.style.transitionDuration = `${H}ms`, a.style.opacity = "0", a.style.transform = `translate3d(${w}px, ${k + 10}px, 0) scale(0.985)`, a.addEventListener("transitionend", P);
    });
  }
  return {
    onEnter: u,
    onBeforeEnter: l,
    onBeforeLeave: I,
    onLeave: h
  };
}
function Xt({
  container: t,
  masonry: i,
  columns: u,
  containerHeight: l,
  isLoading: I,
  pageSize: h,
  refreshLayout: a,
  setItemsRaw: c,
  loadNext: w,
  loadThresholdPx: k
}) {
  let v = 0;
  async function H(N) {
    if (!t.value) return;
    const b = N ?? Se(i.value, u.value), P = b.length ? Math.max(...b) : 0, s = t.value.scrollTop + t.value.clientHeight, $ = t.value.scrollTop > v + 1;
    v = t.value.scrollTop;
    const f = typeof k == "number" ? k : 200, o = f >= 0 ? Math.max(0, P - f) : Math.max(0, P + f);
    if (s >= o && $ && !I.value) {
      await w(), await R();
      return;
    }
  }
  return {
    handleScroll: H
  };
}
const Jt = { class: "w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white relative" }, Kt = {
  key: 0,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-sm p-4 text-center"
}, Qt = {
  key: 1,
  class: "relative w-full h-full"
}, Zt = ["src"], ea = ["src"], ta = { class: "w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm" }, aa = {
  key: 3,
  class: "absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
}, na = {
  key: 4,
  class: "absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 text-sm p-4 text-center"
}, la = ["title"], oa = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none" }, ra = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, ge = /* @__PURE__ */ Je({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 }
  },
  setup(t) {
    const i = t, u = T(!1), l = T(!1), I = T(null), h = T(!1), a = T(!1), c = T(null), w = T(!1), k = T(!1), v = T(!1), H = T(null);
    let N = null;
    const b = J(() => {
      var o;
      return i.type ?? ((o = i.item) == null ? void 0 : o.type) ?? "image";
    }), P = J(() => {
      var o;
      return i.notFound ?? ((o = i.item) == null ? void 0 : o.notFound) ?? !1;
    });
    function s(o) {
      return new Promise((d, g) => {
        if (!o) {
          g(new Error("No image source provided"));
          return;
        }
        const E = new Image(), m = Date.now(), L = 300;
        E.onload = () => {
          const y = Date.now() - m, W = Math.max(0, L - y);
          setTimeout(async () => {
            u.value = !0, l.value = !1, k.value = !1, await R(), await new Promise((S) => setTimeout(S, 100)), v.value = !0, d();
          }, W);
        }, E.onerror = () => {
          l.value = !0, u.value = !1, k.value = !1, g(new Error("Failed to load image"));
        }, E.src = o;
      });
    }
    function $(o) {
      return new Promise((d, g) => {
        if (!o) {
          g(new Error("No video source provided"));
          return;
        }
        const E = document.createElement("video"), m = Date.now(), L = 300;
        E.preload = "metadata", E.muted = !0, E.onloadedmetadata = () => {
          const y = Date.now() - m, W = Math.max(0, L - y);
          setTimeout(async () => {
            h.value = !0, a.value = !1, k.value = !1, await R(), await new Promise((S) => setTimeout(S, 100)), v.value = !0, d();
          }, W);
        }, E.onerror = () => {
          a.value = !0, h.value = !1, k.value = !1, g(new Error("Failed to load video"));
        }, E.src = o;
      });
    }
    async function f() {
      var d;
      if (!w.value || k.value || P.value || b.value === "video" && h.value || b.value === "image" && u.value)
        return;
      const o = (d = i.item) == null ? void 0 : d.src;
      if (o)
        if (k.value = !0, v.value = !1, b.value === "video") {
          c.value = o, h.value = !1, a.value = !1;
          try {
            await $(o);
          } catch {
          }
        } else {
          I.value = o, u.value = !1, l.value = !1;
          try {
            await s(o);
          } catch {
          }
        }
    }
    return Ke(() => {
      H.value && (N = new IntersectionObserver(
        (o) => {
          o.forEach((d) => {
            d.isIntersecting && d.intersectionRatio >= 1 ? w.value || (w.value = !0, f()) : d.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), N.observe(H.value));
    }), Qe(() => {
      N && (N.disconnect(), N = null);
    }), ne(
      () => {
        var o;
        return (o = i.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || P.value)) {
          if (b.value === "video") {
            if (o !== c.value && (h.value = !1, a.value = !1, c.value = o, w.value)) {
              k.value = !0;
              try {
                await $(o);
              } catch {
              }
            }
          } else if (o !== I.value && (u.value = !1, l.value = !1, I.value = o, w.value)) {
            k.value = !0;
            try {
              await s(o);
            } catch {
            }
          }
        }
      }
    ), (o, d) => (B(), O("div", {
      ref_key: "containerRef",
      ref: H,
      class: "relative w-full h-full group"
    }, [
      Le(o.$slots, "default", {
        item: o.item,
        remove: o.remove,
        imageLoaded: u.value,
        imageError: l.value,
        videoLoaded: h.value,
        videoError: a.value,
        showNotFound: P.value,
        isLoading: k.value,
        mediaType: b.value
      }, () => [
        A("div", Jt, [
          P.value ? (B(), O("div", Kt, d[4] || (d[4] = [
            A("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
            A("span", { class: "font-medium" }, "Not Found", -1),
            A("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
          ]))) : (B(), O("div", Qt, [
            b.value === "image" && I.value ? (B(), O("img", {
              key: 0,
              src: I.value,
              class: Z([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                u.value && v.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              loading: "lazy",
              decoding: "async",
              alt: ""
            }, null, 10, Zt)) : ae("", !0),
            b.value === "video" && c.value ? (B(), O("video", {
              key: 1,
              src: c.value,
              class: Z([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                h.value && v.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              muted: "",
              loop: "",
              playsinline: "",
              onMouseenter: d[0] || (d[0] = (g) => g.target.play()),
              onMouseleave: d[1] || (d[1] = (g) => g.target.pause()),
              onError: d[2] || (d[2] = (g) => a.value = !0)
            }, null, 42, ea)) : ae("", !0),
            !u.value && !h.value && !l.value && !a.value ? (B(), O("div", {
              key: 2,
              class: Z([
                "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                v.value ? "opacity-0 pointer-events-none" : "opacity-100"
              ])
            }, [
              A("div", ta, [
                A("i", {
                  class: Z(b.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                }, null, 2)
              ])
            ], 2)) : ae("", !0),
            k.value ? (B(), O("div", aa, d[5] || (d[5] = [
              A("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                A("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
              ], -1)
            ]))) : ae("", !0),
            b.value === "image" && l.value || b.value === "video" && a.value ? (B(), O("div", na, [
              A("i", {
                class: Z(b.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
              }, null, 2),
              A("span", null, "Failed to load " + _e(b.value), 1)
            ])) : ae("", !0)
          ])),
          !P.value && (u.value || h.value || k.value) ? (B(), O("div", {
            key: 2,
            class: "absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            title: b.value === "video" ? "Video" : "Image"
          }, [
            A("i", {
              class: Z(b.value === "video" ? "fas fa-video text-xs" : "fas fa-image text-xs")
            }, null, 2)
          ], 8, la)) : ae("", !0),
          d[7] || (d[7] = A("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }, null, -1)),
          o.remove ? (B(), O("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer z-10",
            onClick: d[3] || (d[3] = dt((g) => o.remove(o.item), ["stop"])),
            "aria-label": "Remove item"
          }, d[6] || (d[6] = [
            A("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : ae("", !0),
          A("div", oa, [
            A("p", ra, "Item #" + _e(String(o.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ], 512));
  }
}), ia = { class: "w-full h-full flex items-center justify-center p-4" }, sa = { class: "w-full h-full max-w-full max-h-full" }, ua = /* @__PURE__ */ Je({
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
    "remove-all:complete"
  ],
  setup(t, { expose: i, emit: u }) {
    const l = t, I = {
      sizes: { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 },
      gutterX: 10,
      gutterY: 10,
      header: 0,
      footer: 0,
      paddingLeft: 0,
      paddingRight: 0,
      placement: "masonry"
    }, h = J(() => {
      var e;
      return {
        ...I,
        ...l.layout,
        sizes: {
          ...I.sizes,
          ...((e = l.layout) == null ? void 0 : e.sizes) || {}
        }
      };
    }), a = T(null), c = T(typeof window < "u" ? window.innerWidth : 1024);
    let w = null;
    function k(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const v = J(() => {
      if (l.layoutMode === "masonry") return !1;
      if (l.layoutMode === "swipe") return !0;
      const e = typeof l.mobileBreakpoint == "string" ? k(l.mobileBreakpoint) : l.mobileBreakpoint;
      return c.value < e;
    }), H = J(() => {
      if (!v.value || s.value.length === 0) return null;
      const e = Math.max(0, Math.min(m.value, s.value.length - 1));
      return s.value[e] || null;
    }), N = J(() => {
      if (!v.value || !H.value) return null;
      const e = m.value + 1;
      return e >= s.value.length ? null : s.value[e] || null;
    }), b = J(() => {
      if (!v.value || !H.value) return null;
      const e = m.value - 1;
      return e < 0 ? null : s.value[e] || null;
    }), P = u, s = J({
      get: () => l.items,
      set: (e) => P("update:items", e)
    }), $ = T(7), f = T(null), o = T([]), d = T(null), g = T(!1), E = T(0), m = T(0), L = T(0), y = T(!1), W = T(0), S = T(0), D = T(null), le = T(/* @__PURE__ */ new Set());
    function oe(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function ee(e, n) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const r = e.filter((x) => !oe(x == null ? void 0 : x.width) || !oe(x == null ? void 0 : x.height));
        if (r.length === 0) return;
        const p = [];
        for (const x of r) {
          const j = (x == null ? void 0 : x.id) ?? `idx:${e.indexOf(x)}`;
          le.value.has(j) || (le.value.add(j), p.push(j));
        }
        if (p.length > 0) {
          const x = p.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: n,
              count: p.length,
              sampleIds: x,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const V = T(0), U = T(0), te = l.virtualBufferPx, K = T(!1), ue = T({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), M = (e) => {
      if (!f.value) return;
      const { scrollTop: n, clientHeight: r } = f.value, p = n + r, x = e ?? Se(s.value, $.value), j = x.length ? Math.max(...x) : 0, Y = typeof l.loadThresholdPx == "number" ? l.loadThresholdPx : 200, se = Y >= 0 ? Math.max(0, j - Y) : Math.max(0, j + Y), Re = Math.max(0, se - p), vt = Re <= 100;
      ue.value = {
        distanceToTrigger: Math.round(Re),
        isNearTrigger: vt
      };
    }, { onEnter: F, onBeforeEnter: _, onBeforeLeave: Q, onLeave: C } = Gt(s, { leaveDurationMs: l.leaveDurationMs });
    function re(e, n) {
      if (K.value) {
        const r = parseInt(e.dataset.left || "0", 10), p = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${r}px, ${p}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", n();
        });
      } else
        F(e, n);
    }
    function q(e) {
      if (K.value) {
        const n = parseInt(e.dataset.left || "0", 10), r = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${n}px, ${r}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        _(e);
    }
    function tt(e) {
      K.value || Q(e);
    }
    function at(e, n) {
      K.value ? n() : C(e, n);
    }
    const nt = J(() => {
      const e = V.value - te, n = V.value + U.value + te, r = s.value;
      return !r || r.length === 0 ? [] : r.filter((p) => {
        const x = p.top;
        return p.top + p.columnHeight >= e && x <= n;
      });
    }), { handleScroll: lt } = Xt({
      container: f,
      masonry: s,
      columns: $,
      containerHeight: E,
      isLoading: g,
      pageSize: l.pageSize,
      refreshLayout: G,
      setItemsRaw: (e) => {
        s.value = e;
      },
      loadNext: ie,
      loadThresholdPx: l.loadThresholdPx
    });
    i({
      isLoading: g,
      refreshLayout: G,
      containerHeight: E,
      remove: ce,
      removeMany: it,
      removeAll: st,
      loadNext: ie,
      loadPage: ye,
      refreshCurrentPage: we,
      reset: ct,
      init: ft,
      paginationHistory: o,
      cancelLoad: Ne,
      scrollToTop: He,
      totalItems: J(() => s.value.length)
    });
    function ot(e) {
      const n = Yt(e);
      let r = 0;
      if (f.value) {
        const { scrollTop: p, clientHeight: x } = f.value;
        r = p + x + 100;
      }
      E.value = Math.max(n, r);
    }
    function G(e) {
      if (v.value) {
        s.value = e;
        return;
      }
      if (!f.value) return;
      ee(e, "refreshLayout");
      const n = e.map((p, x) => ({
        ...p,
        originalIndex: p.originalIndex ?? x
      })), r = wt(n, f.value, $.value, h.value);
      ot(r), s.value = r;
    }
    function $e(e, n) {
      return new Promise((r) => {
        const p = Math.max(0, e | 0), x = Date.now();
        n(p, p);
        const j = setInterval(() => {
          if (z.value) {
            clearInterval(j), r();
            return;
          }
          const Y = Date.now() - x, se = Math.max(0, p - Y);
          n(se, p), se <= 0 && (clearInterval(j), r());
        }, 100);
      });
    }
    async function me(e) {
      try {
        const n = await rt(() => l.getNextPage(e));
        return G([...s.value, ...n.items]), n;
      } catch (n) {
        throw console.error("Error in getContent:", n), n;
      }
    }
    async function rt(e) {
      let n = 0;
      const r = l.retryMaxAttempts;
      let p = l.retryInitialDelayMs;
      for (; ; )
        try {
          const x = await e();
          return n > 0 && P("retry:stop", { attempt: n, success: !0 }), x;
        } catch (x) {
          if (n++, n > r)
            throw P("retry:stop", { attempt: n - 1, success: !1 }), x;
          P("retry:start", { attempt: n, max: r, totalMs: p }), await $e(p, (j, Y) => {
            P("retry:tick", { attempt: n, remainingMs: j, totalMs: Y });
          }), p += l.retryBackoffStepMs;
        }
    }
    async function ye(e) {
      if (!g.value) {
        z.value = !1, g.value = !0;
        try {
          const n = s.value.length;
          if (z.value) return;
          const r = await me(e);
          return z.value ? void 0 : (d.value = e, o.value.push(r.nextPage), await fe(n), r);
        } catch (n) {
          throw console.error("Error loading page:", n), n;
        } finally {
          g.value = !1;
        }
      }
    }
    async function ie() {
      if (!g.value) {
        z.value = !1, g.value = !0;
        try {
          const e = s.value.length;
          if (z.value) return;
          const n = o.value[o.value.length - 1], r = await me(n);
          return z.value ? void 0 : (d.value = n, o.value.push(r.nextPage), await fe(e), r);
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function we() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", g.value, "currentPage:", d.value), !g.value) {
        z.value = !1, g.value = !0;
        try {
          const e = d.value;
          if (console.log("[Masonry] pageToRefresh:", e), e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", d.value, "paginationHistory:", o.value);
            return;
          }
          s.value = [], E.value = 0, o.value = [e], await R();
          const n = await me(e);
          if (z.value) return;
          d.value = e, o.value.push(n.nextPage);
          const r = s.value.length;
          return await fe(r), n;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function ce(e) {
      const n = s.value.filter((r) => r.id !== e.id);
      if (s.value = n, await R(), console.log("[Masonry] remove - next.length:", n.length, "paginationHistory.length:", o.value.length), n.length === 0 && o.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await we();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await ie(), await fe(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((r) => requestAnimationFrame(() => r())), requestAnimationFrame(() => {
        G(n);
      });
    }
    async function it(e) {
      if (!e || e.length === 0) return;
      const n = new Set(e.map((p) => p.id)), r = s.value.filter((p) => !n.has(p.id));
      if (s.value = r, await R(), r.length === 0 && o.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          await we();
        else
          try {
            await ie(), await fe(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((p) => requestAnimationFrame(() => p())), requestAnimationFrame(() => {
        G(r);
      });
    }
    function He(e) {
      f.value && f.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function st() {
      He({ behavior: "smooth" }), s.value = [], E.value = 0, await R(), P("remove-all:complete");
    }
    function ut() {
      $.value = de(h.value), G(s.value), f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight);
    }
    let pe = !1;
    const z = T(!1);
    async function fe(e, n = !1) {
      if (!n && !l.backfillEnabled || pe || z.value) return;
      const r = (e || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || o.value[o.value.length - 1] == null) && !(s.value.length >= r)) {
        pe = !0;
        try {
          let x = 0;
          for (P("backfill:start", { target: r, fetched: s.value.length, calls: x }); s.value.length < r && x < l.backfillMaxCalls && o.value[o.value.length - 1] != null && !z.value && (await $e(l.backfillDelayMs, (Y, se) => {
            P("backfill:tick", {
              fetched: s.value.length,
              target: r,
              calls: x,
              remainingMs: Y,
              totalMs: se
            });
          }), !z.value); ) {
            const j = o.value[o.value.length - 1];
            try {
              g.value = !0;
              const Y = await me(j);
              if (z.value) break;
              o.value.push(Y.nextPage);
            } finally {
              g.value = !1;
            }
            x++;
          }
          P("backfill:stop", { fetched: s.value.length, calls: x });
        } finally {
          pe = !1;
        }
      }
    }
    function Ne() {
      z.value = !0, g.value = !1, pe = !1;
    }
    function ct() {
      Ne(), z.value = !1, f.value && f.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), s.value = [], E.value = 0, d.value = l.loadAtPage, o.value = [l.loadAtPage], ue.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const be = Ge(async () => {
      if (v.value) return;
      f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight), K.value = !0, await R(), await new Promise((n) => requestAnimationFrame(() => n())), K.value = !1;
      const e = Se(s.value, $.value);
      lt(e), M(e);
    }, 200), We = Ge(ut, 200);
    function De(e) {
      v.value && (y.value = !0, W.value = e.touches[0].clientY, S.value = L.value, e.preventDefault());
    }
    function Ae(e) {
      if (!v.value || !y.value) return;
      const n = e.touches[0].clientY - W.value;
      L.value = S.value + n, e.preventDefault();
    }
    function Oe(e) {
      if (!v.value || !y.value) return;
      y.value = !1;
      const n = L.value - S.value;
      Math.abs(n) > 100 ? n > 0 && b.value ? ze() : n < 0 && N.value ? Fe() : X() : X(), e.preventDefault();
    }
    function Be(e) {
      v.value && (y.value = !0, W.value = e.clientY, S.value = L.value, e.preventDefault());
    }
    function xe(e) {
      if (!v.value || !y.value) return;
      const n = e.clientY - W.value;
      L.value = S.value + n, e.preventDefault();
    }
    function Me(e) {
      if (!v.value || !y.value) return;
      y.value = !1;
      const n = L.value - S.value;
      Math.abs(n) > 100 ? n > 0 && b.value ? ze() : n < 0 && N.value ? Fe() : X() : X(), e.preventDefault();
    }
    function Fe() {
      if (!N.value) {
        ie();
        return;
      }
      m.value++, X(), m.value >= s.value.length - 5 && ie();
    }
    function ze() {
      b.value && (m.value--, X());
    }
    function X() {
      if (!D.value) return;
      const e = D.value.clientHeight;
      L.value = -m.value * e;
    }
    function je() {
      a.value ? c.value = a.value.clientWidth : typeof window < "u" && (c.value = window.innerWidth), !v.value && m.value > 0 && (m.value = 0, L.value = 0), v.value && s.value.length === 0 && !g.value && ye(o.value[0]), v.value && X();
    }
    function ft(e, n, r) {
      d.value = n, o.value = [n], o.value.push(r), ee(e, "init"), v.value ? (s.value = [...s.value, ...e], m.value === 0 && s.value.length > 0 && (L.value = 0)) : (G([...s.value, ...e]), M());
    }
    return ne(
      h,
      () => {
        v.value || f.value && ($.value = de(h.value, c.value), G(s.value));
      },
      { deep: !0 }
    ), ne(v, (e) => {
      R(() => {
        e ? (document.addEventListener("mousemove", xe), document.addEventListener("mouseup", Me), m.value = 0, L.value = 0, s.value.length > 0 && X()) : (document.removeEventListener("mousemove", xe), document.removeEventListener("mouseup", Me), f.value && a.value && (c.value = a.value.clientWidth, f.value.removeEventListener("scroll", be), f.value.addEventListener("scroll", be, { passive: !0 }), s.value.length > 0 && ($.value = de(h.value, c.value), G(s.value), V.value = f.value.scrollTop, U.value = f.value.clientHeight, M())));
      });
    }, { immediate: !0 }), ne(D, (e) => {
      e && (e.addEventListener("touchstart", De, { passive: !1 }), e.addEventListener("touchmove", Ae, { passive: !1 }), e.addEventListener("touchend", Oe), e.addEventListener("mousedown", Be));
    }), ne(() => s.value.length, (e, n) => {
      v.value && e > 0 && n === 0 && (m.value = 0, R(() => X()));
    }), ne(a, (e) => {
      w && (w.disconnect(), w = null), e && typeof ResizeObserver < "u" ? (w = new ResizeObserver((n) => {
        for (const r of n) {
          const p = r.contentRect.width;
          c.value !== p && (c.value = p);
        }
      }), w.observe(e), c.value = e.clientWidth) : e && (c.value = e.clientWidth);
    }, { immediate: !0 }), ne(c, (e, n) => {
      e !== n && e > 0 && !v.value && f.value && s.value.length > 0 && R(() => {
        $.value = de(h.value, e), G(s.value), M();
      });
    }), Ke(async () => {
      try {
        await R(), a.value ? c.value = a.value.clientWidth : typeof window < "u" && (c.value = window.innerWidth), v.value || ($.value = de(h.value, c.value), f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight));
        const e = l.loadAtPage;
        o.value = [e], l.skipInitialLoad || await ye(o.value[0]), v.value ? R(() => X()) : M();
      } catch (e) {
        console.error("Error during component initialization:", e), g.value = !1;
      }
      window.addEventListener("resize", We), window.addEventListener("resize", je);
    }), Qe(() => {
      var e;
      w && (w.disconnect(), w = null), (e = f.value) == null || e.removeEventListener("scroll", be), window.removeEventListener("resize", We), window.removeEventListener("resize", je), D.value && (D.value.removeEventListener("touchstart", De), D.value.removeEventListener("touchmove", Ae), D.value.removeEventListener("touchend", Oe), D.value.removeEventListener("mousedown", Be)), document.removeEventListener("mousemove", xe), document.removeEventListener("mouseup", Me);
    }), (e, n) => (B(), O("div", {
      ref_key: "wrapper",
      ref: a,
      class: "w-full h-full flex flex-col relative"
    }, [
      v.value ? (B(), O("div", {
        key: 0,
        class: Z(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": l.forceMotion, "cursor-grab": !y.value, "cursor-grabbing": y.value }]),
        ref_key: "swipeContainer",
        ref: D,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        A("div", {
          class: "relative w-full",
          style: Te({
            transform: `translateY(${L.value}px)`,
            transition: y.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${s.value.length * 100}%`
          })
        }, [
          (B(!0), O(Ce, null, qe(s.value, (r, p) => (B(), O("div", {
            key: `${r.page}-${r.id}`,
            class: "absolute top-0 left-0 w-full",
            style: Te({
              top: `${p * (100 / s.value.length)}%`,
              height: `${100 / s.value.length}%`
            })
          }, [
            A("div", ia, [
              A("div", sa, [
                Le(e.$slots, "default", {
                  item: r,
                  remove: ce
                }, () => [
                  Ie(ge, {
                    item: r,
                    remove: ce
                  }, null, 8, ["item"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4)
      ], 2)) : (B(), O("div", {
        key: 1,
        class: Z(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
        ref_key: "container",
        ref: f
      }, [
        A("div", {
          class: "relative",
          style: Te({ height: `${E.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Ie(mt, {
            name: "masonry",
            css: !1,
            onEnter: re,
            onBeforeEnter: q,
            onLeave: at,
            onBeforeLeave: tt
          }, {
            default: pt(() => [
              (B(!0), O(Ce, null, qe(nt.value, (r, p) => (B(), O("div", ht({
                key: `${r.page}-${r.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, gt(Ut)(r, p), {
                style: { paddingTop: `${h.value.header}px`, paddingBottom: `${h.value.footer}px` }
              }), [
                Le(e.$slots, "default", {
                  item: r,
                  remove: ce
                }, () => [
                  Ie(ge, {
                    item: r,
                    remove: ce
                  }, null, 8, ["item"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          })
        ], 4)
      ], 2))
    ], 512));
  }
}), ca = (t, i) => {
  const u = t.__vccOpts || t;
  for (const [l, I] of i)
    u[l] = I;
  return u;
}, Xe = /* @__PURE__ */ ca(ua, [["__scopeId", "data-v-9c79a3fb"]]), va = {
  install(t) {
    t.component("WyxosMasonry", Xe), t.component("WMasonry", Xe), t.component("WyxosMasonryItem", ge), t.component("WMasonryItem", ge);
  }
};
export {
  Xe as Masonry,
  ge as MasonryItem,
  va as default
};
