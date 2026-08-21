import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Logo from "./Logo";

import { supabase } from "@/lib/supabase";

type UserProfile = {
  name: string | null;
  major: string | null;
};

const navItems = [
  {
    to: "/brief",
    label: "Brief",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    to: "/articles",
    label: "Articles",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    to: "/saved",
    label: "Saved",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 2-2h10a2 2 0 0 2 2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile>({
    name: null,
    major: null,
  });

  // =========================================================
  // LOAD USER PROFILE
  // =========================================================

  const loadProfile = async () => {
    try {
      // =====================================================
      // 1. GET LOGGED-IN USER
      // =====================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        return;
      }

      // =====================================================
      // 2. GET PROFILE
      // =====================================================

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("name, major_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // =====================================================
      // 3. GET MAJOR
      // =====================================================

      let majorName: string | null = null;

      if (profileData?.major_id) {
        const {
          data: majorData,
          error: majorError,
        } = await supabase
          .from("majors")
          .select("name")
          .eq("id", profileData.major_id)
          .single();

        if (majorError) {
          throw majorError;
        }

        majorName = majorData?.name ?? null;
      }

      // =====================================================
      // 4. UPDATE SIDEBAR PROFILE
      // =====================================================

      setProfile({
        name: profileData?.name ?? user.email ?? null,
        major: majorName,
      });
    } catch (error) {
      console.error("PRAXIS SIDEBAR ERROR:", error);
    }
  };

  // =========================================================
  // LOAD PROFILE + LISTEN FOR PROFILE UPDATES
  // =========================================================

  useEffect(() => {
    // Load profile when Sidebar first appears
    loadProfile();

    // Reload profile whenever Settings saves changes
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    // Remove listener when Sidebar is unmounted
    return () => {
      window.removeEventListener(
        "profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  // =========================================================
  // USER DISPLAY
  // =========================================================

  const displayName = profile.name || "User";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-[#1E1830] bg-[#0A0814] shrink-0">

      {/* ===================================================
          LOGO
          =================================================== */}

      <div className="px-6 py-6 border-b border-[#1E1830]">
        <Logo size="md" />
      </div>

      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <nav
        className="flex-1 px-3 py-4"
        aria-label="Main navigation"
      >
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                      : "text-[#8B82A0] hover:text-[#F0ECFF] hover:bg-[#151021] border border-transparent"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Divider */}

        <div className="my-4 border-t border-[#1E1830]" />

        {/* Settings */}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                : "text-[#8B82A0] hover:text-[#F0ECFF] hover:bg-[#151021] border border-transparent"
            }`
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />

            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l-.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>

          Settings
        </NavLink>
      </nav>

      {/* ===================================================
          USER PROFILE
          =================================================== */}

      <div
        className="px-3 py-4 border-t border-[#1E1830] cursor-pointer hover:bg-[#151021] transition-colors rounded-none"
        onClick={() => navigate("/settings")}
      >
        <div className="flex items-center gap-3 px-3 py-2">

          {/* Avatar */}

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>

          {/* User information */}

          <div className="min-w-0">
            <p className="text-sm font-medium text-[#F0ECFF] truncate">
              {displayName}
            </p>

            <p className="text-[10px] text-[#4A4360] truncate">
              {profile.major || "Choose your interests"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}