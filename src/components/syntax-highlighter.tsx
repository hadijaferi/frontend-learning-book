"use client";

import { useEffect } from "react";

// Dependency-free syntax coloring for the static, repository-owned examples.
// All fragments use textContent (never innerHTML), so displayed code stays literal.
const tokenPattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|(?:^|\n)\s*#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<\/?[A-Za-z][\w.-]*|\b(?:import|export|from|default|const|let|var|function|return|async|await|if|else|throw|try|catch|finally|new|typeof|instanceof|interface|type|extends|implements|class|public|private|readonly|static|as|in|of|void|yield|switch|case|break|continue|for|while|do|delete|keyof|infer|satisfies|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\())/gm;

const keywords = new Set([
  "import", "export", "from", "default", "const", "let", "var",
  "function", "return", "async", "await", "if", "else", "throw",
  "try", "catch", "finally", "new", "typeof", "instanceof",
  "interface", "type", "extends", "implements", "class", "public",
  "private", "readonly", "static", "as", "in", "of", "void",
  "yield", "switch", "case", "break", "continue", "for", "while",
  "do", "delete", "keyof", "infer", "satisfies",
]);

function classify(token: string): string {
  if (/^\s*(\/\/|\/\*|#)/.test(token)) return "comment";
  if (/^[\"'`]/.test(token)) return "string";
  if (/^<\/?[A-Za-z]/.test(token)) return "tag";
  if (/^\d/.test(token)) return "number";
  if (token === "true" || token === "false" || token === "null" || token === "undefined") return "literal";
  if (keywords.has(token)) return "keyword";
  return "function";
}

function colorize(code: HTMLElement) {
  if (code.dataset.highlighted === "true") return;
  const source = code.textContent ?? "";
  if (!source.trim()) return;

  const fragment = document.createDocumentFragment();
  tokenPattern.lastIndex = 0;
  let previous = 0;

  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > previous) fragment.appendChild(document.createTextNode(source.slice(previous, index)));
    const element = document.createElement("span");
    element.className = "syntax-" + classify(match[0]);
    element.textContent = match[0];
    fragment.appendChild(element);
    previous = index + match[0].length;
  }

  if (previous < source.length) fragment.appendChild(document.createTextNode(source.slice(previous)));
  code.replaceChildren(fragment);
  code.dataset.highlighted = "true";
}

export function SyntaxHighlighter() {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("pre.code code").forEach(colorize);
  }, []);

  return null;
}
