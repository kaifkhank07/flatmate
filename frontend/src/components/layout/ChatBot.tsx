"use client";

import { useEffect } from "react";

const SCRIPT_ID = "messenger-widget-b";
const HIDE_STYLE_ID = "botpenguin-hidden-style";

export default function ChatBot() {
  const botKey = process.env.NEXT_PUBLIC_BOTPENGUIN_KEY;

  useEffect(() => {
    if (!botKey) return;

    // Remove hidden style if previously applied when navigating away from public pages
    const existingHideStyle = document.getElementById(HIDE_STYLE_ID);
    if (existingHideStyle) {
      existingHideStyle.remove();
    }

    // Check if BotPenguin script already exists, if not create and inject it
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://cdn.botpenguin.com/website-bot.js";
      script.defer = true;
      script.textContent = botKey;
      document.body.appendChild(script);
    }

    // Ensure elements are visible if already created
    const launcher = document.getElementById("botpenguin-launcher-12");
    const root = document.querySelector("botpenguin-root") as HTMLElement | null;
    if (launcher) launcher.style.removeProperty("display");
    if (root) root.style.removeProperty("display");

    return () => {
      // When leaving public pages, hide the BotPenguin widget
      const currentLauncher = document.getElementById("botpenguin-launcher-12");
      const currentMessenger = document.getElementById("BotPenguin-messenger");
      const currentRoot = document.querySelector("botpenguin-root") as HTMLElement | null;

      if (currentLauncher) currentLauncher.style.setProperty("display", "none", "important");
      if (currentMessenger) currentMessenger.style.setProperty("display", "none", "important");
      if (currentRoot) currentRoot.style.setProperty("display", "none", "important");

      // Inject style to guarantee any asynchronously loaded BotPenguin elements remain hidden on non-public pages
      if (!document.getElementById(HIDE_STYLE_ID)) {
        const style = document.createElement("style");
        style.id = HIDE_STYLE_ID;
        style.textContent = `
          #botpenguin-launcher-12,
          #BotPenguin-messenger,
          botpenguin-root {
            display: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    };
  }, [botKey]);

  if (!botKey) return null;

  return (
    <style>{`
      @media (max-width: 1023px) {
        #botpenguin-launcher-12 {
          bottom: 80px !important;
        }
      }
    `}</style>
  );
}
