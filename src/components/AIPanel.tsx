"use client";

interface AIPanelProps {
  loading: boolean;
  content: string | null;
  error: string | null;
  type: "pick" | "insights" | null;
  gameId: string | null;
  onClose: () => void;
}

export default function AIPanel({
  loading,
  content,
  error,
  type,
  gameId,
  onClose,
}: AIPanelProps) {
  if (!gameId && !loading) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="font-semibold text-white text-sm">
            {type === "pick" ? "AI Pick" : "AI Insights"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-lg leading-none"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            Analyzing matchup...
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {content && (
          <div className="prose prose-sm prose-invert max-w-none">
            {content.split("\n").map((line, i) => {
              if (line.startsWith("## ")) {
                return (
                  <h4 key={i} className="text-emerald-400 font-semibold mt-4 mb-1 text-sm">
                    {line.replace("## ", "")}
                  </h4>
                );
              }
              if (line.startsWith("PICK: ")) {
                return (
                  <div
                    key={i}
                    className="bg-emerald-900/40 border border-emerald-600 rounded px-3 py-2 mb-3 text-emerald-200 font-bold"
                  >
                    {line}
                  </div>
                );
              }
              if (line.trim() === "") {
                return <div key={i} className="h-2" />;
              }
              return (
                <p key={i} className="text-slate-300 text-sm leading-relaxed mb-1">
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
