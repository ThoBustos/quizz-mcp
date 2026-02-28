# Quizz MCP - Design Document

*Date: 2026-02-28*

## Vision

An MCP server that generates custom quizzes from Claude Code sessions, helping developers reinforce learning from AI-assisted coding sessions. Think of it as **spaced repetition for your coding conversations**.

**Core Insight**: Every Claude Code session contains valuable learnings - new patterns, debugging insights, architectural decisions. This MCP server captures that knowledge and turns it into interactive quizzes.

---

## Architecture Overview

```
quizz-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # McpServer setup + transport
│   ├── tools/                # MCP tool implementations
│   │   ├── generate.ts       # generate_quiz tool
│   │   ├── evaluate.ts       # evaluate_answer tool
│   │   ├── history.ts        # quiz_history tool
│   │   └── index.ts          # tool registry
│   ├── resources/            # MCP resources (quiz sessions, stats)
│   │   ├── sessions.ts       # Active quiz sessions
│   │   └── stats.ts          # Learning statistics
│   ├── lib/
│   │   ├── quiz/             # Core quiz logic (from reader)
│   │   │   ├── generator.ts  # Question generation prompts
│   │   │   ├── evaluator.ts  # Answer evaluation
│   │   │   ├── schemas.ts    # Zod schemas
│   │   │   └── difficulty.ts # Difficulty calibration
│   │   ├── parser/           # Session content parsing
│   │   │   ├── claude-code.ts # Parse CC session transcripts
│   │   │   └── context.ts    # Extract learnable concepts
│   │   └── storage/          # Quiz persistence
│   │       ├── sessions.ts   # Store quiz sessions
│   │       └── stats.ts      # Track learning progress
│   ├── types/
│   │   ├── quiz.ts           # Quiz types
│   │   ├── session.ts        # Session types
│   │   └── index.ts          # Exports
│   └── ui/                   # Terminal UI components (optional)
│       ├── themes/           # Theme definitions
│       │   ├── hacker.ts     # Green terminal
│       │   ├── claude.ts     # Claude community style
│       │   └── minimal.ts    # Clean minimal
│       └── renderer.ts       # Quiz rendering
├── config/
│   └── default.json          # Default settings
├── tests/
│   ├── tools/
│   ├── lib/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

---

## MCP Tools Design

### 1. `generate_quiz`

Generate a quiz from Claude Code session content or any text.

```typescript
{
  name: "generate_quiz",
  description: "Generate a quiz to test understanding of concepts from a coding session or document",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "Session transcript, code, or document to quiz on"
      },
      questionCount: {
        type: "number",
        default: 5,
        description: "Number of questions (1-20)"
      },
      difficulty: {
        type: "string",
        enum: ["skim", "read", "study", "master"],
        default: "study",
        description: "Difficulty level affecting question depth"
      },
      questionTypes: {
        type: "array",
        items: { enum: ["multiple-choice", "open-ended"] },
        default: ["multiple-choice"],
        description: "Types of questions to generate"
      },
      focus: {
        type: "string",
        description: "Optional: specific topic to focus questions on"
      }
    },
    required: ["content"]
  }
}
```

**Returns**: Quiz session ID + first question (ready to answer)

### 2. `answer_question`

Submit an answer to the current quiz question.

```typescript
{
  name: "answer_question",
  description: "Submit an answer to a quiz question and get feedback",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      answer: {
        oneOf: [
          { type: "number", description: "MC answer index (0-3)" },
          { type: "string", description: "Open-ended answer" }
        ]
      }
    },
    required: ["sessionId", "answer"]
  }
}
```

**Returns**: Evaluation result + next question (or results if done)

### 3. `quiz_stats`

View learning statistics and history.

```typescript
{
  name: "quiz_stats",
  description: "View quiz history, scores, and learning progress",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Filter by topic" },
      days: { type: "number", default: 30, description: "Lookback period" }
    }
  }
}
```

---

## MCP Resources Design

### `quiz://sessions/{id}`

Access quiz session state, questions, and answers.

### `quiz://stats/overview`

Aggregated learning statistics: topics covered, scores, streaks.

---

## Quiz Logic (Adapted from Reader)

### Difficulty System

| Level | Focus | Pass Threshold |
|-------|-------|----------------|
| `skim` | Main ideas, basic recall | 50% |
| `read` | Core concepts, methodology | 60% |
| `study` | Analysis, connections | 70% |
| `master` | Critical evaluation, edge cases | 80% |

### Question Types

**Multiple Choice**
```typescript
interface MultipleChoiceQuestion {
  type: "multiple-choice";
  question: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0-3
  explanation: string;
  source?: string; // where in content
}
```

**Open-Ended**
```typescript
interface OpenEndedQuestion {
  type: "open-ended";
  question: string;
  expectedAnswer: string;
  keyPoints: string[]; // 3-5 points to cover
  explanation: string;
  source?: string;
}
```

### Answer Evaluation

