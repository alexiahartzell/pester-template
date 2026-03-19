import { apiFetch } from "./client";

export interface Task {
  id: number;
  title: string;
  project: string | null;
  source: string | null;
  due: string | null;
  priority: "high" | "medium" | "low";
  status: "inbox" | "active" | "done" | "dropped";
  task_type: string | null;
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
};

export const ai = {
  standup: () => apiFetch<any>("/standup", { method: "POST" }),
  reprioritize: (context: string) =>
    apiFetch<any>("/reprioritize", {
      method: "POST",
      body: JSON.stringify({ context }),
    }),
  review: () => apiFetch<any>("/review", { method: "POST" }),
  todayPlan: () => apiFetch<DayPlan>("/plan/today"),
};
