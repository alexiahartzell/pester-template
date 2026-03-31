import { useState } from "react";
import { ai, type Period } from "../api/tasks";

interface TimeSheetProps {
  periods: Period[];
  clockedIn: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

function formatTime12(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

function toTimeInput(iso: string): string {
  // Handle both "2026-03-31T08:00:00" and full ISO with timezone
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fromTimeInput(timeStr: string, dateIso: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  // Build local datetime string to avoid UTC offset issues
  return `${dateIso}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export default function TimeSheet({ periods, clockedIn, onUpdate, onClose }: TimeSheetProps) {
  const [editing, setEditing] = useState(false);
  const [editPeriods, setEditPeriods] = useState(
    periods.map((p) => ({
      start: toTimeInput(p.start),
      end: p.end ? toTimeInput(p.end) : "",
    }))
  );

  const todayIso = new Date().toISOString().split("T")[0];

  const handleClockIn = async () => {
    await ai.clockIn();
    onUpdate();
  };

  const handleClockOut = async () => {
    await ai.clockOut();
    onUpdate();
  };

  const handleSave = async () => {
    const newPeriods: Period[] = editPeriods
      .filter((p) => p.start)
      .map((p) => ({
        start: fromTimeInput(p.start, todayIso),
        end: p.end ? fromTimeInput(p.end, todayIso) : null,
      }));
    await ai.updatePeriods(newPeriods);
    setEditing(false);
    onUpdate();
  };

  const addPeriod = () => {
    setEditPeriods([...editPeriods, { start: "", end: "" }]);
  };

  const removePeriod = (i: number) => {
    setEditPeriods(editPeriods.filter((_, j) => j !== i));
  };

  const updatePeriod = (i: number, field: "start" | "end", val: string) => {
    const copy = [...editPeriods];
    copy[i] = { ...copy[i], [field]: val };
    setEditPeriods(copy);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text text-lg font-medium">Time sheet</h2>
          <button onClick={onClose} className="text-muted hover:text-text text-sm">close</button>
        </div>

        {!editing ? (
          <>
            {/* Display mode */}
            <div className="space-y-2 mb-4">
              {periods.length === 0 && (
                <div className="text-muted text-sm">No periods logged today.</div>
              )}
              {periods.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-text">{formatTime12(p.start)}</span>
                  <span className="text-muted">→</span>
                  <span className={p.end ? "text-text" : "text-done"}>
                    {p.end ? formatTime12(p.end) : "now"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {clockedIn ? (
                <button
                  onClick={handleClockOut}
                  className="text-sm px-4 py-2 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
                >
                  Clock out
                </button>
              ) : (
                <button
                  onClick={handleClockIn}
                  className="text-sm px-4 py-2 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
                >
                  Clock in
                </button>
              )}
              <button
                onClick={() => {
                  setEditPeriods(periods.map((p) => ({
                    start: toTimeInput(p.start),
                    end: p.end ? toTimeInput(p.end) : "",
                  })));
                  setEditing(true);
                }}
                className="text-sm px-4 py-2 text-muted rounded-lg hover:text-text transition-colors"
              >
                Edit
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Edit mode */}
            <div className="space-y-3 mb-4">
              {editPeriods.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={p.start}
                    onChange={(e) => updatePeriod(i, "start", e.target.value)}
                    className="bg-bg text-text px-3 py-2 rounded-lg border border-border outline-none text-sm w-28"
                  />
                  <span className="text-muted text-sm">→</span>
                  <input
                    type="time"
                    value={p.end}
                    onChange={(e) => updatePeriod(i, "end", e.target.value)}
                    placeholder="now"
                    className="bg-bg text-text px-3 py-2 rounded-lg border border-border outline-none text-sm w-28"
                  />
                  <button
                    onClick={() => removePeriod(i)}
                    className="text-muted hover:text-urgent text-sm px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={addPeriod}
                className="text-sm px-4 py-2 text-muted rounded-lg hover:text-text transition-colors"
              >
                + add period
              </button>
              <button
                onClick={handleSave}
                className="text-sm px-4 py-2 bg-surface-hover text-text rounded-lg hover:bg-border transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm px-4 py-2 text-muted rounded-lg hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
