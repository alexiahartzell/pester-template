import { apiFetch } from "./client";

export interface Task {
  id: number;
  title: string;
  project: string | null;
  source: string | null;
  due: string | null;
  deadline_type: string | null;
  priority: "high" | "medium" | "low";
  status: "inbox" | "active" | "done" | "dropped";
  task_type: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface Stats {
  inbox: number;
  this_week: number;
  overdue: number;
  done_today: number;
  projects: number;
  categories: number;
}

export interface PlanItem {
  id: number;
  title: string;
  reason: string;
}

export interface DayPlan {
  date: string;
  plan: PlanItem[];
  deferred: PlanItem[];
  note: string | null;
}

export interface WeekBucket {
  week: string;
  done: number;
  total: number;
  pct: number;
}

export interface CompletionData {
  categories: Record<string, WeekBucket[]>;
  overall: WeekBucket[];
  total_pct: number;
  total_done: number;
  total_resolved: number;
}

export interface DistributionSlice {
  category: string;
  count: number;
  pct: number;
}

export interface DistributionData {
  week_start: string;
  total: number;
  slices: DistributionSlice[];
}

export const tasks = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Task[]>(`/tasks${qs}`);
  },
  create: (title: string) =>
    apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  update: (id: number, data: Partial<Task>) =>
    apiFetch<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
  stats: () => apiFetch<Stats>("/tasks/stats"),
  completion: (weeks = 4) => apiFetch<CompletionData>(`/tasks/completion?weeks=${weeks}`),
  distribution: () => apiFetch<DistributionData>("/tasks/distribution"),
  createFull: (data: Partial<Task>) =>
    apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export interface HoursData {
  date: string;
  today_hours: number;
  week_hours: number;
  avg_hours_per_week: number | null;
  started: boolean;
  reviewed: boolean;
}

export const ai = {
  standup: () => apiFetch<any>("/standup", { method: "POST" }),
  reprioritize: (context: string) =>
    apiFetch<any>("/reprioritize", {
      method: "POST",
      body: JSON.stringify({ context }),
    }),
  review: () => apiFetch<any>("/review", { method: "POST" }),
  todayPlan: () => apiFetch<DayPlan>("/plan/today"),
  hours: () => apiFetch<HoursData>("/hours/today"),
};
