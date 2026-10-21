"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const {
        isAuthenticated,
        isInitialized,
    } = useAuthStore();

    // Notification Prefetch
    const {
        fetchPreferences,
    } = useNotificationStore();

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (!isInitialized) return;

        if (!isAuthenticated) {
            router.replace(
                `/login?redirect=${encodeURIComponent(pathname || "/")}`
            );
            return;
        }

        setIsCheckingAuth(false);
    }, [isInitialized, isAuthenticated, pathname, router]);

    // Load notification preferences after authentication
    useEffect(() => {
        if (!isInitialized || !isAuthenticated) return;

        fetchPreferences();
    }, [isInitialized, isAuthenticated, fetchPreferences]);

    if (!isInitialized || isCheckingAuth) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-9 h-9 text-[#0066F9] animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-500">
                    Checking authentication...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}