"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { brand } from "@/brand.config";
import Logo from "@/components/logo";
import { motionOff } from "@/lib/motion";
import { adminLogin } from "@/lib/api";
import "./login.css";

/** Login: preloader counter, masked headline, orbiting scene, curtain exit. */
export default function LoginPage() {
  const router = useRouter();
  const [pre, setPre] = useState(true);
  const [n, setN] = useState(0);

  const [email, setEmail] = useState(``);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (motionOff()) { setPre(false); return; }

    const ctx = gsap.context(() => {
      const o = { v: 0 };
      gsap.timeline()
        .to(o, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => setN(Math.round(o.v)) })
        .to(".pre", { yPercent: -100, duration: 0.7, ease: "power4.inOut", onComplete: () => setPre(false) }, "+=.1")
        .fromTo(".l-inner > *", { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out", clearProps: "all" }, "-=.4")
        .fromTo(".l-right", { clipPath: "inset(0 0 0 100%)" },
          { clipPath: "inset(0 0 0 0%)", duration: 1.1, ease: "power4.inOut", clearProps: "clipPath" }, "-=1")
        .fromTo(".l-stats > *", { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", clearProps: "all" }, "-=.6");

      gsap.to(".o1", { rotate: 360, duration: 26, repeat: -1, ease: "none" });
      gsap.to(".o2", { rotate: -360, duration: 19, repeat: -1, ease: "none" });
      gsap.to(".gb1", { x: -46, y: 36, duration: 8, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".gb2", { x: 34, y: -28, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });

    const safety = setTimeout(() => {
      setPre(false);
      document.querySelectorAll<HTMLElement>(".l-inner > *, .l-stats > *")
        .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
    }, 4000);

    return () => { clearTimeout(safety); ctx.revert(); };
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (!res.success || !res.data) {
        setErrorMsg(res.message || "Invalid admin credentials");
        setLoading(false);
        return;
      }

      // Check admin role and navigate to appropriate panel
      const role = res.data.admin.role;
      const targetPath = role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard";

      if (motionOff()) {
        router.push(targetPath);
        return;
      }

      const w = document.querySelector(".wipe-login")!;
      gsap.timeline({ onComplete: () => router.push(targetPath) })
        .fromTo(w.querySelector(".p1"), { yPercent: 101 }, { yPercent: 0, duration: 0.5, ease: "power4.inOut" })
        .fromTo(w.querySelector(".p2"), { yPercent: 101 }, { yPercent: 0, duration: 0.5, ease: "power4.inOut" }, "-=.42");
    } catch {
      setErrorMsg("Failed to connect to backend server");
      setLoading(false);
    }
  };

  return (
    <>
      {pre && <div className="pre"><div className="pre-num">{String(n).padStart(2, "0")}</div>
        <div className="pre-lbl">FLATMATE ADMIN — LOADING WORKSPACE</div></div>}
      <div className="wipe wipe-login"><div className="panel p1" /><div className="panel p2" /></div>

      <div className="login">
        <div className="l-left">
          {/* <div className="brand"><Logo variant="light" height={brand.logo.height.login} /></div> */}
          <div className="l-inner">
            <h1 className="l-title">Flatmate Marketplace<br /><em>Admin Control</em></h1>
            <p className="l-sub">Manage users, admin staff, verifications, and marketplace operations.</p>

            {errorMsg && (
              <div style={{ color: "var(--rose-ink)", background: "var(--rose)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={signIn}>
              <div className="fld">
                <label>Admin Email</label>
                <input
                  className="inp"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="fld" style={{ marginTop: 14 }}>
                <label>Password</label>
                <input
                  className="inp"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-brand login-btn"
                style={{ marginTop: 20 }}
                disabled={loading}
              >
                {loading ? "Authenticating…" : "Sign in to Dashboard"}
              </button>
            </form>
            <p className="l-foot">Protected Admin Portal · Flatmate Marketplace</p>
          </div>
        </div>
        <div className="l-right">
          <div className="g-blob gb1" /><div className="g-blob gb2" />
          <div className="orbit o1"><div className="sat" /></div>
          <div className="orbit o2"><div className="sat alt" /></div>
          <div className="l-stats">
            <div className="l-stat"><div className="f-num">100%</div><span>Secure Auth</span></div>
            <div className="l-stat"><div className="f-num">24/7</div><span>Live Stats</span></div>
            <div className="l-stat"><div className="f-num">V1.0</div><span>API Backend</span></div>
          </div>
          <div className="l-quote">
            <h2>Complete Control Over <em>Marketplace Operations.</em></h2>
            <p>Admin and Super Admin portal for user management, verifications, staff roles, and analytics.</p>
          </div>
        </div>
      </div>
    </>
  );
}
