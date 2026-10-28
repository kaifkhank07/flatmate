"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import ManageProfile from "@/components/dashboard/profile/ManageProfile";
import CompleteProfile from "@/components/dashboard/profile/CompleteProfile";

export default function MyProfile() {
    const router = useRouter();
    const {
        profile,
        isAuthenticated,
        isInitialized,
        fetchProfile,
        checkProfileCompletionStatus,
    } = useAuthStore();

    const [isChecking, setIsChecking] = useState(true);
    const [isProfileCompleted, setIsProfileCompleted] = useState(false);

    useEffect(() => {
        if (!isInitialized) return;

        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        let isMounted = true;
        const checkProfile = async () => {
            try {
                if (!profile) {
                    await fetchProfile();
                }

                const completed = await checkProfileCompletionStatus();
                if (isMounted) {
                    setIsProfileCompleted(completed);
                }
            } catch (error) {
                console.error("Failed to check profile completion status:", error);
            } finally {
                if (isMounted) {
                    setIsChecking(false);
                }
            }
        };

        checkProfile();

        return () => {
            isMounted = false;
        };
    }, [isInitialized, isAuthenticated, profile, fetchProfile, checkProfileCompletionStatus, router]);

    if (!isInitialized || isChecking) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#0066F9] animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!isProfileCompleted) {
        return <CompleteProfile />;
    }

    return <ManageProfile />;
}
