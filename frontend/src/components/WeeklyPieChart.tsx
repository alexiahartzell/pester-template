import { useEffect, useState } from "react";
import { tasks as tasksApi, type DistributionData } from "../api/tasks";
import { getCategoryColor } from "../categoryColors";

// Raw hex values matching the CSS theme tokens
const CATEGORY_HEX: Record<string, string> = {
  "my research": "#5eaaee",
  "group research": "#3578c4",
  "my code": "#b98eff",
  "group code": "#8b5ecf",
  "my admin": "#ffcc44",
  "group admin": "#d4a520",
  "coursework": "#5ee8c0",
  "mentoring": "#f078b0",
  "my meetings": "#ee8855",
  "group meetings": "#cc6633",
};
const DEFAULT_HEX = "#b0b0c0";

function getHex(category: string): string {
  return CATEGORY_HEX[category.toLowerCase()] || DEFAULT_HEX;
}

function buildConicGradient(slices: { category: string; pct: number }[]): string {
  if (slices.length === 0) return "conic-gradient(#2e2e33 0% 100%)";
  const parts: string[] = [];
  let cursor = 0;
  for (const s of slices) {
    const color = getHex(s.category);
    parts.push(`${color} ${cursor}% ${cursor + s.pct}%`);
    cursor += s.pct;
  }
  // Fill remainder if rounding leaves a gap
  if (cursor < 100) {
    const lastColor = getHex(slices[slices.length - 1].category);
    parts[parts.length - 1] = `${lastColor} ${cursor - slices[slices.length - 1].pct}% 100%`;
  }
  return `conic-gradient(${parts.join(", ")})`;
}

export default function WeeklyPieChart() {
  const [data, setData] = useState<DistributionData | null>(null);

  useEffect(() => {
    tasksApi.distribution().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="mt-8 bg-surface rounded-xl p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-5">
        This week by category
      </div>

      {data.total === 0 ? (
        <div className="text-muted text-sm">No tasks this week yet.</div>
      ) : (
        <div className="flex items-center gap-8">
          {/* Pie */}
          <div
            className="w-32 h-32 rounded-full flex-shrink-0"
            style={{
              background: buildConicGradient(data.slices),
            }}
          />

          {/* Legend */}
          <div className="space-y-2 flex-1">
            {data.slices.map((s) => (
              <div key={s.category} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: getHex(s.category) }}
                />
                <span className={`text-sm flex-1 ${getCategoryColor(s.category)}`}>
                  {s.category}
                </span>
                <span className="text-sm text-muted">
                  {s.count} ({s.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
