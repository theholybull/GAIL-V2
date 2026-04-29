import type {
  CartItem,
  ListRecord,
  Note,
  PartRecord,
  Project,
  Reminder,
  Task,
} from "../../shared/contracts/index";
import { EntityRepository } from "./entity-repository";

export class ProjectRepository extends EntityRepository<Project> {}
export class NoteRepository extends EntityRepository<Note> {}
export class ListRepository extends EntityRepository<ListRecord> {}
export class TaskRepository extends EntityRepository<Task> {}
export class ReminderRepository extends EntityRepository<Reminder> {}
export class PartRepository extends EntityRepository<PartRecord> {}
export class CartRepository extends EntityRepository<CartItem> {}
