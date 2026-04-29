export type ChangeApprovalState = "pending" | "approved" | "rejected" | "reverted";
export type ChangeAction = "create" | "update" | "submit" | "approve" | "reject" | "revert";

export interface ChangeRecord {
  changeId: string;
  sourceType: "build_step" | "manual";
  sourceId: string;
  title: string;
  reason: string;
  scope: string[];
  approvalState: ChangeApprovalState;
  latestSnapshotId: string;
  lastApprovedSnapshotId?: string;
  relatedArtifacts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeLedgerEvent {
  eventId: string;
  changeId: string;
  timestamp: string;
  actor: "agent" | "user" | "system";
  action: ChangeAction;
  scope: string[];
  reason: string;
  approvalState: ChangeApprovalState;
  snapshotId: string;
  relatedArtifacts: string[];
  prevHash?: string;
  hash: string;
}

export interface ApprovalRecord {
  id: string;
  changeId: string;
  reviewer: string;
  decision: "approve" | "reject";
  reason?: string;
  timestamp: string;
  snapshotId: string;
}

export interface SubmitGovernanceChangeInput {
  sourceType: ChangeRecord["sourceType"];
  sourceId: string;
  title: string;
  reason: string;
  scope: string[];
  relatedArtifacts?: string[];
  actor?: ChangeLedgerEvent["actor"];
}

export interface DecideGovernanceChangeInput {
  reviewer: string;
  decision: "approve" | "reject";
  reason?: string;
}

