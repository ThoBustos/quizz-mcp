import { describe, it, expect } from "vitest";
import {
  difficultyInstructions,
  evaluationStrictness,
  difficultyThresholds,
} from "./difficulty.js";

describe("difficultyThresholds", () => {
  it("has threshold for easy", () => {
    expect(difficultyThresholds.easy).toBe(50);
  });

  it("has threshold for medium", () => {
    expect(difficultyThresholds.medium).toBe(60);
  });

  it("has threshold for hard", () => {
    expect(difficultyThresholds.hard).toBe(75);
  });

  it("has threshold for expert", () => {
    expect(difficultyThresholds.expert).toBe(85);
  });

  it("thresholds increase with difficulty", () => {
    expect(difficultyThresholds.easy).toBeLessThan(difficultyThresholds.medium);
    expect(difficultyThresholds.medium).toBeLessThan(difficultyThresholds.hard);
    expect(difficultyThresholds.hard).toBeLessThan(difficultyThresholds.expert);
  });
});

describe("difficultyInstructions", () => {
  it("has instructions for all difficulties", () => {
    expect(difficultyInstructions.easy).toBeDefined();
    expect(difficultyInstructions.medium).toBeDefined();
    expect(difficultyInstructions.hard).toBeDefined();
    expect(difficultyInstructions.expert).toBeDefined();
  });

  it("easy instructions focus on basic recall", () => {
    expect(difficultyInstructions.easy.toLowerCase()).toContain("basic");
  });

  it("expert instructions focus on critical evaluation", () => {
    expect(difficultyInstructions.expert.toLowerCase()).toContain("critical");
  });
});

describe("evaluationStrictness", () => {
  it("has strictness for all difficulties", () => {
    expect(evaluationStrictness.easy).toBeDefined();
    expect(evaluationStrictness.medium).toBeDefined();
    expect(evaluationStrictness.hard).toBeDefined();
    expect(evaluationStrictness.expert).toBeDefined();
  });

  it("easy strictness is generous", () => {
    expect(evaluationStrictness.easy.toLowerCase()).toContain("generous");
  });

  it("expert strictness is rigorous", () => {
    expect(evaluationStrictness.expert.toLowerCase()).toContain("rigorous");
  });
});
