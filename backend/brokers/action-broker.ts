import type {
  ActionRequest,
  ActionResult,
  CreateCartItemInput,
  CreateTaskInput,
  UpdateTaskInput,
} from "../../shared/contracts/index";
import type { CartService, ProjectService, TaskService } from "../services";

interface ActionBrokerDependencies {
  cartService: CartService;
  projectService: ProjectService;
  taskService: TaskService;
}

export class ActionBroker {
  constructor(private readonly deps: ActionBrokerDependencies) {}

  evaluate(request: ActionRequest): ActionResult {
    if (request.requiresConfirmation && request.riskLevel !== "low") {
      return {
        requestId: request.id,
        success: false,
        status: "pending_approval",
        message: "This action requires explicit confirmation before execution.",
      };
    }

    if (request.type === "create_task") {
      const task = this.deps.taskService.create(request.payload as unknown as CreateTaskInput);
      return {
        requestId: request.id,
        success: true,
        status: "completed",
        message: "Task created.",
        data: task,
      };
    }

    if (request.type === "update_task") {
      const payload = request.payload as unknown as { id: string; patch: UpdateTaskInput };
      const task = this.deps.taskService.update(payload.id, payload.patch);
      return {
        requestId: request.id,
        success: Boolean(task),
        status: task ? "completed" : "failed",
        message: task ? "Task updated." : "Task not found.",
        data: task,
      };
    }

    if (request.type === "add_part_to_cart") {
      const item = this.deps.cartService.create(request.payload as unknown as CreateCartItemInput);
      return {
        requestId: request.id,
        success: true,
        status: "completed",
        message: "Cart item created for review.",
        data: item,
      };
    }

    if (request.type === "open_project") {
      const payload = request.payload as unknown as { projectId: string };
      const project = this.deps.projectService.getById(payload.projectId);
      return {
        requestId: request.id,
        success: Boolean(project),
        status: project ? "completed" : "failed",
        message: project ? "Project located." : "Project not found.",
        data: project,
      };
    }

    if (request.type === "open_url") {
      return {
        requestId: request.id,
        success: true,
        status: "accepted",
        message: "Action broker accepted the routed command request.",
        data: request.payload,
      };
    }

    return {
      requestId: request.id,
      success: false,
      status: "blocked",
      message: "This action type is not implemented yet.",
    };
  }
}
