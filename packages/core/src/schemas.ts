import { z } from "zod";

// Difficulty levels
export const QuizDifficulty = z.enum(["easy", "medium", "hard", "expert"]);
export type QuizDifficulty = z.infer<typeof QuizDifficulty>;

// Question types
export const QuizQuestionType = z.enum([
  "multiple-choice",
  "multi-select",
  "open-ended",
  "code-writing",
]);
export type QuizQuestionType = z.infer<typeof QuizQuestionType>;

// Code snippet for code-context questions
export const CodeSnippetSchema = z.object({
  language: z.string().describe("Programming language (e.g., typescript, python)"),
  code: z.string().describe("The code snippet"),
  label: z.string().optional().describe("Label for comparison questions (e.g., 'Before', 'After')"),
});

export type CodeSnippet = z.infer<typeof CodeSnippetSchema>;

// Optional code context that can be added to any question type
export const CodeContextSchema = z
  .array(CodeSnippetSchema)
  .min(1)
  .describe("Code snippets to display with the question");

// Multiple-choice question schema (single correct answer)
export const MultipleChoiceQuestionSchema = z.object({
  type: z.literal("multiple-choice"),
  question: z.string().describe("The question to ask"),
  options: z.array(z.string()).length(4).describe("Exactly 4 answer options"),
  correctIndex: z.number().min(0).max(3).describe("Index of correct answer (0-3)"),
  explanation: z.string().describe("Why this answer is correct"),
  source: z.string().optional().describe("Where in the content this comes from"),
  codeContext: CodeContextSchema.optional().describe("Code snippets to display with the question"),
});

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

// Multi-select question schema (multiple correct answers)
export const MultiSelectQuestionSchema = z.object({
  type: z.literal("multi-select"),
  question: z.string().describe("The question to ask"),
  options: z.array(z.string()).min(4).max(6).describe("4-6 answer options"),
  correctIndices: z.array(z.number()).min(1).describe("Indices of all correct answers"),
  explanation: z.string().describe("Why these answers are correct"),
  source: z.string().optional().describe("Where in the content this comes from"),
  codeContext: CodeContextSchema.optional().describe("Code snippets to display with the question"),
});

export type MultiSelectQuestion = z.infer<typeof MultiSelectQuestionSchema>;

// Open-ended question schema
export const OpenEndedQuestionSchema = z.object({
  type: z.literal("open-ended"),
  question: z.string().describe("The question to ask"),
  expectedAnswer: z.string().describe("Model answer"),
  keyPoints: z.array(z.string()).describe("Key points answer should cover"),
  explanation: z.string().describe("Full explanation of the answer"),
  source: z.string().optional().describe("Where in the content this comes from"),
  codeContext: CodeContextSchema.optional().describe("Code snippets to display with the question"),
});

export type OpenEndedQuestion = z.infer<typeof OpenEndedQuestionSchema>;

// Code-writing question schema (user writes code)
export const CodeWritingQuestionSchema = z.object({
  type: z.literal("code-writing"),
  question: z.string().describe("The coding task to complete"),
  language: z.string().describe("Programming language for the solution"),
  starterCode: z.string().optional().describe("Optional starter code scaffold"),
  expectedSolution: z.string().describe("Model solution code"),
  keyPoints: z.array(z.string()).describe("Key aspects the solution should demonstrate"),
  explanation: z.string().describe("Explanation of the solution approach"),
  source: z.string().optional().describe("Where in the content this comes from"),
});

export type CodeWritingQuestion = z.infer<typeof CodeWritingQuestionSchema>;

// Union of question types
export const QuizQuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  MultiSelectQuestionSchema,
  OpenEndedQuestionSchema,
  CodeWritingQuestionSchema,
]);

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// Quiz generation response schema
export const QuizQuestionsResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

export type QuizQuestionsResponse = z.infer<typeof QuizQuestionsResponseSchema>;

// Answer evaluation schema
export const AnswerEvaluationSchema = z.object({
  isCorrect: z.boolean().describe("Whether the answer is sufficiently correct"),
  score: z.number().min(0).max(100).describe("Score from 0-100"),
  feedback: z.string().describe("Feedback explaining the evaluation"),
  matchedPoints: z.array(z.string()).describe("Key points that were covered"),
});

export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;

// Content analysis response schema
export const ContentAnalysisSchema = z.object({
  topics: z.array(z.string()).describe("Main topics identified in the content"),
  complexity: z.enum(["low", "medium", "high"]).describe("Overall complexity of the content"),
  suggestedQuestionCount: z.number().min(1).max(20).describe("Recommended number of questions"),
  suggestedDifficulty: QuizDifficulty.describe("Recommended difficulty level"),
  contentType: z
    .enum(["code", "documentation", "conversation", "mixed"])
    .describe("Type of content"),
});

export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;
