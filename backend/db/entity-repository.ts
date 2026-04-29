export interface EntityRepositoryLike<
  T extends { id: string; createdAt: string; updatedAt: string },
> {
  list(): T[];
  getById(id: string): T | undefined;
  create(record: T): T;
  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | undefined;
}

export class EntityRepository<T extends { id: string; createdAt: string; updatedAt: string }>
  implements EntityRepositoryLike<T>
{
  private readonly records = new Map<string, T>();

  list(): T[] {
    return [...this.records.values()];
  }

  getById(id: string): T | undefined {
    return this.records.get(id);
  }

  create(record: T): T {
    this.records.set(record.id, record);
    return record;
  }

  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | undefined {
    const current = this.records.get(id);
    if (!current) {
      return undefined;
    }

    const normalizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Omit<T, "id" | "createdAt">>;

    const next = {
      ...current,
      ...normalizedPatch,
      updatedAt: new Date().toISOString(),
    } as T;

    this.records.set(id, next);
    return next;
  }
}
