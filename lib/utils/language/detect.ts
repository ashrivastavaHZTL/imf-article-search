// ─── Language detection ───────────────────────────────────────────────────────

export function detectLanguage(text: string): string {
  const n = text.length || 1;
  const checks: [string, RegExp][] = [
    ["ar", /[\u0600-\u06FF]/g],
    ["ru", /[\u0400-\u04FF]/g],
    ["zh", /[\u3000-\u9FFF\uF900-\uFAFF]/g],
  ];
  for (const [code, re] of checks) {
    if ((text.match(re) ?? []).length / n > 0.15) return code;
  }
  return "latin";
}

// ─── End ───────────────────────────────────────────────────────
