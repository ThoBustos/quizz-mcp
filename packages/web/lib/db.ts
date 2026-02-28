import Database from "better-sqlite3";
import { homedir } from "os";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import type { QuizSession, QuizAnswer, QuizConfig } from "@quizz/core";

// Database path: ~/.quizz/data.db (same as MCP server)
const DB_DIR = join(homedir(), ".quizz");
const DB_PATH = join(DB_DIR, "data.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH, { readonly: false });

  // Performance optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");
  db.pragma("mmap_size = 268435456"); // 256MB mmap

  // Initialize schema (same as MCP server)
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
      session_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score_percentage INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
    CREATE INDEX IF NOT EXISTS idx_stats_session_id ON stats(session_id);
    CREATE INDEX IF NOT EXISTS idx_stats_completed_at ON stats(completed_at);
  `);

  return db;
}

export function getSession(id: string): QuizSession | undefined {
  const database = getDb();

  const row = database.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as
    | {
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
      }
    | undefined;

  if (!row) return undefined;

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

export function updateSession(id: string, updates: Partial<QuizSession>): QuizSession | undefined {
  const database = getDb();
  const session = getSession(id);
  if (!session) return undefined;

  const updated = { ...session, ...updates };

  // If resetting (clearing answers), remove old stats first
  if (updates.answers && updates.answers.length === 0) {
    database.prepare("DELETE FROM stats WHERE session_id = ?").run(id);
  }

  database
    .prepare(
      `
    UPDATE sessions SET
      completed_at = ?,
      answers = ?,
      score_correct = ?,
      score_total = ?,
      score_percentage = ?
    WHERE id = ?
  `
    )
    .run(
      updated.completedAt || null,
      JSON.stringify(updated.answers),
      updated.score?.correct || null,
      updated.score?.total || null,
      updated.score?.percentage || null,
      id
    );

  // If completed, add to stats
  if (updates.completedAt && updated.score) {
    database
      .prepare(
        `
      INSERT INTO stats (session_id, difficulty, score_percentage, completed_at)
      VALUES (?, ?, ?, ?)
    `
      )
      .run(id, updated.config.difficulty, updated.score.percentage, updated.completedAt);
  }

  return updated;
}
