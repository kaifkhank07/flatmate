
"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAssets } from "@/data/assets";
import ArrowLink from "../utils/ArrowLink";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function JoinCommunityBanner() {
  const assets = useAssets();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    // Preserve the original JSX, including bold formatting.
    const originalContent = heading.innerHTML;
    let ctx: gsap.Context | undefined;
    let resizeTimer: ReturnType<typeof setTimeout>;

    const setupAnimation = () => {
      ctx?.revert();
      heading.innerHTML = originalContent;

      // Wrap text nodes in individual word spans.
      const walker = document.createTreeWalker(
        heading,
        NodeFilter.SHOW_TEXT
      );

      const textNodes: Text[] = [];

      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
      }

      const words: HTMLElement[] = [];


      textNodes.forEach((node) => {
        const value = node.textContent ?? "";
        if (!value.trim()) return;

        const parent = node.parentElement;
        const computedStyle = parent ? window.getComputedStyle(parent) : null;

        const fragment = document.createDocumentFragment();

        value.split(/(\s+)/).forEach((part) => {
          if (!part || /^\s+$/.test(part)) return;

          const word = document.createElement("span");
          word.className = "line-word";
          word.textContent = part;
          word.style.display = "inline-block";
          word.style.marginRight = "0.25em";

          // Preserve the original text styling, including bold spans.
          if (computedStyle) {
            word.style.fontWeight = computedStyle.fontWeight;
            word.style.fontFamily = computedStyle.fontFamily;
            word.style.fontSize = computedStyle.fontSize;
            word.style.fontStyle = computedStyle.fontStyle;
            word.style.letterSpacing = computedStyle.letterSpacing;
            word.style.color = computedStyle.color;
          }

          fragment.appendChild(word);
          words.push(word);
        });

        node.replaceWith(fragment);
      });

      // Group words by their actual rendered line.
      const linesMap = new Map<number, HTMLElement[]>();

      words.forEach((word) => {
        const top = Math.round(word.getBoundingClientRect().top);

        if (!linesMap.has(top)) {
          linesMap.set(top, []);
        }

        linesMap.get(top)!.push(word);
      });

      const fragment = document.createDocumentFragment();

      linesMap.forEach((lineWords) => {
        const mask = document.createElement("span");
        mask.style.display = "block";
        mask.style.overflow = "hidden";
        mask.style.paddingBottom = "0.08em";

        const inner = document.createElement("span");
        inner.className = "line-reveal-inner";
        inner.style.display = "inline-block";
        inner.style.transform = "translateY(110%)";
        inner.style.opacity = "0";

        lineWords.forEach((word) => inner.appendChild(word));

        mask.appendChild(inner);
        fragment.appendChild(mask);
      });

      heading.replaceChildren(fragment);

      const lines = heading.querySelectorAll(".line-reveal-inner");

      ctx = gsap.context(() => {
        gsap.to(lines, {
          y: "0%",
          opacity: 1,
          duration: 1.2,
          stagger: 0.18,
          ease: "power4.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }, heading);

      ScrollTrigger.refresh();
    };

    // Wait until layout is ready before measuring line positions.
    const frame = requestAnimationFrame(setupAnimation);

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupAnimation, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      ctx?.revert();
      heading.innerHTML = originalContent;
    };
  }, []);

  return (
    <section className="relative flex h-[420px] w-full items-center justify-center overflow-hidden sm:h-[480px] md:h-[520px] lg:h-[580px]">
      <Image
        src={assets.ctabg || "/assets/Images/ctabg.png"}
        alt="Join The Flat & Flatmates Community"
        fill
        className="object-cover object-center"
        priority
      />

      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-4 px-4 text-center sm:space-y-6 sm:px-6">
        <h2
          ref={headingRef}
          className="font-roboto-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight"
        >
          Join The <span className="font-bold">Room & Flatmate</span>{" "}
          Community
        </h2>

        {/*  <h2 className="font-roboto-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-white tracking-tight leading-tight">
          Join The <span className="font-bold">Flat & Flatmates</span> Community
        </h2> */}

        <p className="mx-auto max-w-2xl text-sm font-regular tracking-wide text-white/90 sm:text-base md:text-lg">
          Find Your Space. Find Your People. Belong.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 sm:gap-4 sm:pt-4">
          <ArrowLink
            text="Find a Room"
            href="/listing?category=Flat"
            lineClassName="bg-black"
            className="rounded-full bg-white px-6 py-2.5 text-xs font-medium text-black shadow-md hover:bg-gray-100 sm:px-8 sm:py-3 sm:text-sm"
          />

          <ArrowLink
            text="Find a Flatmate"
            href="/listing?category=Flatmate"
            lineClassName="bg-white"
            className="rounded-full border border-white bg-transparent px-6 py-2.5 text-xs font-medium text-white hover:bg-white/10 sm:px-8 sm:py-3 sm:text-sm"
          />
        </div>
      </div>
    </section>
  );
}
