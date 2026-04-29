import type { CartItem, CreateCartItemInput, UpdateCartItemInput } from "../../shared/contracts/index";
import { createScaffoldId } from "../../shared/index";
import type { EntityRepositoryLike } from "../db";
import { CartRepository } from "../db";

export class CartService {
  constructor(
    private readonly repository: EntityRepositoryLike<CartItem> = new CartRepository(),
  ) {}

  list(): CartItem[] {
    return this.repository.list();
  }

  getById(id: string): CartItem | undefined {
    return this.repository.getById(id);
  }

  create(input: CreateCartItemInput): CartItem {
    const now = new Date().toISOString();
    return this.repository.create({
      id: createScaffoldId("cart_item"),
      title: input.title,
      sourceUrl: input.sourceUrl,
      quantity: input.quantity ?? 1,
      partId: input.partId,
      notes: input.notes,
      status: "pending_review",
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id: string, input: UpdateCartItemInput): CartItem | undefined {
    return this.repository.update(id, input);
  }
}
