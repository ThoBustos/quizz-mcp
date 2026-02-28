import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateQuizQuestions,
  type QuizConfig,
  type QuizSession,
  type QuizDifficulty,
  type QuizQuestionType,
} from "@quizz/core";
import { saveSession, createContentHash, createContentPreview } from "../storage/db.js";
import { getWebUrl, getConfig } from "../env.js";
import { ValidationError } from "../errors.js";
import { sanitizeContent, validateContent } from "../sanitize.js";
import { logger } from "../logger.js";

/** Cross-platform command to open URL in default browser; null if unsupported. */
function getOpenBrowserCommand(url: string): string | null {
  const platform = process.platform;
  const escaped = url.replace(/"/g, '\\"');
  if (platform === "darwin") return `open "${escaped}"`;
  if (platform === "win32") return `start "" "${escaped}"`;
  if (platform === "linux" || platform === "freebsd" || platform === "openbsd") {
    return `xdg-open "${escaped}"`;
  }
  return null;
}

export const generateQuizSchema = {
  name: "generate_quiz",
  description:
    "Generate a quiz to test understanding of concepts. " +
    "CRITICAL REQUIREMENT: You MUST ask the user these questions BEFORE calling this tool: " +
    "(1) What content/topic to quiz on, (2) Difficulty: easy, medium, hard, or expert, " +
    "(3) Number of questions (1-20), (4) Question types: multiple-choice, multi-select, open-ended, code-writing, or any combination. " +
    "DO NOT call this tool until user has explicitly answered these configuration questions. " +
    "Use Claude's AskUserQuestion tool or ask in chat to gather preferences first.",
  inputSchema: {
    type: "object" as const,
    properties: {
      content: {
        type: "string",
        description:
          "Session transcript, code, or document to quiz on. Must be explicitly provided or confirmed by user.",
      },
      questionCount: {
        type: "number",
        description: "Number of questions (1-20). MUST be confirmed by user before calling.",
      },
      difficulty: {
        type: "string",
        enum: ["easy", "medium", "hard", "expert"],
        description:
          "Difficulty level. MUST be chosen by user: easy (50%), medium (60%), hard (75%), expert (85%)",
      },
      questionTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["multiple-choice", "multi-select", "open-ended", "code-writing"],
        },
        description:
          "Question types. MUST be chosen by user: multiple-choice, multi-select, open-ended, code-writing, or any combination.",
      },
      focus: {
        type: "string",
        description: "Optional: specific topic focus within the content",
      },
    },
    required: ["content", "questionCount", "difficulty", "questionTypes"],
  },
};

const InputSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
  questionCount: z.number().int().min(1).max(20),
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  questionTypes: z
    .array(z.enum(["multiple-choice", "multi-select", "open-ended", "code-writing"]))
    .min(1),
  focus: z.string().optional(),
});

export async function handleGenerateQuiz(
  args: unknown,
  anthropic: Anthropic
): Promise<{
  sessionId: string;
  questionCount: number;
  difficulty: string;
  url: string;
  message: string;
}> {
  // Use safeParse for better error handling
  const result = InputSchema.safeParse(args);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    throw new ValidationError(`Invalid input: ${errors.join(", ")}`);
  }
  const input = result.data;

  // Validate and sanitize content
  const contentError = validateContent(input.content);
  if (contentError) {
    throw new ValidationError(contentError);
  }
  const sanitizedContent = sanitizeContent(input.content);

  logger.info("Generating quiz", {
    questionCount: input.questionCount,
    difficulty: input.difficulty,
    types: input.questionTypes,
  });

  const config: QuizConfig = {
    questionCount: input.questionCount,
    questionTypes: input.questionTypes as QuizQuestionType[],
    difficulty: input.difficulty as QuizDifficulty,
    focus: input.focus,
  };

  // Generate questions using sanitized content
  const questions = await generateQuizQuestions(anthropic, sanitizedContent, config);

  // Create session
  const session: QuizSession = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    config,
    contentHash: createContentHash(sanitizedContent),
    contentPreview: createContentPreview(sanitizedContent),
    questions,
    answers: [],
  };

  // Save session to SQLite
  saveSession(session);

  // Generate URL
  const webUrl = getWebUrl();
  const url = `${webUrl}/quiz/${session.id}`;

  // Auto-open browser if enabled (cross-platform)
  const envConfig = getConfig();
  if (envConfig.QUIZ_AUTO_OPEN) {
    const openCommand = getOpenBrowserCommand(url);
    if (openCommand) {
      exec(openCommand, (error) => {
        if (error) {
          logger.warn("Failed to open browser", { error: error.message });
        }
      });
    }
  }

  return {
    sessionId: session.id,
    questionCount: questions.length,
    difficulty: config.difficulty,
    url,
    message: `Quiz ready! ${questions.length} questions at ${config.difficulty} difficulty. ${envConfig.QUIZ_AUTO_OPEN ? "Opening browser..." : `Open ${url} in your browser.`}`,
  };
}
