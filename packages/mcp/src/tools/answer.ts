import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getSession, updateSession } from "../storage/db.js";
import {
  evaluateOpenEndedAnswer,
  evaluateCodeWriting,
  evaluateMultipleChoice,
  evaluateMultiSelect,
  difficultyThresholds,
  type QuizAnswer,
  type QuizSession,
  type OpenEndedQuestion,
  type MultiSelectQuestion,
  type CodeWritingQuestion,
} from "@quizz/core";
import { SessionNotFoundError, QuizAlreadyCompletedError, ValidationError } from "../errors.js";
import { logger } from "../logger.js";

export const answerQuestionSchema = {
  name: "answer_question",
  description: "Submit an answer to a quiz question and get feedback",
  inputSchema: {
    type: "object" as const,
    properties: {
      sessionId: {
        type: "string",
        description: "The quiz session ID",
      },
      answer: {
        oneOf: [
          { type: "number", description: "MC answer index (0-3) or letter position" },
          { type: "string", description: "Open-ended answer or letter (A/B/C/D)" },
        ],
        description: "Your answer - number 0-3 for MC, or text for open-ended",
      },
    },
    required: ["sessionId", "answer"],
  },
};

const InputSchema = z.object({
  sessionId: z.string().uuid(),
  answer: z.union([z.number(), z.string()]),
});

export async function handleAnswerQuestion(
  args: unknown,
  anthropic: Anthropic
): Promise<{
  evaluation: object;
  nextQuestion?: object;
  quizComplete?: boolean;
  finalResults?: object;
}> {
  // Use safeParse for better error handling
  const result = InputSchema.safeParse(args);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    throw new ValidationError(`Invalid input: ${errors.join(", ")}`);
  }
  const input = result.data;

  logger.debug("Processing answer", { sessionId: input.sessionId });

  const session = getSession(input.sessionId);
  if (!session) {
    throw new SessionNotFoundError(input.sessionId);
  }

  const currentIndex = session.answers.length;
  if (currentIndex >= session.questions.length) {
    throw new QuizAlreadyCompletedError(input.sessionId);
  }

  const currentQuestion = session.questions[currentIndex];
  let evaluation;
  let normalizedAnswer: number | number[] | string = input.answer;

  if (currentQuestion.type === "multiple-choice") {
    // Normalize answer to index
    if (typeof input.answer === "string") {
      const letter = input.answer.toUpperCase().trim();
      const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
      if (letter in letterMap) {
        normalizedAnswer = letterMap[letter];
      } else {
        throw new ValidationError("Invalid answer. Use A, B, C, D or 0-3");
      }
    }

    if (typeof normalizedAnswer !== "number" || normalizedAnswer < 0 || normalizedAnswer > 3) {
      throw new ValidationError("Invalid answer index. Must be 0-3");
    }

    evaluation = evaluateMultipleChoice(normalizedAnswer, currentQuestion.correctIndex);
  } else if (currentQuestion.type === "multi-select") {
    // Parse multi-select answer
    let indices: number[];

    if (typeof input.answer === "string") {
      // Parse string like "A, C, D" or "0, 2, 3"
      const parts = input.answer.split(/[,\s]+/).filter(Boolean);
      indices = parts.map((part) => {
        const trimmed = part.trim().toUpperCase();
        const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
        if (trimmed in letterMap) {
          return letterMap[trimmed];
        }
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          return num;
        }
        throw new ValidationError(`Invalid selection: ${part}`);
      });
    } else if (typeof input.answer === "number") {
      indices = [input.answer];
    } else {
      throw new ValidationError("Invalid multi-select answer format");
    }

    const multiQ = currentQuestion as MultiSelectQuestion;
    evaluation = evaluateMultiSelect(indices, multiQ.correctIndices);
    normalizedAnswer = indices;
  } else if (currentQuestion.type === "code-writing") {
    // Code-writing evaluation
    if (typeof input.answer !== "string" || input.answer.trim().length === 0) {
      throw new ValidationError("Code-writing questions require a code answer");
    }

    const codeQuestion = currentQuestion as CodeWritingQuestion;
    evaluation = await evaluateCodeWriting(
      anthropic,
      codeQuestion.question,
      codeQuestion.language,
      codeQuestion.expectedSolution,
      codeQuestion.keyPoints,
      input.answer,
      session.config.difficulty
    );

    // Apply threshold
    const threshold = difficultyThresholds[session.config.difficulty];
    evaluation.isCorrect = evaluation.score >= threshold;
    normalizedAnswer = input.answer;
  } else {
    // Open-ended evaluation
    if (typeof input.answer !== "string" || input.answer.trim().length === 0) {
      throw new ValidationError("Open-ended questions require a text answer");
    }

    const openQuestion = currentQuestion as OpenEndedQuestion;
    evaluation = await evaluateOpenEndedAnswer(
      anthropic,
      openQuestion.question,
      openQuestion.expectedAnswer,
      openQuestion.keyPoints,
      input.answer,
      session.config.difficulty
    );

    // Apply threshold
    const threshold = difficultyThresholds[session.config.difficulty];
    evaluation.isCorrect = evaluation.score >= threshold;
    normalizedAnswer = input.answer;
  }

  // Record answer
  const answer: QuizAnswer = {
    questionIndex: currentIndex,
    userAnswer: normalizedAnswer,
    isCorrect: evaluation.isCorrect,
    score: evaluation.score,
    evaluation: evaluation.feedback,
    answeredAt: new Date().toISOString(),
  };

  const updatedAnswers = [...session.answers, answer];

  // Check if quiz is complete
  const isComplete = updatedAnswers.length >= session.questions.length;

  if (isComplete) {
    // Calculate final score
    const correct = updatedAnswers.filter((a) => a.isCorrect).length;
    const total = session.questions.length;

    updateSession(session.id, {
      answers: updatedAnswers,
      completedAt: new Date().toISOString(),
      score: {
        correct,
        total,
        percentage: Math.round((correct / total) * 100),
      },
    });

    return {
      evaluation: {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        explanation: currentQuestion.explanation,
        correctAnswer: getCorrectAnswer(currentQuestion),
      },
      quizComplete: true,
      finalResults: {
        score: `${correct}/${total}`,
        percentage: Math.round((correct / total) * 100),
        passed: (correct / total) * 100 >= difficultyThresholds[session.config.difficulty],
        threshold: difficultyThresholds[session.config.difficulty],
        difficulty: session.config.difficulty,
        summary: generateSummary(session.questions, updatedAnswers),
      },
    };
  }

  // Update session and return next question
  updateSession(session.id, { answers: updatedAnswers });

  const nextQuestion = session.questions[currentIndex + 1];
  const formattedNext = formatQuestionForDisplay(
    nextQuestion,
    currentIndex + 2,
    session.questions.length
  );

  return {
    evaluation: {
      isCorrect: evaluation.isCorrect,
      feedback: evaluation.feedback,
      explanation: currentQuestion.explanation,
      correctAnswer: getCorrectAnswer(currentQuestion),
    },
    nextQuestion: formattedNext,
  };
}

