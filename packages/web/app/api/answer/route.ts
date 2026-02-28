import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import {
  evaluateMultipleChoice,
  evaluateMultiSelect,
  evaluateCodeWriting,
  difficultyThresholds,
  type QuizAnswer,
  type QuizQuestion,
  type MultiSelectQuestion,
  type OpenEndedQuestion,
  type MultipleChoiceQuestion,
  type CodeWritingQuestion,
} from "@quizz/core";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answer } = body;

    if (!sessionId || answer === undefined) {
      return NextResponse.json({ error: "Missing sessionId or answer" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Quiz session not found" }, { status: 404 });
    }

    const currentIndex = session.answers.length;
    if (currentIndex >= session.questions.length) {
      return NextResponse.json({ error: "Quiz already completed" }, { status: 400 });
    }

    const currentQuestion = session.questions[currentIndex];
    let evaluation;
    let normalizedAnswer: number | number[] | string = answer;

    if (currentQuestion.type === "multiple-choice") {
      // Normalize answer to index
      if (typeof answer === "string") {
        const letter = answer.toUpperCase().trim();
        const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
        if (letter in letterMap) {
          normalizedAnswer = letterMap[letter];
        } else {
          return NextResponse.json(
            { error: "Invalid answer. Use A, B, C, D or 0-3" },
            { status: 400 }
          );
        }
      }

      if (typeof normalizedAnswer !== "number" || normalizedAnswer < 0 || normalizedAnswer > 3) {
        return NextResponse.json({ error: "Invalid answer index" }, { status: 400 });
      }

      evaluation = evaluateMultipleChoice(normalizedAnswer, currentQuestion.correctIndex);
    } else if (currentQuestion.type === "multi-select") {
      // Parse multi-select answer
      let indices: number[];

      if (typeof answer === "string") {
        // Parse string like "A, C, D" or "0, 2, 3"
        const parts = answer.split(/[,\s]+/).filter(Boolean);
        const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
        indices = [];
        for (const part of parts) {
          const trimmed = part.trim().toUpperCase();
          if (trimmed in letterMap) {
            indices.push(letterMap[trimmed]);
          } else {
            const num = parseInt(trimmed, 10);
            if (!isNaN(num) && num >= 0) {
              indices.push(num);
            } else {
              return NextResponse.json(
                { error: `Invalid selection: "${part}". Use A-F or 0-5.` },
                { status: 400 }
              );
            }
          }
        }
      } else if (Array.isArray(answer)) {
        indices = answer;
      } else if (typeof answer === "number") {
        indices = [answer];
      } else {
        return NextResponse.json({ error: "Invalid multi-select answer format" }, { status: 400 });
      }

      const multiQ = currentQuestion as MultiSelectQuestion;
      evaluation = evaluateMultiSelect(indices, multiQ.correctIndices);
      normalizedAnswer = indices;
    } else if (currentQuestion.type === "code-writing") {
      // Code-writing evaluation using LLM
      if (typeof answer !== "string" || answer.trim().length === 0) {
        return NextResponse.json(
          { error: "Code-writing questions require a code answer" },
          { status: 400 }
        );
      }

      const codeQuestion = currentQuestion as CodeWritingQuestion;
      const anthropic = new Anthropic();

      evaluation = await evaluateCodeWriting(
        anthropic,
        codeQuestion.question,
        codeQuestion.language,
        codeQuestion.expectedSolution,
        codeQuestion.keyPoints,
        answer,
        session.config.difficulty
      );

      // Apply threshold
      const threshold = difficultyThresholds[session.config.difficulty];
      evaluation.isCorrect = evaluation.score >= threshold;
      normalizedAnswer = answer;
    } else {
      // Open-ended - simple evaluation for web UI (LLM evaluation happens in MCP)
      if (typeof answer !== "string" || answer.trim().length === 0) {
        return NextResponse.json(
          { error: "Open-ended questions require a text answer" },
          { status: 400 }
        );
      }

      const openQuestion = currentQuestion as OpenEndedQuestion;
      // Simple keyword matching for web UI (full LLM evaluation is in MCP server)
      const userLower = answer.toLowerCase();
      const matchedPoints = openQuestion.keyPoints.filter((point) =>
        userLower.includes(point.toLowerCase().split(" ")[0])
      );

      const score = Math.round((matchedPoints.length / openQuestion.keyPoints.length) * 100);
      const threshold = difficultyThresholds[session.config.difficulty];

      evaluation = {
        isCorrect: score >= threshold,
        score,
        feedback:
          score >= threshold
            ? "Good answer! You covered the key points."
            : "Your answer could be more complete. Review the explanation below.",
        matchedPoints,
      };

      normalizedAnswer = answer;
    }

    // Record answer
    const answerRecord: QuizAnswer = {
      questionIndex: currentIndex,
      userAnswer: normalizedAnswer,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      evaluation: evaluation.feedback,
      answeredAt: new Date().toISOString(),
    };

    const updatedAnswers = [...session.answers, answerRecord];

    // Check if quiz is complete
    const isComplete = updatedAnswers.length >= session.questions.length;

    let updatedSession;
    if (isComplete) {
      const correct = updatedAnswers.filter((a) => a.isCorrect).length;
      const total = session.questions.length;

      updatedSession = updateSession(session.id, {
        answers: updatedAnswers,
        completedAt: new Date().toISOString(),
        score: {
          correct,
          total,
          percentage: Math.round((correct / total) * 100),
        },
      });
    } else {
      updatedSession = updateSession(session.id, { answers: updatedAnswers });
    }

    return NextResponse.json({
      evaluation: {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        explanation: currentQuestion.explanation,
        correctAnswer: getCorrectAnswer(currentQuestion),
      },
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json({ error: "Failed to process answer" }, { status: 500 });
  }
}

function getCorrectAnswer(question: QuizQuestion): string {
  if (question.type === "multiple-choice") {
    const mc = question as MultipleChoiceQuestion;
    const letter = String.fromCharCode(65 + mc.correctIndex);
    return `${letter}) ${mc.options[mc.correctIndex]}`;
  } else if (question.type === "multi-select") {
    const ms = question as MultiSelectQuestion;
    return ms.correctIndices
      .map((i) => `${String.fromCharCode(65 + i)}) ${ms.options[i]}`)
      .join(", ");
  } else if (question.type === "code-writing") {
    return (question as CodeWritingQuestion).expectedSolution;
  }
  return (question as OpenEndedQuestion).expectedAnswer;
}
