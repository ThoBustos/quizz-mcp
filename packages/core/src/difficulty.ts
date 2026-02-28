import type { QuizDifficulty } from "./schemas.js";

// Difficulty-specific instructions for question generation
export const difficultyInstructions: Record<QuizDifficulty, string> = {
  easy: `Difficulty: EASY
- Test basic recall of main ideas and key concepts
- Questions should be answerable after a quick read
- MC distractors should be clearly from different topics or obviously wrong
- Open-ended: expect 1-2 sentence answers covering obvious points
- Focus on: main concepts, key takeaways, basic terminology`,

  medium: `Difficulty: MEDIUM
- Test comprehension of methodology, patterns, and core concepts
- Questions require understanding the content's structure and flow
- MC distractors should be plausible but incomplete or slightly off
- Open-ended: expect short paragraph explaining "how" and "why"
- Focus on: implementation details, patterns used, stated reasons`,

  hard: `Difficulty: HARD
- Test ability to analyze relationships, implications, and trade-offs
- Questions require connecting ideas across different parts
- MC distractors should involve subtle distinctions and partial truths
- Open-ended: expect synthesis of multiple concepts
- Focus on: unstated implications, trade-offs, when to use what`,

  expert: `Difficulty: EXPERT
- Test critical evaluation, edge cases, and alternative approaches
- Questions should challenge even someone who's read the content multiple times
- MC distractors should reflect common expert misconceptions
- Open-ended: expect critique, comparison, or proposed extensions
- Focus on: limitations, edge cases, what wasn't covered, alternatives`,
};

// Evaluation strictness by difficulty
export const evaluationStrictness: Record<QuizDifficulty, string> = {
  easy: `Be generous: accept paraphrasing, partial answers covering the main point count as correct.
A response showing basic understanding should pass.`,

  medium: `Be fair: core concepts must be present, but allow different phrasing.
A response covering most key points should pass.`,

  hard: `Be precise: terminology should be accurate, connections must be explicit.
A response needs strong coverage of key points with clear reasoning.`,

  expert: `Be rigorous: expect expert-level depth, nuance, and critical thinking.
Only thorough, insightful responses demonstrating mastery should pass.`,
};

// Pass thresholds by difficulty (percentage)
export const difficultyThresholds: Record<QuizDifficulty, number> = {
  easy: 50,
  medium: 60,
  hard: 75,
  expert: 85,
};
