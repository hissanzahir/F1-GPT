# About F1-GPT

## Overview

**F1-GPT** is an intelligent Formula One chatbot powered by **Retrieval-Augmented Generation (RAG)**. It combines the knowledge of F1 history, drivers, teams, seasons, and circuits with cutting-edge AI to provide accurate, context-grounded answers to any F1 question.

## What It Does

Ask anything about Formula One—from driver statistics and championship records to circuit history and team performance. F1-GPT retrieves relevant information from a comprehensive F1 knowledge base and uses OpenAI's language models to generate accurate, conversational responses.

## How It Works

F1-GPT employs a **Retrieval-Augmented Generation (RAG)** pipeline:

1. **Ingest** — Scrape F1-related Wikipedia pages covering drivers, teams, seasons, circuits, and historical records
2. **Chunk** — Split page content into semantic chunks for efficient retrieval
3. **Embed** — Convert chunks into vector embeddings using OpenAI's embedding model (1536 dimensions)
4. **Store** — Persist embeddings in DataStax Astra DB for fast similarity search
5. **Query** — Answer user questions by retrieving relevant context and generating responses with an LLM

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **LLM & Embeddings**: OpenAI API
- **Vector Database**: DataStax Astra DB
- **Data Loading**: LangChain (PuppeteerWebBaseLoader for web scraping)
- **Language**: TypeScript (88%), JavaScript (12%)
- **Runtime**: Node.js 18+

## Key Features

✅ **RAG-powered** — Answers grounded in real F1 data  
✅ **Comprehensive coverage** — Drivers, teams, seasons, circuits, and historical records  
✅ **Real-time retrieval** — Vector search for instant, relevant context  
✅ **Semantic understanding** — AI-powered question answering  
✅ **Scalable architecture** — Built on modern cloud-native tech  

## Data Sources

The knowledge base covers:

- Formula One overview and rules
- Current and legendary drivers (Verstappen, Hamilton, Leclerc, Norris, and more)
- Major teams (Ferrari, Mercedes, Red Bull, McLaren, Aston Martin)
- Recent seasons (2018–2026)
- Iconic circuits (Monaco, Silverstone, COTA, Suzuka, Monza)
- Historical records and early F1 seasons

## Development Status

**Active Development** — Core infrastructure is in place; chat UI and full integration are in progress.

Completed:
- Next.js app scaffold
- Astra DB client setup
- F1 data source configuration
- RAG pipeline architecture

In Progress:
- Seed script completion (Wikipedia scraping and embedding)
- Chat API route
- Interactive frontend UI

## Use Cases

- 🏁 **Fans** — Get instant F1 trivia and historical facts
- 📊 **Analysts** — Research driver/team statistics and performance trends
- 🎓 **Students** — Learn F1 history and technical details
- 🤖 **Developers** — Study RAG implementation with real-world data

## Getting Started

```bash
# Clone and install
git clone https://github.com/hissanzahir/F1-GPT.git
cd F1-GPT
npm install

# Configure environment variables (.env file)
# Run the seed script to populate the knowledge base
npm run seed

# Start development server
npm run dev
```

## License

MIT — Free to use and modify.

---

**Questions?** Start a discussion or open an issue in the repository.
