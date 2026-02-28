"use client";

import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language: string;
  label?: string;
  showLineNumbers?: boolean;
}

// Custom theme matching the terminal aesthetic
const terminalTheme = {
  ...themes.nightOwl,
  plain: {
    color: "#00ff41",
    backgroundColor: "#0a0a0a",
  },
  styles: [
    ...themes.nightOwl.styles,
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#006b1a", fontStyle: "italic" as const },
    },
    {
      types: ["keyword", "operator"],
      style: { color: "#ff79c6" },
    },
    {
      types: ["string", "char"],
      style: { color: "#7ee787" },
    },
    {
      types: ["function"],
      style: { color: "#79c0ff" },
    },
    {
      types: ["number", "boolean"],
      style: { color: "#f78166" },
    },
    {
      types: ["variable", "constant"],
      style: { color: "#ffa657" },
    },
    {
      types: ["class-name", "type"],
      style: { color: "#ff7b72" },
    },
  ],
};

export function CodeBlock({ code, language, label, showLineNumbers = false }: CodeBlockProps) {
  // Normalize language names
  const normalizedLang = language
    .toLowerCase()
    .replace(/^(js|jsx)$/, "javascript")
    .replace(/^(ts|tsx)$/, "typescript");

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      {label && (
        <div className="bg-surface border-border text-text-muted border-b px-3 py-1.5 text-xs uppercase tracking-wide">
          {label}
        </div>
      )}
      <Highlight theme={terminalTheme} code={code.trim()} language={normalizedLang}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} overflow-x-auto p-4 font-mono text-sm`} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {showLineNumbers && (
                  <span className="text-text-muted mr-4 inline-block w-8 select-none text-right opacity-50">
                    {i + 1}
                  </span>
                )}
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

interface CodeComparisonProps {
  snippets: Array<{
    code: string;
    language: string;
    label?: string;
  }>;
  showLineNumbers?: boolean;
}

export function CodeComparison({ snippets, showLineNumbers }: CodeComparisonProps) {
  if (snippets.length === 1) {
    return (
      <CodeBlock
        code={snippets[0].code}
        language={snippets[0].language}
        label={snippets[0].label}
        showLineNumbers={showLineNumbers}
      />
    );
  }

  // For 2 snippets, show side by side on larger screens
  if (snippets.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {snippets.map((snippet, i) => (
          <CodeBlock
            key={i}
            code={snippet.code}
            language={snippet.language}
            label={snippet.label || `Snippet ${i + 1}`}
            showLineNumbers={showLineNumbers}
          />
        ))}
      </div>
    );
  }

  // For 3+ snippets, stack vertically
  return (
    <div className="space-y-4">
      {snippets.map((snippet, i) => (
        <CodeBlock
          key={i}
          code={snippet.code}
          language={snippet.language}
          label={snippet.label || `Snippet ${i + 1}`}
          showLineNumbers={showLineNumbers}
        />
      ))}
    </div>
  );
}
