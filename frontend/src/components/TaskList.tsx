import { useState } from "react";
import type { Task, PlanItem } from "../api/tasks";
import TaskRow from "./TaskRow";

interface TaskListProps {
  tasks: Task[];
  plan: PlanItem[];
  planDate: string | null;
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete?: (id: number) => void;
  onReorder?: (ids: number[]) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export default function TaskList({ tasks, plan, planDate, onUpdate, onDelete }: TaskListProps) {
  const today = new Date().toISOString().split("T")[0];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const [dragId, setDragId] = useState<number | null>(null);
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);

  const ordered: Task[] = [];
  const seen = new Set<number>();

  // 1. Planned tasks first, in plan order
  for (const p of plan) {
    const t = taskMap.get(p.id);
    if (t && t.status === "active") {
      ordered.push(t);
      seen.add(t.id);
    }
  }

  // 2. Unplanned tasks that are due today or overdue
  for (const t of tasks) {
    if (t.status === "active" && !seen.has(t.id) && t.due && t.due <= today) {
      ordered.push(t);
      seen.add(t.id);
    }
  }

  // 3. Unplanned tasks with no due date
  for (const t of tasks) {
    if (t.status === "active" && !seen.has(t.id) && !t.due) {
      ordered.push(t);
      seen.add(t.id);
    }
  }

  // Apply local drag reorder
  const displayOrder = localOrder
    ? localOrder.map((id) => ordered.find((t) => t.id === id)).filter(Boolean) as Task[]
    : ordered;

  if (displayOrder.length === 0) {
    return (
      <div className="text-muted text-base py-12 text-center">
        Nothing planned. Hit "Plan my day" or capture something above.
      </div>
    );
  }

  // Label based on what's actually showing
  const dueDates = displayOrder.map((t) => t.due).filter(Boolean) as string[];
  const uniqueDates = [...new Set(dueDates)].sort();
  let label = "Up next";
  if (plan.length > 0 && planDate) {
    label = formatDate(planDate);
  } else if (uniqueDates.length === 1) {
    label = formatDate(uniqueDates[0]);
  } else if (uniqueDates.length > 1) {
    label = `${formatDate(uniqueDates[0])} – ${formatDate(uniqueDates[uniqueDates.length - 1])}`;
  }

  const handleDragStart = (id: number) => {
    setDragId(id);
    if (!localOrder) setLocalOrder(ordered.map((t) => t.id));
  };

  const handleDragOver = (e: React.DragEvent, overId: number) => {
    e.preventDefault();
    if (dragId === null || dragId === overId || !localOrder) return;
    const ids = [...localOrder];
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(overId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragId);
    setLocalOrder(ids);
  };

  const handleDragEnd = () => {
    setDragId(null);
  };

  return (
    <div className="mb-10">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
        {label}
      </div>
      {displayOrder.map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => handleDragStart(task.id)}
          onDragOver={(e) => handleDragOver(e, task.id)}
          onDragEnd={handleDragEnd}
          className={`${dragId === task.id ? "opacity-50" : ""}`}
        >
          <TaskRow task={task} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
