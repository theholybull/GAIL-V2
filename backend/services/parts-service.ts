import type { CreatePartRecordInput, PartRecord, UpdatePartRecordInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { PartRepository } from "../db";

export class PartsService {
  constructor(
    private readonly repository: EntityRepositoryLike<PartRecord> = new PartRepository(),
  ) {}

  list(): PartRecord[] {
    return this.repository.list();
  }

  getById(id: string): PartRecord | undefined {
    return this.repository.getById(id);
  }

  create(input: CreatePartRecordInput): PartRecord {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("part"),
      title: input.title,
      sourceType: input.sourceType,
      projectId: input.projectId,
      partNumber: input.partNumber,
      sourceUrl: input.sourceUrl,
      compatibilityNotes: input.compatibilityNotes,
      status: input.status ?? "needed",
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdatePartRecordInput): PartRecord | undefined {
    return this.repository.update(id, input);
  }
}
