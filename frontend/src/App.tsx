import { useEffect, useState, useCallback } from "react";
import { tasks as tasksApi, ai, type Task, type Stats, type DayPlan, type HoursData } from "./api/tasks";
import CaptureBar from "./components/CaptureBar";
import TaskList from "./components/TaskList";
import SummaryCards from "./components/SummaryCards";
import InboxView from "./components/InboxView";
import WeekView from "./components/WeekView";
import ProjectsView from "./components/ProjectsView";
import CategoryView from "./components/CategoryView";
import PlansChanged from "./components/PlansChanged";
import StandupFlow from "./components/StandupFlow";
import ReviewFlow from "./components/ReviewFlow";
import CompletionTracker from "./components/CompletionTracker";
import WeeklyPieChart from "./components/WeeklyPieChart";

export default function App() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ inbox: 0, this_week: 0, overdue: 0, done_today: 0, projects: 0, categories: 0 });
  const [plan, setPlan] = useState<DayPlan>({ date: "", plan: [], deferred: [], note: null });
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showPlansChanged, setShowPlansChanged] = useState(false);
  const [reprioritizing, setReprioritizing] = useState(false);
  const [standupSuggestions, setStandupSuggestions] = useState<any[] | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [loadingStandup, setLoadingStandup] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [hours, setHours] = useState<HoursData | null>(null);

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

  const handleRunStandup = async () => {
    setLoadingStandup(true);
    try {
      const result = await ai.standup();
      if (result.inbox_suggestions && Array.isArray(result.inbox_suggestions)) {
        setStandupSuggestions(result.inbox_suggestions);
      }
      refresh();
    } finally {
      setLoadingStandup(false);
    }
  };

  const handleReprioritize = async (context: string) => {
    setReprioritizing(true);
    try {
      await ai.reprioritize(context);
      refresh();
      setShowPlansChanged(false);
    } finally {
      setReprioritizing(false);
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
          {hours && hours.started && (
            <div className="text-xs text-muted mt-1">
              {formatHours(hours.today_hours)} today &middot; {formatHours(hours.week_hours)} this week
              {hours.avg_hours_per_week != null && (
                <> &middot; avg {formatHours(hours.avg_hours_per_week)}/wk</>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRunStandup}
            disabled={loadingStandup}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loadingStandup ? "Running..." : "Plan my day"}
          </button>
          <button
            onClick={() => setShowPlansChanged(true)}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors"
          >
            Reshuffle
          </button>
          <button
            onClick={handleRunReview}
            disabled={loadingReview}
            className="text-sm px-4 py-2 bg-surface border border-border text-text rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {loadingReview ? "Running..." : "Wrap up"}
          </button>
        </div>
      </div>

      <CaptureBar onCapture={handleCapture} />

      {standupSuggestions && (
        <StandupFlow
          suggestions={standupSuggestions}
          onAccept={async (id, data) => {
            await handleUpdate(id, data);
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
        onUpdate={handleUpdate}
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
        <InboxView tasks={allTasks} onUpdate={handleUpdate} />
      )}
      {activeView === "this_week" && (
        <WeekView tasks={allTasks} onUpdate={handleUpdate} />
      )}
      {activeView === "categories" && (
        <CategoryView tasks={allTasks} onUpdate={handleUpdate} />
      )}
      {activeView === "projects" && (
        <ProjectsView tasks={allTasks} onUpdate={handleUpdate} />
      )}

      <WeeklyPieChart />
      <CompletionTracker />

      {showPlansChanged && (
        <PlansChanged
          onSubmit={handleReprioritize}
          onClose={() => setShowPlansChanged(false)}
          loading={reprioritizing}
        />
      )}
    </div>
  );
}
