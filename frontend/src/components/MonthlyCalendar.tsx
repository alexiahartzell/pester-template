import type { Task } from "../api/tasks";

interface MonthlyCalendarProps {
  tasks: Task[];
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

export default function MonthlyCalendar({ tasks }: MonthlyCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.toISOString().split("T")[0];

  const days = getDaysInMonth(year, month);
  const firstDow = days[0].getDay(); // 0=Sun

  // Group tasks by due date
  const tasksByDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.due || t.status === "dropped") continue;
    const existing = tasksByDate.get(t.due) || [];
    existing.push(t);
    tasksByDate.set(t.due, existing);
  }

  // Leading empty cells for alignment
  const blanks = Array.from({ length: firstDow }, (_, i) => i);

  const monthName = new Date(year, month).toLocaleString(undefined, { month: "long", year: "numeric" });

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
          const dayTasks = tasksByDate.get(iso) || [];
          const hasHard = dayTasks.some((t) => t.deadline_type === "hard");

          // Get unique categories for dots
          const cats = [...new Set(dayTasks.map((t) => t.category).filter(Boolean))];

          return (
            <div
              key={iso}
              className={`relative rounded-lg p-1.5 min-h-[3rem] text-center transition-colors
                ${isToday ? "ring-1 ring-subtle bg-surface-hover" : "hover:bg-surface-hover"}`}
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
                      className={`w-1.5 h-1.5 rounded-full`}
                      style={{ backgroundColor: getCategoryHex(cat!) }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline hex lookup to avoid importing from WeeklyPieChart
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
