import { createHash } from "crypto";

// ─── GUID validation ──────────────────────────────────────────────────────────
export function isValidGuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

// ─── End ──────────────────────────────────────────────────────────

// ─── Stable ID ────────────────────────────────────────────────────────────────

export function stableId(title: string): string {
  return createHash("sha256")
    .update(title.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

// ─── End ──────────────────────────────────────────────────────────
