import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "./env.js";
import { handleError } from "./errors.js";
import { logger } from "./logger.js";
import {
  generateQuizSchema,
  handleGenerateQuiz,
  answerQuestionSchema,
  handleAnswerQuestion,
  quizStatsSchema,
  handleQuizStats,
  analyzeContentSchema,
  handleAnalyzeContent,
} from "./tools/index.js";
import { getSession, listSessions } from "./storage/db.js";

export function createServer(): Server {
  const server = new Server(
    {
      name: "quizz-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Anthropic client created lazily on first tool call
  let _anthropic: Anthropic | null = null;
  const getAnthropic = (): Anthropic => {
    if (!_anthropic) {
      _anthropic = new Anthropic({
        apiKey: getAnthropicApiKey(),
      });
    }
    return _anthropic;
  };

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [generateQuizSchema, answerQuestionSchema, quizStatsSchema, analyzeContentSchema],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "generate_quiz": {
          const result = await handleGenerateQuiz(args, getAnthropic());
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "answer_question": {
          const result = await handleAnswerQuestion(args, getAnthropic());
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "quiz_stats": {
          const result = await handleQuizStats(args);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "analyze_content": {
          const result = await handleAnalyzeContent(args, getAnthropic());
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      throw handleError(error);
    }
  });

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const sessions = listSessions(10);

    const resources = [
      {
        uri: "quiz://health",
        name: "Health Check",
        description: "Server health status and version info",
        mimeType: "application/json",
      },
      {
        uri: "quiz://stats/overview",
        name: "Quiz Statistics Overview",
        description: "Aggregated learning statistics and recent quiz performance",
        mimeType: "application/json",
      },
      ...sessions.map((s) => ({
        uri: `quiz://sessions/${s.id}`,
        name: `Quiz Session ${s.id.slice(0, 8)}`,
        description: `${s.config.difficulty} quiz - ${s.questions.length} questions - ${s.contentPreview}`,
        mimeType: "application/json",
      })),
    ];

    return { resources };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === "quiz://health") {
      const health = {
        status: "healthy",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(health, null, 2),
          },
        ],
      };
    }

    if (uri === "quiz://stats/overview") {
      const stats = await handleQuizStats({});
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    const sessionMatch = uri.match(/^quiz:\/\/sessions\/(.+)$/);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      const session = getSession(sessionId);

      if (!session) {
        throw new McpError(ErrorCode.InvalidRequest, `Session not found: ${sessionId}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(session, null, 2),
          },
        ],
      };
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
  });

  return server;
}

export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  logger.info("MCP server started", { name: "quizz-mcp", version: "0.1.0" });

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info("Shutting down", { signal });
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
