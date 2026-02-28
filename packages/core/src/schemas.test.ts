import { describe, it, expect } from "vitest";
import {
  QuizDifficulty,
  QuizQuestionType,
  MultipleChoiceQuestionSchema,
  MultiSelectQuestionSchema,
  OpenEndedQuestionSchema,
  CodeWritingQuestionSchema,
  AnswerEvaluationSchema,
} from "./schemas.js";

describe("QuizDifficulty", () => {
  it("accepts valid difficulties", () => {
    expect(QuizDifficulty.parse("easy")).toBe("easy");
    expect(QuizDifficulty.parse("medium")).toBe("medium");
    expect(QuizDifficulty.parse("hard")).toBe("hard");
    expect(QuizDifficulty.parse("expert")).toBe("expert");
  });

  it("rejects invalid difficulties", () => {
    expect(() => QuizDifficulty.parse("invalid")).toThrow();
    expect(() => QuizDifficulty.parse("skim")).toThrow(); // old name
  });
});

describe("QuizQuestionType", () => {
  it("accepts valid question types", () => {
    expect(QuizQuestionType.parse("multiple-choice")).toBe("multiple-choice");
    expect(QuizQuestionType.parse("multi-select")).toBe("multi-select");
    expect(QuizQuestionType.parse("open-ended")).toBe("open-ended");
    expect(QuizQuestionType.parse("code-writing")).toBe("code-writing");
  });

  it("rejects invalid question types", () => {
    expect(() => QuizQuestionType.parse("invalid")).toThrow();
  });
});

describe("MultipleChoiceQuestionSchema", () => {
  const validQuestion = {
    type: "multiple-choice" as const,
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    explanation: "Basic arithmetic",
  };

  it("accepts valid multiple choice question", () => {
    expect(MultipleChoiceQuestionSchema.parse(validQuestion)).toEqual(validQuestion);
  });

  it("requires exactly 4 options", () => {
    expect(() =>
      MultipleChoiceQuestionSchema.parse({
        ...validQuestion,
        options: ["A", "B", "C"],
      })
    ).toThrow();
  });

  it("requires correctIndex between 0-3", () => {
    expect(() =>
      MultipleChoiceQuestionSchema.parse({
        ...validQuestion,
        correctIndex: 4,
      })
    ).toThrow();
  });
});

describe("MultiSelectQuestionSchema", () => {
  const validQuestion = {
    type: "multi-select" as const,
    question: "Which are programming languages?",
    options: ["Python", "HTML", "JavaScript", "CSS"],
    correctIndices: [0, 2],
    explanation: "Python and JavaScript are programming languages",
  };

  it("accepts valid multi-select question", () => {
    expect(MultiSelectQuestionSchema.parse(validQuestion)).toEqual(validQuestion);
  });

  it("requires at least 4 options", () => {
    expect(() =>
      MultiSelectQuestionSchema.parse({
        ...validQuestion,
        options: ["A", "B", "C"],
      })
    ).toThrow();
  });

  it("allows up to 6 options", () => {
    const sixOptions = {
      ...validQuestion,
      options: ["A", "B", "C", "D", "E", "F"],
    };
    expect(MultiSelectQuestionSchema.parse(sixOptions)).toBeDefined();
  });
});

describe("OpenEndedQuestionSchema", () => {
  const validQuestion = {
    type: "open-ended" as const,
    question: "Explain closures in JavaScript",
    expectedAnswer: "A closure is...",
    keyPoints: ["function scope", "outer variables"],
    explanation: "Closures capture their lexical environment",
  };

  it("accepts valid open-ended question", () => {
    expect(OpenEndedQuestionSchema.parse(validQuestion)).toEqual(validQuestion);
  });
});

describe("CodeWritingQuestionSchema", () => {
  const validQuestion = {
    type: "code-writing" as const,
    question: "Write a function to add two numbers",
    language: "typescript",
    expectedSolution: "function add(a: number, b: number) { return a + b; }",
    keyPoints: ["type annotations", "return value"],
    explanation: "Simple addition function",
  };

  it("accepts valid code-writing question", () => {
    expect(CodeWritingQuestionSchema.parse(validQuestion)).toEqual(validQuestion);
  });

  it("accepts optional starterCode", () => {
    const withStarter = {
      ...validQuestion,
      starterCode: "function add(a, b) { }",
    };
    expect(CodeWritingQuestionSchema.parse(withStarter)).toBeDefined();
  });
});

describe("AnswerEvaluationSchema", () => {
  it("accepts valid evaluation", () => {
    const evaluation = {
      isCorrect: true,
      score: 85,
      feedback: "Good job!",
      matchedPoints: ["point 1", "point 2"],
    };
    expect(AnswerEvaluationSchema.parse(evaluation)).toEqual(evaluation);
  });

  it("validates score range 0-100", () => {
    expect(() =>
      AnswerEvaluationSchema.parse({
        isCorrect: true,
        score: 150,
        feedback: "Test",
        matchedPoints: [],
      })
    ).toThrow();
  });
});