For open-ended answers, use LLM evaluation with difficulty-adjusted strictness:
- `skim`: Accept paraphrasing, partial answers
- `read`: Core concepts must be present
- `study`: Terminology accurate, connections explicit
- `master`: Expert-level depth required

---

## Theme System

### Philosophy

Terminal-first aesthetic. Clean, focused, no distractions.

### Theme: Hacker (Default)

```css
:root {
  --bg: #0a0a0a;
  --surface: #111111;
  --text: #00ff41;        /* Matrix green */
  --text-muted: #006b1a;
  --primary: #00ff41;
  --accent: #ff3333;      /* Error red */
  --border: #1a3320;
}
```

Visual effects:
- Monospace font (JetBrains Mono, Fira Code)
- Subtle scanline overlay (optional)
- Phosphor glow on active elements
- Blinking cursor

### Theme: Claude Community

```css
:root {
  --bg: #1a1a2e;
  --surface: #16213e;
  --text: #e8e8e8;
  --text-muted: #7c7c8a;
  --primary: #d4a574;     /* Claude orange */
  --accent: #ff6b6b;
  --border: #2a2a4a;
}
```

### Theme: Minimal

```css
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --text: #c9d1d9;
  --text-muted: #8b949e;
  --primary: #58a6ff;
  --accent: #f85149;
  --border: #30363d;
}
```

---

## Content Sources for Quizzes

### 1. Claude Code Session Transcript

Parse the `.claude/conversation.json` or session markdown:
- Extract code explanations
- Identify debugging insights
- Capture architectural decisions
- Find tool usage patterns

### 2. Code Diffs

Generate questions about:
- What changed and why
- Potential bugs introduced
- Alternative approaches

### 3. README/Documentation

Test understanding of:
- API usage
- Configuration options
- Best practices

### 4. Arbitrary Text

Works with any learning content.

---

## Technical Decisions

### MCP SDK

Use `@modelcontextprotocol/sdk` (TypeScript):
- STDIO transport for Claude Code integration
- Standard tool/resource patterns
- Built-in capability negotiation

### Storage

SQLite (via `better-sqlite3`) for quiz persistence:
- Sessions table (id, created, config, questions, answers)
- Stats table (topic, attempts, scores, timestamps)
- Local, fast, no external dependencies

### LLM Integration

For quiz generation and evaluation:
- Use Claude API directly (user provides key)
- Or pass through to host's sampling capability
- Support both patterns

### Error Handling

```typescript
// MCP-standard error responses
throw new McpError(
  ErrorCode.InvalidParams,
  "Question count must be 1-20"
);
```

---

## Development Phases

### Phase 1: Core MCP Server

- [ ] Project setup (TypeScript, ESLint, Jest)
- [ ] Basic MCP server with STDIO transport
- [ ] `generate_quiz` tool (MC questions only)
- [ ] `answer_question` tool
- [ ] In-memory session storage

### Phase 2: Full Quiz System

- [ ] Open-ended questions + evaluation
- [ ] Difficulty calibration
- [ ] SQLite persistence
- [ ] Quiz history resource
- [ ] Stats tracking

### Phase 3: Content Parsing

- [ ] Claude Code session parser
- [ ] Code diff analyzer
- [ ] Concept extraction

### Phase 4: Polish

- [ ] Theme system (terminal UI)
- [ ] Configuration options
- [ ] Documentation
- [ ] Tests

---

## Integration with Claude Code

### Installation

```json
// ~/.claude.json or project .mcp.json
{
  "mcpServers": {
    "quizz": {
      "command": "node",
      "args": ["/path/to/quizz-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "..."
      }
    }
  }
}
```

### Usage Flow

1. Finish a coding session
2. "Generate a quiz about what we just learned"
3. Claude calls `generate_quiz` with session context
4. User answers questions via Claude
5. Track progress over time

---

## Key Files from Reader to Adapt

| Reader File | Purpose | Adaptation |
|-------------|---------|------------|
| `lib/llm/quiz.ts` | Generation prompts, evaluation | Core logic, keep mostly intact |
| `lib/llm/quiz-schemas.ts` | Zod schemas | Direct reuse |
| `types/index.ts` | TypeScript types | Adapt for MCP context |
| `components/quiz/useQuiz.ts` | State management | Adapt to MCP session model |

---

## Open Questions

1. **Session Content Access**: How to best access current Claude Code session? Options:
   - User pastes transcript
   - Read from ~/.claude/conversation files
   - MCP client provides context

2. **UI Rendering**: Should quiz rendering be:
   - Pure text (Claude renders in terminal)
   - Rich terminal UI (ink/blessed)
   - Web UI (separate port)

3. **Spaced Repetition**: Should we implement SRS for missed questions?

---

## References

- [MCP Architecture](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Best Practices](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [Reader Quiz Implementation](../reader/src/lib/llm/quiz.ts)
- [Terminal UI Themes](https://css-tricks.com/old-timey-terminal-styling/)

