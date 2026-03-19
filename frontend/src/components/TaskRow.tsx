import { useState } from "react";
import type { Task } from "../api/tasks";

const BORDER_COLORS: Record<string, string> = {
  urgent: "border-l-urgent",
  quick: "border-l-quick",
  "deep work": "border-l-deep",
  reading: "border-l-reading",
};

function getBorderColor(task: Task): string {
  if (task.due) {
    const dueDate = new Date(task.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate <= today) return "border-l-urgent";
  }
  if (task.task_type && BORDER_COLORS[task.task_type]) {
    return BORDER_COLORS[task.task_type];
  }
  return "border-l-stone-800";
}

function getTypeColor(task: Task): string {
  if (task.due) {
    const dueDate = new Date(task.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate <= today) return "text-urgent";
  }
  const colors: Record<string, string> = {
    quick: "text-quick",
    "deep work": "text-deep",
    reading: "text-reading",
  };
  return task.task_type ? colors[task.task_type] || "text-stone-500" : "text-stone-500";
}

function getTypeLabel(task: Task): string {
  if (task.due) {
    const dueDate = new Date(task.due + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate.getTime() === today.getTime()) return "due today";
    if (dueDate < today) return "overdue";
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
  const [editSource, setEditSource] = useState(task.source || "");
  const [editProject, setEditProject] = useState(task.project || "");
  const [editPriority, setEditPriority] = useState<Task["priority"]>(task.priority || "medium");
  const [editNotes, setEditNotes] = useState(task.notes || "");

  const isDone = task.status === "done";
  const borderColor = getBorderColor(task);
  const typeLabel = getTypeLabel(task);
  const typeColor = getTypeColor(task);

  const handleCheck = () => {
    onUpdate(task.id, { status: isDone ? "active" : "done" });
  };

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      due: editDue || null,
      source: editSource || null,
      project: editProject || null,
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
    <div className={`bg-stone-900 rounded-lg border-l-[3px] ${borderColor} mb-1.5`}>
      <div
        className="flex items-center px-4 py-3.5 cursor-pointer gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCheck();
          }}
          className={`w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 transition-colors
            ${isDone
              ? "bg-quick border-quick"
              : "border-stone-500 hover:border-stone-400"
            }`}
        />
        <span className={`flex-1 ${isDone ? "line-through text-stone-500" : ""}`}>
          {task.title}
        </span>
        {typeLabel && (
          <span className={`text-[11px] font-medium ${typeColor} flex-shrink-0`}>
            {typeLabel}
          </span>
        )}
        {task.source && (
          <span className="text-[11px] text-stone-500 flex-shrink-0 ml-3">
            {task.source}
          </span>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-stone-800 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Due</label>
              <input
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Source</label>
              <input
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Project</label>
              <input
                value={editProject}
                onChange={(e) => setEditProject(e.target.value)}
                className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
                className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-stone-500 block mb-1">Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full bg-stone-950 text-stone-200 px-3 py-2 rounded border border-stone-800 outline-none text-sm resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-stone-800 text-stone-200 rounded text-sm hover:bg-stone-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleDrop}
              className="px-3 py-1.5 text-stone-500 rounded text-sm hover:text-urgent transition-colors"
            >
              Drop
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 text-stone-500 rounded text-sm hover:text-stone-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
