import type { AuthMode } from "./auth";

export interface AccessSurface {
  label: string;
  url: string;
}

export interface AccessLanAddress {
  address: string;
  family: "IPv4";
  surfaces: AccessSurface[];
}

export interface AccessStatus {
  host: string;
  port: number;
  authMode: AuthMode;
  pairingRequired: boolean;
  pairingRequiredForSensitive: boolean;
  localSurfaces: AccessSurface[];
  lanAddresses: AccessLanAddress[];
  warnings: string[];
}
