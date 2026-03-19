import type { Task } from "../api/tasks";

interface InboxSuggestion {
  id: number;
  title: string;
  suggested_project: string | null;
  suggested_source: string | null;
  suggested_task_type: string | null;
  suggested_priority: string | null;
  suggested_due: string | null;
  reasoning: string;
}

interface StandupFlowProps {
  suggestions: InboxSuggestion[] | null;
  onAccept: (id: number, data: Partial<Task>) => void;
  onDismiss: () => void;
}

export default function StandupFlow({ suggestions, onAccept, onDismiss }: StandupFlowProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mb-8 bg-stone-900 rounded-lg border border-stone-800 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-deep mb-3">
        Inbox triage
      </div>
      <p className="text-stone-500 text-sm mb-4">
        The AI categorized your inbox items. Confirm or adjust each one.
      </p>
      {suggestions.map((s) => (
        <div key={s.id} className="border-b border-stone-800 last:border-0 py-3">
          <div className="text-sm text-stone-200 mb-1">{s.title}</div>
          <div className="text-stone-500 text-xs mb-2">{s.reasoning}</div>
          <div className="flex gap-2 flex-wrap text-xs">
            {s.suggested_project && (
              <span className="bg-stone-800 px-2 py-0.5 rounded">project: {s.suggested_project}</span>
            )}
            {s.suggested_source && (
              <span className="bg-stone-800 px-2 py-0.5 rounded">from: {s.suggested_source}</span>
            )}
            {s.suggested_task_type && (
              <span className="bg-stone-800 px-2 py-0.5 rounded">type: {s.suggested_task_type}</span>
            )}
            {s.suggested_priority && (
              <span className="bg-stone-800 px-2 py-0.5 rounded">priority: {s.suggested_priority}</span>
            )}
            {s.suggested_due && (
              <span className="bg-stone-800 px-2 py-0.5 rounded">due: {s.suggested_due}</span>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() =>
                onAccept(s.id, {
                  status: "active",
                  project: s.suggested_project,
                  source: s.suggested_source,
                  task_type: s.suggested_task_type,
                  priority: s.suggested_priority as any,
                  due: s.suggested_due,
                })
              }
              className="text-xs px-2.5 py-1 bg-stone-800 text-stone-200 rounded hover:bg-stone-700 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onDismiss}
        className="mt-3 text-xs text-stone-500 hover:text-stone-300 transition-colors"
      >
        Dismiss all
      </button>
    </div>
  );
}
