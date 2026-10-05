"use client";

import React, { useEffect, useState } from "react";
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
    const { isAuthenticated, isInitialized, profile, checkProfileCompletionStatus, fetchProfile } = useAuthStore();
    const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);

    useEffect(() => {
        if (!isInitialized) return;

        if (!isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
            return;
        }

        let isMounted = true;
        const verifyProfileCompletion = async () => {
            try {
                if (!profile) {
                    await fetchProfile();
                }
                const completedOnce = await checkProfileCompletionStatus();

                if (!isMounted) return;

                if (!completedOnce && pathname !== "/my-profile-complete") {
                    router.replace("/my-profile-complete");
                } else if (completedOnce && pathname === "/my-profile-complete") {
                    router.replace("/my-profile");
                }
            } catch (err) {
                console.error("Failed to check profile completion status:", err);
            } finally {
                if (isMounted) {
                    setIsCheckingCompletion(false);
                }
            }
        };

        verifyProfileCompletion();

        return () => {
            isMounted = false;
        };
    }, [isInitialized, isAuthenticated, profile, pathname, router, checkProfileCompletionStatus, fetchProfile]);

    // While checking auth status from HTTP-only cookie or verifying profile completion
    if (!isInitialized || (isAuthenticated && isCheckingCompletion)) {
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
