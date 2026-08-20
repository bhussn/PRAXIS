interface AnalysisErrorProps {
  originalUrl?: string;
  onRetry?: () => void;
}

// CLAUDE: REPLACE THIS — shown when Claude API call fails
export default function AnalysisError({ originalUrl, onRetry }: AnalysisErrorProps) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <h3 className="font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-sm text-[#8B82A0] mb-6">
        Something went wrong while building your brief.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
        )}
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl border border-[#2D2548] text-[#8B82A0] hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5 justify-center"
          >
            Read the original article
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
