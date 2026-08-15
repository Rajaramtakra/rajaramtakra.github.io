import { describe, expect, it } from "vitest";
import { buildPaginationArgs, toPaginatedResult } from "../../src/lib/pagination";

describe("buildPaginationArgs", () => {
  it("defaults to page 1 / pageSize 20", () => {
    expect(buildPaginationArgs({})).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
  });

  it("computes skip/take for later pages", () => {
    expect(buildPaginationArgs({ page: 3, pageSize: 10 })).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("clamps pageSize to 100 and page to at least 1", () => {
    expect(buildPaginationArgs({ page: 0, pageSize: 500 })).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 });
  });
});

describe("toPaginatedResult", () => {
  it("computes totalPages correctly", () => {
    const result = toPaginatedResult([1, 2, 3], 25, 1, 10);
    expect(result.meta).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });
  });

  it("never reports fewer than 1 total page", () => {
    const result = toPaginatedResult([], 0, 1, 20);
    expect(result.meta.totalPages).toBe(1);
  });
});
