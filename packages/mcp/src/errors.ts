import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

/**
 * Custom error types for better error handling
 * Maps to MCP ErrorCode for proper client communication
 */

export class QuizError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode = ErrorCode.InternalError,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "QuizError";
  }

  toMcpError(): McpError {
    return new McpError(this.code, this.message);
  }
}

export class ValidationError extends QuizError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.InvalidParams, details);
    this.name = "ValidationError";
  }
}

export class SessionNotFoundError extends QuizError {
  constructor(sessionId: string) {
    super(`Quiz session not found: ${sessionId}`, ErrorCode.InvalidRequest, {
      sessionId,
    });
    this.name = "SessionNotFoundError";
  }
}

export class QuizAlreadyCompletedError extends QuizError {
  constructor(sessionId: string) {
    super(`Quiz already completed: ${sessionId}`, ErrorCode.InvalidRequest, {
      sessionId,
    });
    this.name = "QuizAlreadyCompletedError";
  }
}

export class LLMError extends QuizError {
  constructor(message: string, originalError?: Error) {
    super(`LLM Error: ${message}`, ErrorCode.InternalError, {
      originalError: originalError?.message,
    });
    this.name = "LLMError";
  }
}

/**
 * Wrap errors in MCP-compatible format
 */
export function handleError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error;
  }

  if (error instanceof QuizError) {
    return error.toMcpError();
  }

  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}
