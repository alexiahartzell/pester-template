import type { Stats } from "../api/tasks";

interface SummaryCardsProps {
  stats: Stats;
  activeView: string | null;
  onToggleView: (view: string) => void;
}

const cards = [
  { key: "inbox", label: "Inbox", color: "text-deep" },
  { key: "this_week", label: "This week", color: "text-urgent" },
  { key: "projects", label: "Projects", color: "text-stone-400" },
] as const;

export default function SummaryCards({ stats, activeView, onToggleView }: SummaryCardsProps) {
  return (
    <div className="flex gap-2.5">
      {cards.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => onToggleView(key)}
          className={`flex-1 bg-stone-900 p-3.5 rounded-lg text-left transition-colors
            ${activeView === key ? "ring-1 ring-stone-500" : "hover:bg-stone-800/50"}`}
        >
          <div className={`text-[11px] font-semibold ${color} mb-1`}>{label}</div>
          <div className="text-[22px] font-light text-stone-200">
            {stats[key as keyof Stats]}
          </div>
        </button>
      ))}
    </div>
  );
}
