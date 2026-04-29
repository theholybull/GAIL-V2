import type { CreateTaskInput, Task, UpdateTaskInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { TaskRepository } from "../db";

export class TaskService {
  constructor(private readonly repository: EntityRepositoryLike<Task> = new TaskRepository()) {}

  list(): Task[] {
    return this.repository.list();
  }

  getById(id: string): Task | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("task"),
      title: input.title,
      details: input.details,
      projectId: input.projectId,
      dueAt: input.dueAt,
      sourceThreadId: input.sourceThreadId,
      priority: input.priority ?? "normal",
      status: input.status ?? "inbox",
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdateTaskInput): Task | undefined {
    return this.repository.update(id, input);
  }
}
