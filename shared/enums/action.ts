export const ACTION_TYPES = [
  "open_app",
  "open_url",
  "search_web",
  "draft_email",
  "send_email",
  "attach_file",
  "play_media",
  "control_media",
  "create_task",
  "update_task",
  "add_part_to_cart",
  "open_project",
  "import_file",
  "export_backup",
] as const;

export const ACTION_RISK_LEVELS = ["low", "medium", "high"] as const;

export type ActionType = (typeof ACTION_TYPES)[number];
export type ActionRiskLevel = (typeof ACTION_RISK_LEVELS)[number];
