import type {
  AddListItemInput,
  CreateListInput,
  ListItem,
  ListRecord,
  UpdateListInput,
  UpdateListItemInput,
} from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { ListRepository } from "../db";

export class ListService {
  constructor(
    private readonly repository: EntityRepositoryLike<ListRecord> = new ListRepository(),
  ) {}

  list(): ListRecord[] {
    return this.repository.list();
  }

  getById(id: string): ListRecord | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateListInput): ListRecord {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("list"),
      title: input.title,
      description: input.description,
      items: [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdateListInput): ListRecord | undefined {
    return this.repository.update(id, input);
  }

  addItem(id: string, input: AddListItemInput): ListRecord | undefined {
    const current = this.repository.getById(id);
    if (!current) {
      return undefined;
    }

    const now = new Date().toISOString();
    const nextItem: ListItem = {
      id: createScaffoldId("list_item"),
      text: input.text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.update(id, {
      items: [...current.items, nextItem],
    });
  }

  updateItem(listId: string, itemId: string, input: UpdateListItemInput): ListRecord | undefined {
    const current = this.repository.getById(listId);
    if (!current) {
      return undefined;
    }

    const items = current.items.map((item: ListItem) =>
      item.id === itemId
        ? {
            ...item,
            ...input,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    return this.repository.update(listId, { items });
  }
}
