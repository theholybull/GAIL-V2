import type {
  ApprovalRequest,
  CartItem,
  DeviceProfile,
  ListRecord,
  Note,
  PartRecord,
  Project,
  Reminder,
  Task,
} from "../../shared/contracts/index";
import type {
  ApprovalService,
  CartService,
  DeviceService,
  ListService,
  NoteService,
  PartsService,
  ProjectService,
  ReminderService,
  TaskService,
} from "./index";
import type { RequestMeta } from "../api/request-meta";

export interface DashboardOverview {
  generatedAt: string;
  counts: {
    devices: number;
    trustedDevices: number;
    approvalsPending: number;
    projects: number;
    notes: number;
    lists: number;
    tasks: number;
    reminders: number;
    parts: number;
    cartItems: number;
  };
  highlights: {
    pendingApprovals: ApprovalRequest[];
    recentProjects: Project[];
    recentTasks: Task[];
    pendingCartItems: CartItem[];
    reminders: Reminder[];
    parts: PartRecord[];
    lists: ListRecord[];
    notes: Note[];
  };
}

interface DashboardDependencies {
  approvalService: ApprovalService;
  cartService: CartService;
  deviceService: DeviceService;
  listService: ListService;
  noteService: NoteService;
  partsService: PartsService;
  projectService: ProjectService;
  reminderService: ReminderService;
  taskService: TaskService;
}

export class DashboardService {
  constructor(private readonly deps: DashboardDependencies) {}

  getOverview(meta: RequestMeta): DashboardOverview {
    if (meta.mode === "private") {
      const notes = this.deps.noteService.listForMode(meta);
      return {
        generatedAt: new Date().toISOString(),
        counts: {
          devices: 0,
          trustedDevices: 0,
          approvalsPending: 0,
          projects: 0,
          notes: notes.length,
          lists: 0,
          tasks: 0,
          reminders: 0,
          parts: 0,
          cartItems: 0,
        },
        highlights: {
          pendingApprovals: [],
          recentProjects: [],
          recentTasks: [],
          pendingCartItems: [],
          reminders: [],
          parts: [],
          lists: [],
          notes: notes.slice(0, 5),
        },
      };
    }

    const devices = this.deps.deviceService.list();
    const approvals = this.deps.approvalService.list();
    const projects = this.deps.projectService.list();
    const notes = this.deps.noteService.list();
    const lists = this.deps.listService.list();
    const tasks = this.deps.taskService.list();
    const reminders = this.deps.reminderService.list();
    const parts = this.deps.partsService.list();
    const cartItems = this.deps.cartService.list();

    return {
      generatedAt: new Date().toISOString(),
      counts: {
        devices: devices.length,
        trustedDevices: devices.filter((device) => device.trusted).length,
        approvalsPending: approvals.filter((approval) => approval.status === "pending").length,
        projects: projects.length,
        notes: notes.length,
        lists: lists.length,
        tasks: tasks.length,
        reminders: reminders.length,
        parts: parts.length,
        cartItems: cartItems.length,
      },
      highlights: {
        pendingApprovals: approvals.filter((approval) => approval.status === "pending").slice(0, 5),
        recentProjects: projects.slice(0, 5),
        recentTasks: tasks.slice(0, 5),
        pendingCartItems: cartItems.filter((item) => item.status !== "approved").slice(0, 5),
        reminders: reminders.slice(0, 5),
        parts: parts.slice(0, 5),
        lists: lists.slice(0, 5),
        notes: notes.slice(0, 5),
      },
    };
  }
}
