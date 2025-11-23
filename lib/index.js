import { nextTick as R, defineComponent as Je, ref as k, computed as J, onMounted as Ke, onUnmounted as Qe, watch as le, createElementBlock as A, openBlock as O, renderSlot as $e, createElementVNode as W, createCommentVNode as Z, normalizeClass as K, toDisplayString as ce, withModifiers as dt, normalizeStyle as ke, Fragment as Ie, renderList as Ee, createVNode as Le, TransitionGroup as mt, withCtx as pt, mergeProps as ht, unref as gt } from "vue";
let Pe = null;
function yt() {
  if (Pe != null) return Pe;
  const t = document.createElement("div");
  t.style.visibility = "hidden", t.style.overflow = "scroll", t.style.msOverflowStyle = "scrollbar", t.style.width = "100px", t.style.height = "100px", document.body.appendChild(t);
  const s = document.createElement("div");
  s.style.width = "100%", t.appendChild(s);
  const u = t.offsetWidth - s.offsetWidth;
  return document.body.removeChild(t), Pe = u, u;
}
function wt(t, s, u, l = {}) {
  const {
    gutterX: I = 0,
    gutterY: h = 0,
    header: n = 0,
    footer: c = 0,
    paddingLeft: w = 0,
    paddingRight: E = 0,
    sizes: d = {
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
    if (s && s.nodeType === 1 && typeof window < "u" && window.getComputedStyle) {
      const y = window.getComputedStyle(s);
      N = parseFloat(y.paddingLeft) || 0, b = parseFloat(y.paddingRight) || 0;
    }
  } catch {
  }
  const P = (w || 0) + N, r = (E || 0) + b, $ = s.offsetWidth - s.clientWidth, f = $ > 0 ? $ + 2 : yt() + 2, o = s.offsetWidth - f - P - r, p = I * (u - 1), g = Math.floor((o - p) / u), T = t.map((y) => {
    const D = y.width, S = y.height;
    return Math.round(g * S / D) + c + n;
  });
  if (H === "sequential-balanced") {
    const y = T.length;
    if (y === 0) return [];
    const D = (M, B, _) => M + (B > 0 ? h : 0) + _;
    let S = Math.max(...T), z = T.reduce((M, B) => M + B, 0) + h * Math.max(0, y - 1);
    const oe = (M) => {
      let B = 1, _ = 0, te = 0;
      for (let C = 0; C < y; C++) {
        const ie = T[C], q = D(_, te, ie);
        if (q <= M)
          _ = q, te++;
        else if (B++, _ = ie, te = 1, ie > M || B > u) return !1;
      }
      return B <= u;
    };
    for (; S < z; ) {
      const M = Math.floor((S + z) / 2);
      oe(M) ? z = M : S = M + 1;
    }
    const re = z, ae = new Array(u).fill(0);
    let V = u - 1, U = 0, ne = 0;
    for (let M = y - 1; M >= 0; M--) {
      const B = T[M], _ = M < V;
      !(D(U, ne, B) <= re) || _ ? (ae[V] = M + 1, V--, U = B, ne = 1) : (U = D(U, ne, B), ne++);
    }
    ae[0] = 0;
    const Q = [], ee = new Array(u).fill(0);
    for (let M = 0; M < u; M++) {
      const B = ae[M], _ = M + 1 < u ? ae[M + 1] : y, te = M * (g + I);
      for (let C = B; C < _; C++) {
        const q = {
          ...t[C],
          columnWidth: g,
          imageHeight: 0,
          columnHeight: 0,
          left: 0,
          top: 0
        };
        q.imageHeight = T[C] - (c + n), q.columnHeight = T[C], q.left = te, q.top = ee[M], ee[M] += q.columnHeight + (C + 1 < _ ? h : 0), Q.push(q);
      }
    }
    return Q;
  }
  const v = new Array(u).fill(0), L = [];
  for (let y = 0; y < t.length; y++) {
    const D = t[y], S = {
      ...D,
      columnWidth: 0,
      imageHeight: 0,
      columnHeight: 0,
      left: 0,
      top: 0
    }, z = v.indexOf(Math.min(...v)), oe = D.width, re = D.height;
    S.columnWidth = g, S.left = z * (g + I), S.imageHeight = Math.round(g * re / oe), S.columnHeight = S.imageHeight + c + n, S.top = v[z], v[z] += S.columnHeight + h, L.push(S);
  }
  return L;
}
var bt = typeof global == "object" && global && global.Object === Object && global, xt = typeof self == "object" && self && self.Object === Object && self, Ze = bt || xt || Function("return this")(), ge = Ze.Symbol, et = Object.prototype, Mt = et.hasOwnProperty, Tt = et.toString, de = ge ? ge.toStringTag : void 0;
function kt(t) {
  var s = Mt.call(t, de), u = t[de];
  try {
    t[de] = void 0;
    var l = !0;
  } catch {
  }
  var I = Tt.call(t);
  return l && (s ? t[de] = u : delete t[de]), I;
}
var It = Object.prototype, Et = It.toString;
function Lt(t) {
  return Et.call(t);
}
var Pt = "[object Null]", St = "[object Undefined]", Ye = ge ? ge.toStringTag : void 0;
function $t(t) {
  return t == null ? t === void 0 ? St : Pt : Ye && Ye in Object(t) ? kt(t) : Lt(t);
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
  for (var s = t.length; s-- && Dt.test(t.charAt(s)); )
    ;
  return s;
}
var Ot = /^\s+/;
function zt(t) {
  return t && t.slice(0, At(t) + 1).replace(Ot, "");
}
function He(t) {
  var s = typeof t;
  return t != null && (s == "object" || s == "function");
}
var Ve = NaN, Bt = /^[-+]0x[0-9a-f]+$/i, Ft = /^0b[01]+$/i, jt = /^0o[0-7]+$/i, Rt = parseInt;
function Ue(t) {
  if (typeof t == "number")
    return t;
  if (Wt(t))
    return Ve;
  if (He(t)) {
    var s = typeof t.valueOf == "function" ? t.valueOf() : t;
    t = He(s) ? s + "" : s;
  }
  if (typeof t != "string")
    return t === 0 ? t : +t;
  t = zt(t);
  var u = Ft.test(t);
  return u || jt.test(t) ? Rt(t.slice(2), u ? 2 : 8) : Bt.test(t) ? Ve : +t;
}
var Se = function() {
  return Ze.Date.now();
}, _t = "Expected a function", Ct = Math.max, qt = Math.min;
function Ge(t, s, u) {
  var l, I, h, n, c, w, E = 0, d = !1, H = !1, N = !0;
  if (typeof t != "function")
    throw new TypeError(_t);
  s = Ue(s) || 0, He(u) && (d = !!u.leading, H = "maxWait" in u, h = H ? Ct(Ue(u.maxWait) || 0, s) : h, N = "trailing" in u ? !!u.trailing : N);
  function b(v) {
    var L = l, y = I;
    return l = I = void 0, E = v, n = t.apply(y, L), n;
  }
  function P(v) {
    return E = v, c = setTimeout(f, s), d ? b(v) : n;
  }
  function r(v) {
    var L = v - w, y = v - E, D = s - L;
    return H ? qt(D, h - y) : D;
  }
  function $(v) {
    var L = v - w, y = v - E;
    return w === void 0 || L >= s || L < 0 || H && y >= h;
  }
  function f() {
    var v = Se();
    if ($(v))
      return o(v);
    c = setTimeout(f, r(v));
  }
  function o(v) {
    return c = void 0, N && l ? b(v) : (l = I = void 0, n);
  }
  function p() {
    c !== void 0 && clearTimeout(c), E = 0, l = w = I = c = void 0;
  }
  function g() {
    return c === void 0 ? n : o(Se());
  }
  function T() {
    var v = Se(), L = $(v);
    if (l = arguments, I = this, w = v, L) {
      if (c === void 0)
        return P(w);
      if (H)
        return clearTimeout(c), c = setTimeout(f, s), b(w);
    }
    return c === void 0 && (c = setTimeout(f, s)), n;
  }
  return T.cancel = p, T.flush = g, T;
}
function me(t, s) {
  const u = s ?? (typeof window < "u" ? window.innerWidth : 1024), l = t.sizes;
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
function Ut(t, s = 0) {
  return {
    style: Vt(t),
    "data-top": t.top,
    "data-left": t.left,
    "data-id": `${t.page}-${t.id}`,
    "data-index": s
  };
}
function Ne(t, s) {
  if (!t.length || s <= 0)
    return new Array(Math.max(1, s)).fill(0);
  const l = Array.from(new Set(t.map((n) => n.left))).sort((n, c) => n - c).slice(0, s), I = /* @__PURE__ */ new Map();
  for (let n = 0; n < l.length; n++) I.set(l[n], n);
  const h = new Array(l.length).fill(0);
  for (const n of t) {
    const c = I.get(n.left);
    c != null && (h[c] = Math.max(h[c], n.top + n.columnHeight));
  }
  for (; h.length < s; ) h.push(0);
  return h;
}
function Gt(t, s) {
  function u(n, c) {
    const w = parseInt(n.dataset.left || "0", 10), E = parseInt(n.dataset.top || "0", 10), d = parseInt(n.dataset.index || "0", 10), H = Math.min(d * 20, 160), N = n.style.getPropertyValue("--masonry-opacity-delay");
    n.style.setProperty("--masonry-opacity-delay", `${H}ms`), requestAnimationFrame(() => {
      n.style.opacity = "1", n.style.transform = `translate3d(${w}px, ${E}px, 0) scale(1)`;
      const b = () => {
        N ? n.style.setProperty("--masonry-opacity-delay", N) : n.style.removeProperty("--masonry-opacity-delay"), n.removeEventListener("transitionend", b), c();
      };
      n.addEventListener("transitionend", b);
    });
  }
  function l(n) {
    const c = parseInt(n.dataset.left || "0", 10), w = parseInt(n.dataset.top || "0", 10);
    n.style.opacity = "0", n.style.transform = `translate3d(${c}px, ${w + 10}px, 0) scale(0.985)`;
  }
  function I(n) {
    const c = parseInt(n.dataset.left || "0", 10), w = parseInt(n.dataset.top || "0", 10);
    n.style.transition = "none", n.style.opacity = "1", n.style.transform = `translate3d(${c}px, ${w}px, 0) scale(1)`, n.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
      n.style.transition = "";
    });
  }
  function h(n, c) {
    const w = parseInt(n.dataset.left || "0", 10), E = parseInt(n.dataset.top || "0", 10), d = typeof (s == null ? void 0 : s.leaveDurationMs) == "number" ? s.leaveDurationMs : NaN;
    let H = Number.isFinite(d) && d > 0 ? d : NaN;
    if (!Number.isFinite(H)) {
      const f = getComputedStyle(n).getPropertyValue("--masonry-leave-duration") || "", o = parseFloat(f);
      H = Number.isFinite(o) && o > 0 ? o : 200;
    }
    const N = n.style.transitionDuration, b = () => {
      n.removeEventListener("transitionend", P), clearTimeout(r), n.style.transitionDuration = N || "";
    }, P = ($) => {
      (!$ || $.target === n) && (b(), c());
    }, r = setTimeout(() => {
      b(), c();
    }, H + 100);
    requestAnimationFrame(() => {
      n.style.transitionDuration = `${H}ms`, n.style.opacity = "0", n.style.transform = `translate3d(${w}px, ${E + 10}px, 0) scale(0.985)`, n.addEventListener("transitionend", P);
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
  masonry: s,
  columns: u,
  containerHeight: l,
  isLoading: I,
  pageSize: h,
  refreshLayout: n,
  setItemsRaw: c,
  loadNext: w,
  loadThresholdPx: E
}) {
  let d = 0;
  async function H(N) {
    if (!t.value) return;
    const b = N ?? Ne(s.value, u.value), P = b.length ? Math.max(...b) : 0, r = t.value.scrollTop + t.value.clientHeight, $ = t.value.scrollTop > d + 1;
    d = t.value.scrollTop;
    const f = typeof E == "number" ? E : 200, o = f >= 0 ? Math.max(0, P - f) : Math.max(0, P + f);
    if (r >= o && $ && !I.value) {
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
}, la = ["title"], oa = { class: "absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75 pointer-events-none" }, ra = { class: "text-white text-xs font-medium truncate drop-shadow-md" }, ye = /* @__PURE__ */ Je({
  __name: "MasonryItem",
  props: {
    item: {},
    remove: {},
    type: { default: void 0 },
    notFound: { type: Boolean, default: void 0 }
  },
  setup(t) {
    const s = t, u = k(!1), l = k(!1), I = k(null), h = k(!1), n = k(!1), c = k(null), w = k(!1), E = k(!1), d = k(!1), H = k(null);
    let N = null;
    const b = J(() => {
      var o;
      return s.type ?? ((o = s.item) == null ? void 0 : o.type) ?? "image";
    }), P = J(() => {
      var o;
      return s.notFound ?? ((o = s.item) == null ? void 0 : o.notFound) ?? !1;
    });
    function r(o) {
      return new Promise((p, g) => {
        if (!o) {
          g(new Error("No image source provided"));
          return;
        }
        const T = new Image(), v = Date.now(), L = 300;
        T.onload = () => {
          const y = Date.now() - v, D = Math.max(0, L - y);
          setTimeout(async () => {
            u.value = !0, l.value = !1, E.value = !1, await R(), await new Promise((S) => setTimeout(S, 100)), d.value = !0, p();
          }, D);
        }, T.onerror = () => {
          l.value = !0, u.value = !1, E.value = !1, g(new Error("Failed to load image"));
        }, T.src = o;
      });
    }
    function $(o) {
      return new Promise((p, g) => {
        if (!o) {
          g(new Error("No video source provided"));
          return;
        }
        const T = document.createElement("video"), v = Date.now(), L = 300;
        T.preload = "metadata", T.muted = !0, T.onloadedmetadata = () => {
          const y = Date.now() - v, D = Math.max(0, L - y);
          setTimeout(async () => {
            h.value = !0, n.value = !1, E.value = !1, await R(), await new Promise((S) => setTimeout(S, 100)), d.value = !0, p();
          }, D);
        }, T.onerror = () => {
          n.value = !0, h.value = !1, E.value = !1, g(new Error("Failed to load video"));
        }, T.src = o;
      });
    }
    async function f() {
      var p;
      if (!w.value || E.value || P.value || b.value === "video" && h.value || b.value === "image" && u.value)
        return;
      const o = (p = s.item) == null ? void 0 : p.src;
      if (o)
        if (E.value = !0, d.value = !1, b.value === "video") {
          c.value = o, h.value = !1, n.value = !1;
          try {
            await $(o);
          } catch {
          }
        } else {
          I.value = o, u.value = !1, l.value = !1;
          try {
            await r(o);
          } catch {
          }
        }
    }
    return Ke(() => {
      H.value && (N = new IntersectionObserver(
        (o) => {
          o.forEach((p) => {
            p.isIntersecting && p.intersectionRatio >= 1 ? w.value || (w.value = !0, f()) : p.isIntersecting;
          });
        },
        {
          // Only trigger when item is 100% visible (full height in view)
          threshold: [1]
        }
      ), N.observe(H.value));
    }), Qe(() => {
      N && (N.disconnect(), N = null);
    }), le(
      () => {
        var o;
        return (o = s.item) == null ? void 0 : o.src;
      },
      async (o) => {
        if (!(!o || P.value)) {
          if (b.value === "video") {
            if (o !== c.value && (h.value = !1, n.value = !1, c.value = o, w.value)) {
              E.value = !0;
              try {
                await $(o);
              } catch {
              }
            }
          } else if (o !== I.value && (u.value = !1, l.value = !1, I.value = o, w.value)) {
            E.value = !0;
            try {
              await r(o);
            } catch {
            }
          }
        }
      }
    ), (o, p) => (O(), A("div", {
      ref_key: "containerRef",
      ref: H,
      class: "relative w-full h-full group"
    }, [
      $e(o.$slots, "default", {
        item: o.item,
        remove: o.remove,
        imageLoaded: u.value,
        imageError: l.value,
        videoLoaded: h.value,
        videoError: n.value,
        showNotFound: P.value,
        isLoading: E.value,
        mediaType: b.value
      }, () => [
        W("div", Jt, [
          P.value ? (O(), A("div", Kt, p[4] || (p[4] = [
            W("i", { class: "fas fa-search text-3xl mb-3 opacity-50" }, null, -1),
            W("span", { class: "font-medium" }, "Not Found", -1),
            W("span", { class: "text-xs mt-1 opacity-75" }, "This item could not be located", -1)
          ]))) : (O(), A("div", Qt, [
            b.value === "image" && I.value ? (O(), A("img", {
              key: 0,
              src: I.value,
              class: K([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                u.value && d.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              loading: "lazy",
              decoding: "async",
              alt: ""
            }, null, 10, Zt)) : Z("", !0),
            b.value === "video" && c.value ? (O(), A("video", {
              key: 1,
              src: c.value,
              class: K([
                "w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105",
                h.value && d.value ? "opacity-100" : "opacity-0"
              ]),
              style: { position: "absolute", top: "0", left: "0" },
              muted: "",
              loop: "",
              playsinline: "",
              onMouseenter: p[0] || (p[0] = (g) => g.target.play()),
              onMouseleave: p[1] || (p[1] = (g) => g.target.pause()),
              onError: p[2] || (p[2] = (g) => n.value = !0)
            }, null, 42, ea)) : Z("", !0),
            !u.value && !h.value && !l.value && !n.value ? (O(), A("div", {
              key: 2,
              class: K([
                "absolute inset-0 bg-slate-100 flex items-center justify-center transition-opacity duration-500",
                d.value ? "opacity-0 pointer-events-none" : "opacity-100"
              ])
            }, [
              W("div", ta, [
                W("i", {
                  class: K(b.value === "video" ? "fas fa-video text-xl text-slate-400" : "fas fa-image text-xl text-slate-400")
                }, null, 2)
              ])
            ], 2)) : Z("", !0),
            E.value ? (O(), A("div", aa, p[5] || (p[5] = [
              W("div", { class: "bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm" }, [
                W("div", { class: "animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" })
              ], -1)
            ]))) : Z("", !0),
            b.value === "image" && l.value || b.value === "video" && n.value ? (O(), A("div", na, [
              W("i", {
                class: K(b.value === "video" ? "fas fa-video text-2xl mb-2 opacity-50" : "fas fa-image text-2xl mb-2 opacity-50")
              }, null, 2),
              W("span", null, "Failed to load " + ce(b.value), 1)
            ])) : Z("", !0)
          ])),
          !P.value && (u.value || h.value || E.value) ? (O(), A("div", {
            key: 2,
            class: "absolute top-2 left-2 w-7 h-7 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            title: b.value === "video" ? "Video" : "Image"
          }, [
            W("i", {
              class: K(b.value === "video" ? "fas fa-video text-xs" : "fas fa-image text-xs")
            }, null, 2)
          ], 8, la)) : Z("", !0),
          p[7] || (p[7] = W("div", { class: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" }, null, -1)),
          o.remove ? (O(), A("button", {
            key: 3,
            class: "absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-slate-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500 hover:text-white cursor-pointer z-10",
            onClick: p[3] || (p[3] = dt((g) => o.remove(o.item), ["stop"])),
            "aria-label": "Remove item"
          }, p[6] || (p[6] = [
            W("i", { class: "fas fa-times text-sm" }, null, -1)
          ]))) : Z("", !0),
          W("div", oa, [
            W("p", ra, "Item #" + ce(String(o.item.id).split("-")[0]), 1)
          ])
        ])
      ])
    ], 512));
  }
}), ia = { class: "w-full h-full flex items-center justify-center p-4" }, sa = { class: "w-full h-full max-w-full max-h-full" }, ua = {
  key: 0,
  class: "fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10 pointer-events-none"
}, ca = { class: "fixed top-20 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full z-20 pointer-events-none" }, fa = /* @__PURE__ */ Je({
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
  setup(t, { expose: s, emit: u }) {
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
    }), n = k(null), c = k(typeof window < "u" ? window.innerWidth : 1024);
    let w = null;
    function E(e) {
      return {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536
      }[e] || 768;
    }
    const d = J(() => {
      if (l.layoutMode === "masonry") return !1;
      if (l.layoutMode === "swipe") return !0;
      const e = typeof l.mobileBreakpoint == "string" ? E(l.mobileBreakpoint) : l.mobileBreakpoint;
      return c.value < e;
    }), H = J(() => {
      if (!d.value || r.value.length === 0) return null;
      const e = Math.max(0, Math.min(v.value, r.value.length - 1));
      return r.value[e] || null;
    }), N = J(() => {
      if (!d.value || !H.value) return null;
      const e = v.value + 1;
      return e >= r.value.length ? null : r.value[e] || null;
    }), b = J(() => {
      if (!d.value || !H.value) return null;
      const e = v.value - 1;
      return e < 0 ? null : r.value[e] || null;
    }), P = u, r = J({
      get: () => l.items,
      set: (e) => P("update:items", e)
    }), $ = k(7), f = k(null), o = k([]), p = k(null), g = k(!1), T = k(0), v = k(0), L = k(0), y = k(!1), D = k(0), S = k(0), z = k(null), oe = k(/* @__PURE__ */ new Set());
    function re(e) {
      return typeof e == "number" && Number.isFinite(e) && e > 0;
    }
    function ae(e, a) {
      try {
        if (!Array.isArray(e) || e.length === 0) return;
        const i = e.filter((x) => !re(x == null ? void 0 : x.width) || !re(x == null ? void 0 : x.height));
        if (i.length === 0) return;
        const m = [];
        for (const x of i) {
          const j = (x == null ? void 0 : x.id) ?? `idx:${e.indexOf(x)}`;
          oe.value.has(j) || (oe.value.add(j), m.push(j));
        }
        if (m.length > 0) {
          const x = m.slice(0, 10);
          console.warn(
            "[Masonry] Items missing width/height detected:",
            {
              context: a,
              count: m.length,
              sampleIds: x,
              hint: "Ensure each item has positive width and height. Consider providing fallbacks (e.g., 512x512) at the data layer."
            }
          );
        }
      } catch {
      }
    }
    const V = k(0), U = k(0), ne = l.virtualBufferPx, Q = k(!1), ee = k({
      distanceToTrigger: 0,
      isNearTrigger: !1
    }), M = (e) => {
      if (!f.value) return;
      const { scrollTop: a, clientHeight: i } = f.value, m = a + i, x = e ?? Ne(r.value, $.value), j = x.length ? Math.max(...x) : 0, Y = typeof l.loadThresholdPx == "number" ? l.loadThresholdPx : 200, ue = Y >= 0 ? Math.max(0, j - Y) : Math.max(0, j + Y), qe = Math.max(0, ue - m), vt = qe <= 100;
      ee.value = {
        distanceToTrigger: Math.round(qe),
        isNearTrigger: vt
      };
    }, { onEnter: B, onBeforeEnter: _, onBeforeLeave: te, onLeave: C } = Gt(r, { leaveDurationMs: l.leaveDurationMs });
    function ie(e, a) {
      if (Q.value) {
        const i = parseInt(e.dataset.left || "0", 10), m = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${i}px, ${m}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay"), requestAnimationFrame(() => {
          e.style.transition = "", a();
        });
      } else
        B(e, a);
    }
    function q(e) {
      if (Q.value) {
        const a = parseInt(e.dataset.left || "0", 10), i = parseInt(e.dataset.top || "0", 10);
        e.style.transition = "none", e.style.opacity = "1", e.style.transform = `translate3d(${a}px, ${i}px, 0) scale(1)`, e.style.removeProperty("--masonry-opacity-delay");
      } else
        _(e);
    }
    function tt(e) {
      Q.value || te(e);
    }
    function at(e, a) {
      Q.value ? a() : C(e, a);
    }
    const nt = J(() => {
      const e = V.value - ne, a = V.value + U.value + ne, i = r.value;
      return !i || i.length === 0 ? [] : i.filter((m) => {
        const x = m.top;
        return m.top + m.columnHeight >= e && x <= a;
      });
    }), { handleScroll: lt } = Xt({
      container: f,
      masonry: r,
      columns: $,
      containerHeight: T,
      isLoading: g,
      pageSize: l.pageSize,
      refreshLayout: G,
      setItemsRaw: (e) => {
        r.value = e;
      },
      loadNext: se,
      loadThresholdPx: l.loadThresholdPx
    });
    s({
      isLoading: g,
      refreshLayout: G,
      containerHeight: T,
      remove: fe,
      removeMany: it,
      removeAll: st,
      loadNext: se,
      loadPage: we,
      refreshCurrentPage: be,
      reset: ct,
      init: ft,
      paginationHistory: o,
      cancelLoad: Ae,
      scrollToTop: De,
      totalItems: J(() => r.value.length)
    });
    function ot(e) {
      const a = Yt(e);
      let i = 0;
      if (f.value) {
        const { scrollTop: m, clientHeight: x } = f.value;
        i = m + x + 100;
      }
      T.value = Math.max(a, i);
    }
    function G(e) {
      if (d.value) {
        r.value = e;
        return;
      }
      if (!f.value) return;
      ae(e, "refreshLayout");
      const a = e.map((m, x) => ({
        ...m,
        originalIndex: m.originalIndex ?? x
      })), i = wt(a, f.value, $.value, h.value);
      ot(i), r.value = i;
    }
    function We(e, a) {
      return new Promise((i) => {
        const m = Math.max(0, e | 0), x = Date.now();
        a(m, m);
        const j = setInterval(() => {
          if (F.value) {
            clearInterval(j), i();
            return;
          }
          const Y = Date.now() - x, ue = Math.max(0, m - Y);
          a(ue, m), ue <= 0 && (clearInterval(j), i());
        }, 100);
      });
    }
    async function pe(e) {
      try {
        const a = await rt(() => l.getNextPage(e));
        return G([...r.value, ...a.items]), a;
      } catch (a) {
        throw console.error("Error in getContent:", a), a;
      }
    }
    async function rt(e) {
      let a = 0;
      const i = l.retryMaxAttempts;
      let m = l.retryInitialDelayMs;
      for (; ; )
        try {
          const x = await e();
          return a > 0 && P("retry:stop", { attempt: a, success: !0 }), x;
        } catch (x) {
          if (a++, a > i)
            throw P("retry:stop", { attempt: a - 1, success: !1 }), x;
          P("retry:start", { attempt: a, max: i, totalMs: m }), await We(m, (j, Y) => {
            P("retry:tick", { attempt: a, remainingMs: j, totalMs: Y });
          }), m += l.retryBackoffStepMs;
        }
    }
    async function we(e) {
      if (!g.value) {
        F.value = !1, g.value = !0;
        try {
          const a = r.value.length;
          if (F.value) return;
          const i = await pe(e);
          return F.value ? void 0 : (p.value = e, o.value.push(i.nextPage), await ve(a), i);
        } catch (a) {
          throw console.error("Error loading page:", a), a;
        } finally {
          g.value = !1;
        }
      }
    }
    async function se() {
      if (!g.value) {
        F.value = !1, g.value = !0;
        try {
          const e = r.value.length;
          if (F.value) return;
          const a = o.value[o.value.length - 1], i = await pe(a);
          return F.value ? void 0 : (p.value = a, o.value.push(i.nextPage), await ve(e), i);
        } catch (e) {
          throw console.error("Error loading next page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function be() {
      if (console.log("[Masonry] refreshCurrentPage called, isLoading:", g.value, "currentPage:", p.value), !g.value) {
        F.value = !1, g.value = !0;
        try {
          const e = p.value;
          if (console.log("[Masonry] pageToRefresh:", e), e == null) {
            console.warn("[Masonry] No current page to refresh - currentPage:", p.value, "paginationHistory:", o.value);
            return;
          }
          r.value = [], T.value = 0, o.value = [e], await R();
          const a = await pe(e);
          if (F.value) return;
          p.value = e, o.value.push(a.nextPage);
          const i = r.value.length;
          return await ve(i), a;
        } catch (e) {
          throw console.error("[Masonry] Error refreshing current page:", e), e;
        } finally {
          g.value = !1;
        }
      }
    }
    async function fe(e) {
      const a = r.value.filter((i) => i.id !== e.id);
      if (r.value = a, await R(), console.log("[Masonry] remove - next.length:", a.length, "paginationHistory.length:", o.value.length), a.length === 0 && o.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          console.log("[Masonry] All items removed, calling refreshCurrentPage"), await be();
        else {
          console.log("[Masonry] All items removed, calling loadNext and forcing backfill");
          try {
            await se(), await ve(0, !0);
          } catch {
          }
        }
        return;
      }
      await new Promise((i) => requestAnimationFrame(() => i())), requestAnimationFrame(() => {
        G(a);
      });
    }
    async function it(e) {
      if (!e || e.length === 0) return;
      const a = new Set(e.map((m) => m.id)), i = r.value.filter((m) => !a.has(m.id));
      if (r.value = i, await R(), i.length === 0 && o.value.length > 0) {
        if (l.autoRefreshOnEmpty)
          await be();
        else
          try {
            await se(), await ve(0, !0);
          } catch {
          }
        return;
      }
      await new Promise((m) => requestAnimationFrame(() => m())), requestAnimationFrame(() => {
        G(i);
      });
    }
    function De(e) {
      f.value && f.value.scrollTo({
        top: 0,
        behavior: (e == null ? void 0 : e.behavior) ?? "smooth",
        ...e
      });
    }
    async function st() {
      De({ behavior: "smooth" }), r.value = [], T.value = 0, await R(), P("remove-all:complete");
    }
    function ut() {
      $.value = me(h.value), G(r.value), f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight);
    }
    let he = !1;
    const F = k(!1);
    async function ve(e, a = !1) {
      if (!a && !l.backfillEnabled || he || F.value) return;
      const i = (e || 0) + (l.pageSize || 0);
      if (!(!l.pageSize || l.pageSize <= 0 || o.value[o.value.length - 1] == null) && !(r.value.length >= i)) {
        he = !0;
        try {
          let x = 0;
          for (P("backfill:start", { target: i, fetched: r.value.length, calls: x }); r.value.length < i && x < l.backfillMaxCalls && o.value[o.value.length - 1] != null && !F.value && (await We(l.backfillDelayMs, (Y, ue) => {
            P("backfill:tick", {
              fetched: r.value.length,
              target: i,
              calls: x,
              remainingMs: Y,
              totalMs: ue
            });
          }), !F.value); ) {
            const j = o.value[o.value.length - 1];
            try {
              g.value = !0;
              const Y = await pe(j);
              if (F.value) break;
              o.value.push(Y.nextPage);
            } finally {
              g.value = !1;
            }
            x++;
          }
          P("backfill:stop", { fetched: r.value.length, calls: x });
        } finally {
          he = !1;
        }
      }
    }
    function Ae() {
      F.value = !0, g.value = !1, he = !1;
    }
    function ct() {
      Ae(), F.value = !1, f.value && f.value.scrollTo({
        top: 0,
        behavior: "smooth"
      }), r.value = [], T.value = 0, p.value = l.loadAtPage, o.value = [l.loadAtPage], ee.value = {
        distanceToTrigger: 0,
        isNearTrigger: !1
      };
    }
    const xe = Ge(async () => {
      if (d.value) return;
      f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight), Q.value = !0, await R(), await new Promise((a) => requestAnimationFrame(() => a())), Q.value = !1;
      const e = Ne(r.value, $.value);
      lt(e), M(e);
    }, 200), Oe = Ge(ut, 200);
    function ze(e) {
      d.value && (y.value = !0, D.value = e.touches[0].clientY, S.value = L.value, e.preventDefault());
    }
    function Be(e) {
      if (!d.value || !y.value) return;
      const a = e.touches[0].clientY - D.value;
      L.value = S.value + a, e.preventDefault();
    }
    function Fe(e) {
      if (!d.value || !y.value) return;
      y.value = !1;
      const a = L.value - S.value;
      Math.abs(a) > 100 ? a > 0 && b.value ? _e() : a < 0 && N.value ? Re() : X() : X(), e.preventDefault();
    }
    function je(e) {
      d.value && (y.value = !0, D.value = e.clientY, S.value = L.value, e.preventDefault());
    }
    function Me(e) {
      if (!d.value || !y.value) return;
      const a = e.clientY - D.value;
      L.value = S.value + a, e.preventDefault();
    }
    function Te(e) {
      if (!d.value || !y.value) return;
      y.value = !1;
      const a = L.value - S.value;
      Math.abs(a) > 100 ? a > 0 && b.value ? _e() : a < 0 && N.value ? Re() : X() : X(), e.preventDefault();
    }
    function Re() {
      if (!N.value) {
        se();
        return;
      }
      v.value++, X(), v.value >= r.value.length - 5 && se();
    }
    function _e() {
      b.value && (v.value--, X());
    }
    function X() {
      if (!z.value) return;
      const e = z.value.clientHeight;
      L.value = -v.value * e;
    }
    function Ce() {
      n.value ? c.value = n.value.clientWidth : typeof window < "u" && (c.value = window.innerWidth), !d.value && v.value > 0 && (v.value = 0, L.value = 0), d.value && r.value.length === 0 && !g.value && we(o.value[0]), d.value && X();
    }
    function ft(e, a, i) {
      p.value = a, o.value = [a], o.value.push(i), ae(e, "init"), d.value ? (r.value = [...r.value, ...e], v.value === 0 && r.value.length > 0 && (L.value = 0)) : (G([...r.value, ...e]), M());
    }
    return le(
      h,
      () => {
        d.value || f.value && ($.value = me(h.value, c.value), G(r.value));
      },
      { deep: !0 }
    ), le(d, (e) => {
      R(() => {
        e ? (document.addEventListener("mousemove", Me), document.addEventListener("mouseup", Te), v.value = 0, L.value = 0, r.value.length > 0 && X()) : (document.removeEventListener("mousemove", Me), document.removeEventListener("mouseup", Te), f.value && n.value && (c.value = n.value.clientWidth, f.value.removeEventListener("scroll", xe), f.value.addEventListener("scroll", xe, { passive: !0 }), r.value.length > 0 && ($.value = me(h.value, c.value), G(r.value), V.value = f.value.scrollTop, U.value = f.value.clientHeight, M())));
      });
    }, { immediate: !0 }), le(z, (e) => {
      e && (e.addEventListener("touchstart", ze, { passive: !1 }), e.addEventListener("touchmove", Be, { passive: !1 }), e.addEventListener("touchend", Fe), e.addEventListener("mousedown", je));
    }), le(() => r.value.length, (e, a) => {
      d.value && e > 0 && a === 0 && (v.value = 0, R(() => X()));
    }), le(n, (e) => {
      w && (w.disconnect(), w = null), e && typeof ResizeObserver < "u" ? (w = new ResizeObserver((a) => {
        for (const i of a) {
          const m = i.contentRect.width;
          c.value !== m && (c.value = m);
        }
      }), w.observe(e), c.value = e.clientWidth) : e && (c.value = e.clientWidth);
    }, { immediate: !0 }), le(c, (e, a) => {
      e !== a && e > 0 && !d.value && f.value && r.value.length > 0 && R(() => {
        $.value = me(h.value, e), G(r.value), M();
      });
    }), Ke(async () => {
      try {
        await R(), n.value ? c.value = n.value.clientWidth : typeof window < "u" && (c.value = window.innerWidth), d.value || ($.value = me(h.value, c.value), f.value && (V.value = f.value.scrollTop, U.value = f.value.clientHeight));
        const e = l.loadAtPage;
        o.value = [e], l.skipInitialLoad || await we(o.value[0]), d.value ? R(() => X()) : M();
      } catch (e) {
        console.error("Error during component initialization:", e), g.value = !1;
      }
      window.addEventListener("resize", Oe), window.addEventListener("resize", Ce);
    }), Qe(() => {
      var e;
      w && (w.disconnect(), w = null), (e = f.value) == null || e.removeEventListener("scroll", xe), window.removeEventListener("resize", Oe), window.removeEventListener("resize", Ce), z.value && (z.value.removeEventListener("touchstart", ze), z.value.removeEventListener("touchmove", Be), z.value.removeEventListener("touchend", Fe), z.value.removeEventListener("mousedown", je)), document.removeEventListener("mousemove", Me), document.removeEventListener("mouseup", Te);
    }), (e, a) => (O(), A("div", {
      ref_key: "wrapper",
      ref: n,
      class: "w-full h-full flex flex-col relative"
    }, [
      d.value ? (O(), A("div", {
        key: 0,
        class: K(["overflow-hidden w-full flex-1 swipe-container touch-none select-none", { "force-motion": l.forceMotion, "cursor-grab": !y.value, "cursor-grabbing": y.value }]),
        ref_key: "swipeContainer",
        ref: z,
        style: { height: "100%", "max-height": "100%", position: "relative" }
      }, [
        W("div", {
          class: "relative w-full",
          style: ke({
            transform: `translateY(${L.value}px)`,
            transition: y.value ? "none" : `transform ${t.transitionDurationMs}ms ${t.transitionEasing}`,
            height: `${r.value.length * 100}%`
          })
        }, [
          (O(!0), A(Ie, null, Ee(r.value, (i, m) => (O(), A("div", {
            key: `${i.page}-${i.id}`,
            class: "absolute top-0 left-0 w-full",
            style: ke({
              top: `${m * (100 / r.value.length)}%`,
              height: `${100 / r.value.length}%`
            })
          }, [
            W("div", ia, [
              W("div", sa, [
                $e(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  Le(ye, {
                    item: i,
                    remove: fe
                  }, null, 8, ["item"])
                ], !0)
              ])
            ])
          ], 4))), 128))
        ], 4),
        r.value.length > 1 ? (O(), A("div", ua, [
          (O(!0), A(Ie, null, Ee(r.value.slice(0, Math.min(10, r.value.length)), (i, m) => (O(), A("div", {
            key: `dot-${i.id}`,
            class: K(["w-1.5 h-1.5 rounded-full transition-all duration-300", m === v.value ? "bg-white w-4" : "bg-white/40"])
          }, null, 2))), 128))
        ])) : Z("", !0),
        W("div", ca, ce(v.value + 1) + " / " + ce(r.value.length), 1)
      ], 2)) : (O(), A("div", {
        key: 1,
        class: K(["overflow-auto w-full flex-1 masonry-container", { "force-motion": l.forceMotion }]),
        ref_key: "container",
        ref: f
      }, [
        W("div", {
          class: "relative",
          style: ke({ height: `${T.value}px`, "--masonry-duration": `${t.transitionDurationMs}ms`, "--masonry-leave-duration": `${t.leaveDurationMs}ms`, "--masonry-ease": t.transitionEasing })
        }, [
          Le(mt, {
            name: "masonry",
            css: !1,
            onEnter: ie,
            onBeforeEnter: q,
            onLeave: at,
            onBeforeLeave: tt
          }, {
            default: pt(() => [
              (O(!0), A(Ie, null, Ee(nt.value, (i, m) => (O(), A("div", ht({
                key: `${i.page}-${i.id}`,
                class: "absolute masonry-item",
                ref_for: !0
              }, gt(Ut)(i, m), {
                style: { paddingTop: `${h.value.header}px`, paddingBottom: `${h.value.footer}px` }
              }), [
                $e(e.$slots, "default", {
                  item: i,
                  remove: fe
                }, () => [
                  Le(ye, {
                    item: i,
                    remove: fe
                  }, null, 8, ["item"])
                ], !0)
              ], 16))), 128))
            ]),
            _: 3
          }),
          T.value > 0 ? (O(), A("div", {
            key: 0,
            class: K(["fixed bottom-4 right-4 bg-gray-800 text-white text-xs rounded-full px-3 py-1.5 shadow-lg z-10 transition-opacity duration-300", { "opacity-50 hover:opacity-100": !ee.value.isNearTrigger, "opacity-100": ee.value.isNearTrigger }])
          }, [
            W("span", null, ce(r.value.length) + " items", 1),
            a[0] || (a[0] = W("span", { class: "mx-2" }, "|", -1)),
            W("span", null, ce(ee.value.distanceToTrigger) + "px to load", 1)
          ], 2)) : Z("", !0)
        ], 4)
      ], 2))
    ], 512));
  }
}), va = (t, s) => {
  const u = t.__vccOpts || t;
  for (const [l, I] of s)
    u[l] = I;
  return u;
}, Xe = /* @__PURE__ */ va(fa, [["__scopeId", "data-v-919154a5"]]), ma = {
  install(t) {
    t.component("WyxosMasonry", Xe), t.component("WMasonry", Xe), t.component("WyxosMasonryItem", ye), t.component("WMasonryItem", ye);
  }
};
export {
  Xe as Masonry,
  ye as MasonryItem,
  ma as default
};
