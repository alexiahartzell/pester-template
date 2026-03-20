import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface WeekViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
}

export default function WeekView({ tasks, onUpdate }: WeekViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekTasks = tasks
    .filter((t) => {
      if (t.status !== "active" || !t.due) return false;
      const d = new Date(t.due + "T00:00:00");
      return d <= weekEnd;
    })
    .sort((a, b) => (a.due! > b.due! ? 1 : -1));

  if (weekTasks.length === 0) {
    return (
      <div className="text-muted text-base py-6 text-center">
        Nothing due this week.
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
        This week
      </div>
      {weekTasks.map((task) => (
        <TaskRow key={task.id} task={task} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
