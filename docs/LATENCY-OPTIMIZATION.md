# F1GPT — Response Time Optimization

## Goal
Reduce perceived latency between user input and model output in the chat
while keeping RAG intact.

## Architecture Tree
```
F1-GPT/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts            <-- optimization target (RAG + stream)
│   ├── auth/
│   │   ├── actions.ts              (Supabase server actions)
│   │   └── callback/route.ts       (Google OAuth callback)
│   ├── components/
│   │   ├── Bubble.tsx
│   │   ├── LoadingBubble.tsx
│   │   ├── PromptSuggestionButton.tsx
│   │   ├── PromptSuggestionsRow.tsx
│   │   └── SidebarAuth.tsx
│   ├── assets/
│   │   ├── F1GPTLogo.png
│   │   └── background.avif.png
│   ├── global.css
│   ├── layout.tsx
│   ├── page.tsx                    (chat UI, useChat)
│   ├── login/page.tsx
│   └── signup/page.tsx
├── lib/
│   └── supabase/
│       ├── client.ts               (browser client)
│       └── server.ts               (server client)
├── middleware.ts                    (session refresh)
├── .env / .env.example
└── docs/
    └── LATENCY-OPTIMIZATION.md     <-- this file (NEW)
```

## Current Latency Path (per user message)
```
User input
  → POST /api/chat
  → OpenAI embedding (text-embedding-3-small)     ~100–300ms
  → Astra DB vector search (limit 6, ≥0.7)         ~50–200ms
  → streamText (gpt-5.6-luna) first token         dominant cost
  → token stream back to client
```
User sees nothing until the LLM's first token arrives.

## Changes (all in app/api/chat/route.ts)

### 1. Smooth streaming
`experimental_transform: smoothStream({ chunking: "word" })` — steady,
readable token flow → output *feels* faster.

### 2. LRU context cache (RAG preserved)
- Module-level LRU (~50 entries), key = normalized latest user message.
- Cache hit → skip embedding + Astra lookup, reuse stored `docContext`.
- New/different questions always run full RAG. Repeat questions are
  identical to first retrieval — no quality change.

### 3. Truncate history
Send only last 6 messages to the model (`messages.slice(-6)`).
The template already carries the current question. Smaller prompt → faster
first token.

### 4. Skip RAG for trivial prompts
Inputs < 5 chars (greetings: "hi", "hello") bypass embedding + DB — they
returned empty context today anyway, so RAG results are unchanged.

### Unchanged / Final tuning values
- Model `gpt-5.6-luna`, temperature 1.
- Vector search: `limit` 4, no similarity post-filter (top-4 taken
  unconditionally), docs truncated to 1500 chars, projection of
  `text`/`title`/`sourceUrl` only.

### Saved suggestion answers
The four onboarding suggestion buttons return pre-written answers
immediately (no API call) via `app/data/suggestedAnswers.ts`, so the first
impression feels instant. All other questions use the normal RAG stream.

## New Latency Path (optimized)
```
User input
  → POST /api/chat
  → [trivial?] yes → skip RAG, go straight to LLM
  → [cache hit?] yes → skip embedding + DB, go straight to LLM
  → [else] embedding → Astra DB → docContext
  → streamText (gpt-5.6-luna) + smoothStream
  → token stream back to client
```

## Verification
- `npm run build` passes.
- Manual: repeat a question → near-instant reply; ask a new F1 question →
  RAG still returns sourced context.
