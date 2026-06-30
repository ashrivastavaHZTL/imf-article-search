import { describe, it, expect } from "vitest";
import { isEmptyString, isNearDuplicate, stripHtml } from "@/lib/utils/string/string";

describe("isEmptyString", () => {
  it("returns true for empty string", () => expect(isEmptyString("")).toBe(true));
  it("returns true for whitespace-only string", () => expect(isEmptyString("   ")).toBe(true));
  it("returns true for null", () => expect(isEmptyString(null)).toBe(true));
  it("returns true for undefined", () => expect(isEmptyString(undefined)).toBe(true));
  it("returns false for non-empty string", () => expect(isEmptyString("hello")).toBe(false));
  it("returns false for string with content and spaces", () => expect(isEmptyString("  hi  ")).toBe(false));
});

describe("isNearDuplicate", () => {
  it("returns true for identical strings", () =>
    expect(isNearDuplicate("hello world", "hello world")).toBe(true));
  it("returns true when strings differ only in whitespace", () =>
    expect(isNearDuplicate("hello  world", "hello world")).toBe(true));
  it("returns true when long strings share the same first 100 chars", () => {
    const base = "a".repeat(120);
    expect(isNearDuplicate(base, base + "different")).toBe(true);
  });
  it("returns false for different strings", () =>
    expect(isNearDuplicate("hello", "world")).toBe(false));
  it("returns false when either string is empty", () => {
    expect(isNearDuplicate("", "hello")).toBe(false);
    expect(isNearDuplicate("hello", "")).toBe(false);
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () =>
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world"));
  it("decodes common HTML entities", () => {
    expect(stripHtml("&amp;")).toBe("&");
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
    // &nbsp; decodes to a space which trim() then removes
    expect(stripHtml("&nbsp;")).toBe("");
    expect(stripHtml("hello&nbsp;world")).toBe("hello world");
  });
  it("collapses extra whitespace", () =>
    expect(stripHtml("<p>  too   many   spaces  </p>")).toBe("too many spaces"));
  it("returns empty string for falsy input", () =>
    expect(stripHtml("")).toBe(""));
});
