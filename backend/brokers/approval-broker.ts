import type {
  ApprovalRequest,
  CreateApprovalRequestInput,
  ResolveApprovalRequestInput,
} from "../../shared/contracts/index";
import type { ApprovalService } from "../services";

export class ApprovalBroker {
  constructor(private readonly approvalService: ApprovalService) {}

  requestApproval(input: CreateApprovalRequestInput): ApprovalRequest {
    return this.approvalService.create(input);
  }

  resolveApproval(id: string, input: ResolveApprovalRequestInput): ApprovalRequest | undefined {
    return this.approvalService.resolve(id, input);
  }
}
