import type { AuditFields } from "../types/base";

export interface MemoryEntry extends AuditFields {
  id: string;
  title: string;
  body: string;
  tags: string[];
  source?: string;
  /** Which private persona owns this entry (undefined = shared / working memory). */
  persona?: string;
}
