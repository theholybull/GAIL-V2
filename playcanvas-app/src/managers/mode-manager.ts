import type { Mode } from "../../../shared/contracts/index";

export class ModeManager {
  constructor(private mode: Mode) {}

  get currentMode(): Mode {
    return this.mode;
  }

  setMode(mode: Mode): Mode {
    this.mode = mode;
    return this.mode;
  }

  getThemeClass(): string {
    return `bg-${this.mode}`;
  }
}
