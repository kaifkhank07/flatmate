"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAssets } from "@/data/assets";
import Login from "./Login";
import SignUp from "./SignUp";
import LineRoll from "../utils/LineRoll";
import { useAuthStore } from "@/store/useAuthStore";

interface AuthenticationProps {
  initialMode?: "login" | "signup";
}

export default function Authentication({ initialMode = "login" }: AuthenticationProps) {
  const assets = useAssets();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  return (
    <section className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden border">
      {/* Left Form Section */}
      <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-[550px] lg:min-h-[660px]">
        {/* Top Header with Logo */}
        <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={assets.logo}
              alt="Flatmate Logo"
              width={180}
              height={56}
              className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Dynamic Form Content */}
        {mode === "login" ? (
          <Login onSwitchToSignUp={() => setMode("signup")} />
        ) : (
          <SignUp onSwitchToLogin={() => setMode("login")} />
        )}

        {/* Bottom Footer Link */}
        <div className="pt-4 text-sm sm:text-base md:text-lg text-gray-400 font-medium">
          Having Trouble?{" "}
          <button
            type="button"
            className="text-gray-700 font-medium cursor-pointer bg-transparent border-none p-0 inline"
          >
            <LineRoll text="Give Feedback" className="mb-0.5" lineClassName="bg-gray-700" />
          </button>
        </div>
      </div>

      {/* Right Banner Image */}
      <div className="lg:col-span-6 relative hidden lg:block h-full min-h-[500px] lg:min-h-[660px] p-0">
        <div className="relative w-full h-full overflow-hidden rounded-tl-[70px] xl:rounded-tl-[90px] rounded-bl-[70px] xl:rounded-bl-[90px]">
          <Image
            src={assets.login}
            alt="Flat & Flatmate"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}