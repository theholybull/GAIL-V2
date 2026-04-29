import type { CreateNoteInput, Note, UpdateNoteInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { NoteRepository } from "../db";
import type { RequestMeta } from "../api/request-meta";

export class NoteService {
  constructor(
    private readonly repository: EntityRepositoryLike<Note> = new NoteRepository(),
    private readonly privateRepository: EntityRepositoryLike<Note> = new NoteRepository(),
  ) {}

  list(): Note[] {
    return this.repository.list();
  }

  listForMode(meta: RequestMeta): Note[] {
    return meta.mode === "private" ? this.privateRepository.list() : this.repository.list();
  }

  getById(id: string): Note | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateNoteInput): Note {
    return this.createInRepository(this.repository, input);
  }

  createForMode(meta: RequestMeta, input: CreateNoteInput): Note {
    return meta.mode === "private"
      ? this.createInRepository(this.privateRepository, input)
      : this.createInRepository(this.repository, input);
  }

  update(id: string, input: UpdateNoteInput): Note | undefined {
    return this.repository.update(id, input);
  }

  updateForMode(meta: RequestMeta, id: string, input: UpdateNoteInput): Note | undefined {
    return meta.mode === "private"
      ? this.privateRepository.update(id, input)
      : this.repository.update(id, input);
  }

  private createInRepository(
    repository: EntityRepositoryLike<Note>,
    input: CreateNoteInput,
  ): Note {
    const now = new Date().toISOString();
    return repository.create({
      id: createScaffoldId("note"),
      title: input.title,
      body: input.body,
      projectId: input.projectId,
      privateOnly: input.privateOnly ?? false,
      createdAt: now,
      updatedAt: now,
    });
  }
}
