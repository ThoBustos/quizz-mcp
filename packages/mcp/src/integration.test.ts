import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer } from "./server.js";

describe("MCP Server Integration", () => {
  let server: ReturnType<typeof createServer>;

  beforeAll(() => {
    server = createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("creates server successfully", () => {
    expect(server).toBeDefined();
  });

  it("exposes server info", () => {
    // Server info is set in createServer
    expect(server).toHaveProperty("connect");
    expect(server).toHaveProperty("close");
  });
});

describe("Tool Schemas", () => {
  it("all schemas have required fields", async () => {
    const { generateQuizSchema } = await import("./tools/generate.js");
    const { answerQuestionSchema } = await import("./tools/answer.js");
    const { quizStatsSchema } = await import("./tools/stats.js");
    const { analyzeContentSchema } = await import("./tools/analyze.js");

    const schemas = [
      generateQuizSchema,
      answerQuestionSchema,
      quizStatsSchema,
      analyzeContentSchema,
    ];

    for (const schema of schemas) {
      expect(schema.name).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.inputSchema).toBeDefined();
    }
  });
});
