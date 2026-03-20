import type { Stats } from "../api/tasks";

interface SummaryCardsProps {
  stats: Stats;
  activeView: string | null;
  onToggleView: (view: string) => void;
}

function getCardColor(key: string, count: number): string {
  if (key === "inbox") {
    if (count === 0) return "text-muted";
    if (count <= 3) return "text-cat-my-admin";
    return "text-urgent";
  }
  if (key === "this_week") {
    if (count === 0) return "text-muted";
    if (count <= 5) return "text-subtle";
    return "text-urgent";
  }
  return "text-subtle";
}

const cards = [
  { key: "inbox", label: "New" },
  { key: "this_week", label: "This week" },
  { key: "categories", label: "Categories" },
  { key: "projects", label: "Projects" },
] as const;

export default function SummaryCards({ stats, activeView, onToggleView }: SummaryCardsProps) {
  return (
    <div className="flex gap-3">
      {cards.map(({ key, label }) => {
        const count = stats[key as keyof Stats] ?? 0;
        const color = getCardColor(key, count);
        return (
          <button
            key={key}
            onClick={() => onToggleView(key)}
            className={`flex-1 bg-surface p-5 rounded-xl text-left transition-colors
              ${activeView === key ? "ring-1 ring-subtle" : "hover:bg-surface-hover"}`}
          >
            <div className={`text-xs font-semibold ${color} mb-1.5`}>{label}</div>
            <div className="text-2xl font-light text-text">
              {count}
            </div>
          </button>
        );
      })}
    </div>
  );
}
