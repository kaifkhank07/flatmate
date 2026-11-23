"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/layout/SmoothScroll";
import MobileNavbar from "@/components/layout/MobileNavbar";
import Footer from "@/components/layout/Footer";
import AuthInitializer from "@/components/layout/AuthInitializer";
import ChatBot from "@/components/layout/ChatBot";

/**
 * Checks whether the current path is a public page accessible without login.
 * Protected dashboard routes (/chat, /my-listings, /profile, etc.) and auth routes (/login) return false.
 */
function isPublicPage(pathname: string | null): boolean {
  if (!pathname) return false;

  const nonPublicPrefixes = [
    "/chat",
    "/my-listings",
    "/profile",
    "/preferences",
    "/notifications",
    "/wishlist",
    "/more",
    "/login",
  ];

  return !nonPublicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute = pathname?.includes("/login");
  const showChatBot = isPublicPage(pathname);

  return (
    <>
      <AuthInitializer />
      {!isLoginRoute && <Navbar />}
      <SmoothScroll />
      {children}
      {showChatBot && <ChatBot />}
      {!isLoginRoute && <MobileNavbar />}
      {!isLoginRoute && <Footer />}
    </>
  );
}

