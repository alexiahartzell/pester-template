import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface InboxViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
  onDelete?: (id: number) => void;
}

export default function InboxView({ tasks, onUpdate, onDelete }: InboxViewProps) {
  const inbox = tasks.filter((t) => t.status === "inbox");

  if (inbox.length === 0) {
    return (
      <div className="text-muted text-base py-6 text-center">
        Inbox is empty.
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">
        New
      </div>
      {inbox.map((task) => (
        <TaskRow key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
