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
    <form onSubmit={handleSubmit} className="mb-8">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task..."
        className="w-full bg-stone-900 text-stone-200 placeholder-stone-500
                   px-4 py-3.5 rounded-lg border border-stone-800
                   outline-none focus:border-stone-500 transition-colors"
      />
    </form>
  );
}
