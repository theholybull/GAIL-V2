import type { CreateProjectInput, Project, UpdateProjectInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { ProjectRepository } from "../db";

export class ProjectService {
  constructor(
    private readonly repository: EntityRepositoryLike<Project> = new ProjectRepository(),
  ) {}

  list(): Project[] {
    return this.repository.list();
  }

  getById(id: string): Project | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateProjectInput): Project {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("project"),
      title: input.title,
      summary: input.summary ?? "",
      status: "active",
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdateProjectInput): Project | undefined {
    return this.repository.update(id, input);
  }
}
