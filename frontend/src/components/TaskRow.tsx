import { useState } from "react";
import type { Task } from "../api/tasks";
import { getCategoryColor, getCategoryBorderColor, CATEGORIES } from "../categoryColors";

function getTypeLabel(task: Task): string {
  if (task.due) {
    const dueDate = new Date(task.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const suffix = task.deadline_type === "hard" ? " (hard)" : task.deadline_type === "soft" ? " (soft)" : "";
    if (dueDate.getTime() === today.getTime()) return "due today" + suffix;
    if (dueDate < today) return "overdue" + suffix;
  }
  return task.task_type || "";
}

interface TaskRowProps {
  task: Task;
  onUpdate: (id: number, data: Partial<Task>) => void;
}

export default function TaskRow({ task, onUpdate }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDue, setEditDue] = useState(task.due || "");
  const [editDeadlineType, setEditDeadlineType] = useState(task.deadline_type || "");
  const [editSource, setEditSource] = useState(task.source || "");
  const [editProject, setEditProject] = useState(task.project || "");
  const [editCategory, setEditCategory] = useState(task.category || "");
  const [editPriority, setEditPriority] = useState<Task["priority"]>(task.priority || "medium");
  const [editNotes, setEditNotes] = useState(task.notes || "");

  const isDone = task.status === "done";
  const isOverdue = task.due && new Date(task.due + "T00:00:00") < new Date(new Date().toDateString());
  const isHighPriority = task.priority === "high";
  const typeLabel = getTypeLabel(task);

  // Color priority: overdue > high priority > category
  let borderColor = getCategoryBorderColor(task.category);
  let labelColor = getCategoryColor(task.category);
  if (isHighPriority && !isOverdue) {
    borderColor = "border-l-warm";
  }
  if (isOverdue) {
    borderColor = "border-l-urgent";
    labelColor = "text-urgent";
  }

  const handleCheck = () => {
    onUpdate(task.id, { status: isDone ? "active" : "done" });
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      due: editDue || null,
      deadline_type: editDeadlineType || null,
      source: editSource || null,
      project: editProject || null,
      category: editCategory || null,
      priority: editPriority as Task["priority"],
      notes: editNotes || null,
    });
    setExpanded(false);
  };

  const handleDrop = () => {
    onUpdate(task.id, { status: "dropped" });
    setExpanded(false);
  };

  return (
    <div className={`bg-surface rounded-xl border-l-[3px] ${borderColor} mb-2`}>
      <div
        className="flex items-center px-5 py-4 cursor-pointer gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCheck();
          }}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors
            ${isDone
              ? "bg-done border-done"
              : "border-muted hover:border-subtle"
            }`}
        />
        <span className={`flex-1 text-base ${isDone ? "line-through text-muted" : ""}`}>
          {task.title}
        </span>
        {task.category && (
          <span className={`text-xs font-medium ${getCategoryColor(task.category)} flex-shrink-0`}>
            {task.category}
          </span>
        )}
        {typeLabel && (
          <span className={`text-xs font-medium ${labelColor} flex-shrink-0`}>
            {typeLabel}
          </span>
        )}
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Due</label>
              <input
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Deadline</label>
              <select
                value={editDeadlineType}
                onChange={(e) => setEditDeadlineType(e.target.value)}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              >
                <option value="">None</option>
                <option value="hard">Hard</option>
                <option value="soft">Soft</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              >
                <option value="">None</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Project</label>
              <input
                value={editProject}
                onChange={(e) => setEditProject(e.target.value)}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Source</label>
              <input
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted block mb-1.5">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg text-text px-4 py-2.5 rounded-lg border border-border outline-none text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-surface-hover text-text rounded-lg text-sm hover:bg-border transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleDrop}
              className="px-4 py-2 text-muted rounded-lg text-sm hover:text-urgent transition-colors"
            >
              Drop
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-4 py-2 text-muted rounded-lg text-sm hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
