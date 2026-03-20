import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";
import { getCategoryColor } from "../categoryColors";

interface CategoryViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete?: (id: number) => void;
}

export default function CategoryView({ tasks, onUpdate, onDelete }: CategoryViewProps) {
  const active = tasks.filter((t) => t.status === "active");
  const grouped = new Map<string, Task[]>();

  for (const task of active) {
    const cat = task.category || "uncategorized";
    const list = grouped.get(cat) || [];
    list.push(task);
    grouped.set(cat, list);
  }

  if (grouped.size === 0) {
    return (
      <div className="text-muted text-base py-6 text-center">
        No active tasks.
      </div>
    );
  }

  return (
    <div className="mt-5">
      {Array.from(grouped.entries()).map(([cat, catTasks]) => (
        <div key={cat} className="mb-8">
          <div className={`text-xs font-semibold uppercase tracking-wider ${getCategoryColor(cat)} mb-4`}>
            {cat}
          </div>
          {catTasks.map((task) => (
            <TaskRow key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
}
