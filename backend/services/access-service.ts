import { networkInterfaces } from "node:os";
import type { AccessLanAddress, AccessStatus, AccessSurface, AuthStatus } from "../../shared/contracts/index";

export class AccessService {
  getStatus(authStatus: AuthStatus): AccessStatus {
    const host = process.env.GAIL_BACKEND_HOST?.trim() || "0.0.0.0";
    const rawPort = process.env.GAIL_BACKEND_PORT?.trim();
    const parsedPort = rawPort ? Number(rawPort) : NaN;
    const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 4180;
    const localSurfaces = this.buildSurfaces("127.0.0.1", port);
    const lanAddresses = this.listLanAddresses(port);
    const warnings: string[] = [];

    if (host === "127.0.0.1" || host === "localhost") {
      warnings.push("Backend is bound to localhost only. LAN devices cannot connect until the bind host is widened.");
    }

    if (lanAddresses.length === 0) {
      warnings.push("No private IPv4 LAN address was detected on this host. Other devices may not be able to reach the backend yet.");
    }

    if (authStatus.authMode === "open") {
      warnings.push("Auth mode is open. This is useful for prototyping, but any device that can reach the host can use the service.");
    }

    if (host === "0.0.0.0") {
      warnings.push("The backend is listening on all interfaces. Confirm Windows Firewall only allows the networks you expect.");
    }

    return {
      host,
      port,
      authMode: authStatus.authMode,
      pairingRequired: authStatus.pairingRequired,
      pairingRequiredForSensitive: authStatus.pairingRequiredForSensitive,
      localSurfaces,
      lanAddresses,
      warnings,
    };
  }

  private listLanAddresses(port: number): AccessLanAddress[] {
    const found = new Map<string, AccessLanAddress>();
    const interfaces = networkInterfaces();

    for (const entries of Object.values(interfaces)) {
      for (const entry of entries ?? []) {
        const family = this.normalizeFamily((entry as { family?: string | number }).family);
        if (family !== "IPv4" || entry.internal || !this.isPrivateIpv4(entry.address)) {
          continue;
        }

        if (!found.has(entry.address)) {
          found.set(entry.address, {
            address: entry.address,
            family: "IPv4",
            surfaces: this.buildSurfaces(entry.address, port),
          });
        }
      }
    }

    return [...found.values()].sort((left, right) => left.address.localeCompare(right.address));
  }

  private buildSurfaces(host: string, port: number): AccessSurface[] {
    const base = `http://${host}:${port}`;
    return [
      { label: "operator_panel", url: `${base}/panel/` },
      { label: "operator_studio_shell", url: `${base}/panel/operator-studio-shell.html` },
      { label: "work_lite_client", url: `${base}/client/work-lite/` },
      { label: "display_phone_client", url: `${base}/client/phone/` },
      { label: "display_proof_client", url: `${base}/client/proof/` },
      { label: "display_animation_diagnostic", url: `${base}/client/anim-test/` },
      { label: "health", url: `${base}/health` },
      { label: "auth_status", url: `${base}/auth/status` },
    ];
  }

  private isPrivateIpv4(address: string): boolean {
    return address.startsWith("10.")
      || address.startsWith("192.168.")
      || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
  }

  private normalizeFamily(family: string | number | undefined): "IPv4" | "IPv6" {
    if (family === 4 || family === "IPv4") {
      return "IPv4";
    }
    return "IPv6";
  }
}

