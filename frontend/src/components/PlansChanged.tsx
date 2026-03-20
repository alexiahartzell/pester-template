import { useState } from "react";

interface PlansChangedProps {
  onSubmit: (context: string) => void;
  onClose: () => void;
  loading: boolean;
}

export default function PlansChanged({ onSubmit, onClose, loading }: PlansChangedProps) {
  const [context, setContext] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-xl border border-border p-7 w-full max-w-lg">
        <h2 className="text-text text-lg font-medium mb-1">Reshuffle</h2>
        <p className="text-muted text-sm mb-5">What changed? The AI will reprioritize your day.</p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder='e.g., "Advisor wants tetramer results by tomorrow"'
          rows={3}
          autoFocus
          className="w-full bg-bg text-text placeholder-muted
                     px-4 py-3 rounded-xl border border-border outline-none
                     text-base resize-none mb-5"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-muted text-sm rounded-lg hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => context.trim() && onSubmit(context.trim())}
            disabled={!context.trim() || loading}
            className="px-5 py-2.5 bg-surface-hover text-text text-sm rounded-lg
                       hover:bg-border transition-colors disabled:opacity-40"
          >
            {loading ? "Reshuffling..." : "Reshuffle"}
          </button>
        </div>
      </div>
    </div>
  );
}
