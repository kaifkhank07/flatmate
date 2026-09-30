"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/layout/SmoothScroll";
import MobileNavbar from "@/components/layout/MobileNavbar";
import Footer from "@/components/layout/Footer";
import AuthInitializer from "@/components/layout/AuthInitializer";

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute = pathname?.includes("/login");

  return (
    <>
      <AuthInitializer />
      {!isLoginRoute && <Navbar />}
      <SmoothScroll />
      {children}
      {!isLoginRoute && <MobileNavbar />}
      {!isLoginRoute && <Footer />}
    </>
  );
}
