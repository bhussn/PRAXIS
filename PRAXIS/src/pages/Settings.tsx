import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockUser, mockProfile, mockCareers } from "@/data/mockData";

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] tracking-widest text-[#4A4360] mb-4">{label}</p>
  );
}

function Field({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  const [val, setVal] = useState(value);
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">{label}</label>
      <input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm focus:border-violet-500/50 transition-all outline-none"
      />
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // DATABASE: REPLACE THIS — save profile changes to Supabase profiles table
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    // AUTH: REPLACE THIS — call Supabase Auth signOut
    navigate("/");
  };

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-2xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-2">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Profile section */}
        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">
          <SectionHeader label="PROFILE" />
          {/* AUTH: REPLACE THIS — name and email come from Supabase Auth + profiles */}
          <Field label="Name" value={mockUser.name} />
          <Field label="Email" value={mockUser.email} type="email" />
        </div>

        {/* Interests section */}
        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">
          <SectionHeader label="INTERESTS" />
          {/* DATABASE: REPLACE THIS — major comes from profiles.major */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">Major</label>
            <div className="px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm">
              {mockProfile.major}
            </div>
          </div>
          {/* DATABASE: REPLACE THIS — careers come from user_careers */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">Career interests</label>
            <div className="flex flex-wrap gap-2">
              {mockCareers.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          {/* DATABASE: REPLACE THIS — concerns come from profiles.concerns */}
          <div>
            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">College-to-career concerns</label>
            <textarea
              rows={4}
              defaultValue={mockProfile.concerns}
              className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm leading-relaxed focus:border-violet-500/50 transition-all outline-none resize-none"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
            >
              {saved ? "Saved ✓" : "Save changes"}
            </button>
          </div>
        </div>

        {/* Account section */}
        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">
          <SectionHeader label="ACCOUNT" />
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-xl border border-[#1E1830] text-[#8B82A0] hover:text-white hover:border-[#2D2548] text-sm font-medium transition-all">
              Change password
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 rounded-xl border border-[#1E1830] text-[#8B82A0] hover:text-white hover:border-[#2D2548] text-sm font-medium transition-all"
            >
              {/* AUTH: REPLACE THIS */}
              Sign out
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-sm font-medium transition-all">
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
