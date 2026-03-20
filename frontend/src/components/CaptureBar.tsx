import { useState } from "react";

interface CaptureBarProps {
  onCapture: (title: string) => void;
}

export default function CaptureBar({ onCapture }: CaptureBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onCapture(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-10">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task..."
        className="w-full bg-surface text-text placeholder-muted
                   px-5 py-4 rounded-xl border border-border text-base
                   outline-none focus:border-subtle transition-colors"
      />
    </form>
  );
}
