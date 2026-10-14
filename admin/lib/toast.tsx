"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

/** Tiny global toast. `const toast = useToast(); toast("Saved")` */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const push = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div id="toast" style={msg ? { opacity: 1, zIndex:1000, transform: "translateX(-50%) translateY(0)" } : undefined}>
        {msg}
      </div>
    </Ctx.Provider>
  );
}
