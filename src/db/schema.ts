import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const itemSourceType = pgEnum("item_source_type", [
  "url",
  "pdf",
  "note",
  "video",
  "document",
]);

export const itemStatus = pgEnum("item_status", [
  "draft",
  "processing",
  "ready",
  "failed",
]);

export const entityType = pgEnum("entity_type", [
  "city",
  "product",
  "framework",
  "person",
  "tool",
  "place",
  "organization",
  "topic",
  "other",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [
    index("collections_user_id_idx").on(table.userId),
    uniqueIndex("collections_user_name_idx").on(table.userId, table.name),
  ],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    sourceType: itemSourceType("source_type").notNull(),
    url: text("url"),
    contentText: text("content_text"),
    summary: text("summary"),
    status: itemStatus("status").default("draft").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("items_user_id_idx").on(table.userId),
    index("items_source_type_idx").on(table.sourceType),
    index("items_status_idx").on(table.status),
    index("items_created_at_idx").on(table.createdAt),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    rawText: text("raw_text").notNull(),
    cleanedText: text("cleaned_text").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_item_id_idx").on(table.itemId),
    uniqueIndex("documents_item_unique_idx").on(table.itemId),
  ],
);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    chunkIndex: integer("chunk_index").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
  },
  (table) => [
    index("chunks_document_id_idx").on(table.documentId),
    index("chunks_item_id_idx").on(table.itemId),
    uniqueIndex("chunks_document_chunk_idx").on(
      table.documentId,
      table.chunkIndex,
    ),
    index("chunks_embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_name_idx").on(table.userId, table.name),
  ],
);

export const itemTags = pgTable(
  "item_tags",
  {
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.tagId] }),
    index("item_tags_tag_id_idx").on(table.tagId),
  ],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.itemId] }),
    index("collection_items_item_id_idx").on(table.itemId),
  ],
);

export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    type: entityType("type").notNull(),
    confidence: real("confidence").notNull(),
  },
  (table) => [
    index("entities_item_id_idx").on(table.itemId),
    index("entities_type_idx").on(table.type),
    index("entities_name_idx").on(table.name),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  items: many(items),
  tags: many(tags),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  collectionItems: many(collectionItems),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  documents: many(documents),
  chunks: many(chunks),
  itemTags: many(itemTags),
  collectionItems: many(collectionItems),
  entities: many(entities),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  item: one(items, {
    fields: [documents.itemId],
    references: [items.id],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id],
  }),
  item: one(items, {
    fields: [chunks.itemId],
    references: [items.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(items, {
    fields: [itemTags.itemId],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.id],
  }),
}));

export const collectionItemsRelations = relations(
  collectionItems,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionItems.collectionId],
      references: [collections.id],
    }),
    item: one(items, {
      fields: [collectionItems.itemId],
      references: [items.id],
    }),
  }),
);

export const entitiesRelations = relations(entities, ({ one }) => ({
  item: one(items, {
    fields: [entities.itemId],
    references: [items.id],
  }),
}));
