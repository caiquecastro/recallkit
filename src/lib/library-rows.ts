export type LibraryItem = {
  id: string;
  title: string;
  sourceType: "url" | "pdf" | "note" | "video" | "document";
  status: "draft" | "processing" | "ready" | "failed";
  summary: string | null;
  url: string | null;
  createdAt: Date;
  tags: string[];
  collections: string[];
};

export type LibraryItemRow = {
  id: string;
  title: string;
  sourceType: LibraryItem["sourceType"];
  status: LibraryItem["status"];
  summary: string | null;
  url: string | null;
  createdAt: Date;
  tagName: string | null;
  collectionName: string | null;
};

export function groupLibraryRows(rows: LibraryItemRow[]) {
  const grouped = new Map<string, LibraryItem>();

  for (const row of rows) {
    const item =
      grouped.get(row.id) ??
      ({
        id: row.id,
        title: row.title,
        sourceType: row.sourceType,
        status: row.status,
        summary: row.summary,
        url: row.url,
        createdAt: row.createdAt,
        tags: [],
        collections: [],
      } satisfies LibraryItem);

    if (row.tagName && !item.tags.includes(row.tagName)) {
      item.tags.push(row.tagName);
    }

    if (row.collectionName && !item.collections.includes(row.collectionName)) {
      item.collections.push(row.collectionName);
    }

    grouped.set(row.id, item);
  }

  return Array.from(grouped.values());
}
