import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface ProjectsViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete?: (id: number) => void;
}

export default function ProjectsView({ tasks, onUpdate, onDelete }: ProjectsViewProps) {
  const active = tasks.filter((t) => t.status === "active");
  const grouped = new Map<string, Task[]>();

  for (const task of active) {
    if (!task.project) continue;
    const list = grouped.get(task.project) || [];
    list.push(task);
    grouped.set(task.project, list);
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
      {Array.from(grouped.entries()).map(([project, projectTasks]) => (
        <div key={project} className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
            {project}
          </div>
          {projectTasks.map((task) => (
            <TaskRow key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      ))}
    </div>
  );
}
