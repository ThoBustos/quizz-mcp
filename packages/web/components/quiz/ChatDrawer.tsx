"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { QuizQuestion } from "@quizz/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CodeBlock } from "../ui/CodeBlock";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  questionIndex: number;
  question: QuizQuestion;
  userAnswer: number | number[] | string;
  feedback: {
    isCorrect: boolean;
    explanation: string;
  };
}

export function ChatDrawer({
  isOpen,
  onClose,
  sessionId,
  questionIndex,
  question,
  userAnswer: _userAnswer,
  feedback,
}: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key and expand shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClose();
        }
      }
      // Cmd+Shift+E to toggle expand
      if (e.key === "e" && (e.metaKey || e.ctrlKey) && e.shiftKey && isOpen) {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExpanded, onClose]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionIndex,
          message: userMessage,
          chatHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantMessage += parsed.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, sessionId, questionIndex, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`bg-surface border-border fixed right-0 top-0 z-50 flex h-full transform flex-col border-l shadow-xl transition-all ${isExpanded ? "w-full" : "w-full sm:w-96"}`}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <h3 className="text-text font-medium">Ask about this question</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-text-muted hover:text-text p-1 transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              title={isExpanded ? "Collapse (⌘⇧E)" : "Expand (⌘⇧E)"}
            >
              {isExpanded ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted hover:text-text p-1 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Context summary */}
        <div className="bg-bg/50 border-border text-text-muted border-b p-3 text-xs">
          <div className="line-clamp-2">
            <span className={feedback.isCorrect ? "text-accent" : "text-error"}>
              {feedback.isCorrect ? "✓" : "✗"}
            </span>{" "}
            Q{questionIndex + 1}: {question.question.slice(0, 80)}
            {question.question.length > 80 ? "..." : ""}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-text-muted py-8 text-center text-sm">
              <p>Ask questions about this topic.</p>
              <p className="mt-2 text-xs">The tutor can help clarify concepts.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-bg"
                    : "bg-bg border-border text-text border"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert [&_li]:text-text [&_strong]:text-text [&_a]:text-primary max-w-none [&_ol]:mb-2 [&_p:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        p: ({ children }) => <p className="text-text mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => (
                          <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => <li className="text-text">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="text-text font-semibold">{children}</strong>
                        ),
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline = !match;

                          if (isInline) {
                            return (
                              <code
                                className="bg-surface text-primary rounded px-1.5 py-0.5 font-mono text-xs"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          // Extract code content for CodeBlock
                          const codeContent = String(children).replace(/\n$/, "");
                          return (
                            <CodeBlock
                              code={codeContent}
                              language={match[1]}
                              showLineNumbers={codeContent.split("\n").length > 3}
                            />
                          );
                        },
                        pre: ({ children }) => <div className="my-2">{children}</div>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-primary my-2 border-l-2 pl-3 italic opacity-80">
                            {children}
                          </blockquote>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-text mb-2 text-base font-bold">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-text mb-2 text-sm font-bold">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-text mb-1 text-sm font-semibold">{children}</h3>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline hover:opacity-80"
                          >
                            {children}
                          </a>
                        ),
                        table: ({ children }) => (
                          <div className="my-2 overflow-x-auto">
                            <table className="min-w-full border-collapse text-xs">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border-border bg-surface text-text border px-2 py-1 font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border-border text-text border px-2 py-1">{children}</td>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    {isStreaming && i === messages.length - 1 && (
                      <span className="bg-primary ml-1 inline-block h-4 w-2 animate-pulse" />
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-border border-t p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isStreaming}
              rows={2}
              className="bg-bg border-border text-text placeholder-text-muted focus:border-primary flex-1 resize-none rounded-lg border p-3 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="bg-primary text-bg self-end rounded-lg px-4 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <div className="text-text-muted mt-2 text-xs">
            <kbd>⌘</kbd>+<kbd>Enter</kbd> to send • <kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>E</kbd> expand •{" "}
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}
