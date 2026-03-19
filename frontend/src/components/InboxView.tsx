import type { Task } from "../api/tasks";
import TaskRow from "./TaskRow";

interface InboxViewProps {
  tasks: Task[];
  onUpdate: (id: number, data: Partial<Task>) => void;
}

export default function InboxView({ tasks, onUpdate }: InboxViewProps) {
  const inbox = tasks.filter((t) => t.status === "inbox");

  if (inbox.length === 0) {
    return (
      <div className="text-stone-500 text-sm py-4 text-center">
        Inbox is empty.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-3">
        Inbox
      </div>
      {inbox.map((task) => (
        <TaskRow key={task.id} task={task} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
