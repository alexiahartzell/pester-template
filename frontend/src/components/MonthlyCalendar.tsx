import { useState, useRef } from "react";
import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface MonthlyCalendarProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete?: (id: number) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const CAT_HEX: Record<string, string> = {
  "my research": "#5eaaee",
  "group research": "#3578c4",
  "my code": "#b98eff",
  "group code": "#8b5ecf",
  "my admin": "#ffcc44",
  "group admin": "#d4a520",
  "my meetings": "#ee8855",
  "group meetings": "#cc6633",
  "coursework": "#5ee8c0",
  "mentoring": "#f078b0",
};

function getCategoryHex(cat: string): string {
  return CAT_HEX[cat.toLowerCase()] || "#b0b0c0";
}

function DraggableTaskList({ tasks, onUpdate, onDelete }: { tasks: Task[]; onUpdate: (id: number, data: Partial<Task>) => void; onDelete?: (id: number) => void }) {
  const [order, setOrder] = useState<number[]>(tasks.map((t) => t.id));
  const dragId = useRef<number | null>(null);

  // Reset order when tasks change
  const taskIds = tasks.map((t) => t.id).join(",");
  const [prevIds, setPrevIds] = useState(taskIds);
  if (taskIds !== prevIds) {
    setOrder(tasks.map((t) => t.id));
    setPrevIds(taskIds);
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const display = order.map((id) => taskMap.get(id)).filter(Boolean) as Task[];

  return (
    <>
      {display.map((t) => (
        <div
          key={t.id}
          draggable
          onDragStart={() => { dragId.current = t.id; }}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragId.current === null || dragId.current === t.id) return;
            setOrder((prev) => {
              const ids = [...prev];
              const from = ids.indexOf(dragId.current!);
              const to = ids.indexOf(t.id);
              if (from === -1 || to === -1) return prev;
              ids.splice(from, 1);
              ids.splice(to, 0, dragId.current!);
              return ids;
            });
          }}
          onDragEnd={() => { dragId.current = null; }}
          className={dragId.current === t.id ? "opacity-50" : ""}
        >
          <TaskRow task={t} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      ))}
    </>
  );
}

export default function MonthlyCalendar({ tasks, onUpdate, onDelete }: MonthlyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.toISOString().split("T")[0];

  const days = getDaysInMonth(year, month);
  const firstDow = days[0].getDay();

  // Group tasks by due date
  const tasksByDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.due || t.status === "dropped") continue;
    const existing = tasksByDate.get(t.due) || [];
    existing.push(t);
    tasksByDate.set(t.due, existing);
  }

  const blanks = Array.from({ length: firstDow }, (_, i) => i);
  const monthName = new Date(year, month).toLocaleString(undefined, { month: "long", year: "numeric" });
  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) || []) : [];

  return (
    <div className="mt-8 bg-surface rounded-xl p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
        {monthName}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10px] text-muted text-center pb-2 font-medium">
            {d}
          </div>
        ))}

        {blanks.map((i) => (
          <div key={`b${i}`} />
        ))}

        {days.map((d) => {
          const iso = d.toISOString().split("T")[0];
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const dayTasks = tasksByDate.get(iso) || [];
          const hasHard = dayTasks.some((t) => t.deadline_type === "hard");
          const cats = [...new Set(dayTasks.map((t) => t.category).filter(Boolean))];

          return (
            <div
              key={iso}
              onClick={() => setSelectedDate(isSelected ? null : iso)}
              className={`relative rounded-lg p-1.5 min-h-[3rem] text-center cursor-pointer transition-colors
                ${isSelected ? "ring-1 ring-text bg-surface-hover" : ""}
                ${isToday && !isSelected ? "ring-1 ring-subtle bg-surface-hover" : ""}
                ${!isToday && !isSelected ? "hover:bg-surface-hover" : ""}`}
            >
              <div className={`text-xs ${isToday ? "text-text font-semibold" : "text-muted"}`}>
                {d.getDate()}
              </div>
              {dayTasks.length > 0 && (
                <div className={`text-[10px] mt-0.5 ${hasHard ? "text-text font-semibold" : "text-muted"}`}>
                  {dayTasks.length}
                </div>
              )}
              {cats.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {cats.slice(0, 3).map((cat) => (
                    <div
                      key={cat}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getCategoryHex(cat!) }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-3">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          {selectedTasks.length === 0 ? (
            <div className="text-muted text-sm">No tasks due this day.</div>
          ) : (
            <DraggableTaskList tasks={selectedTasks} onUpdate={onUpdate} onDelete={onDelete} />
          )}
        </div>
      )}
    </div>
  );
}
