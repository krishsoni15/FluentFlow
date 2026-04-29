"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfileComponent, type UserProfile } from "@/components/UserProfile";

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Fetch existing profile data if any
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const user = data.user;
            const isProfileComplete =
              Boolean(user.onboardingComplete) ||
              (Boolean(user.name) &&
                Array.isArray(user.targetLanguages) &&
                user.targetLanguages.length > 0 &&
                Array.isArray(user.learningGoals) &&
                user.learningGoals.length > 0);

            if (isProfileComplete) {
              router.replace("/dashboard");
              return;
            }

            setProfile(user);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsChecking(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSave = async (updatedProfile: UserProfile) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        console.error("Failed to save profile");
        router.push("/dashboard"); // proceed anyway for now
      }
    } catch (error) {
      console.error(error);
      router.push("/dashboard");
    }
  };

  const handleClose = () => {
    // If they try to close it, just go to dashboard
    // The dashboard will handle showing it again if onboarding isn't complete
    router.push("/dashboard");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10">
        <UserProfileComponent 
          isVisible={true}
          onClose={handleClose}
          onSave={handleSave}
          currentProfile={profile}
        />
      </div>
    </div>
  );
}

