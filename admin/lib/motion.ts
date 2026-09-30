"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { brand } from "@/brand.config";

export const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const motionOff = () => !brand.motion.enabled || prefersReduced();

/** Count-up any element carrying data-count (+ optional prefix/suffix). */
export function runCounters(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count!);
    const pre = el.dataset.prefix ?? "";
    const suf = el.dataset.suffix ?? "";
    const dec = el.dataset.count!.includes(".") ? 1 : 0;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: motionOff() ? 0 : 1.8, ease: "expo.out", delay: 0.25,
      onUpdate() {
        el.textContent = pre + (dec ? o.v.toFixed(1) : Math.round(o.v).toLocaleString("en-IN")) + suf;
      },
    });
  });
}

/** Draw chart paths, grow bars, sweep donuts, fill funnels and progress bars. */
export function drawCharts(scope: ParentNode = document) {
  const off = motionOff();

  scope.querySelectorAll<HTMLElement>(".bar").forEach((b, i) => {
    gsap.fromTo(b, { height: "0%" },
      { height: `${parseFloat(b.dataset.h!) * 100}%`, duration: off ? 0 : 1.1, delay: 0.2 + i * 0.09, ease: "expo.out" });
    const pct = b.querySelector(".bar-pct");
    if (pct) gsap.fromTo(pct, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, delay: 0.6 + i * 0.09 });
  });

  scope.querySelectorAll<SVGCircleElement>(".donut-seg").forEach((seg) => {
    const len = parseFloat(seg.getAttribute("stroke-dasharray")!);
    gsap.to(seg, { strokeDashoffset: len * (1 - parseFloat(seg.dataset.fill!)), duration: off ? 0 : 1.7, ease: "expo.inOut", delay: 0.3 });
  });

  scope.querySelectorAll<SVGPathElement>(".draw-line").forEach((p) => {
    const L = p.getTotalLength();
    p.style.strokeDasharray = `${L}`;
    p.style.strokeDashoffset = `${L}`;
    gsap.to(p, { strokeDashoffset: 0, duration: off ? 0 : 2, ease: "power2.inOut", delay: 0.35 });
  });

  scope.querySelectorAll(".fill-reveal").forEach((f) =>
    gsap.fromTo(f, { opacity: 0 }, { opacity: 1, duration: off ? 0 : 1.3, delay: 1.2 }));

  scope.querySelectorAll<HTMLElement>(".grid-line").forEach((l, i) =>
    gsap.to(l, { opacity: 1, duration: 0.5, delay: 0.15 + i * 0.07 }));

  scope.querySelectorAll<HTMLElement>(".heat i").forEach((c, i) =>
    gsap.fromTo(c, { opacity: 0, scale: 0.3 },
      { opacity: parseFloat(c.dataset.o!), scale: 1, duration: 0.55, delay: 0.25 + i * 0.009, ease: "back.out(2.2)" }));

  scope.querySelectorAll<HTMLElement>(".fn-fill").forEach((f, i) =>
    gsap.fromTo(f, { width: 0 }, { width: `${f.dataset.w}%`, duration: off ? 0 : 1.1, ease: "expo.out", delay: 0.3 + i * 0.09 }));

  scope.querySelectorAll<HTMLElement>(".prog i, .bar-thin i, .band-bar i").forEach((p) =>
    gsap.fromTo(p, { width: 0 }, { width: `${p.dataset.w}%`, duration: off ? 0 : 1.3, ease: "expo.out", delay: 0.4 }));
}