function getCorrectAnswer(question: QuizSession["questions"][0]): string {
  if (question.type === "multiple-choice") {
    const letter = String.fromCharCode(65 + question.correctIndex);
    return `${letter}) ${question.options[question.correctIndex]}`;
  } else if (question.type === "multi-select") {
    const q = question as MultiSelectQuestion;
    return q.correctIndices
      .map((i) => `${String.fromCharCode(65 + i)}) ${q.options[i]}`)
      .join(", ");
  } else if (question.type === "code-writing") {
    return (question as CodeWritingQuestion).expectedSolution;
  }
  return (question as OpenEndedQuestion).expectedAnswer;
}

function formatQuestionForDisplay(
  question: QuizSession["questions"][0],
  questionNumber: number,
  totalQuestions: number
): object {
  const base = {
    questionNumber,
    totalQuestions,
    type: question.type,
    question: question.question,
    source: question.source,
  };

  if (question.type === "multiple-choice") {
    return {
      ...base,
      options: question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`),
      hint: "Answer with the letter (A, B, C, or D) or the option number (0-3)",
    };
  } else if (question.type === "multi-select") {
    return {
      ...base,
      options: question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`),
      hint: "Select all correct answers (e.g., 'A, C, D' or '0, 2, 3')",
    };
  } else if (question.type === "code-writing") {
    const codeQ = question as CodeWritingQuestion;
    return {
      ...base,
      language: codeQ.language,
      starterCode: codeQ.starterCode,
      hint: `Write ${codeQ.language} code to solve the problem. I'll evaluate your solution.`,
    };
  } else {
    return {
      ...base,
      hint: "Provide your answer as free text. I'll evaluate it against key points.",
    };
  }
}

function generateSummary(
  questions: QuizSession["questions"],
  answers: QuizAnswer[]
): Array<{ question: string; correct: boolean; yourAnswer: string }> {
  return questions.map((q, i) => {
    const answer = answers[i];
    let yourAnswer: string;

    if (q.type === "multiple-choice" && typeof answer.userAnswer === "number") {
      yourAnswer = `${String.fromCharCode(65 + answer.userAnswer)}) ${q.options[answer.userAnswer]}`;
    } else if (q.type === "multi-select" && Array.isArray(answer.userAnswer)) {
      const multiQ = q as MultiSelectQuestion;
      yourAnswer = answer.userAnswer
        .map((idx) => `${String.fromCharCode(65 + idx)}) ${multiQ.options[idx]}`)
        .join(", ");
    } else {
      yourAnswer = String(answer.userAnswer);
    }

    return {
      question: q.question,
      correct: answer.isCorrect,
      yourAnswer,
    };
  });
}
