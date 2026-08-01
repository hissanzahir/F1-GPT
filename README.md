# F1-GPT

An intelligent Formula One chatbot powered by **Retrieval-Augmented Generation (RAG)**. Users ask natural-language questions about drivers, teams, seasons, circuits, and F1 history; the app retrieves relevant Wikipedia content from a vector database and uses OpenAI to generate grounded, conversational answers.

Built with **Next.js 14**, **OpenAI**, **LangChain**, **Vercel AI SDK**, and **DataStax Astra DB**.

---

## Table of contents

- [Architecture overview](#architecture-overview)
- [End-to-end data flow](#end-to-end-data-flow)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Ingestion pipeline (seed script)](#ingestion-pipeline-seed-script)
- [Query pipeline (chat API)](#query-pipeline-chat-api)
- [Frontend architecture](#frontend-architecture)
- [Vector database schema](#vector-database-schema)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Scripts reference](#scripts-reference)
- [Deployment](#deployment)
- [Design decisions and tradeoffs](#design-decisions-and-tradeoffs)
- [License](#license)

---

## Architecture overview

F1-GPT is a two-phase system:

| Phase | When it runs | Purpose |
|-------|--------------|---------|
| **Ingestion** | One-time / on-demand (`npm run seed`) | Scrape Wikipedia, chunk text, embed, store in Astra DB |
| **Query** | Every user message | Embed question, vector search, stream LLM answer with context |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INGESTION (offline)                             │
│                                                                         │
│  Wikipedia URLs  →  Puppeteer scrape  →  Text splitter  →  OpenAI embed │
│       (f1Data)         (loadDb.tsx)        (512/100)      (1536-dim)    │
│                                                                         │
│                                    ↓                                    │
│                         DataStax Astra DB collection                    │
│                    { text, $vector, sourceUrl, chunkIndex }              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         QUERY (runtime)                                 │
│                                                                         │
│  User input  →  Next.js UI  →  POST /api/chat  →  Embed query           │
│  (page.tsx)      useChat()       (route.ts)         (OpenAI)            │
│                                                                         │
│                         ↓                        ↓                      │
│                  Vector search (Astra)    Build system prompt           │
│                  top 10 similar chunks      with retrieved context        │
│                                                                         │
│                         ↓                                               │
│                  streamText (GPT-4)  →  SSE stream  →  UI bubbles       │
└─────────────────────────────────────────────────────────────────────────┘
```

The app has **no server-side session or user database**. Each chat request is stateless except for the message history the client sends in the POST body.

---

## End-to-end data flow

### 1. Seeding the knowledge base

```
f1Data[] (36 Wikipedia URLs)
    │
    ▼
scrapePage(url)
    │  PuppeteerWebBaseLoader launches headless Chromium
    │  Strips <script>, <style>, <noscript>
    │  Returns document.body.innerText
    ▼
RecursiveCharacterTextSplitter
    │  chunkSize: 512 characters
    │  chunkOverlap: 100 characters
    ▼
For each chunk:
    │  openai.embeddings.create("text-embedding-3-small")
    │  Skip if { sourceUrl, chunkIndex } already exists
    │  insertOne({ $vector, text, sourceUrl, chunkIndex })
    │  Save progress to .seed-checkpoint.json
    ▼
Astra DB collection ready for similarity search
```

### 2. Answering a user question

```
Browser (page.tsx)
    │  useChat() from Vercel AI SDK
    │  POST /api/chat with { messages: [...] }
    ▼
app/api/chat/route.ts
    │  Extract latest user message content
    │  Embed with text-embedding-3-small
    │  collection.find(null, { sort: { $vector: embedding }, limit: 10 })
    │  Join retrieved doc.text values into docContext
    │  Build system message with context + question
    │  streamText({ model: gpt-4, messages: [system, ...history] })
    ▼
Streaming response → Bubble components render assistant reply
```

---

## Tech stack

| Layer | Technology | Role |
|-------|------------|------|
| **Framework** | Next.js 14.2 (App Router) | Full-stack React app, API routes |
| **UI** | React 18, CSS | Chat interface, message bubbles |
| **Chat client** | Vercel AI SDK (`ai`, `@ai-sdk/openai`) | `useChat` hook, streaming UI |
| **LLM** | OpenAI GPT-4 | Answer generation with RAG context |
| **Embeddings** | OpenAI `text-embedding-3-small` | 1536-dimensional vectors for chunks and queries |
| **Vector DB** | DataStax Astra DB (`@datastax/astra-db-ts`) | Store and search embeddings |
| **Scraping** | LangChain `PuppeteerWebBaseLoader` + Puppeteer | Headless browser Wikipedia extraction |
| **Text splitting** | LangChain `RecursiveCharacterTextSplitter` | Chunk long pages for retrieval |
| **Language** | TypeScript | App, API, and seed script |
| **Seed runner** | ts-node | Execute `script/loadDb.tsx` outside Next.js |

### Key dependencies (`package.json`)

- `next`, `react`, `react-dom` — application shell
- `ai`, `@ai-sdk/openai` — streaming chat on the server; `useChat` on the client
- `openai` — direct OpenAI client for embeddings in API route and seed script
- `@datastax/astra-db-ts` — Astra DB Data API client
- `langchain`, `puppeteer` — document loading and browser automation for seeding
- `dotenv` — load `.env` in the seed script (Next.js loads env vars automatically for the app)

---

## Project structure

```
F1-GPT/
├── app/
│   ├── layout.tsx                 # Root HTML shell, metadata, global CSS import
│   ├── page.tsx                   # Main chat page (client component)
│   ├── global.css                 # Layout, bubbles, form, loader styles
│   ├── assets/                    # Logo and background images (referenced by UI)
│   ├── components/
│   │   ├── Bubble.tsx             # Single chat message (user or assistant)
│   │   ├── LoadingBubble.tsx      # Animated loader while assistant responds
│   │   ├── PromptSuggestionButton.tsx  # Clickable starter prompt chip
│   │   └── PromptSuggestionsRow.tsx    # Row of example questions on empty chat
│   └── api/
│       └── chat/
│           └── route.ts           # RAG + streaming LLM endpoint
├── script/
│   └── loadDb.tsx                 # Wikipedia scrape → embed → Astra DB loader
├── .env.example                   # Template for required environment variables
├── .seed-checkpoint.json          # Resumable seed progress (local, gitignored pattern)
├── next.config.js                 # Next.js config (reactStrictMode)
├── tsconfig.json                  # TypeScript + ts-node CommonJS override for seed
├── package.json
└── README.md
```

---

## Ingestion pipeline (seed script)

**File:** `script/loadDb.tsx`

This script is the **offline knowledge builder**. It is not part of the Next.js request lifecycle; you run it manually with `npm run seed`.

### Wikipedia source list

Thirty-six URLs are defined in the `f1Data` array, grouped by topic:

| Category | Examples |
|----------|----------|
| F1 overview | Formula One, driver/constructor/champion lists |
| Drivers | Verstappen, Hamilton, Leclerc, Norris, Piastri, Alonso |
| Teams | Ferrari, Mercedes, Red Bull, McLaren, Aston Martin |
| Seasons | 2018–2026 season pages |
| Circuits | Monaco, Silverstone, COTA, Suzuka, Monza |
| History | Season lists, 1950 season, constructors' champions |

### Scraping behavior

`scrapePage(url)` uses LangChain's `PuppeteerWebBaseLoader`:

1. Launches headless Chromium with `--no-sandbox` and `--disable-setuid-sandbox`
2. Navigates with `waitUntil: "domcontentloaded"`
3. In the browser context, removes `script`, `style`, and `noscript` nodes
4. Returns plain text from `document.body.innerText`
5. Closes the browser after each page

This yields readable article text without HTML markup, suitable for chunking and embedding.

### Chunking

```typescript
new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100
})
```

- **512 characters** per chunk keeps each vector focused on a small passage
- **100-character overlap** reduces the risk of cutting sentences mid-thought across chunk boundaries

### Embedding and storage

For each chunk:

1. Call `openai.embeddings.create` with model `text-embedding-3-small`, `encoding_format: "float"`
2. Check for an existing document with the same `sourceUrl` and `chunkIndex` (idempotent re-runs)
3. Insert:

```typescript
{
  $vector: number[],      // 1536 floats — Astra vector field
  text: string,           // chunk content used at retrieval time
  sourceUrl: string,      // originating Wikipedia URL
  chunkIndex: number      // position within that URL's chunks
}
```

### Checkpoint system

Progress is saved to `.seed-checkpoint.json`:

```json
{
  "urlIndex": 5,
  "chunkIndex": 466
}
```

- **`urlIndex`** — index into `f1Data` (which URL is being processed)
- **`chunkIndex`** — which chunk within the current URL to resume from

On restart, the script skips already-inserted chunks and continues from the checkpoint. If the collection is empty but the checkpoint is non-zero, the checkpoint resets to `{ urlIndex: 0, chunkIndex: 0 }`.

### Collection creation

`createCollection()` is defined to create an Astra collection with:

- **Vector dimension:** 1536 (matches `text-embedding-3-small`)
- **Similarity metric:** `dot_product` (also supports `cosine`, `euclidean`)

You must ensure the collection exists in Astra before seeding—either create it in the Astra UI or call `createCollection()` once. The main `loadSampleData()` flow assumes the collection already exists and calls `db.collection(ASTRA_DB_COLLECTION)`.

### Running the seed script

```bash
npm run seed
```

Requires all env vars in `.env` (see [Environment variables](#environment-variables)). Puppeteer downloads Chromium on install; some environments may need extra system libraries for headless Chrome.

---

## Query pipeline (chat API)

**File:** `app/api/chat/route.ts`

**Endpoint:** `POST /api/chat` (default target for Vercel AI SDK's `useChat()`)

### Request shape

The client sends JSON:

```json
{
  "messages": [
    { "role": "user", "content": "Who won the 2024 championship?" },
    { "role": "assistant", "content": "..." }
  ]
}
```

### Processing steps

1. **Parse messages** — Read `messages` from the request body; take the **last message's `content`** as the query string for embedding and the explicit `QUESTION` in the system prompt.

2. **Embed the query** — Same model as ingestion: `text-embedding-3-small`, float encoding.

3. **Vector search** — Query Astra collection with:
   - `sort: { $vector: embedding }` — similarity ranking
   - `limit: 10` — top ten chunks passed to the LLM

4. **Build context** — Map documents to `doc.text`, stringify as JSON, inject into a **system** message template that instructs GPT-4 to:
   - Act as an F1 expert
   - Use Wikipedia-derived context when relevant
   - Fall back to general knowledge without mentioning sources or context limits
   - Format with Markdown; do not return images

5. **Stream response** — `streamText` from the AI SDK with `aiOpenai("gpt-4")` and messages `[systemTemplate, ...fullClientHistory]`. Returns `result.toDataStreamResponse()` for SSE streaming to the client.

6. **Error handling** — If the DB query fails, `docContext` is set to `""` and the model still responds using its base knowledge only.

### Astra client setup (shared pattern)

```typescript
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })
const collection = await db.collection(ASTRA_DB_COLLECTION)
```

The API route and seed script use the same env vars and client initialization pattern.

---

## Frontend architecture

### Root layout (`app/layout.tsx`)

Server component that sets page metadata (`title: "F1GPT"`) and wraps all pages in a minimal `<html><body>` with global CSS.

### Main page (`app/page.tsx`)

Client component (`"use client"`) — the entire chat experience.

| Concern | Implementation |
|---------|----------------|
| Chat state | `useChat()` from `ai/react` — manages `messages`, `input`, `isLoading`, submit handlers |
| API target | Defaults to `/api/chat` (no custom `api` prop) |
| Empty state | Welcome copy + `PromptSuggestionsRow` |
| Active chat | Maps `messages` to `Bubble`; shows `LoadingBubble` while streaming |
| Starter prompts | `handlePrompt` builds a user `Message` and calls `append(msg)` |

### Components

**`Bubble.tsx`** — Renders one message. CSS class `bubble ${role}` (`user` vs `assistant`) controls alignment and color.

**`LoadingBubble.tsx`** — CSS-only three-dot loader shown when `isLoading` is true.

**`PromptSuggestionsRow.tsx`** — Four hard-coded example questions; clicking one triggers `onPromptClick(prompt)`.

**`PromptSuggestionButton.tsx`** — Styled button for each suggestion.

### Styling (`app/global.css`)

- Full-viewport centered layout with background image
- Main panel: gradient card (~80vw × 80vh)
- Chat section scrolls when populated (`section.populated`)
- User bubbles align right (light blue); assistant bubbles align left (lavender)
- Form pinned at bottom: text input + purple submit button

---

## Vector database schema

Each document in the Astra collection `f1_gpt` (name from env) looks like:

| Field | Type | Purpose |
|-------|------|---------|
| `$vector` | `number[]` (1536) | Embedding for similarity search |
| `text` | `string` | Chunk text returned into the LLM prompt |
| `sourceUrl` | `string` | Wikipedia URL (dedup key with chunkIndex) |
| `chunkIndex` | `number` | Ordinal chunk within that URL |

**Collection settings (when created via script):**

- Dimension: **1536**
- Metric: **dot_product**

**Retrieval at query time:** No metadata filter—pure vector sort over the whole collection, top 10 results.

---

## Environment variables

Copy `.env.example` to `.env` in the project root:

| Variable | Description |
|----------|-------------|
| `ASTRA_DB_NAMESPACE` | Astra keyspace / namespace (e.g. `default_keyspace`) |
| `ASTRA_DB_COLLECTION` | Collection name (e.g. `f1_gpt`) |
| `ASTRA_DB_API_ENDPOINT` | Data API URL, e.g. `https://<db-id>-<region>.apps.astra.datastax.com` |
| `ASTRA_DB_APPLICATION_TOKEN` | Astra application token (`AstraCS:...`) |
| `OPENAI_API_KEY` | OpenAI API key for embeddings and GPT-4 |

**Security:** `.env*` is gitignored. Never commit secrets. Set the same variables in your hosting provider for production.

---

## Getting started

### Prerequisites

- **Node.js** 18+
- [OpenAI API key](https://platform.openai.com/api-keys)
- [DataStax Astra DB](https://astra.datastax.com/) database with vector search enabled
- **Puppeteer / Chromium** for the seed script (installed via `npm install`)

### Setup

```bash
git clone https://github.com/hissanzahir/F1-GPT.git
cd F1-GPT
npm install
```

Create `.env` from `.env.example` and fill in your credentials.

Ensure the Astra collection exists (create in console or run `createCollection()` once from the seed script).

### Seed the knowledge base

```bash
npm run seed
```

This may take a while (36 pages × many chunks × OpenAI embedding calls). Re-runs are safe: existing `{ sourceUrl, chunkIndex }` pairs are skipped.

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run seed` | Run `ts-node ./script/loadDb.tsx` — populate Astra DB |
| `npm run lint` | Run ESLint |

---

## Deployment

### Next.js app

Deploy to [Vercel](https://vercel.com) or any Node.js host that supports Next.js 14.

1. Set all [environment variables](#environment-variables) in the host dashboard
2. Build and deploy (`npm run build` / platform default)
3. The `/api/chat` route runs serverlessly; it needs network access to OpenAI and Astra

### Seed script

Run **locally or as a one-off CI job**—not on every user request:

- Before first deploy, or when updating `f1Data`
- Requires Puppeteer; many serverless environments are a poor fit for seeding
- Use checkpoint file locally; for CI, consider a fresh collection or idempotent re-run

### Production checklist

- [ ] Astra collection created with 1536-dim vectors
- [ ] Seed completed at least once
- [ ] Env vars set on host
- [ ] OpenAI billing and rate limits adequate for traffic

---

## Design decisions and tradeoffs

### Why RAG instead of fine-tuning?

- **Fresh data:** Wikipedia pages can be re-scraped without retraining a model
- **Transparency:** Retrieved chunks ground answers in stored text
- **Cost:** Embeddings + retrieval are cheaper than fine-tuning for a hobby/education project

### Chunk size 512 / overlap 100

Smaller chunks improve precision for specific facts; overlap reduces boundary artifacts. Tuning these values trades retrieval granularity against context window usage (10 chunks × ~512 chars ≈ 5K chars of context).

### Top-10 retrieval, no reranking

Simple and fast. No cross-encoder reranker or hybrid keyword search—acceptable for a demo-scale corpus but a likely upgrade path for production quality.

### GPT-4 for answers, text-embedding-3-small for vectors

Strong answer quality with cost-efficient embeddings. Query and document embeddings must use the **same model** for meaningful similarity scores.

### Stateless API

No auth, sessions, or chat persistence in the database. History lives only in the browser session via `useChat` state. Refreshing the page clears the conversation.

### Idempotent seeding

`sourceUrl` + `chunkIndex` uniqueness checks and checkpoint files make long seed runs resumable after failures or rate limits.

---

## License

MIT
