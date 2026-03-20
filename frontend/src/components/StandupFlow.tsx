import { useState } from "react";
import type { Task } from "../api/tasks";
import { getCategoryColor } from "../categoryColors";

interface InboxSuggestion {
  id: number;
  title: string;
  suggested_category: string | null;
  suggested_project: string | null;
  suggested_source: string | null;
  suggested_task_type: string | null;
  suggested_priority: string | null;
  suggested_due: string | null;
  suggested_deadline_type: string | null;
  reasoning: string;
  needs_clarification?: boolean;
  clarification_prompt?: string | null;
}

interface StandupFlowProps {
  suggestions: InboxSuggestion[] | null;
  onAccept: (id: number, data: Partial<Task>) => void;
  onDismiss: () => void;
}

export default function StandupFlow({ suggestions, onAccept, onDismiss }: StandupFlowProps) {
  const [edits, setEdits] = useState<Record<number, string>>({});

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mb-10 bg-surface rounded-xl border border-border p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-cat-my-admin mb-3">
        Sort new tasks
      </div>
      <p className="text-muted text-sm mb-5">
        The AI categorized your new tasks. Some may need more detail from you.
      </p>
      {suggestions.map((s) => {
        const needsClarification = s.needs_clarification && s.clarification_prompt;
        const editedTitle = edits[s.id];

        return (
          <div key={s.id} className="border-b border-border last:border-0 py-4">
            <div className="text-base text-text mb-1">{s.title}</div>
            <div className="text-muted text-sm mb-3">{s.reasoning}</div>
            <div className="flex gap-2 flex-wrap text-xs mb-3">
              {s.suggested_category && (
                <span className={`px-2.5 py-1 rounded-lg bg-surface-hover ${getCategoryColor(s.suggested_category)}`}>
                  {s.suggested_category}
                </span>
              )}
              {s.suggested_project && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">project: {s.suggested_project}</span>
              )}
              {s.suggested_priority && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">priority: {s.suggested_priority}</span>
              )}
              {s.suggested_due && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">
                  due: {s.suggested_due}{s.suggested_deadline_type ? ` (${s.suggested_deadline_type})` : ""}
                </span>
              )}
            </div>

            {needsClarification ? (
              <div className="mb-3">
                <div className="text-sm text-warm mb-2">{s.clarification_prompt}</div>
                <input
                  type="text"
                  value={editedTitle ?? s.title}
                  onChange={(e) => setEdits({ ...edits, [s.id]: e.target.value })}
                  placeholder="Be more specific..."
                  className="w-full bg-bg text-text placeholder-muted px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
            ) : null}

            <button
              onClick={() =>
                onAccept(s.id, {
                  title: editedTitle ?? s.title,
                  status: "active",
                  category: s.suggested_category,
                  project: s.suggested_project,
                  source: s.suggested_source,
                  task_type: s.suggested_task_type,
                  priority: s.suggested_priority as any,
                  due: s.suggested_due,
                  deadline_type: s.suggested_deadline_type as any,
                })
              }
              className="text-sm px-3.5 py-1.5 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
            >
              {needsClarification ? "Save & accept" : "Accept"}
            </button>
          </div>
        );
      })}
      <button
        onClick={onDismiss}
        className="mt-4 text-sm text-muted hover:text-text transition-colors"
      >
        Dismiss all
      </button>
    </div>
  );
}
