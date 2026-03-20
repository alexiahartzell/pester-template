import { useEffect, useState } from "react";
import { tasks as tasksApi, type CompletionData } from "../api/tasks";
import { getCategoryColor } from "../categoryColors";

function pctColor(pct: number): string {
  if (pct >= 75) return "bg-done";
  if (pct >= 50) return "bg-cat-my-admin";
  return "bg-urgent";
}

function pctTextColor(pct: number): string {
  if (pct >= 75) return "text-done";
  if (pct >= 50) return "text-cat-my-admin";
  return "text-urgent";
}

export default function CompletionTracker({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<CompletionData | null>(null);

  useEffect(() => {
    tasksApi.completion(4).then(setData);
  }, [refreshKey]);

  if (!data) return null;

  const cats = Object.entries(data.categories);

  return (
    <div className="mt-8 bg-surface rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-subtle">
          Completion rate
        </div>
        <div className={`text-3xl font-light ${pctTextColor(data.total_pct)}`}>
          {data.total_pct}%
        </div>
      </div>

      {data.total_resolved === 0 ? (
        <div className="text-muted text-sm">
          No completed or dropped tasks yet. Data will appear as you finish tasks.
        </div>
      ) : (
        <div className="space-y-5">
          {cats.map(([cat, weeks]) => {
            const done = weeks.reduce((s, w) => s + w.done, 0);
            const total = weeks.reduce((s, w) => s + w.total, 0);
            const pct = total ? Math.round((done / total) * 100) : 0;

            return (
              <div key={cat}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-sm font-medium ${getCategoryColor(cat)}`}>{cat}</span>
                  <span className={`text-sm ${pctTextColor(pct)}`}>
                    {pct}% ({done}/{total})
                  </span>
                </div>
                <div className="flex gap-1">
                  {weeks.map((w) => (
                    <div
                      key={w.week}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pctColor(w.pct)}`}
                          style={{ width: `${Math.max(w.pct, w.total > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(w.week + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
