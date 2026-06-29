import { describe, it, expect } from "vitest";
import { isValidGuid, stableId } from "@/lib/utils/string/id";

describe("isValidGuid", () => {
  it("accepts a valid lowercase GUID", () =>
    expect(isValidGuid("a647d733-0e5f-4374-8071-db4b258e3af5")).toBe(true));
  it("accepts a valid uppercase GUID", () =>
    expect(isValidGuid("A647D733-0E5F-4374-8071-DB4B258E3AF5")).toBe(true));
  it("accepts a GUID with surrounding whitespace", () =>
    expect(isValidGuid("  a647d733-0e5f-4374-8071-db4b258e3af5  ")).toBe(true));
  it("rejects a GUID without dashes", () =>
    expect(isValidGuid("a647d7330e5f43748071db4b258e3af5")).toBe(false));
  it("rejects an empty string", () =>
    expect(isValidGuid("")).toBe(false));
  it("rejects a random string", () =>
    expect(isValidGuid("not-a-guid")).toBe(false));
});

describe("stableId", () => {
  it("returns a 16-character hex string", () => {
    const id = stableId("some title");
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
  it("is deterministic for the same input", () =>
    expect(stableId("test")).toBe(stableId("test")));
  it("is case-insensitive (trims and lowercases)", () =>
    expect(stableId("  Hello  ")).toBe(stableId("hello")));
  it("produces different ids for different inputs", () =>
    expect(stableId("article-a")).not.toBe(stableId("article-b")));
});
