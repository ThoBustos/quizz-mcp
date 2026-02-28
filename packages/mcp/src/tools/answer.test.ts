import { describe, it, expect } from "vitest";
import { answerQuestionSchema } from "./answer.js";

describe("answerQuestionSchema", () => {
  it("has correct name", () => {
    expect(answerQuestionSchema.name).toBe("answer_question");
  });

  it("has description", () => {
    expect(answerQuestionSchema.description).toContain("answer");
    expect(answerQuestionSchema.description).toContain("feedback");
  });

  it("requires sessionId", () => {
    expect(answerQuestionSchema.inputSchema.required).toContain("sessionId");
  });

  it("requires answer", () => {
    expect(answerQuestionSchema.inputSchema.required).toContain("answer");
  });

  it("accepts number or string for answer", () => {
    const answerSchema = answerQuestionSchema.inputSchema.properties.answer;
    expect(answerSchema.oneOf).toBeDefined();
    expect(answerSchema.oneOf.length).toBe(2);
  });
});
