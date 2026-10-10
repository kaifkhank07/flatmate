"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import ManageProfile from "@/components/dashboard/profile/ManageProfile";
import CompleteProfile from "@/components/dashboard/profile/CompleteProfile";

export default function MyProfile() {
    const {
        profile,
        fetchProfile,
        checkProfileCompletionStatus,
    } = useAuthStore();

    const [isChecking, setIsChecking] = useState(true);
    const [isProfileCompleted, setIsProfileCompleted] = useState(false);

    useEffect(() => {
        const checkProfile = async () => {
            try {
                if (!profile) {
                    await fetchProfile();
                }

                const completed = await checkProfileCompletionStatus();
                setIsProfileCompleted(completed);
            } catch (error) {
                console.error("Failed to check profile completion status:", error);
            } finally {
                setIsChecking(false);
            }
        };

        checkProfile();
    }, [profile, fetchProfile, checkProfileCompletionStatus]);

    if (isChecking) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#0066F9] animate-spin" />
            </div>
        );
    }

    if (!isProfileCompleted) {
        return <CompleteProfile />;
    }

    return <ManageProfile />;
}