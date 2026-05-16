# RecallKit: Personal Second Brain for Travel, Tennis, and Tech

## Concept

RecallKit is a personal AI knowledge base for saving, organizing, and querying content across personal interests.

The app lets users save links, PDFs, notes, videos, and documents, then ask natural-language questions over their personal library with source citations.

Demo domains:

- Travel planning
- Tennis gear research
- Technical learning
- Restaurants and saved places
- Personal notes

Example questions:

- "What tennis rackets was I considering?"
- "What restaurants did I save for Madrid?"
- "Summarize the best resources I saved about pgvector."
- "Find my notes about offline-first apps."
- "What did I save about Babolat Pure Aero alternatives?"

## Product Positioning

RecallKit is a personal second brain with AI search and retrieval.

Instead of manually organizing every resource, users can save information quickly and let the app extract useful metadata, summarize the content, generate tags, and make the information searchable through semantic search and RAG.

The project is designed as a portfolio-quality AI web app that demonstrates:

- Document ingestion
- URL extraction
- PDF parsing
- Semantic search
- RAG with citations
- Structured metadata extraction
- Tags and collections
- Personal knowledge management UX
- Recommendation and summarization flows

## MVP Scope

The first version should be a web app only.

### Core Features

1. Save content
   - Paste a URL
   - Upload a PDF
   - Create a manual note
   - Add optional tags and collection

2. Library
   - Browse saved items
   - Filter by tag, collection, source type, and topic
   - View item summary, source URL, extracted metadata, and original content

3. Ask
   - Chat interface over saved content
   - Answers include source citations
   - Retrieval combines semantic chunks and structured metadata

4. Summaries
   - Per-item summary
   - Collection summary
   - "Best resources about X" style answers

5. Auto organization
   - AI-generated title
   - Short summary
   - Suggested tags
   - Suggested collection
   - Extracted entities such as cities, products, frameworks, people, and tools

## Later Features

- Browser extension for saving links
- Telegram or WhatsApp bot for quick capture
- YouTube transcript ingestion
- Price tracking for products or travel resources
- Saved search alerts
- Public share links for collections
- Import from bookmarks, Notion, Readwise, or Obsidian
- Offline-first mobile capture
- Personal recommendation engine

## Recommended Stack

### Application

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Server Components where useful

### Data

- Postgres
- pgvector
- Drizzle ORM
- Supabase or Neon for hosted database

### AI

- OpenAI embeddings for chunk search
- OpenAI chat model for answers, summaries, and metadata extraction
- Structured JSON outputs for title, tags, entities, and summaries

### Ingestion

- URL extraction with Readability/Cheerio
- PDF parsing with a basic parser first, LlamaParse later if needed
- YouTube transcript ingestion later
- Background jobs with Inngest or Trigger.dev later

### Deployment

- Vercel for the web app
- Supabase or Neon for Postgres and pgvector

## Data Model

### users

Stores account-level identity.

Key fields:

- id
- email
- created_at

### items

The main user-facing saved object.

Examples:

- Madrid restaurant guide
- pgvector tutorial
- tennis racket review
- personal note about offline-first apps

Key fields:

- id
- user_id
- title
- source_type
- url
- content_text
- summary
- status
- created_at
- updated_at

Source types:

- url
- pdf
- note
- video
- document

### documents

Normalized extracted content for retrieval.

Key fields:

- id
- item_id
- raw_text
- cleaned_text
- metadata
- created_at

### chunks

Searchable text chunks with embeddings.

Key fields:

- id
- document_id
- item_id
- content
- embedding
- chunk_index
- metadata

### tags

Reusable user tags.

Key fields:

- id
- user_id
- name

### item_tags

Join table between items and tags.

Key fields:

- item_id
- tag_id

### collections

User-defined groups of saved items.

Examples:

- Madrid
- Tennis Gear
- pgvector
- Offline-first Apps

Key fields:

- id
- user_id
- name
- description
- created_at

### collection_items

Join table between collections and items.

Key fields:

- collection_id
- item_id

### entities

Extracted structured entities.

Examples:

- Madrid
- Babolat Pure Aero
- pgvector
- Supabase
- ElectricSQL

Key fields:

- id
- item_id
- name
- type
- confidence

Entity types:

- city
- restaurant
- product
- brand
- framework
- library
- person
- concept
- company

## RAG Flow

1. User asks a question.
2. App classifies the intent:
   - factual lookup
   - summary
   - comparison
   - recommendation
   - collection search
3. App retrieves relevant chunks using vector search.
4. App optionally filters by tags, collections, source type, or entities.
5. App pulls item metadata for citations.
6. App generates an answer using retrieved context.
7. App returns:
   - answer
   - source citations
   - related items
   - optional follow-up prompts

## UX Structure

### Main Navigation

- Library
- Ask
- Collections
- Add
- Settings

### Library View

Shows saved items with:

- title
- source type
- summary
- tags
- collection
- date saved

### Item Detail View

Shows:

- source link
- generated summary
- extracted entities
- tags
- collections
- original content
- related items

### Ask View

Chat-style interface with:

- natural-language question input
- source-cited answers
- citation cards
- related saved items
- optional filters for collection or tag

### Add View

Capture interface with:

- URL input
- PDF upload
- note editor
- optional tags
- optional collection

## Implementation Phases

### Phase 1: Foundation

- Create Next.js app
- Add Tailwind and shadcn/ui
- Configure database
- Add Drizzle schema
- Build basic layout and navigation

### Phase 2: Save and Library

- Create item manually
- Paste URL and extract readable content
- Store items and documents
- Browse library
- View item detail

### Phase 3: Embeddings and Search

- Chunk document text
- Generate embeddings
- Store vectors in pgvector
- Add semantic search

### Phase 4: RAG Ask

- Build Ask page
- Retrieve relevant chunks
- Generate source-cited answers
- Display citations

### Phase 5: AI Organization

- Generate title
- Generate summary
- Suggest tags
- Extract entities
- Suggest collection

### Phase 6: Portfolio Polish

- Add demo data for Travel, Tennis, and Tech
- Improve empty states
- Add loading states
- Add deploy-ready README
- Add screenshots and architecture notes

## Portfolio Story

This project should be presented as more than a chatbot.

The strongest story:

"I built a personal AI knowledge base that ingests links, PDFs, and notes, organizes them automatically, and lets me ask source-cited questions across my saved travel plans, tennis research, and technical learning."

Technical highlights:

- Retrieval-augmented generation
- pgvector semantic search
- Structured extraction from unstructured content
- Source-grounded answers
- Personal data organization
- Full-stack TypeScript implementation

## Initial Build Recommendation

Start with the smallest complete loop:

1. Save a manual note.
2. Store it in Postgres.
3. Chunk and embed it.
4. Ask a question.
5. Return an answer with a citation.

After that works, add URL ingestion, PDFs, collections, and automatic tagging.
