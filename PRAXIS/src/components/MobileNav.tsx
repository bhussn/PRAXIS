import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { mockUser } from "@/data/mockData";

const navItems = [
  {
    to: "/brief",
    label: "Brief",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    to: "/articles",
    label: "Articles",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    to: "/saved",
    label: "Saved",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function MobileNav() {
  const navigate = useNavigate();

  return (
    <>
      {/* Top header */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-[#1E1830] bg-[#08060D]/95 backdrop-blur-md">
        <Logo size="sm" />
        {/* AUTH: REPLACE THIS */}
        <button
          onClick={() => navigate("/settings")}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold"
          aria-label="Profile"
        >
          {mockUser.avatarInitials}
        </button>
      </header>

      {/* Bottom navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-[#1E1830] bg-[#08060D]/95 backdrop-blur-md"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors duration-200 ${
                isActive ? "text-violet-400" : "text-[#4A4360]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
