import { describe, expect, it } from "vitest";

import { groupLibraryRows, type LibraryItemRow } from "@/lib/library-rows";

const createdAt = new Date("2026-05-18T12:00:00.000Z");

function row(overrides: Partial<LibraryItemRow>): LibraryItemRow {
  return {
    collectionName: null,
    createdAt,
    id: "item-1",
    sourceType: "note",
    status: "ready",
    summary: "A saved note",
    tagName: null,
    title: "Saved note",
    url: null,
    ...overrides,
  };
}

describe("groupLibraryRows", () => {
  it("groups joined tag and collection rows into one library item", () => {
    expect(
      groupLibraryRows([
        row({ collectionName: "Research", tagName: "ai" }),
        row({ collectionName: "Reading", tagName: "tools" }),
      ]),
    ).toEqual([
      {
        collections: ["Research", "Reading"],
        createdAt,
        id: "item-1",
        sourceType: "note",
        status: "ready",
        summary: "A saved note",
        tags: ["ai", "tools"],
        title: "Saved note",
        url: null,
      },
    ]);
  });

  it("dedupes repeated tags and collections from join fanout", () => {
    expect(
      groupLibraryRows([
        row({ collectionName: "Research", tagName: "ai" }),
        row({ collectionName: "Research", tagName: "ai" }),
        row({ collectionName: "Research", tagName: "tools" }),
      ]),
    ).toMatchObject([
      {
        collections: ["Research"],
        tags: ["ai", "tools"],
      },
    ]);
  });

  it("ignores null tag and collection join values", () => {
    expect(
      groupLibraryRows([
        row({ collectionName: null, tagName: null }),
        row({ collectionName: "Research", tagName: null }),
      ]),
    ).toMatchObject([
      {
        collections: ["Research"],
        tags: [],
      },
    ]);
  });

  it("preserves the first occurrence order of grouped items", () => {
    const secondCreatedAt = new Date("2026-05-17T12:00:00.000Z");

    expect(
      groupLibraryRows([
        row({ id: "item-2", title: "Second", createdAt: secondCreatedAt }),
        row({ id: "item-1", title: "First" }),
        row({ id: "item-2", title: "Second", createdAt: secondCreatedAt }),
      ]).map((item) => item.id),
    ).toEqual(["item-2", "item-1"]);
  });
});
