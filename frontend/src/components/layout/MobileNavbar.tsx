"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export default function MobileNavbar() {
  const pathname = usePathname();
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

  const navItems = [
    {
      id: "search",
      label: "Search",
      href: "/",
      icon: (
        <svg className="w-6 h-6 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      ),
    },
    {
      id: "add-listing",
      label: "Add Listing",
      href: "/my-listings/create",
      icon: (
        <div className="relative">
          <svg className="w-6.5 h-6.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
            />
            <circle cx="16.5" cy="16.5" r="4.5" className="fill-white stroke-current stroke-[1.8]" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 14.5v4m-2-2h4" strokeWidth="1.8" />
          </svg>
        </div>
      ),
    },
    {
      id: "chat",
      label: "Chat",
      href: "/chat",
      icon: (
        <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.85 5.978 5.978 0 00.999-2.614A7.854 7.854 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      ),
    },
    {
      id: "more",
      label: "More",
      href: "/more",
      hasNotification: true,
      icon: (
        <div className="relative">
          <svg className="w-6.5 h-6.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2.5" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
        </div>
      ),
    },
  ];

  return (
    <div
      ref={navbarRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[24px] shadow-[0_-4px_25px_rgba(0,0,0,0.08)] border-t border-gray-100/80 px-2 py-2 sm:py-2.5"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || activeTab === item.id;
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
              <div className="flex items-center justify-center h-7">{item.icon}</div>
              <span className="text-[11px] leading-tight font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
