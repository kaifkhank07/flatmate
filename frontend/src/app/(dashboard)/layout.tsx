"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isInitialized } = useAuthStore();

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
        }
    }, [isInitialized, isAuthenticated, router, pathname]);

    // While checking auth status from HTTP-only cookie
    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-9 h-9 text-[#0066F9] animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-500">Checking authentication...</p>
            </div>
        );
    }

    // If unauthenticated, return null while redirecting
    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
