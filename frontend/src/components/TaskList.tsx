import type { Task, PlanItem } from "../api/tasks";
import TaskRow from "./TaskRow";

interface TaskListProps {
  tasks: Task[];
  plan: PlanItem[];
  onUpdate: (id: number, data: Partial<Task>) => void;
}

export default function TaskList({ tasks, plan, onUpdate }: TaskListProps) {
  const planIds = plan.map((p) => p.id);
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const ordered: Task[] = [];
  for (const id of planIds) {
    const t = taskMap.get(id);
    if (t && t.status === "active") ordered.push(t);
  }
  for (const t of tasks) {
    if (t.status === "active" && !planIds.includes(t.id)) ordered.push(t);
  }

  if (ordered.length === 0) {
    return (
      <div className="text-stone-500 text-sm py-8 text-center">
        No tasks for today. Run standup to generate a plan, or capture something above.
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
        Today
      </div>
      {ordered.map((task) => (
        <TaskRow key={task.id} task={task} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
