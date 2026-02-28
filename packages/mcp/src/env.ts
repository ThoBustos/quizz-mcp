import { z } from "zod";

/**
 * Environment variable validation
 * API key is validated lazily when needed (not at startup)
 */

// Config that can be validated at startup (all optional)
const configSchema = z.object({
  // Optional: Override default model
  QUIZ_MODEL: z.string().default("claude-opus-4-5-20251101"),

  // Optional: Web UI port
  QUIZ_WEB_PORT: z.coerce.number().default(9004),

  // Optional: Auto-open browser
  QUIZ_AUTO_OPEN: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("true"),

  // Optional: Debug mode
  DEBUG: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("false"),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  _config = configSchema.parse(process.env);
  return _config;
}

/**
 * Get API key - validates lazily when actually needed
 * Throws clear error if missing
 */
export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required. " +
        "Set it in your MCP config or shell environment."
    );
  }

  return key;
}

/**
 * Get the web UI URL
 */
export function getWebUrl(): string {
  const config = getConfig();
  return `http://localhost:${config.QUIZ_WEB_PORT}`;
}
