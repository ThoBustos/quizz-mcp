import type {
  QuizDifficulty,
  QuizQuestionType,
  QuizQuestion,
  AnswerEvaluation,
  ContentAnalysis,
} from "./schemas.js";

// Re-export schema types
export type { QuizDifficulty, QuizQuestionType, QuizQuestion, AnswerEvaluation, ContentAnalysis };

// Quiz configuration
export interface QuizConfig {
  questionCount: number;
  questionTypes: QuizQuestionType[];
  difficulty: QuizDifficulty;
  focus?: string;
}

// Quiz answer
export interface QuizAnswer {
  questionIndex: number;
  userAnswer: number | number[] | string; // number for MC, number[] for multi-select, string for open-ended
  isCorrect: boolean;
  score?: number;
  evaluation?: string;
  skipped?: boolean;
  answeredAt: string;
}

// Quiz session
export interface QuizSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  config: QuizConfig;
  contentHash: string;
  contentPreview: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score?: {
    correct: number;
    total: number;
    percentage: number;
  };
}

// Quiz statistics
export interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  byDifficulty: Record<
    QuizDifficulty,
    {
      attempts: number;
      averageScore: number;
    }
  >;
  recentSessions: Array<{
    id: string;
    date: string;
    score: number;
    difficulty: QuizDifficulty;
  }>;
}
