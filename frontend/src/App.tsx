import { useEffect, useState, useCallback } from "react";
import { tasks as tasksApi, ai, type Task, type Stats, type DayPlan } from "./api/tasks";
import CaptureBar from "./components/CaptureBar";
import TaskList from "./components/TaskList";
import SummaryCards from "./components/SummaryCards";
import InboxView from "./components/InboxView";
import WeekView from "./components/WeekView";
import ProjectsView from "./components/ProjectsView";
import PlansChanged from "./components/PlansChanged";
import StandupFlow from "./components/StandupFlow";
import ReviewFlow from "./components/ReviewFlow";

export default function App() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats>({ inbox: 0, this_week: 0, overdue: 0, done_today: 0, projects: 0 });
  const [plan, setPlan] = useState<DayPlan>({ date: "", plan: [], deferred: [], note: null });
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showPlansChanged, setShowPlansChanged] = useState(false);
  const [reprioritizing, setReprioritizing] = useState(false);
  const [standupSuggestions, setStandupSuggestions] = useState<any[] | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);

  const refresh = useCallback(async () => {
    const [taskList, statsData, planData] = await Promise.all([
      tasksApi.list(),
      tasksApi.stats(),
      ai.todayPlan(),
    ]);
    setAllTasks(taskList);
    setStats(statsData);
    setPlan(planData);
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
    const result = await ai.standup();
    if (result.inbox_suggestions && Array.isArray(result.inbox_suggestions)) {
      setStandupSuggestions(result.inbox_suggestions);
    }
    refresh();
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
    const result = await ai.review();
    setReviewData(result);
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-stone-400 text-sm font-semibold uppercase tracking-wider">
          pester
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleRunStandup}
            className="text-xs px-3 py-1.5 text-stone-500 rounded hover:text-stone-300 hover:bg-stone-900 transition-colors"
          >
            Standup
          </button>
          <button
            onClick={() => setShowPlansChanged(true)}
            className="text-xs px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 rounded hover:bg-stone-800 transition-colors"
          >
            Plans changed
          </button>
          <button
            onClick={handleRunReview}
            className="text-xs px-3 py-1.5 text-stone-500 rounded hover:text-stone-300 hover:bg-stone-900 transition-colors"
          >
            Review
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
        <div className="text-stone-500 text-sm italic mb-6 px-1">{plan.note}</div>
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
      {activeView === "projects" && (
        <ProjectsView tasks={allTasks} onUpdate={handleUpdate} />
      )}

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
