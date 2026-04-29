import type { BuildOverview, BuildAgentLane } from "./build-control";

export interface SystemHealthEntry {
  component: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  detail?: string;
  checkedAt: string;
}

export interface SystemStatus {
  generatedAt: string;
  uptime: number;
  health: SystemHealthEntry[];
  providers: {
    active: string;
    available: string[];
    lastFallbackReason?: string;
  };
  voice: {
    ttsReady: boolean;
    sttReady: boolean;
  };
  build: BuildOverview;
  agents: BuildAgentLane[];
  recentErrors: SystemErrorEntry[];
}

export interface SystemErrorEntry {
  timestamp: string;
  source: string;
  message: string;
  level: "error" | "warning";
}

export interface FileSystemEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modifiedAt?: string;
}

export interface FileReadResult {
  path: string;
  content: string;
  size: number;
  encoding: string;
}
