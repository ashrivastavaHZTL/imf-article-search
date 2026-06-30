export function isEmptyString(
  str: string | null | undefined,
): str is null | undefined | "" {
  try {
    return (str ? str.replace(/\s/g, "") : "") === "";
  } catch (error) {
    console.warn(
      `There was a critical error in processing isEmptyString: ${str}`,
      error,
    );
  }
  return true;
}

// ─── Near-duplicate check ─────────────────────────────────────────────────────

export function isNearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 100);
  return norm(a) === norm(b);
}

// ─── End ───────────────────────────────────────────────────────────

// ─── HTML stripping ───────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  "&laquo;": "«",
  "&raquo;": "»",
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&ndash;": "–",
  "&mdash;": "—",
};

export function stripHtml(raw: string): string {
  if (!raw) return "";
  let t = raw.replace(/<[^>]*>/g, " ");
  for (const [ent, ch] of Object.entries(ENTITIES)) t = t.split(ent).join(ch);
  return t.replace(/\s+/g, " ").trim();
}

// ─── End ───────────────────────────────────────────────────────────
