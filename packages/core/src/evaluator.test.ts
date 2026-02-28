import { describe, it, expect } from "vitest";
import { evaluateMultipleChoice, evaluateMultiSelect } from "./evaluator.js";

describe("evaluateMultipleChoice", () => {
  it("returns correct when answer matches", () => {
    const result = evaluateMultipleChoice(2, 2);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toBe("Correct!");
  });

  it("returns incorrect when answer does not match", () => {
    const result = evaluateMultipleChoice(1, 3);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("Incorrect");
    expect(result.feedback).toContain("D");
  });

  it("handles edge case of first option", () => {
    const result = evaluateMultipleChoice(0, 0);
    expect(result.isCorrect).toBe(true);
  });

  it("handles edge case of last option", () => {
    const result = evaluateMultipleChoice(3, 3);
    expect(result.isCorrect).toBe(true);
  });
});

describe("evaluateMultiSelect", () => {
  it("returns correct when all answers selected correctly", () => {
    const result = evaluateMultiSelect([0, 2], [0, 2]);
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
    expect(result.feedback).toContain("Correct");
  });

  it("returns incorrect with partial selection", () => {
    const result = evaluateMultiSelect([0], [0, 2]);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(50); // 1 out of 2 correct
    expect(result.feedback).toContain("missed");
  });

  it("penalizes incorrect selections", () => {
    const result = evaluateMultiSelect([0, 1, 2], [0, 2]);
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toContain("incorrect");
  });

  it("handles empty user selection", () => {
    const result = evaluateMultiSelect([], [0, 2]);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it("handles all wrong selections", () => {
    const result = evaluateMultiSelect([1, 3], [0, 2]);
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it("includes correct letter in feedback", () => {
    const result = evaluateMultiSelect([1], [0, 2]);
    expect(result.feedback).toContain("A");
    expect(result.feedback).toContain("C");
  });

  it("tracks matched points correctly", () => {
    const result = evaluateMultiSelect([0, 1, 2], [0, 2]);
    expect(result.matchedPoints).toContain("A");
    expect(result.matchedPoints).toContain("C");
    expect(result.matchedPoints).not.toContain("B");
  });
});
