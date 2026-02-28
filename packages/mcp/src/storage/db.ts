import Database from "better-sqlite3";
import { createHash } from "crypto";
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import type { QuizSession, QuizAnswer, QuizConfig } from "@quizz/core";

// Database path: ~/.quizz/data.db
const DB_DIR = join(homedir(), ".quizz");
const DB_PATH = join(DB_DIR, "data.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Performance optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");
  db.pragma("mmap_size = 268435456"); // 256MB mmap

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      config TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      content_preview TEXT,
      questions TEXT NOT NULL,
      answers TEXT DEFAULT '[]',
      score_correct INTEGER,
      score_total INTEGER,
      score_percentage INTEGER
    );

    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT REFERENCES sessions(id),
      difficulty TEXT,
      score_percentage INTEGER,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
    CREATE INDEX IF NOT EXISTS idx_stats_completed_at ON stats(completed_at);
    CREATE INDEX IF NOT EXISTS idx_stats_difficulty ON stats(difficulty);
  `);

  return db;
}

type SessionRow = {
  id: string;
  created_at: string;
  completed_at: string | null;
  config: string;
  content_hash: string;
  content_preview: string;
  questions: string;
  answers: string;
  score_correct: number | null;
  score_total: number | null;
  score_percentage: number | null;
};

function rowToSession(row: SessionRow): QuizSession {
  return {
    id: row.id,
    createdAt: row.created_at,
    completedAt: row.completed_at || undefined,
    config: JSON.parse(row.config) as QuizConfig,
    contentHash: row.content_hash,
    contentPreview: row.content_preview,
    questions: JSON.parse(row.questions),
    answers: JSON.parse(row.answers) as QuizAnswer[],
    score:
      row.score_correct !== null
        ? {
            correct: row.score_correct,
            total: row.score_total!,
            percentage: row.score_percentage!,
          }
        : undefined,
  };
}

export function createContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function createContentPreview(content: string, maxLength = 100): string {
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3) + "...";
}

export function saveSession(session: QuizSession): void {
  const db = getDb();

  db.prepare(
    `
    INSERT INTO sessions (
      id, created_at, completed_at, config, content_hash, content_preview,
      questions, answers, score_correct, score_total, score_percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    session.id,
    session.createdAt,
    session.completedAt || null,
    JSON.stringify(session.config),
    session.contentHash,
    session.contentPreview,
    JSON.stringify(session.questions),
    JSON.stringify(session.answers),
    session.score?.correct || null,
    session.score?.total || null,
    session.score?.percentage || null
  );
}

export function getSession(id: string): QuizSession | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as SessionRow | undefined;
  if (!row) return undefined;
  return rowToSession(row);
}

export function updateSession(id: string, updates: Partial<QuizSession>): QuizSession | undefined {
  const db = getDb();
  const session = getSession(id);
  if (!session) return undefined;

  const updated = { ...session, ...updates };

  db.prepare(
    `
    UPDATE sessions SET
      completed_at = ?,
      answers = ?,
      score_correct = ?,
      score_total = ?,
      score_percentage = ?
    WHERE id = ?
  `
  ).run(
    updated.completedAt || null,
    JSON.stringify(updated.answers),
    updated.score?.correct || null,
    updated.score?.total || null,
    updated.score?.percentage || null,
    id
  );

  // If completed, add to stats
  if (updates.completedAt && updated.score) {
    db.prepare(
      `
      INSERT INTO stats (session_id, difficulty, score_percentage, completed_at)
      VALUES (?, ?, ?, ?)
    `
    ).run(id, updated.config.difficulty, updated.score.percentage, updated.completedAt);
  }

  return updated;
}

export function deleteSession(id: string): boolean {
  const db = getDb();
  db.prepare("DELETE FROM stats WHERE session_id = ?").run(id);
  const result = db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listSessions(limit = 20): QuizSession[] {
  const db = getDb();

  const rows = db
    .prepare("SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Array<SessionRow>;

  return rows.map(rowToSession);
}

/** Sessions with created_at >= since (for stats); optional high limit to avoid undercount. */
export function listSessionsSince(sinceIso: string, limit = 5000): QuizSession[] {
  const db = getDb();

  const rows = db
    .prepare("SELECT * FROM sessions WHERE created_at >= ? ORDER BY created_at DESC LIMIT ?")
    .all(sinceIso, limit) as Array<SessionRow>;

  return rows.map(rowToSession);
}

export function getSessionStats(): {
  total: number;
  completed: number;
  averageScore: number;
} {
  const db = getDb();

  const totalRow = db.prepare("SELECT COUNT(*) as count FROM sessions").get() as {
    count: number;
  };
  const completedRow = db
    .prepare("SELECT COUNT(*) as count FROM sessions WHERE completed_at IS NOT NULL")
    .get() as { count: number };
  const avgRow = db
    .prepare("SELECT AVG(score_percentage) as avg FROM sessions WHERE score_percentage IS NOT NULL")
    .get() as { avg: number | null };

  return {
    total: totalRow.count,
    completed: completedRow.count,
    averageScore: avgRow.avg || 0,
  };
}

// Close database on process exit
process.on("exit", () => {
  if (db) {
    db.close();
  }
});
