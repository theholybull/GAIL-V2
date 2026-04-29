import type {
  ApprovalRequest,
  CreateApprovalRequestInput,
  ResolveApprovalRequestInput,
} from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { ApprovalStore } from "../db";
import { SqliteApprovalRepository } from "../db";
import { HttpError } from "../api/http-error";

export class ApprovalService {
  constructor(private readonly approvals: ApprovalStore = new SqliteApprovalRepository()) {}

  list(): ApprovalRequest[] {
    return this.approvals.list().map((approval) => this.expireIfNeeded(approval));
  }

  getById(id: string): ApprovalRequest | undefined {
    const approval = this.approvals.getById(id);
    return approval ? this.expireIfNeeded(approval) : undefined;
  }

  create(input: CreateApprovalRequestInput): ApprovalRequest {
    const now = new Date().toISOString();
    const approval: ApprovalRequest = {
      id: createScaffoldId("approval"),
      actionType: input.actionType,
      reason: input.reason,
      requestedByDeviceId: input.requestedByDeviceId,
      approvedByDeviceId: undefined,
      status: "pending",
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    return this.approvals.create(approval);
  }

  resolve(id: string, input: ResolveApprovalRequestInput): ApprovalRequest | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    if (current.status === "expired") {
      throw new HttpError(410, `Approval ${id} has expired.`);
    }

    if (current.status !== "pending") {
      throw new HttpError(409, `Approval ${id} is already ${current.status}.`);
    }

    return this.approvals.update(id, input);
  }

  markExpired(id: string): ApprovalRequest | undefined {
    const current = this.approvals.getById(id);
    if (!current || current.status === "expired") {
      return current;
    }

    return this.approvals.update(id, { status: "expired" });
  }

  private expireIfNeeded(approval: ApprovalRequest): ApprovalRequest {
    if (
      approval.status === "pending"
      && approval.expiresAt
      && Number.isFinite(Date.parse(approval.expiresAt))
      && Date.parse(approval.expiresAt) <= Date.now()
    ) {
      return this.approvals.update(approval.id, { status: "expired" }) ?? approval;
    }

    return approval;
  }
}
