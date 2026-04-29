import type { ControlPanelTab } from "../lib/tab-definitions";
import { CONTROL_PANEL_TABS } from "../lib/tab-definitions";

export interface TabPage {
  id: ControlPanelTab;
  status: "scaffolded";
}

export const TAB_PAGES: TabPage[] = CONTROL_PANEL_TABS.map((tab) => ({
  id: tab,
  status: "scaffolded",
}));
