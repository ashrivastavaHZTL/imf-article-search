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
  const GUID_A = "a647d733-0e5f-4374-8071-db4b258e3af5";
  const GUID_B = "b92c1e44-1f6a-4885-9182-ec5c369f4b06";

  it("returns a 16-character hex string", () => {
    const id = stableId(GUID_A, "en");
    expect(id).toHaveLength(16);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
  it("is deterministic for the same guid and locale", () =>
    expect(stableId(GUID_A, "en")).toBe(stableId(GUID_A, "en")));
  it("is case-insensitive (trims and lowercases guid and locale)", () =>
    expect(stableId("  " + GUID_A.toUpperCase() + "  ", "EN")).toBe(stableId(GUID_A, "en")));
  it("produces different ids for different guids with the same locale", () =>
    expect(stableId(GUID_A, "en")).not.toBe(stableId(GUID_B, "en")));
  it("produces different ids for the same guid with different locales", () => {
    expect(stableId(GUID_A, "en")).not.toBe(stableId(GUID_A, "ar"));
    expect(stableId(GUID_A, "en")).not.toBe(stableId(GUID_A, "fr"));
    expect(stableId(GUID_A, "ar")).not.toBe(stableId(GUID_A, "ru"));
  });
});
