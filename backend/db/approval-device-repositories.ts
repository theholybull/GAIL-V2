import type { DatabaseSync } from "node:sqlite";
import type {
  ApprovalRequest,
  DeviceCredential,
  DeviceProfile,
  PairingSession,
} from "../../shared/contracts/index";
import { getSqliteDatabase } from "./sqlite";

type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, SqlValue>;

function toBoolean(value: SqlValue): boolean {
  return Number(value) === 1;
}

export interface ApprovalStore {
  list(): ApprovalRequest[];
  getById(id: string): ApprovalRequest | undefined;
  create(record: ApprovalRequest): ApprovalRequest;
  update(
    id: string,
    input: {
      approvedByDeviceId?: string;
      status: "approved" | "rejected" | "expired";
    },
  ): ApprovalRequest | undefined;
}

export interface DeviceStore {
  list(): DeviceProfile[];
  getById(id: string): DeviceProfile | undefined;
  upsert(record: DeviceProfile): DeviceProfile;
  updateTrust(id: string, trusted: boolean): DeviceProfile | undefined;
  updateSensitiveAccess(id: string, sensitiveActionsUnlockedUntil?: string): DeviceProfile | undefined;
  touchSeen(id: string, lastSeenAt: string, lastSeenAddress?: string): DeviceProfile | undefined;
}

export interface PairingSessionStore {
  create(record: PairingSession): PairingSession;
  getById(id: string): PairingSession | undefined;
  update(record: PairingSession): PairingSession;
  expirePending(nowIso: string): number;
}

export interface DeviceCredentialStore {
  create(record: DeviceCredential & { tokenHash: string }): DeviceCredential;
  getByTokenHash(tokenHash: string): (DeviceCredential & { tokenHash: string }) | undefined;
  touchLastUsed(id: string, lastUsedAt: string): void;
}

