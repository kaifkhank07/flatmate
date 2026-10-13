"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useAuthStore } from "@/store/useAuthStore";
import { CircleEllipsis, CircleUser, HousePlus, LucideIcon, MessageCircle, Search } from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("search");
  const navbarRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const navbar = navbarRef.current;
      if (!navbar) return;

      // Always show near top of page
      if (currentScrollY <= 20) {
        gsap.to(navbar, {
          y: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scroll Down -> Hide MobileNavbar smoothly
      if (currentScrollY > lastScrollY.current + 5) {
        gsap.to(navbar, {
          y: 100,
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
      // Scroll Up -> Show MobileNavbar smoothly
      else if (currentScrollY < lastScrollY.current - 5) {
        gsap.to(navbar, {
          y: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  const navItems: {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
  }[] = [
      {
        id: "search",
        label: "Search",
        href: "/",
        icon: Search,
      },
      {
        id: "add-listing",
        label: "Add Listing",
        href: "/my-listings/create",
        icon: HousePlus,
      },
      {
        id: isAuthenticated ? "chat" : "login",
        label: isAuthenticated ? "Chat" : "Login",
        href: isAuthenticated ? "/chat" : "/login",
        icon: isAuthenticated ? MessageCircle : CircleUser,
      },
      {
        id: "more",
        label: "More",
        href: "/more",
        icon: CircleEllipsis,
      },
    ];

  return (
    <div
      ref={navbarRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[24px] shadow-[0_-4px_25px_rgba(0,0,0,0.08)] border-t border-gray-100/80 px-2 py-2 sm:py-2.5"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          // const isActive = pathname === item.href || activeTab === item.id;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 cursor-pointer ${isActive
                ? "text-brand-blue font-semibold scale-105"
                : "text-gray-600 hover:text-brand-dark"
                }`}
            >
              <div className="flex items-center justify-center h-7">

                <Icon
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2 : 1.8}
                />

              </div>
              <span className="text-[11px] leading-tight font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div >
  );
}
