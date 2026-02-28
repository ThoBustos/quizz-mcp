import { z } from "zod";
import { listSessionsSince } from "../storage/db.js";
import type { QuizStats, QuizDifficulty } from "@quizz/core";

export const quizStatsSchema = {
  name: "quiz_stats",
  description: "View quiz history, scores, and learning progress",
  inputSchema: {
    type: "object" as const,
    properties: {
      days: {
        type: "number",
        description: "Lookback period in days, default 30",
      },
      difficulty: {
        type: "string",
        enum: ["easy", "medium", "hard", "expert"],
        description: "Filter by difficulty level",
      },
    },
  },
};

const InputSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]).optional(),
});

export async function handleQuizStats(args: unknown): Promise<QuizStats> {
  const input = InputSchema.parse(args || {});

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - input.days);
  const sinceIso = cutoffDate.toISOString();

  // Load sessions in date range (no artificial cap that would undercount)
  let sessions = listSessionsSince(sinceIso);

  // Filter by difficulty if specified
  if (input.difficulty) {
    sessions = sessions.filter((s) => s.config.difficulty === input.difficulty);
  }

  // Calculate stats
  const completedSessions = sessions.filter((s) => s.completedAt && s.score);

  const totalQuestions = completedSessions.reduce((sum, s) => sum + s.questions.length, 0);

  const correctAnswers = completedSessions.reduce((sum, s) => sum + (s.score?.correct || 0), 0);

  const averageScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.score?.percentage || 0), 0) /
        completedSessions.length
      : 0;

  // Stats by difficulty
  const difficulties: QuizDifficulty[] = ["easy", "medium", "hard", "expert"];
  const byDifficulty = Object.fromEntries(
    difficulties.map((d) => {
      const diffSessions = completedSessions.filter((s) => s.config.difficulty === d);
      return [
        d,
        {
          attempts: diffSessions.length,
          averageScore:
            diffSessions.length > 0
              ? diffSessions.reduce((sum, s) => sum + (s.score?.percentage || 0), 0) /
                diffSessions.length
              : 0,
        },
      ];
    })
  ) as Record<QuizDifficulty, { attempts: number; averageScore: number }>;

  // Recent sessions
  const recentSessions = completedSessions.slice(0, 10).map((s) => ({
    id: s.id,
    date: s.completedAt!,
    score: s.score?.percentage || 0,
    difficulty: s.config.difficulty,
  }));

  return {
    totalQuizzes: sessions.length,
    totalQuestions,
    correctAnswers,
    averageScore: Math.round(averageScore),
    byDifficulty,
    recentSessions,
  };
}
