import Redis from "ioredis";
export interface PatientSession {
  sessionId: string;
  phone: string | null;
  email: string | null;
  patientId: string;
  role: "patient";
  createdAt: number;
  expiresAt: number;
}

export interface PatientSessionStore {
  get(sessionId: string): Promise<PatientSession | null>;
  set(session: PatientSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
  clear(): Promise<void>;
}

// In-memory store (default, used in tests / when Redis is not configured)
export class InMemoryPatientSessionStore implements PatientSessionStore {
  private store = new Map<string, PatientSession>();

  async get(sessionId: string): Promise<PatientSession | null> {
    const session = this.store.get(sessionId);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.store.delete(sessionId);
      return null;
    }
    return session;
  }

  async set(session: PatientSession): Promise<void> {
    this.store.set(session.sessionId, session);
  }

  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Redis-backed store (used when REDIS_URL is configured)
export class RedisPatientSessionStore implements PatientSessionStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;

  constructor(client: unknown) {
    this.client = client;
  }

  private key(sessionId: string): string {
    return `patient:session:${sessionId}`;
  }

  async get(sessionId: string): Promise<PatientSession | null> {
    const raw = await this.client.get(this.key(sessionId));
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as PatientSession;
      if (session.expiresAt <= Date.now()) {
        await this.client.del(this.key(sessionId));
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  async set(session: PatientSession): Promise<void> {
    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt - Date.now()) / 1000));
    await this.client.set(this.key(session.sessionId), JSON.stringify(session), "EX", ttlSeconds);
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.del(this.key(sessionId));
  }

  async clear(): Promise<void> {
    // Best-effort: scan and delete keys with the patient:session: prefix
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", "patient:session:*", "COUNT", 100);
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await this.client.del(...keys);
      }
    } while (cursor !== "0");
  }
}

export function createPatientSessionStore(): PatientSessionStore {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      return new RedisPatientSessionStore(client);
    } catch {
      // Fall back to in-memory if ioredis is unavailable
    }
  }
  return new InMemoryPatientSessionStore();
}

export const patientSessionStore = createPatientSessionStore();
