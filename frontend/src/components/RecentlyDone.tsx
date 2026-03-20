import type { Task } from "../api/tasks";
import { getCategoryColor } from "../categoryColors";

interface RecentlyDoneProps {
  tasks: Task[];
  onUndo: (id: number) => void;
}

export default function RecentlyDone({ tasks, onUndo }: RecentlyDoneProps) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 7) % 7)); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  const recentDone = tasks.filter((t) => {
    if (t.status !== "done" || !t.completed_at) return false;
    return new Date(t.completed_at) >= weekStart;
  });

  if (recentDone.length === 0) return null;

  return (
    <div className="mt-8 bg-surface rounded-xl p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
        Done this week
      </div>
      <div className="space-y-2">
        {recentDone.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-2">
            <span className="flex-1 text-sm text-muted line-through">{t.title}</span>
            {t.category && (
              <span className={`text-xs ${getCategoryColor(t.category)}`}>{t.category}</span>
            )}
            <button
              onClick={() => onUndo(t.id)}
              className="text-xs px-3 py-1.5 text-muted rounded-lg hover:text-text hover:bg-surface-hover transition-colors"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
