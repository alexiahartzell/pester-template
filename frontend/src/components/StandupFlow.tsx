import { useState } from "react";
import type { Task } from "../api/tasks";
import { CATEGORIES } from "../categoryColors";

export interface InboxSuggestion {
  original_id: number;
  original_title: string;
  suggested_title: string;
  suggested_category: string | null;
  suggested_project: string | null;
  suggested_priority: string | null;
  suggested_due: string | null;
  suggested_deadline_type: string | null;
  suggested_difficulty: string | null;
  suggested_start_time: string | null;
  suggested_end_time: string | null;
  suggested_recurrence: string | null;
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
  difficulty?: string;
  start_time?: string;
  end_time?: string;
  recurrence?: string;
  project?: string;
}

interface StandupFlowProps {
  suggestions: InboxSuggestion[] | null;
  onAccept: (originalId: number, data: Partial<Task>) => void;
  onDismiss: () => void;
}

export default function StandupFlow({ suggestions, onAccept, onDismiss }: StandupFlowProps) {
  const [edits, setEdits] = useState<Record<number, Edits>>({});

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
        Review and adjust each task, then accept.
      </p>
      {suggestions.map((s) => {
        const e = getEdit(s.original_id);

        const title = e.title ?? s.suggested_title;
        const category = e.category ?? s.suggested_category ?? "";
        const priority = e.priority ?? s.suggested_priority ?? "medium";
        const due = e.due ?? s.suggested_due ?? "";
        const deadlineType = e.deadline_type ?? s.suggested_deadline_type ?? "";
        const difficulty = e.difficulty ?? s.suggested_difficulty ?? "";
        const startTime = e.start_time ?? s.suggested_start_time ?? "";
        const endTime = e.end_time ?? s.suggested_end_time ?? "";
        const recurrence = e.recurrence ?? s.suggested_recurrence ?? "";
        const project = e.project ?? s.suggested_project ?? "";

        return (
          <div key={s.original_id} className="border-b border-border last:border-0 py-5">
            {s.original_title.toLowerCase() !== s.suggested_title.toLowerCase() && (
              <div className="text-sm text-muted line-through mb-1">{s.original_title}</div>
            )}
            <div className="text-muted text-sm mb-3">{s.reasoning}</div>

            {s.needs_clarification && s.clarification_prompt && (
              <div className="text-sm text-warm mb-3">{s.clarification_prompt}</div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(ev) => setEdit(s.original_id, { title: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(ev) => setEdit(s.original_id, { category: ev.target.value })}
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
                  onChange={(ev) => setEdit(s.original_id, { priority: ev.target.value })}
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
                  onChange={(ev) => setEdit(s.original_id, { due: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Deadline</label>
                <select
                  value={deadlineType}
                  onChange={(ev) => setEdit(s.original_id, { deadline_type: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                >
                  <option value="">None</option>
                  <option value="hard">hard</option>
                  <option value="soft">soft</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(ev) => setEdit(s.original_id, { difficulty: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                >
                  <option value="">None</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(ev) => setEdit(s.original_id, { start_time: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(ev) => setEdit(s.original_id, { end_time: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(ev) => setEdit(s.original_id, { recurrence: ev.target.value })}
                  className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                >
                  <option value="">None</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Project</label>
                <input
                  type="text"
                  value={project}
                  onChange={(ev) => setEdit(s.original_id, { project: ev.target.value })}
                  className="w-full bg-bg text-text placeholder-muted px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                onAccept(s.original_id, {
                  title,
                  status: "active",
                  category: category || null,
                  project: project || null,
                  priority: (priority || "medium") as any,
                  due: due || null,
                  deadline_type: deadlineType || null,
                  difficulty: difficulty || null,
                  start_time: startTime || null,
                  end_time: endTime || null,
                  recurrence: recurrence || null,
                });
              }}
              className="text-sm px-4 py-2 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
            >
              Accept
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
