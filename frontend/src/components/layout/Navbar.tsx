"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAssets } from "@/data/assets";
import LineRoll from "@/components/utils/LineRoll";

import { useAuthStore } from "@/store/useAuthStore";
import {
  Heart,
  MessageCircle,
  PlusCircle,
  UserCircle,
  LogOut,
  User,
  Sliders,
  Bell,
} from "lucide-react";

interface NavbarProps {
  activeItem?: string;
}

export default function Navbar({ activeItem }: NavbarProps) {
  const assets = useAssets();
  const pathname = usePathname();
  const { user, profile, isAuthenticated, logout } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Listing", href: "/listing" },
    { label: "Community", href: "/community" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
  ];

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Mobile Menu Animation
  useEffect(() => {
    const menu = mobileMenuRef.current;
    if (!menu) return;

    gsap.killTweensOf(menu);

    if (mobileMenuOpen) {
      gsap.set(menu, {
        display: "flex",
        overflow: "hidden",
      });

      const targetHeight = menu.scrollHeight;

      gsap.fromTo(
        menu,
        {
          height: 0,
          opacity: 0,
          y: -10,
        },
        {
          height: targetHeight,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => {
            gsap.set(menu, { height: "auto", overflow: "visible" });
          },
        }
      );
    } else {
      if (menu.style.display === "none" || !menu.offsetHeight) {
        gsap.set(menu, { display: "none", height: 0, opacity: 0 });
        return;
      }

      const currentHeight = menu.offsetHeight;

      gsap.fromTo(
        menu,
        {
          height: currentHeight,
          opacity: 1,
          y: 0,
          overflow: "hidden",
        },
        {
          height: 0,
          opacity: 0,
          y: -10,
          duration: 0.35,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(menu, { display: "none" });
          },
        }
      );
    }

    return () => {
      gsap.killTweensOf(menu);
    };
  }, [mobileMenuOpen]);

  const displayName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
      : user?.mobile || "My Account";

  return (
    <nav className="fixed top-0 left-0 z-50 w-full py-2 sm:py-3 px-4 sm:px-6 lg:px-16">
      <div className="max-w-8xl 3xl:max-w-[1450px] mx-auto flex justify-between items-center ease-in-out bg-background rounded-full drop-shadow-md px-4 md:px-6 transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 py-1">
          <Image
            src={assets.logo}
            alt="Flatmate Logo"
            width={140}
            height={44}
            className="h-12 sm:h-12 md:h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-6 sm:space-x-8 lg:space-x-16">
          {navItems.map((item) => {
            const isActive = activeItem
              ? item.label === activeItem
              : item.href === "/"
                ? pathname === "/"
                : item.href !== "#" && pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative py-1 text-sm lg:text-base font-medium transition-colors ${
                  isActive
                    ? "text-brand-blue font-semibold"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                <LineRoll
                  text={item.label}
                  lineClassName="bg-brand-blue"
                  showDefaultLine={isActive}
                />
              </Link>
            );
          })}
        </div>

        {/* Right Section (Desktop) */}
        <div className="hidden lg:flex items-center space-x-3 lg:space-x-5">
          {isAuthenticated ? (
            <>
              {/* Wishlist Link */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className={`p-2 transition-colors rounded-full hover:bg-gray-50 cursor-pointer ${
                  pathname === "/wishlist"
                    ? "text-brand-blue bg-blue-50/60"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                <Heart className="w-5 h-5 lg:w-6 lg:h-6" />
              </Link>

              {/* Chat Link */}
              <Link
                href="/chat"
                aria-label="Chat"
                className={`p-2 transition-colors rounded-full hover:bg-gray-50 cursor-pointer ${
                  pathname === "/chat"
                    ? "text-brand-blue bg-blue-50/60"
                    : "text-gray-700 hover:text-brand-blue"
                }`}
              >
                <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6" />
              </Link>

              {/* Add Listing */}
              <Link
                href="/my-listing/create"
                className="flex items-center gap-2 bg-brand-blue text-white px-5 lg:px-6 py-2.5 rounded-full text-sm lg:text-base font-medium hover:bg-[#0052c7] transition-all shadow-sm active:scale-95"
              >
                Add Listing
                <PlusCircle className="w-4 h-4 lg:w-5 lg:h-5" />
              </Link>

              {/* User Profile Avatar (No Chevron, Toggles Dropdown) */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="User Account Menu"
                  aria-expanded={profileDropdownOpen}
                  className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-brand-blue/30 transition-all cursor-pointer select-none focus:outline-none active:scale-95"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shadow-xs">
                    {profile?.image?.url ? (
                      <Image
                        src={profile.image.url}
                        alt="User Avatar"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <UserCircle className="w-9 h-9 text-brand-blue" />
                    )}
                  </div>
                </button>

                {/* Desktop Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl p-3 shadow-2xl border border-gray-100 animate-in fade-in-50 slide-in-from-top-2 duration-200 z-50">
                    {/* User Header */}
                    <div className="px-3 py-2.5 mb-1 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {displayName}
                      </p>
                      {user?.mobile && (
                        <p className="text-xs text-gray-500 truncate">{user.mobile}</p>
                      )}
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1 py-1">
                      <Link
                        href="/my-profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                          pathname === "/my-profile"
                            ? "bg-brand-ice text-brand-blue font-semibold"
                            : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                        }`}
                      >
                        <User className="w-4 h-4 text-brand-blue" />
                        My Profile
                      </Link>

                      <Link
                        href="/my-preferences"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                          pathname === "/my-preferences"
                            ? "bg-brand-ice text-brand-blue font-semibold"
                            : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-brand-blue" />
                        My Preferences
                      </Link>

                      <Link
                        href="/my-notifications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                          pathname === "/my-notifications"
                            ? "bg-brand-ice text-brand-blue font-semibold"
                            : "text-gray-700 hover:bg-gray-50 hover:text-brand-blue"
                        }`}
                      >
                        <Bell className="w-4 h-4 text-brand-blue" />
                        My Notifications
                      </Link>
                    </div>

                    {/* Divider & Logout */}
                    <div className="pt-2 mt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-brand-blue text-white px-6 lg:px-8 py-2.5 rounded-full text-sm lg:text-base font-medium hover:bg-[#0052c7] transition-all shadow-sm active:scale-95"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Header Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 lg:hidden">
          {isAuthenticated ? (
            <>
              {/* Wishlist Link Mobile */}
              <Link
                href="/wishlist"
                aria-label="Wishlist"
                className="p-1.5 text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-full transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Chat Link Mobile */}
              <Link
                href="/chat"
                aria-label="Chat"
                className="p-1.5 text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>

              {/* Mobile Profile Avatar */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Profile Menu"
                className="p-1 rounded-full hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {profile?.image?.url ? (
                    <Image
                      src={profile.image.url}
                      alt="User Avatar"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <UserCircle className="w-7 h-7 text-brand-blue" />
                  )}
                </div>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-brand-blue text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium hover:bg-[#0052c7] transition-all shadow-sm active:scale-95"
            >
              Login
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 text-brand-dark focus:outline-none rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        ref={mobileMenuRef}
        className="lg:hidden mt-2 bg-white rounded-3xl p-5 shadow-xl border border-gray-100 flex flex-col space-y-4"
        style={{
          display: "none",
          height: 0,
          opacity: 0,
        }}
      >
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const isActive = activeItem
              ? item.label === activeItem
              : item.href === "/"
                ? pathname === "/"
                : item.href !== "#" && pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-2xl text-base font-medium transition-colors ${
                  isActive
                    ? "bg-brand-ice text-brand-blue font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LineRoll
                  text={item.label}
                  lineClassName="bg-brand-blue"
                  showDefaultLine={isActive}
                />
              </Link>
            );
          })}
        </div>

        {/* Mobile Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
          {isAuthenticated ? (
            <>
              {/* Dashboard Navigation Links */}
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Account Dashboard
                </p>
                <Link
                  href="/my-profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/my-profile"
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <User className="w-4 h-4 text-brand-blue" />
                  My Profile
                </Link>

                <Link
                  href="/my-preferences"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/my-preferences"
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Sliders className="w-4 h-4 text-brand-blue" />
                  My Preferences
                </Link>

                <Link
                  href="/my-notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                    pathname === "/my-notifications"
                      ? "bg-brand-ice text-brand-blue font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Bell className="w-4 h-4 text-brand-blue" />
                  My Notifications
                </Link>
              </div>

              <Link
                href="/my-listing/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-brand-blue text-white py-3 rounded-full font-medium hover:bg-[#0052c7] transition-all shadow-sm active:scale-95 mt-1"
              >
                <PlusCircle className="w-5 h-5" />
                Add Listing
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-brand-blue text-white py-3 rounded-full font-medium hover:bg-[#0052c7] transition-all shadow-sm active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
