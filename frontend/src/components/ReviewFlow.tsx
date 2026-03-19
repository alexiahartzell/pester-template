import type { Task } from "../api/tasks";

interface ReviewItem {
  id: number;
  title: string;
  suggestion?: string;
  reason?: string;
}

interface ReviewFlowProps {
  completed: ReviewItem[];
  uncompleted: ReviewItem[];
  summary: string;
  onAction: (id: number, action: "tomorrow" | "drop" | "done") => void;
  onDismiss: () => void;
}

export default function ReviewFlow({
  completed,
  uncompleted,
  summary,
  onAction,
  onDismiss,
}: ReviewFlowProps) {
  return (
    <div className="mb-8 bg-stone-900 rounded-lg border border-stone-800 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
        Evening review
      </div>
      {summary && <p className="text-stone-400 text-sm mb-4">{summary}</p>}

      {completed.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wide text-quick mb-2">Done</div>
          {completed.map((t) => (
            <div key={t.id} className="text-sm text-stone-400 py-1">
              {t.title}
            </div>
          ))}
        </div>
      )}

      {uncompleted.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-wide text-urgent mb-2">Not done</div>
          {uncompleted.map((t) => (
            <div key={t.id} className="py-2 border-b border-stone-800 last:border-0">
              <div className="text-sm text-stone-200">{t.title}</div>
              {t.suggestion && (
                <div className="text-xs text-stone-500 mt-0.5">Suggestion: {t.suggestion}</div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onAction(t.id, "tomorrow")}
                  className="text-xs px-2.5 py-1 bg-stone-800 text-stone-200 rounded hover:bg-stone-700 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => onAction(t.id, "drop")}
                  className="text-xs px-2.5 py-1 text-stone-500 rounded hover:text-urgent transition-colors"
                >
                  Drop
                </button>
                <button
                  onClick={() => onAction(t.id, "done")}
                  className="text-xs px-2.5 py-1 text-stone-500 rounded hover:text-quick transition-colors"
                >
                  Actually done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
