import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeContent, type ContentAnalysis } from "@quizz/core";
import { ValidationError } from "../errors.js";
import { sanitizeContent, validateContent } from "../sanitize.js";

export const analyzeContentSchema = {
  name: "analyze_content",
  description:
    "Analyze content to get recommendations for quiz generation (topics, difficulty, question count)",
  inputSchema: {
    type: "object" as const,
    properties: {
      content: {
        type: "string",
        description: "The content to analyze (code, conversation, documentation)",
      },
    },
    required: ["content"],
  },
};

const InputSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
});

export async function handleAnalyzeContent(
  args: unknown,
  anthropic: Anthropic
): Promise<ContentAnalysis> {
  const result = InputSchema.safeParse(args);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    throw new ValidationError(`Invalid input: ${errors.join(", ")}`);
  }
  const input = result.data;

  const contentError = validateContent(input.content);
  if (contentError) {
    throw new ValidationError(contentError);
  }
  const sanitizedContent = sanitizeContent(input.content);

  return analyzeContent(anthropic, sanitizedContent);
}
