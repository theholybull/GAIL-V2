export interface RouteDescriptor {
  method: "GET" | "POST" | "PATCH";
  path: string;
  service: string;
}

export const DOMAIN_ROUTES: RouteDescriptor[] = [
  { method: "GET", path: "/devices", service: "deviceService.list" },
  { method: "POST", path: "/devices", service: "deviceService.register" },
  { method: "PATCH", path: "/devices/:id/trust", service: "deviceService.updateTrust" },
  { method: "GET", path: "/approvals", service: "approvalService.list" },
  { method: "POST", path: "/approvals", service: "approvalService.create" },
  { method: "PATCH", path: "/approvals/:id", service: "approvalService.resolve" },
  { method: "GET", path: "/private/session", service: "memoryService.getPrivateSession" },
  { method: "POST", path: "/private/session/notes", service: "memoryService.addPrivateSessionNote" },
  { method: "POST", path: "/private/session/wipe", service: "memoryService.wipePrivateSession" },
  { method: "GET", path: "/projects", service: "projectService.list" },
  { method: "POST", path: "/projects", service: "projectService.create" },
  { method: "PATCH", path: "/projects/:id", service: "projectService.update" },
  { method: "GET", path: "/notes", service: "noteService.list" },
  { method: "POST", path: "/notes", service: "noteService.create" },
  { method: "PATCH", path: "/notes/:id", service: "noteService.update" },
  { method: "GET", path: "/lists", service: "listService.list" },
  { method: "POST", path: "/lists", service: "listService.create" },
  { method: "PATCH", path: "/lists/:id", service: "listService.update" },
  { method: "POST", path: "/lists/:id/items", service: "listService.addItem" },
  { method: "PATCH", path: "/lists/:id/items/:itemId", service: "listService.updateItem" },
  { method: "GET", path: "/tasks", service: "taskService.list" },
  { method: "POST", path: "/tasks", service: "taskService.create" },
  { method: "PATCH", path: "/tasks/:id", service: "taskService.update" },
  { method: "GET", path: "/reminders", service: "reminderService.list" },
  { method: "POST", path: "/reminders", service: "reminderService.create" },
  { method: "PATCH", path: "/reminders/:id", service: "reminderService.update" },
  { method: "GET", path: "/parts", service: "partsService.list" },
  { method: "POST", path: "/parts", service: "partsService.create" },
  { method: "PATCH", path: "/parts/:id", service: "partsService.update" },
  { method: "GET", path: "/cart", service: "cartService.list" },
  { method: "POST", path: "/cart", service: "cartService.create" },
  { method: "PATCH", path: "/cart/:id", service: "cartService.update" },
  { method: "POST", path: "/cart/:id/approve-request", service: "approvalService.create" },
  { method: "POST", path: "/cart/:id/approve-commit", service: "cartService.update" },
];
