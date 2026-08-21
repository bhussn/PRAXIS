import { useState } from "react";

import { supabase } from "@/lib/supabase";

interface SaveButtonProps {
  articleId: string;
  initialSaved?: boolean;
  onToggle?: (id: string, saved: boolean) => void;
}

export default function SaveButton({
  articleId,
  initialSaved = false,
  onToggle,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent double-clicks while request is running
    if (loading) return;

    setAnimating(true);
    setLoading(true);

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
        throw new Error("You must be logged in to save articles.");
      }

      const articleIdNumber = Number(articleId);

      if (Number.isNaN(articleIdNumber)) {
        throw new Error("Invalid article ID.");
      }

      // =====================================================
      // 2. UNSAVE ARTICLE
      // =====================================================

      if (saved) {
        const { error } = await supabase
          .from("saved_articles")
          .delete()
          .eq("user_id", user.id)
          .eq("article_id", articleIdNumber);

        if (error) {
          throw error;
        }

        setSaved(false);
        onToggle?.(articleId, false);

        console.log("PRAXIS: Article unsaved", articleId);
      }

      // =====================================================
      // 3. SAVE ARTICLE
      // =====================================================

      else {
        const { error } = await supabase
          .from("saved_articles")
          .insert({
            user_id: user.id,
            article_id: articleIdNumber,
          });

        if (error) {
          throw error;
        }

        setSaved(true);
        onToggle?.(articleId, true);

        console.log("PRAXIS: Article saved", articleId);
      }
    } catch (error) {
      console.error("=================================");
      console.error("PRAXIS SAVE ERROR");
      console.error("=================================");
      console.error(error);

      // Don't visually change the bookmark if
      // the database operation failed.
    } finally {
      setLoading(false);

      setTimeout(() => {
        setAnimating(false);
      }, 300);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? "Unsave article" : "Save article"}
      aria-pressed={saved}
      className={`
        group relative flex items-center justify-center
        w-8 h-8 rounded-lg
        border transition-all duration-200

        ${
          saved
            ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
            : "border-[#1E1830] bg-transparent text-[#4A4360] hover:border-[#2D2548] hover:text-[#8B82A0]"
        }

        ${animating ? "scale-90" : "scale-100"}

        ${loading ? "opacity-60 cursor-wait" : ""}
      `}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-200"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}