import { useState } from "react";
import type { Task } from "../api/tasks";
import { getCategoryColor, CATEGORIES } from "../categoryColors";

interface InboxSuggestion {
  id: number;
  title: string;
  suggested_category: string | null;
  suggested_project: string | null;
  suggested_task_type: string | null;
  suggested_priority: string | null;
  suggested_due: string | null;
  suggested_deadline_type: string | null;
  reasoning: string;
  needs_clarification?: boolean;
  clarification_prompt?: string | null;
}

interface Edits {
  title?: string;
  category?: string;
  priority?: string;
  due?: string;
  deadline_type?: string;
}

interface StandupFlowProps {
  suggestions: InboxSuggestion[] | null;
  onAccept: (id: number, data: Partial<Task>) => void;
  onDismiss: () => void;
}

export default function StandupFlow({ suggestions, onAccept, onDismiss }: StandupFlowProps) {
  const [edits, setEdits] = useState<Record<number, Edits>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (!suggestions || suggestions.length === 0) return null;

  const getEdit = (id: number): Edits => edits[id] || {};
  const setEdit = (id: number, patch: Partial<Edits>) =>
    setEdits({ ...edits, [id]: { ...getEdit(id), ...patch } });

  return (
    <div className="mb-10 bg-surface rounded-xl border border-border p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-cat-my-admin mb-3">
        Sort new tasks
      </div>
      <p className="text-muted text-sm mb-5">
        The AI categorized your new tasks. Click edit to adjust, or accept as-is.
      </p>
      {suggestions.map((s) => {
        const needsClarification = s.needs_clarification && s.clarification_prompt;
        const e = getEdit(s.id);
        const isExpanded = expanded[s.id] || needsClarification;

        const title = e.title ?? s.title;
        const category = e.category ?? s.suggested_category ?? "";
        const priority = e.priority ?? s.suggested_priority ?? "medium";
        const due = e.due ?? s.suggested_due ?? "";
        const deadlineType = e.deadline_type ?? s.suggested_deadline_type ?? "";

        return (
          <div key={s.id} className="border-b border-border last:border-0 py-4">
            <div className="text-base text-text mb-1">{s.title}</div>
            <div className="text-muted text-sm mb-3">{s.reasoning}</div>

            {needsClarification && (
              <div className="text-sm text-warm mb-3">{s.clarification_prompt}</div>
            )}

            <div className="flex gap-2 flex-wrap text-xs mb-3">
              {category && (
                <span className={`px-2.5 py-1 rounded-lg bg-surface-hover ${getCategoryColor(category)}`}>
                  {category}
                </span>
              )}
              {s.suggested_project && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">project: {s.suggested_project}</span>
              )}
              {priority && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">priority: {priority}</span>
              )}
              {due && (
                <span className="bg-surface-hover px-2.5 py-1 rounded-lg">
                  due: {due}{deadlineType ? ` (${deadlineType})` : ""}
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(ev) => setEdit(s.id, { title: ev.target.value })}
                    className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(ev) => setEdit(s.id, { category: ev.target.value })}
                    className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                  >
                    <option value="">None</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(ev) => setEdit(s.id, { priority: ev.target.value })}
                    className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Due</label>
                  <input
                    type="date"
                    value={due}
                    onChange={(ev) => setEdit(s.id, { due: ev.target.value })}
                    className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Deadline</label>
                  <select
                    value={deadlineType}
                    onChange={(ev) => setEdit(s.id, { deadline_type: ev.target.value })}
                    className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                  >
                    <option value="">None</option>
                    <option value="hard">hard</option>
                    <option value="soft">soft</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isExpanded && (
                <button
                  onClick={() => setExpanded({ ...expanded, [s.id]: true })}
                  className="text-sm px-3.5 py-1.5 text-muted rounded-lg hover:text-text transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() =>
                  onAccept(s.id, {
                    title,
                    status: "active",
                    category: category || null,
                    project: s.suggested_project,
                    task_type: s.suggested_task_type,
                    priority: priority as any,
                    due: due || null,
                    deadline_type: deadlineType || null,
                  })
                }
                className="text-sm px-3.5 py-1.5 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
              >
                Accept
              </button>
            </div>
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
