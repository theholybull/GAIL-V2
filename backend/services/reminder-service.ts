import type { CreateReminderInput, Reminder, UpdateReminderInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { ReminderRepository } from "../db";

export class ReminderService {
  constructor(
    private readonly repository: EntityRepositoryLike<Reminder> = new ReminderRepository(),
  ) {}

  list(): Reminder[] {
    return this.repository.list();
  }

  getById(id: string): Reminder | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateReminderInput): Reminder {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("reminder"),
      title: input.title,
      details: input.details,
      remindAt: input.remindAt,
      linkedTaskId: input.linkedTaskId,
      status: input.status ?? "scheduled",
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdateReminderInput): Reminder | undefined {
    return this.repository.update(id, input);
  }
}
