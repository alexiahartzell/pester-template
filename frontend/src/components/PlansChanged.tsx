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
      <div className="bg-stone-900 rounded-lg border border-stone-800 p-6 w-full max-w-lg">
        <h2 className="text-stone-200 font-medium mb-1">Plans changed</h2>
        <p className="text-stone-500 text-sm mb-4">What shifted? The AI will reshuffle your day.</p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder='e.g., "Advisor wants tetramer results by tomorrow"'
          rows={3}
          autoFocus
          className="w-full bg-stone-950 text-stone-200 placeholder-stone-500
                     px-3 py-2.5 rounded border border-stone-800 outline-none
                     text-sm resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-500 text-sm rounded hover:text-stone-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => context.trim() && onSubmit(context.trim())}
            disabled={!context.trim() || loading}
            className="px-4 py-2 bg-stone-800 text-stone-200 text-sm rounded
                       hover:bg-stone-700 transition-colors disabled:opacity-40"
          >
            {loading ? "Reshuffling..." : "Reshuffle"}
          </button>
        </div>
      </div>
    </div>
  );
}
