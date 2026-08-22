import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="font-mono text-[10px] tracking-widest text-[#4A4360] mb-4">
      {label}
    </p>
  );
}

type Major = {
  id: number;
  name: string;
};

type Interest = {
  id: number;
  name: string;
};

type ProfileData = {
  name: string;
  email: string;
  majorId: number | null;
  major: string;
  concerns: string;
  interests: Interest[];
};

export default function Settings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    majorId: null,
    major: "",
    concerns: "",
    interests: [],
  });

  const [majors, setMajors] = useState<Major[]>([]);
  const [allInterests, setAllInterests] = useState<Interest[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ----------------------------------------
  // Load profile + majors + interests
  // ----------------------------------------

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("You must be logged in to view settings.");
        }

        // ----------------------------------------
        // Get profile
        // ----------------------------------------

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select(`
              name,
              concerns,
              major_id,
              majors (
                id,
                name
              )
            `)
            .eq("id", user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        // ----------------------------------------
        // Get user's interests
        // ----------------------------------------

        const { data: userInterestRows, error: userInterestsError } =
          await supabase
            .from("user_interests")
            .select(`
              interest_id,
              interests (
                id,
                name
              )
            `)
            .eq("user_id", user.id);

        if (userInterestsError) {
          throw userInterestsError;
        }

        const selectedInterests =
          userInterestRows
            ?.map((row) => row.interests)
            .filter(
              (interest): interest is Interest =>
                interest !== null && interest !== undefined
            ) ?? [];

        // ----------------------------------------
        // Get all majors
        // ----------------------------------------

        const { data: majorsData, error: majorsError } =
          await supabase
            .from("majors")
            .select("id, name")
            .order("name");

        if (majorsError) {
          throw majorsError;
        }

        // ----------------------------------------
        // Get all interests
        // ----------------------------------------

        const { data: interestsData, error: interestsError } =
          await supabase
            .from("interests")
            .select("id, name")
            .order("name");

        if (interestsError) {
          throw interestsError;
        }

        // ----------------------------------------
        // Set state
        // ----------------------------------------

        setMajors(majorsData ?? []);
        setAllInterests(interestsData ?? []);

        setProfile({
          name: profileData.name ?? "",
          email: user.email ?? "",
          majorId: profileData.major_id ?? null,
          major: profileData.majors?.name ?? "",
          concerns: profileData.concerns ?? "",
          interests: selectedInterests,
        });
      } catch (error) {
        console.error("Error loading settings:", error);

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load your profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ----------------------------------------
  // Change major
  // ----------------------------------------

  const handleMajorChange = (majorId: number) => {
    const selectedMajor = majors.find(
      (major) => major.id === majorId
    );

    setProfile((prev) => ({
      ...prev,
      majorId,
      major: selectedMajor?.name ?? "",
    }));
  };

  // ----------------------------------------
  // Toggle interest
  // ----------------------------------------

  const toggleInterest = (interest: Interest) => {
    setProfile((prev) => {
      const alreadySelected = prev.interests.some(
        (item) => item.id === interest.id
      );

      if (alreadySelected) {
        return {
          ...prev,
          interests: prev.interests.filter(
            (item) => item.id !== interest.id
          ),
        };
      }

      return {
        ...prev,
        interests: [...prev.interests, interest],
      };
    });
  };

  // ----------------------------------------
  // Save profile
  // ----------------------------------------

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in.");
      }

      // ----------------------------------------
      // Update profile
      // ----------------------------------------

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: profile.name.trim(),
          major_id: profile.majorId,
          concerns: profile.concerns.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // ----------------------------------------
      // Remove existing interests
      // ----------------------------------------

      const { error: deleteError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      // ----------------------------------------
      // Insert new interests
      // ----------------------------------------

      if (profile.interests.length > 0) {
        const rows = profile.interests.map((interest) => ({
          user_id: user.id,
          interest_id: interest.id,
        }));

        const { error: insertError } = await supabase
          .from("user_interests")
          .insert(rows);

        if (insertError) {
          throw insertError;
        }
      }

      setSaved(true);

      window.dispatchEvent(new Event("profile-updated"));

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Could not save your changes.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // Sign out
  // ----------------------------------------

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // ----------------------------------------
  // Loading
  // ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen px-6 lg:px-10 py-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-[#8B82A0]">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // Page
  // ----------------------------------------

  return (
    <div className="min-h-screen px-6 lg:px-10 py-8 max-w-2xl mx-auto">

      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white mb-2">
          Settings
        </h1>
        <p className="text-sm text-[#8B82A0]">
          Keep your PRAXIS experience personalized.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <div className="space-y-8">

        {/* PROFILE */}

        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">

          <SectionHeader label="PROFILE" />

          <div className="mb-4">
            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">
              Name
            </label>

            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm focus:border-violet-500/50 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">
              Email
            </label>

            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-[#4A4360] text-sm cursor-not-allowed"
            />
          </div>

        </div>

        {/* INTERESTS */}

        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">

          <SectionHeader label="INTERESTS" />

          {/* MAJOR */}

          <div className="mb-6">

            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">
              Major
            </label>

            <select
              value={profile.majorId ?? ""}
              onChange={(e) =>
                handleMajorChange(Number(e.target.value))
              }
              className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm focus:border-violet-500/50 transition-all outline-none"
            >
              <option value="">
                Select your major
              </option>

              {majors.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </select>

          </div>

          {/* INTERESTS */}

          <div className="mb-6">

            <label className="block text-xs font-medium text-[#8B82A0] mb-2">
              Career & industry interests
            </label>

            <p className="text-xs text-[#4A4360] mb-3">
              Select the areas you want PRAXIS to personalize your brief around.
            </p>

            <div className="flex flex-wrap gap-2">

              {allInterests.map((interest) => {
                const selected = profile.interests.some(
                  (item) => item.id === interest.id
                );

                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={
                      selected
                        ? "px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 text-violet-300 text-xs font-medium transition-all"
                        : "px-3 py-1.5 rounded-lg border border-[#2D2548] bg-[#120E1C] text-[#8B82A0] hover:text-white hover:border-violet-500/30 text-xs font-medium transition-all"
                    }
                  >
                    {interest.name}
                  </button>
                );
              })}

            </div>

            {profile.interests.length > 0 && (
              <p className="text-[10px] font-mono text-[#4A4360] mt-3">
                {profile.interests.length} interest
                {profile.interests.length === 1 ? "" : "s"} selected
              </p>
            )}

          </div>

          {/* CONCERNS */}

          <div>

            <label className="block text-xs font-medium text-[#8B82A0] mb-1.5">
              College-to-career concerns
            </label>

            <textarea
              rows={4}
              value={profile.concerns}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  concerns: e.target.value,
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-[#120E1C] border border-[#1E1830] text-white text-sm leading-relaxed focus:border-violet-500/50 transition-all outline-none resize-none"
            />

          </div>

          {/* SAVE */}

          <div className="mt-4 flex items-center gap-3">

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-all"
            >
              {saving
                ? "Saving..."
                : saved
                  ? "Saved ✓"
                  : "Save changes"}
            </button>

          </div>

        </div>

        {/* ACCOUNT */}

        <div className="rounded-2xl border border-[#1E1830] bg-[#0F0B18] p-6">

          <SectionHeader label="ACCOUNT" />

          <div className="space-y-2">

            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 rounded-xl border border-[#1E1830] text-[#8B82A0] hover:text-white hover:border-[#2D2548] text-sm font-medium transition-all"
            >
              Sign out
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}