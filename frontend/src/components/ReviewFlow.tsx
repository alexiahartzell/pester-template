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
    <div className="mb-10 bg-surface rounded-xl border border-border p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-3">
        Evening review
      </div>
      {summary && <p className="text-subtle text-sm mb-5">{summary}</p>}

      {completed.length > 0 && (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wide text-done mb-2">Done</div>
          {completed.map((t) => (
            <div key={t.id} className="text-sm text-subtle py-1.5">
              {t.title}
            </div>
          ))}
        </div>
      )}

      {uncompleted.length > 0 && (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wide text-urgent mb-2">Not done</div>
          {uncompleted.map((t) => (
            <div key={t.id} className="py-3 border-b border-border last:border-0">
              <div className="text-base text-text">{t.title}</div>
              {t.suggestion && (
                <div className="text-sm text-muted mt-1">Suggestion: {t.suggestion}</div>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => onAction(t.id, "tomorrow")}
                  className="text-sm px-3.5 py-1.5 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  onClick={() => onAction(t.id, "drop")}
                  className="text-sm px-3.5 py-1.5 text-muted rounded-lg hover:text-urgent transition-colors"
                >
                  Drop
                </button>
                <button
                  onClick={() => onAction(t.id, "done")}
                  className="text-sm px-3.5 py-1.5 text-muted rounded-lg hover:text-done transition-colors"
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
        className="text-sm text-muted hover:text-text transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
