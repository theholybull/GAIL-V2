export const REMINDER_STATUSES = [
  "scheduled",
  "fired",
  "snoozed",
  "completed",
  "canceled",
] as const;

export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
