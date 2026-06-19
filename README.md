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
