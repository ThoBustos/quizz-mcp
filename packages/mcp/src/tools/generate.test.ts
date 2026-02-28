import { describe, it, expect } from "vitest";
import { generateQuizSchema } from "./generate.js";

describe("generateQuizSchema", () => {
  it("has correct name", () => {
    expect(generateQuizSchema.name).toBe("generate_quiz");
  });

  it("has description mentioning critical requirements", () => {
    expect(generateQuizSchema.description).toContain("CRITICAL");
    expect(generateQuizSchema.description).toContain("MUST ask");
  });

  it("describes all 4 question types", () => {
    expect(generateQuizSchema.description).toContain("multiple-choice");
    expect(generateQuizSchema.description).toContain("multi-select");
    expect(generateQuizSchema.description).toContain("open-ended");
    expect(generateQuizSchema.description).toContain("code-writing");
  });

  it("has required input properties", () => {
    const props = generateQuizSchema.inputSchema.properties;
    expect(props.content).toBeDefined();
    expect(props.questionCount).toBeDefined();
    expect(props.difficulty).toBeDefined();
    expect(props.questionTypes).toBeDefined();
  });

  it("requires content, questionCount, difficulty, questionTypes", () => {
    expect(generateQuizSchema.inputSchema.required).toContain("content");
    expect(generateQuizSchema.inputSchema.required).toContain("questionCount");
    expect(generateQuizSchema.inputSchema.required).toContain("difficulty");
    expect(generateQuizSchema.inputSchema.required).toContain("questionTypes");
  });

  it("defines difficulty enum with new values", () => {
    const diffEnum = generateQuizSchema.inputSchema.properties.difficulty.enum;
    expect(diffEnum).toContain("easy");
    expect(diffEnum).toContain("medium");
    expect(diffEnum).toContain("hard");
    expect(diffEnum).toContain("expert");
  });

  it("defines questionTypes enum correctly", () => {
    const typeEnum = generateQuizSchema.inputSchema.properties.questionTypes.items.enum;
    expect(typeEnum).toContain("multiple-choice");
    expect(typeEnum).toContain("multi-select");
    expect(typeEnum).toContain("open-ended");
    expect(typeEnum).toContain("code-writing");
  });

  it("has optional focus property", () => {
    expect(generateQuizSchema.inputSchema.properties.focus).toBeDefined();
    expect(generateQuizSchema.inputSchema.required).not.toContain("focus");
  });
});
