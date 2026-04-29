import type {
  ControlIntentResult,
  ResolveControlIntentInput,
} from "../../shared/contracts/index";
import { MANAGER_KEYWORDS } from "../../shared/constants/app-constants";
import type { RequestMeta } from "../api/request-meta";
import { HttpError } from "../api/http-error";
import type { CommandService } from "./command-service";
import type { WorkflowService } from "./workflow-service";
import type { ManagerAgentService } from "./manager-agent-service";

export class ControlIntentService {
  constructor(
    private readonly commandService: CommandService,
    private readonly workflowService: WorkflowService,
    private readonly managerAgentService?: ManagerAgentService,
  ) {}

  async resolve(meta: RequestMeta, input: ResolveControlIntentInput): Promise<ControlIntentResult> {
    const text = input.text.trim();
    if (!text) {
      throw new HttpError(400, "text must not be empty.");
    }

    const source = input.source ?? "typed";
    const matchedCommand = this.commandService.match(text, { allowPartial: true });
    if (matchedCommand) {
      const executed = this.commandService.executeMatched(meta, matchedCommand);
      return {
        inputText: text,
        source,
        action: "command",
        status: executed.status === "failed" ? "failed" : "accepted",
        summary: `Matched command ${matchedCommand.key} and routed it through the broker.`,
        command: {
          key: matchedCommand.key,
          action: matchedCommand.action,
          description: matchedCommand.description,
          brokerStatus: executed.status,
          success: executed.success,
        },
      };
    }

    // Route build/task requests through the manager agent when available
    if (this.managerAgentService && MANAGER_KEYWORDS.test(text)) {
      const directive = this.managerAgentService.createDirective({
        instruction: text,
        priority: "normal",
      });
      return {
        inputText: text,
        source,
        action: "workflow",
        status: directive.status === "failed" ? "failed" : "planned",
        summary: `Routed to manager agent as directive ${directive.id} (${directive.status}). Assigned to ${directive.assignee}.`,
        workflow: directive.workflowId
          ? {
              id: directive.workflowId,
              title: `Manager Directive: ${text.slice(0, 60)}`,
              status: "active",
              plannedStepCount: 1,
              firstStepId: undefined,
              firstStepTitle: "Execute directive",
              reviewRequired: false,
            }
          : undefined,
      };
    }

    const workflow = this.workflowService.create({
      title: createWorkflowTitle(text),
      objective: text,
      providerPreference: meta.mode === "private" ? "local-llm" : "openai",
      contextItems: [
        {
          title: source === "voice" ? "Voice control transcript" : "Typed control request",
          body: text,
          sourceType: "conversation",
        },
      ],
    });

    const planned = input.autoPlan === false
      ? { workflow, step: workflow.steps[0], usedProvider: "heuristic" as const, fellBack: false }
      : this.workflowService.planWorkflow(workflow.id, meta, { replaceExistingSteps: true });
    const plannedSteps = planned.workflow.steps;
    const firstStep = planned.step ?? plannedSteps[0];
    const reviewRequired = plannedSteps.some((step) => step.requiresReview);

    return {
      inputText: text,
      source,
      action: "workflow",
      status: plannedSteps.length > 0 ? "planned" : "failed",
      summary: plannedSteps.length > 0
        ? `Created workflow ${planned.workflow.title} with ${plannedSteps.length} planned steps. Review stays required before execution.`
        : `Created workflow ${planned.workflow.title}, but no executable steps were planned yet.`,
      workflow: {
        id: planned.workflow.id,
        title: planned.workflow.title,
        status: planned.workflow.status,
        plannedStepCount: plannedSteps.length,
        firstStepId: firstStep?.id,
        firstStepTitle: firstStep?.title,
        reviewRequired,
      },
    };
  }
}

function createWorkflowTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 72) {
    return normalized;
  }
  return `${normalized.slice(0, 69).trimEnd()}...`;
}