export class SqliteApprovalRepository implements ApprovalStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  list(): ApprovalRequest[] {
    const rows = this.database
      .prepare("SELECT * FROM approval_requests ORDER BY updated_at DESC")
      .all() as SqlRow[];
    return rows.map((row) => this.fromRow(row));
  }

  getById(id: string): ApprovalRequest | undefined {
    const row = this.database
      .prepare("SELECT * FROM approval_requests WHERE id = ?")
      .get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  create(record: ApprovalRequest): ApprovalRequest {
    this.database
      .prepare(
        `INSERT INTO approval_requests (
          id, action_type, reason, requested_by_device_id, approved_by_device_id,
          status, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.actionType,
        record.reason,
        record.requestedByDeviceId,
        record.approvedByDeviceId ?? null,
        record.status,
        record.expiresAt ?? null,
        record.createdAt,
        record.updatedAt,
      );

    return record;
  }

  update(
    id: string,
    input: {
      approvedByDeviceId?: string;
      status: "approved" | "rejected" | "expired";
    },
  ): ApprovalRequest | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    const updatedAt = new Date().toISOString();
    this.database
      .prepare(
        "UPDATE approval_requests SET approved_by_device_id = ?, status = ?, updated_at = ? WHERE id = ?",
      )
      .run(input.approvedByDeviceId ?? current.approvedByDeviceId ?? null, input.status, updatedAt, id);

    return {
      ...current,
      approvedByDeviceId: input.approvedByDeviceId ?? current.approvedByDeviceId,
      status: input.status,
      updatedAt,
    };
  }

  private fromRow(row: SqlRow): ApprovalRequest {
    return {
      id: String(row.id),
      actionType: String(row.action_type),
      reason: String(row.reason),
      requestedByDeviceId: String(row.requested_by_device_id),
      approvedByDeviceId: row.approved_by_device_id ? String(row.approved_by_device_id) : undefined,
      status: row.status as ApprovalRequest["status"],
      expiresAt: row.expires_at ? String(row.expires_at) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteDeviceRepository implements DeviceStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  list(): DeviceProfile[] {
    const rows = this.database.prepare("SELECT * FROM device_profiles ORDER BY name ASC").all() as SqlRow[];
    return rows.map((row) => this.fromRow(row));
  }

  getById(id: string): DeviceProfile | undefined {
    const row = this.database
      .prepare("SELECT * FROM device_profiles WHERE id = ?")
      .get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  upsert(record: DeviceProfile): DeviceProfile {
    this.database
      .prepare(
        `INSERT INTO device_profiles (
          id, type, name, default_mode, quality_tier, trusted, is_paired, paired_at,
          last_seen_at, last_seen_address, sensitive_actions_unlocked_until,
          supports_camera, supports_watch_approval, supports_rich_avatar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          name = excluded.name,
          default_mode = excluded.default_mode,
          quality_tier = excluded.quality_tier,
          trusted = excluded.trusted,
          is_paired = excluded.is_paired,
          paired_at = excluded.paired_at,
          last_seen_at = excluded.last_seen_at,
          last_seen_address = excluded.last_seen_address,
          sensitive_actions_unlocked_until = excluded.sensitive_actions_unlocked_until,
          supports_camera = excluded.supports_camera,
          supports_watch_approval = excluded.supports_watch_approval,
          supports_rich_avatar = excluded.supports_rich_avatar`,
      )
      .run(
        record.id,
        record.type,
        record.name,
        record.defaultMode,
        record.qualityTier,
        record.trusted ? 1 : 0,
        record.isPaired ? 1 : 0,
        record.pairedAt ?? null,
        record.lastSeenAt ?? null,
        record.lastSeenAddress ?? null,
        record.sensitiveActionsUnlockedUntil ?? null,
        record.supportsCamera ? 1 : 0,
        record.supportsWatchApproval ? 1 : 0,
        record.supportsRichAvatar ? 1 : 0,
      );

    return record;
  }

  updateTrust(id: string, trusted: boolean): DeviceProfile | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    this.database
      .prepare("UPDATE device_profiles SET trusted = ?, sensitive_actions_unlocked_until = ? WHERE id = ?")
      .run(trusted ? 1 : 0, trusted ? current.sensitiveActionsUnlockedUntil ?? null : null, id);

    return {
      ...current,
      trusted,
      sensitiveActionsUnlockedUntil: trusted ? current.sensitiveActionsUnlockedUntil : undefined,
    };
  }

  updateSensitiveAccess(id: string, sensitiveActionsUnlockedUntil?: string): DeviceProfile | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    this.database
      .prepare("UPDATE device_profiles SET sensitive_actions_unlocked_until = ? WHERE id = ?")
      .run(sensitiveActionsUnlockedUntil ?? null, id);

    return {
      ...current,
      sensitiveActionsUnlockedUntil,
    };
  }

  touchSeen(id: string, lastSeenAt: string, lastSeenAddress?: string): DeviceProfile | undefined {
    const current = this.getById(id);
    if (!current) {
      return undefined;
    }

    this.database
      .prepare("UPDATE device_profiles SET last_seen_at = ?, last_seen_address = ? WHERE id = ?")
      .run(lastSeenAt, lastSeenAddress ?? current.lastSeenAddress ?? null, id);

    return {
      ...current,
      lastSeenAt,
      lastSeenAddress: lastSeenAddress ?? current.lastSeenAddress,
    };
  }

  private fromRow(row: SqlRow): DeviceProfile {
    return {
      id: String(row.id),
      type: row.type as DeviceProfile["type"],
      name: String(row.name),
      defaultMode: row.default_mode as DeviceProfile["defaultMode"],
      qualityTier: row.quality_tier as DeviceProfile["qualityTier"],
      trusted: toBoolean(row.trusted),
      isPaired: row.is_paired === null ? false : toBoolean(row.is_paired),
      pairedAt: row.paired_at ? String(row.paired_at) : undefined,
      lastSeenAt: row.last_seen_at ? String(row.last_seen_at) : undefined,
      lastSeenAddress: row.last_seen_address ? String(row.last_seen_address) : undefined,
      sensitiveActionsUnlockedUntil: row.sensitive_actions_unlocked_until
        ? String(row.sensitive_actions_unlocked_until)
        : undefined,
      supportsCamera: toBoolean(row.supports_camera),
      supportsWatchApproval: toBoolean(row.supports_watch_approval),
      supportsRichAvatar: toBoolean(row.supports_rich_avatar),
    };
  }
}

export class SqlitePairingSessionRepository implements PairingSessionStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  create(record: PairingSession): PairingSession {
    this.database
      .prepare(
        `INSERT INTO pairing_sessions (
          id, pairing_code, requested_by_address, status, expires_at, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.pairingCode,
        record.requestedByAddress,
        record.status,
        record.expiresAt,
        record.completedAt ?? null,
        record.createdAt,
        record.updatedAt,
      );

    return record;
  }

  getById(id: string): PairingSession | undefined {
    const row = this.database
      .prepare("SELECT * FROM pairing_sessions WHERE id = ?")
      .get(id) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  update(record: PairingSession): PairingSession {
    this.database
      .prepare(
        `UPDATE pairing_sessions
         SET pairing_code = ?, requested_by_address = ?, status = ?, expires_at = ?, completed_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        record.pairingCode,
        record.requestedByAddress,
        record.status,
        record.expiresAt,
        record.completedAt ?? null,
        record.updatedAt,
        record.id,
      );

    return record;
  }

  expirePending(nowIso: string): number {
    const result = this.database
      .prepare(
        `UPDATE pairing_sessions
         SET status = 'expired', updated_at = ?
         WHERE status = 'pending' AND expires_at <= ?`,
      )
      .run(nowIso, nowIso);

    return Number(result.changes ?? 0);
  }

  private fromRow(row: SqlRow): PairingSession {
    return {
      id: String(row.id),
      pairingCode: String(row.pairing_code),
      requestedByAddress: String(row.requested_by_address),
      status: row.status as PairingSession["status"],
      expiresAt: String(row.expires_at),
      completedAt: row.completed_at ? String(row.completed_at) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}

export class SqliteDeviceCredentialRepository implements DeviceCredentialStore {
  constructor(private readonly database: DatabaseSync = getSqliteDatabase()) {}

  create(record: DeviceCredential & { tokenHash: string }): DeviceCredential {
    this.database
      .prepare(
        `INSERT INTO device_credentials (
          id, device_id, label, token_hash, created_at, last_used_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.deviceId,
        record.label,
        record.tokenHash,
        record.createdAt,
        record.lastUsedAt ?? null,
      );

    return {
      id: record.id,
      deviceId: record.deviceId,
      label: record.label,
      createdAt: record.createdAt,
      lastUsedAt: record.lastUsedAt,
    };
  }

  getByTokenHash(tokenHash: string): (DeviceCredential & { tokenHash: string }) | undefined {
    const row = this.database
      .prepare("SELECT * FROM device_credentials WHERE token_hash = ?")
      .get(tokenHash) as SqlRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  touchLastUsed(id: string, lastUsedAt: string): void {
    this.database
      .prepare("UPDATE device_credentials SET last_used_at = ? WHERE id = ?")
      .run(lastUsedAt, id);
  }

  private fromRow(row: SqlRow): DeviceCredential & { tokenHash: string } {
    return {
      id: String(row.id),
      deviceId: String(row.device_id),
      label: String(row.label),
      tokenHash: String(row.token_hash),
      createdAt: String(row.created_at),
      lastUsedAt: row.last_used_at ? String(row.last_used_at) : undefined,
    };
  }
}
