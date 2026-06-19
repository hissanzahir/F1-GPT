# F1GPT

A Formula One chatbot powered by **Retrieval-Augmented Generation (RAG)**. Ask questions about drivers, teams, seasons, circuits, and F1 history — answers are grounded in scraped Wikipedia content stored in a vector database.

Built with **Next.js**, **OpenAI**, **LangChain**, and **DataStax Astra DB**.

---

## How it works

1. **Ingest** — Scrape F1-related Wikipedia pages (drivers, teams, seasons, circuits, etc.)
2. **Chunk** — Split page content into smaller text chunks
3. **Embed** — Generate vector embeddings with OpenAI (`text-embedding-3-small`, 1536 dimensions)
4. **Store** — Save chunks + embeddings in Astra DB for similarity search
5. **Query** — User asks a question → retrieve relevant chunks → LLM generates an answer with context

```
User question
     │
     ▼
Next.js UI ──► API route ──► Embed query (OpenAI)
                                │
                                ▼
                         Vector search (Astra DB)
                                │
                                ▼
                         LLM answer (OpenAI + retrieved context)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18 |
| LLM & embeddings | OpenAI API |
| Document loading | LangChain (`PuppeteerWebBaseLoader`) |
| Vector database | DataStax Astra DB |
| Language | TypeScript |

---

## Prerequisites

- **Node.js** 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [DataStax Astra DB](https://astra.datastax.com/) database with vector search enabled
- **Puppeteer** (used by LangChain for web scraping — requires Chromium; may need extra setup on some systems)

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nextjs-f1gpt
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
ASTRA_DB_NAMESPACE=default_keyspace
ASTRA_DB_COLLECTION=f1_gpt
ASTRA_DB_API_ENDPOINT=https://<your-db-id>-<region>.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:...
OPENAI_API_KEY=sk-...
```

> **Never commit `.env` or API keys.** This project ignores `.env*` via `.gitignore`.

### 3. Seed the vector database

The seed script scrapes Wikipedia, chunks the content, embeds it, and loads it into Astra DB:

```bash
npm run seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
nextjs-f1gpt/
├── app/
│   ├── page.tsx          # Chat UI (planned)
│   ├── layout.tsx        # Root layout
│   └── global.css
├── script/
│   └── loadDb.tsx        # Scrape → chunk → embed → load into Astra DB
├── .env                  # Local secrets (not committed)
├── next.config.ts
└── package.json
```

---

## Data sources

The seed script ingests content from Wikipedia pages including:

- Formula One overview, drivers, champions, constructors
- Current drivers (Verstappen, Hamilton, Leclerc, Norris, etc.)
- Teams (Ferrari, Mercedes, Red Bull, McLaren, Aston Martin)
- Recent seasons (2018–2026)
- Iconic circuits (Monaco, Silverstone, COTA, Suzuka, Monza)
- Historical records and early seasons

Sources are defined in `script/loadDb.tsx`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run seed` | Populate Astra DB with F1 knowledge |
| `npm run lint` | Run ESLint |

---

## Current status

This project is **in active development**:

- [x] Next.js app scaffold
- [x] Astra DB client setup
- [x] F1 Wikipedia URL list defined
- [x] Text splitter configured (512 chars, 100 overlap)
- [ ] Complete seed script (scrape, embed, insert)
- [ ] Chat API route (`/api/chat`)
- [ ] Frontend chat UI

---

## Deployment

Deploy the Next.js app to [Vercel](https://vercel.com) or similar. Set all environment variables in your hosting provider's dashboard — do not bake secrets into the repo.

For the seed script, run it locally or as a one-off CI job before/after deploy.

---

## License

MIT
