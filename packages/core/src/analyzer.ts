import Anthropic from "@anthropic-ai/sdk";
import { ContentAnalysisSchema, type ContentAnalysis } from "./schemas.js";

const ANALYSIS_PROMPT = `Analyze this content and provide recommendations for quiz generation.

Identify:
1. Main topics covered (3-5 specific topics)
2. Overall complexity (low/medium/high based on technical depth)
3. Suggested number of questions (based on content length and density)
4. Suggested difficulty level (skim/read/study/master)
5. Content type (code/documentation/conversation/mixed)

Content to analyze:
`;

export async function analyzeContent(
  anthropic: Anthropic,
  content: string
): Promise<ContentAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${ANALYSIS_PROMPT}

${content}

Respond with valid JSON:
{
  "topics": ["topic1", "topic2", "topic3"],
  "complexity": "low" | "medium" | "high",
  "suggestedQuestionCount": 5,
  "suggestedDifficulty": "skim" | "read" | "study" | "master",
  "contentType": "code" | "documentation" | "conversation" | "mixed"
}`,
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

  return ContentAnalysisSchema.parse(JSON.parse(jsonMatch[0]));
}
