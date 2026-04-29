export type FeatureBacklogSource = "voice" | "typed";
export type FeatureBacklogStageTarget = "current_build" | "next_round" | "future_upgrade";
export type FeatureBacklogPriority = "low" | "normal" | "high" | "critical";
export type FeatureBacklogStatus = "pending" | "planned" | "in_progress" | "done" | "deferred";
export type FeatureBacklogPromotionTarget = "task" | "workflow" | "change_request";

export interface FeatureBacklogPromotionLink {
  target: FeatureBacklogPromotionTarget;
  linkedTaskId?: string;
  linkedWorkflowId?: string;
  linkedChangeId?: string;
  promotedAt: string;
}

export interface FeatureBacklogEntry {
  id: string;
  title: string;
  details: string;
  source: FeatureBacklogSource;
  stageTarget: FeatureBacklogStageTarget;
  priority: FeatureBacklogPriority;
  status: FeatureBacklogStatus;
  timestamp: string;
  capturedBy: string;
  linkedTaskId?: string;
  linkedWorkflowId?: string;
  linkedChangeId?: string;
  promotions: FeatureBacklogPromotionLink[];
  updatedAt: string;
}