/** A glowing dot that rides the primary series, plus bar hover tooltips. */
export function chartExtras(scope: ParentNode = document) {
  if (motionOff()) return;

  scope.querySelectorAll<HTMLElement>(".chart-wrap").forEach((wrap) => {
    const path = wrap.querySelector<SVGPathElement>(".draw-line");
    const dot = wrap.querySelector<SVGCircleElement>(".pulse-dot");
    if (!path || !dot) return;
    const L = path.getTotalLength();
    gsap.to(dot, { opacity: 1, duration: 0.4, delay: 2.2 });
    gsap.to({ t: 0 }, {
      t: 1, duration: 5, repeat: -1, ease: "none", delay: 2.2,
      onUpdate() {
        const p = path.getPointAtLength((this.targets()[0] as { t: number }).t * L);
        dot.setAttribute("cx", `${p.x}`);
        dot.setAttribute("cy", `${p.y}`);
      },
    });
  });

  scope.querySelectorAll<HTMLElement>(".bars").forEach((bars) => {
    const host = bars.parentElement!;
    host.style.position = "relative";
    let tip = host.querySelector<HTMLElement>(".bar-tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "bar-tip"; host.appendChild(tip); }
    bars.querySelectorAll<HTMLElement>(".bar-col").forEach((col) => {
      col.addEventListener("mouseenter", () => {
        const bar = col.querySelector<HTMLElement>(".bar")!;
        tip!.innerHTML = `${col.querySelector(".bar-lbl")?.textContent ?? ""} · <b>${col.querySelector(".bar-pct")?.textContent ?? ""}</b>`;
        const r = col.getBoundingClientRect(), pr = host.getBoundingClientRect();
        tip!.style.left = `${r.left - pr.left + r.width / 2}px`;
        tip!.style.top = `${bar.getBoundingClientRect().top - pr.top}px`;
        gsap.to(tip!, { opacity: 1, duration: 0.2 });
        gsap.to(bar, { scaleX: 1.06, duration: 0.3, transformOrigin: "center bottom" });
      });
      col.addEventListener("mouseleave", () => {
        gsap.to(tip!, { opacity: 0, duration: 0.25 });
        gsap.to(col.querySelector(".bar"), { scaleX: 1, duration: 0.35 });
      });
    });
  });

  scope.querySelectorAll(".ring-live").forEach((r) =>
    gsap.to(r, { rotate: 360, duration: 26, repeat: -1, ease: "none", transformOrigin: "center" }));
}

/** Staggered entrance for `.gs` cards + the page title word reveal.
 *  Uses fromTo (never bare `from`) so a double-invoked effect in React
 *  StrictMode can't capture opacity:0 as the end state. */
export function revealPage() {
  if (motionOff()) {
    document.querySelectorAll<HTMLElement>(".gs").forEach((el) => { el.style.opacity = "1"; });
    return;
  }
  const title = document.querySelector<HTMLElement>(".page-title");
  if (title && !title.dataset.split) {
    title.dataset.split = "1";
    title.innerHTML = title.innerHTML
      .split(/(<em>.*?<\/em>)/g)
      .map((part) =>
        part.startsWith("<em>")
          ? `<span class="line-mask"><span class="w">${part}</span></span>`
          : part.split(" ").filter(Boolean)
              .map((w) => `<span class="line-mask"><span class="w">${w}&nbsp;</span></span>`).join(""))
      .join("");
    gsap.fromTo(title.querySelectorAll(".w"),
      { yPercent: 115, rotate: 3 },
      { yPercent: 0, rotate: 0, duration: 0.9, stagger: 0.05, ease: "power4.out", delay: 0.15, clearProps: "all" });
  }
  gsap.fromTo(".gs",
    { y: 34, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.85, stagger: 0.07, ease: "power3.out", delay: 0.2, clearProps: "all" });
}

/** The dark navy hero: aurora drift, ring parallax, staggered content. */
export function animateBand() {
  const band = document.querySelector<HTMLElement>(".band");
  if (!band || motionOff()) return;
  if (band.dataset.animated === "1") return;
  band.dataset.animated = "1";
  gsap.fromTo(band.querySelectorAll(".band-eyebrow,h2,p,.bm,.band-bar,.band-foot"),
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: "power3.out", delay: 0.3, clearProps: "all" });
  gsap.fromTo(band.querySelectorAll(".glass-tile"),
    { x: 34, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: "power3.out", delay: 0.45, clearProps: "all" });
  gsap.to(band.querySelector(".a1"), { x: -38, y: 26, duration: 11, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(band.querySelector(".a2"), { x: 44, y: -22, duration: 13, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(band.querySelector(".a3"), { x: -26, y: -30, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" });
  gsap.to(band.querySelector(".rings"), { rotate: 360, duration: 70, repeat: -1, ease: "none" });

  if (window.matchMedia("(pointer:fine)").matches) {
    const rings = band.querySelector(".rings");
    const px = gsap.quickTo(rings, "x", { duration: 0.9, ease: "power3" });
    const py = gsap.quickTo(rings, "y", { duration: 0.9, ease: "power3" });
    band.addEventListener("mousemove", (e) => {
      const r = band.getBoundingClientRect();
      px((e.clientX - r.left - r.width / 2) * 0.045);
      py((e.clientY - r.top - r.height / 2) * 0.075);
    });
    band.addEventListener("mouseleave", () => { px(0); py(0); });
  }
}

/** Runs the full entrance sequence for a page.
 *  Everything is scoped to a gsap.context() so React StrictMode's
 *  double-invoke is reverted cleanly instead of stranding elements. */
export function usePageMotion(deps: unknown[] = []) {
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const ctx = gsap.context(() => {
      revealPage();
      animateBand();
      runCounters();
      drawCharts();
      t = setTimeout(() => chartExtras(), 120);
    });
    return () => {
      clearTimeout(t);
      ctx.revert();
      // revert() restores inline styles; make sure nothing is left hidden
      document.querySelectorAll<HTMLElement>(".gs, .glass-tile, .band-eyebrow, .bm")
        .forEach((el) => { el.style.opacity = ""; el.style.transform = ""; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
