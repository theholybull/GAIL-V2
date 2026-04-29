import type { PartSourceType, PartStatus } from "../enums/parts";
import type { PriorityLevel, TaskStatus } from "../enums/task";
import type { ReminderStatus } from "../enums/reminder";
import type { AuditFields } from "../types/base";

export interface Project extends AuditFields {
  id: string;
  title: string;
  summary: string;
  status: "active" | "paused" | "archived";
  tags: string[];
}

export interface Note extends AuditFields {
  id: string;
  projectId?: string;
  title: string;
  body: string;
  privateOnly: boolean;
}

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListRecord extends AuditFields {
  id: string;
  title: string;
  description?: string;
  items: ListItem[];
  archived: boolean;
}

export interface Task extends AuditFields {
  id: string;
  projectId?: string;
  title: string;
  details?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  dueAt?: string;
  sourceThreadId?: string;
}

export interface Reminder extends AuditFields {
  id: string;
  title: string;
  details?: string;
  remindAt: string;
  status: ReminderStatus;
  linkedTaskId?: string;
}

export interface PartRecord extends AuditFields {
  id: string;
  projectId?: string;
  title: string;
  partNumber?: string;
  sourceUrl?: string;
  status: PartStatus;
  sourceType: PartSourceType;
  compatibilityNotes?: string;
}

export interface CartItem extends AuditFields {
  id: string;
  partId?: string;
  title: string;
  sourceUrl: string;
  quantity: number;
  status: "pending_review" | "saved_for_later" | "approved" | "removed";
  notes?: string;
}

export interface ApprovalRequest extends AuditFields {
  id: string;
  actionType: string;
  reason: string;
  requestedByDeviceId: string;
  approvedByDeviceId?: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: string;
}
