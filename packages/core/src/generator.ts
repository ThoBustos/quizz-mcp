import Anthropic from "@anthropic-ai/sdk";
import type { QuizConfig } from "./types.js";
import type { QuizQuestion } from "./schemas.js";
import { QuizQuestionsResponseSchema } from "./schemas.js";
import { difficultyInstructions } from "./difficulty.js";

function buildQuizPrompt(content: string, config: QuizConfig): string {
  const difficultyGuide = difficultyInstructions[config.difficulty];

  // Detect if content contains code blocks
  const hasCodeBlocks = /```[\s\S]*?```|`[^`]+`/.test(content);

  const typeInstructions = config.questionTypes
    .map((type) => {
      if (type === "multiple-choice") {
        return `For multiple-choice questions:
- Create questions with exactly 4 options where only 1 is correct
- Distractor difficulty should match the overall difficulty level
- Include the correctIndex (0-3) for the correct answer
- Include "type": "multiple-choice" for each MC question
${
  hasCodeBlocks
    ? `- When asking about code, include a "codeContext" array with code snippets
- For code comparison questions, include 2 snippets with labels like "Before"/"After"`
    : ""
}`;
      } else if (type === "multi-select") {
        return `For multi-select questions:
- Create questions with 4-6 options where MULTIPLE answers are correct
- Typically 2-3 correct answers out of the options
- Include correctIndices array with all correct answer indices
- Include "type": "multi-select" for each multi-select question
- Good for testing comprehensive understanding of related concepts
${hasCodeBlocks ? `- When asking about code, include a "codeContext" array with code snippets` : ""}`;
      } else if (type === "code-writing") {
        return `For code-writing questions:
- Ask the user to write or complete code
- Include "type": "code-writing"
- Include "language" field (e.g., "typescript", "python")
- Include optional "starterCode" if providing a scaffold
- Include "expectedSolution" with a model solution
- Include 3-5 "keyPoints" the solution should demonstrate
- Good for testing practical coding skills`;
      } else {
        return `For open-ended questions:
- Question depth should match the difficulty level
- Include 3-5 key points the answer should cover (more nuanced for harder difficulties)
- Provide a model expectedAnswer appropriate to the difficulty
- Include "type": "open-ended" for each open-ended question
${hasCodeBlocks ? `- When asking about code, include a "codeContext" array with code snippets` : ""}`;
      }
    })
    .join("\n\n");

  const focusInstruction = config.focus ? `Focus questions specifically on: ${config.focus}` : "";

  return `You are generating quiz questions to test understanding of a coding session or technical content.
Generate exactly ${config.questionCount} questions.

${difficultyGuide}

Question types to include: ${config.questionTypes.join(", ")}
${config.questionTypes.length > 1 ? `Mix the question types roughly equally.` : ""}

${typeInstructions}

${focusInstruction}

For all questions:
- Questions should test practical understanding, not just memorization
- Include the source location when possible (e.g., "in the discussion about X")
- Explanations should help the learner understand, not just state the answer
- For coding content, test understanding of WHY not just WHAT

Content to generate questions from:
${content}

Respond with valid JSON in this exact structure:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "...",
      "source": "optional source reference",
      "codeContext": [{"language": "typescript", "code": "const x = 1;", "label": "optional label"}]
    },
    {
      "type": "multi-select",
      "question": "...",
      "options": ["A", "B", "C", "D", "E"],
      "correctIndices": [0, 2, 3],
      "explanation": "...",
      "source": "optional source reference"
    },
    {
      "type": "open-ended",
      "question": "...",
      "expectedAnswer": "...",
      "keyPoints": ["point1", "point2", "point3"],
      "explanation": "...",
      "source": "optional source reference"
    },
    {
      "type": "code-writing",
      "question": "Write a function that...",
      "language": "typescript",
      "starterCode": "function example() {\\n  // your code here\\n}",
      "expectedSolution": "function example() { return 42; }",
      "keyPoints": ["point1", "point2"],
      "explanation": "...",
      "source": "optional source reference"
    }
  ]
}

Note: codeContext is optional for multiple-choice, multi-select, and open-ended questions. Only include it when the question references specific code.`;
}

export async function generateQuizQuestions(
  anthropic: Anthropic,
  content: string,
  config: QuizConfig
): Promise<QuizQuestion[]> {
  const prompt = buildQuizPrompt(content, config);

  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((c: { type: string }) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Parse and validate with Zod
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in response");
  }

  const parsed = QuizQuestionsResponseSchema.parse(JSON.parse(jsonMatch[0]));
  return parsed.questions;
}
