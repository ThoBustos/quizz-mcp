import Anthropic from "@anthropic-ai/sdk";
import type { QuizDifficulty, AnswerEvaluation } from "./schemas.js";
import { AnswerEvaluationSchema } from "./schemas.js";
import { evaluationStrictness, difficultyThresholds } from "./difficulty.js";

function buildEvaluationPrompt(
  question: string,
  expectedAnswer: string,
  keyPoints: string[],
  userAnswer: string,
  difficulty: QuizDifficulty
): string {
  const strictnessGuide = evaluationStrictness[difficulty];
  const threshold = difficultyThresholds[difficulty];

  return `Evaluate this answer to a quiz question about coding/technical content.

Question: ${question}

Expected answer: ${expectedAnswer}

Key points that should be covered:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

User's answer: ${userAnswer}

Evaluation strictness (${difficulty.toUpperCase()} difficulty):
${strictnessGuide}

Pass threshold: ${threshold}% (score >= ${threshold} means correct)

Respond with valid JSON:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "explanation of evaluation",
  "matchedPoints": ["points that were covered"]
}`;
}

export async function evaluateOpenEndedAnswer(
  anthropic: Anthropic,
  question: string,
  expectedAnswer: string,
  keyPoints: string[],
  userAnswer: string,
  difficulty: QuizDifficulty
): Promise<AnswerEvaluation> {
  const prompt = buildEvaluationPrompt(question, expectedAnswer, keyPoints, userAnswer, difficulty);

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c: { type: string }) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in response");
  }

  return AnswerEvaluationSchema.parse(JSON.parse(jsonMatch[0]));
}

function buildCodeEvaluationPrompt(
  question: string,
  language: string,
  expectedSolution: string,
  keyPoints: string[],
  userCode: string,
  difficulty: QuizDifficulty
): string {
  const strictnessGuide = evaluationStrictness[difficulty];
  const threshold = difficultyThresholds[difficulty];

  return `Evaluate this code solution to a coding quiz question.

Question: ${question}

Language: ${language}

Expected solution:
\`\`\`${language}
${expectedSolution}
\`\`\`

Key points the solution should demonstrate:
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

User's code:
\`\`\`${language}
${userCode}
\`\`\`

Evaluation strictness (${difficulty.toUpperCase()} difficulty):
${strictnessGuide}

Pass threshold: ${threshold}% (score >= ${threshold} means correct)

Evaluate based on:
1. Correctness: Does the code solve the problem?
2. Key points: Does it demonstrate the required concepts?
3. Code quality: Is it readable and well-structured?
4. Edge cases: Does it handle edge cases appropriately?

Respond with valid JSON:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "explanation of evaluation with specific code feedback",
  "matchedPoints": ["key points that were demonstrated"]
}`;
}

export async function evaluateCodeWriting(
  anthropic: Anthropic,
  question: string,
  language: string,
  expectedSolution: string,
  keyPoints: string[],
  userCode: string,
  difficulty: QuizDifficulty
): Promise<AnswerEvaluation> {
  const prompt = buildCodeEvaluationPrompt(
    question,
    language,
    expectedSolution,
    keyPoints,
    userCode,
    difficulty
  );

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((c: { type: string }) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in response");
  }

  return AnswerEvaluationSchema.parse(JSON.parse(jsonMatch[0]));
}

export function evaluateMultipleChoice(userAnswer: number, correctIndex: number): AnswerEvaluation {
  const isCorrect = userAnswer === correctIndex;
  return {
    isCorrect,
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Correct!"
      : `Incorrect. The correct answer was option ${String.fromCharCode(65 + correctIndex)}.`,
    matchedPoints: [],
  };
}

export function evaluateMultiSelect(
  userAnswers: number[],
  correctIndices: number[]
): AnswerEvaluation {
  const userSet = new Set(userAnswers);
  const correctSet = new Set(correctIndices);

  // Calculate how many correct answers the user got
  const correctlySelected = userAnswers.filter((a) => correctSet.has(a)).length;
  // Calculate how many wrong answers the user selected
  const incorrectlySelected = userAnswers.filter((a) => !correctSet.has(a)).length;
  // Calculate how many correct answers were missed
  const missed = correctIndices.filter((a) => !userSet.has(a)).length;

  // Perfect score only if all correct selected and no incorrect
  const isCorrect = correctlySelected === correctIndices.length && incorrectlySelected === 0;

  // Score calculation: full credit for correct selections, penalties for wrong/missed
  let score: number;
  if (isCorrect) {
    score = 100;
  } else {
    // Partial credit based on correct selections minus penalties
    const maxPoints = correctIndices.length;
    const earnedPoints = Math.max(0, correctlySelected - incorrectlySelected);
    score = Math.round((earnedPoints / maxPoints) * 100);
  }

  // Build feedback
  let feedback: string;
  if (isCorrect) {
    feedback = "Correct! You selected all the right answers.";
  } else {
    const parts: string[] = [];
    if (incorrectlySelected > 0) {
      parts.push(`${incorrectlySelected} incorrect selection(s)`);
    }
    if (missed > 0) {
      parts.push(`${missed} correct answer(s) missed`);
    }
    const correctLetters = correctIndices.map((i) => String.fromCharCode(65 + i)).join(", ");
    feedback = `Incorrect. ${parts.join(" and ")}. The correct answers were: ${correctLetters}.`;
  }

  return {
    isCorrect,
    score,
    feedback,
    matchedPoints: userAnswers
      .filter((a) => correctSet.has(a))
      .map((i) => String.fromCharCode(65 + i)),
  };
}
