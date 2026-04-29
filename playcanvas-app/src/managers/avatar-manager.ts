export class AvatarManager {
  private state: "placeholder" | "ready" = "placeholder";

  getState(): "placeholder" | "ready" {
    return this.state;
  }

  markReady(): void {
    this.state = "ready";
  }
}
