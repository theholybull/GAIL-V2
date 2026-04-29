export const TASK_STATUSES = [
  "inbox",
  "planned",
  "active",
  "waiting",
  "blocked",
  "done",
  "dropped",
] as const;

export const PRIORITY_LEVELS = [
  "low",
  "normal",
  "high",
  "urgent",
  "someday",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
