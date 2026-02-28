import { describe, it, expect } from "vitest";
import { quizStatsSchema } from "./stats.js";

describe("quizStatsSchema", () => {
  it("has correct name", () => {
    expect(quizStatsSchema.name).toBe("quiz_stats");
  });

  it("has description", () => {
    expect(quizStatsSchema.description).toContain("history");
  });

  it("has optional days property", () => {
    const props = quizStatsSchema.inputSchema.properties;
    expect(props.days).toBeDefined();
    expect(props.days.type).toBe("number");
  });

  it("has optional difficulty filter", () => {
    const props = quizStatsSchema.inputSchema.properties;
    expect(props.difficulty).toBeDefined();
    expect(props.difficulty.enum).toContain("easy");
    expect(props.difficulty.enum).toContain("expert");
  });

  it("has no required properties", () => {
    // Stats schema has no required fields - all are optional
    const schema = quizStatsSchema.inputSchema as { required?: string[] };
    expect(schema.required).toBeUndefined();
  });
});
