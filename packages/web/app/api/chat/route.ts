import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/db";
import type { QuizQuestion, QuizAnswer } from "@quizz/core";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  sessionId: string;
  questionIndex: number;
  message: string;
  chatHistory?: ChatMessage[];
}

function buildSystemPrompt(
  session: {
    config: { difficulty: string; focus?: string };
    questions: QuizQuestion[];
    answers: QuizAnswer[];
  },
  questionIndex: number
): string {
  const currentQuestion = session.questions[questionIndex];
  const currentAnswer = session.answers[questionIndex];

  // Build context from previous questions (NOT future ones)
  const previousContext = session.questions
    .slice(0, questionIndex)
    .map((q, i) => {
      const answer = session.answers[i];
      return `Q${i + 1}: ${q.question}
User's answer: ${answer?.userAnswer ?? "Not answered"}
Result: ${answer?.isCorrect ? "Correct" : "Incorrect"}`;
    })
    .join("\n\n");

  const userAnswerDisplay =
    typeof currentAnswer?.userAnswer === "number"
      ? `Option ${String.fromCharCode(65 + currentAnswer.userAnswer)}`
      : Array.isArray(currentAnswer?.userAnswer)
        ? currentAnswer.userAnswer.map((i) => String.fromCharCode(65 + i)).join(", ")
        : (currentAnswer?.userAnswer ?? "Unknown");

  return `You are a helpful tutor discussing a quiz question with a student.

Quiz Topic: ${session.config.focus || "General coding concepts"}
Difficulty: ${session.config.difficulty}

The student just answered question ${questionIndex + 1}:

Question: ${currentQuestion.question}
${currentQuestion.type !== "open-ended" && "options" in currentQuestion ? `Options: ${(currentQuestion as { options: string[] }).options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(", ")}` : ""}
Their answer: ${userAnswerDisplay}
Result: ${currentAnswer?.isCorrect ? "Correct!" : "Incorrect"}
${currentAnswer?.evaluation ? `Feedback: ${currentAnswer.evaluation}` : ""}

Explanation: ${currentQuestion.explanation}

${previousContext ? `Previous questions context:\n${previousContext}` : ""}

Guidelines:
- Help the student understand this topic better
- Be encouraging and supportive
- Give clear, concise explanations
- Use code examples when helpful
- NEVER reveal upcoming questions or answers
- Stay focused on the current question and related concepts`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { sessionId, questionIndex, message, chatHistory = [] } = body;

    if (!sessionId || questionIndex === undefined || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = getSession(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: "Quiz session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate questionIndex - must be answered already
    if (questionIndex < 0 || questionIndex >= session.answers.length) {
      return new Response(
        JSON.stringify({ error: "Invalid question index or question not yet answered" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropic = new Anthropic();
    const systemPrompt = buildSystemPrompt(session, questionIndex);

    // Build messages array
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...chatHistory,
      { role: "user", content: message },
    ];

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: "Failed to process chat message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
