import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface ProjectsViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
}

export default function ProjectsView({ tasks, onUpdate }: ProjectsViewProps) {
  const active = tasks.filter((t) => t.status === "active");
  const grouped = new Map<string, Task[]>();

  for (const task of active) {
    const project = task.project || "No project";
    const list = grouped.get(project) || [];
    list.push(task);
    grouped.set(project, list);
  }

  if (grouped.size === 0) {
    return (
      <div className="text-stone-500 text-sm py-4 text-center">
        No active tasks.
      </div>
    );
  }

  return (
    <div className="mt-4">
      {Array.from(grouped.entries()).map(([project, projectTasks]) => (
        <div key={project} className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
            {project}
          </div>
          {projectTasks.map((task) => (
            <TaskRow key={task.id} task={task} onUpdate={onUpdate} />
          ))}
        </div>
      ))}
    </div>
  );
}
