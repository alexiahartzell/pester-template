import { useEffect, useState, useCallback } from "react";
import { tasks as tasksApi, ai, type Task, type Stats, type DayPlan, type HoursData } from "./api/tasks";
import CaptureBar from "./components/CaptureBar";
import TaskList from "./components/TaskList";
import SummaryCards from "./components/SummaryCards";
import InboxView from "./components/InboxView";
import WeekView from "./components/WeekView";
import ProjectsView from "./components/ProjectsView";
import CategoryView from "./components/CategoryView";
import StandupFlow from "./components/StandupFlow";
import ReviewFlow from "./components/ReviewFlow";
import CompletionTracker from "./components/CompletionTracker";
import RecentlyDone from "./components/RecentlyDone";
import WeeklyPieChart from "./components/WeeklyPieChart";
import TimeSheet from "./components/TimeSheet";
import MonthlyCalendar from "./components/MonthlyCalendar";

export default function App() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ inbox: 0, this_week: 0, overdue: 0, done_today: 0, projects: 0, categories: 0 });
  const [plan, setPlan] = useState<DayPlan>({ date: "", plan: [], deferred: [], note: null });
  const [activeView, setActiveView] = useState<string | null>(null);
  const [standupSuggestions, setStandupSuggestions] = useState<any[] | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [hours, setHours] = useState<HoursData | null>(null);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    const [taskList, statsData, planData, hoursData] = await Promise.all([
      tasksApi.list(),
      tasksApi.stats(),
      ai.todayPlan(),
      ai.hours(),
    ]);
    setAllTasks(taskList);
    setStats(statsData);
    setPlan(planData);
    setHours(hoursData);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCapture = async (title: string) => {
    await tasksApi.create(title);
    refresh();
  };

  const handleUpdate = async (id: number, data: Partial<Task>) => {
    await tasksApi.update(id, data);
    refresh();
  };

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id);
    refresh();
  };

  const handleProcessInbox = async () => {
    setLoadingProcess(true);
    try {
      const result = await ai.processInbox();
      if (result.inbox_suggestions && Array.isArray(result.inbox_suggestions) && result.inbox_suggestions.length > 0) {
        setStandupSuggestions(result.inbox_suggestions);
      }
    } finally {
      setLoadingProcess(false);
    }
  };

  const handlePlanDay = async () => {
    setLoadingPlan(true);
    try {
      await ai.planDay();
      refresh();
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleRunReview = async () => {
    setLoadingReview(true);
    try {
      const result = await ai.review();
      setReviewData(result);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleReviewAction = async (id: number, action: "tomorrow" | "drop" | "done") => {
    if (action === "drop") {
      await tasksApi.update(id, { status: "dropped" });
    } else if (action === "done") {
      await tasksApi.update(id, { status: "done" });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await tasksApi.update(id, { due: tomorrow.toISOString().split("T")[0] });
    }
    refresh();
  };

  const toggleView = (view: string) => {
    setActiveView(activeView === view ? null : view);
  };

  const formatHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-subtle text-base font-semibold tracking-wide">
            pester
          </h1>
          {hours && hours.periods.length > 0 && (
            <div className="text-xs text-muted mt-1">
              {formatHours(hours.today_hours)} today &middot; {formatHours(hours.week_hours)} this week
              {hours.avg_hours_per_week != null && (
                <> &middot; avg {formatHours(hours.avg_hours_per_week)}/wk</>
              )}
              <button
                onClick={() => setShowTimeSheet(true)}
                className="ml-2 text-muted hover:text-text transition-colors"
              >
                {hours.clocked_in ? "⏱" : "⏱ clocked out"}
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleProcessInbox}
            disabled={loadingProcess}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loadingProcess ? "Running..." : "Process new"}
          </button>
          <button
            onClick={handlePlanDay}
            disabled={loadingPlan}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loadingPlan ? "Running..." : "Plan my day"}
          </button>
          <button
            onClick={handleRunReview}
            disabled={loadingReview}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loadingReview ? "Running..." : "Review"}
          </button>
        </div>
      </div>

      <CaptureBar onCapture={handleCapture} />

      {standupSuggestions && (
        <StandupFlow
          suggestions={standupSuggestions}
          onAccept={async (originalId, data) => {
            try {
              await tasksApi.createFull({
                title: data.title!,
                category: data.category,
                project: data.project,
                priority: data.priority || "medium" as any,
                due: data.due,
                deadline_type: data.deadline_type,
                difficulty: data.difficulty,
                start_time: data.start_time,
                end_time: data.end_time,
                recurrence: data.recurrence,
                status: "active",
              });
              await tasksApi.update(originalId, { status: "dropped" });
              setStandupSuggestions((prev) =>
                prev ? prev.filter((s) => s.original_id !== originalId) : null
              );
              refresh();
            } catch (err) {
              console.error("Accept failed:", err);
            }
          }}
          onDismiss={() => setStandupSuggestions(null)}
        />
      )}

      {reviewData && (
        <ReviewFlow
          completed={reviewData.completed || []}
          uncompleted={reviewData.uncompleted || []}
          summary={reviewData.summary || ""}
          onAction={handleReviewAction}
          onDismiss={() => setReviewData(null)}
        />
      )}

      <TaskList
        tasks={allTasks}
        plan={plan.plan}
        planDate={plan.date || null}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {plan.note && (
        <div className="text-muted text-sm italic mb-8 px-1">{plan.note}</div>
      )}

      <SummaryCards
        stats={stats}
        activeView={activeView}
        onToggleView={toggleView}
      />

      {activeView === "inbox" && (
        <InboxView tasks={allTasks} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
      {activeView === "this_week" && (
        <WeekView tasks={allTasks} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
      {activeView === "categories" && (
        <CategoryView tasks={allTasks} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}
      {activeView === "projects" && (
        <ProjectsView tasks={allTasks} onUpdate={handleUpdate} onDelete={handleDelete} />
      )}

      <RecentlyDone
        tasks={allTasks}
        onUndo={async (id) => {
          await tasksApi.update(id, { status: "active" });
          refresh();
        }}
      />

      <MonthlyCalendar tasks={allTasks} onUpdate={handleUpdate} onDelete={handleDelete} />

      <WeeklyPieChart refreshKey={refreshKey} />
      <CompletionTracker refreshKey={refreshKey} />

      {showTimeSheet && hours && (
        <TimeSheet
          periods={hours.periods}
          clockedIn={hours.clocked_in}
          onUpdate={() => { refresh(); }}
          onClose={() => setShowTimeSheet(false)}
        />
      )}
    </div>
  );
}
