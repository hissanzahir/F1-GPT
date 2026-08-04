import OpenAI from "openai";
import { streamText } from "ai";
import { openai as aiOpenai } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} =process.env

const TRIVIAL_PROMPT_LENGTH = 5
const HISTORY_LIMIT = 6
const CACHE_SIZE = 50
const MAX_DOC_CHARS = 1500

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

const contextCache = new Map<string, string>()

function getCachedContext(key: string): string | null {
    if (contextCache.has(key)) {
        const value = contextCache.get(key)!
        contextCache.delete(key)
        contextCache.set(key, value)
        return value
    }
    return null
}

function setCachedContext(key: string, value: string) {
    contextCache.delete(key)
    contextCache.set(key, value)
    if (contextCache.size > CACHE_SIZE) {
        contextCache.delete(contextCache.keys().next().value)
    }
}

function normalizeKey(message: string): string {
    return message.trim().replace(/\s+/g, " ").toLowerCase()
}

export async function POST(req:Request) {
    try{

        const {messages} = await req.json()
        const latestMessages = messages[messages.length-1]?.content

        const t0 = Date.now()

        let docContext = ""

        const normalized = normalizeKey(latestMessages)
        const isTrivial = normalized.length < TRIVIAL_PROMPT_LENGTH

        if (!isTrivial) {
            docContext = getCachedContext(normalized) ?? ""

            if (!docContext) {
                const tEmbed = Date.now()
                const embedding = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: latestMessages,
                    encoding_format: "float"
                })
                const embedMs = Date.now() - tEmbed

                let dbMs = 0
                try {
                    const tDb = Date.now()
                    const collection = await db.collection(ASTRA_DB_COLLECTION)
                    const cursor = collection.find ({}, {
                        sort:{
                            $vector : embedding.data[0].embedding,
                        },
                        limit: 4,
                        projection: {
                            text: 1,
                            title: 1,
                            sourceUrl: 1
                        }
                    })

                    const documents = await cursor.toArray()
                    dbMs = Date.now() - tDb

                    const docsMap = documents
                        .map((doc) => `[${doc.title ?? doc.sourceUrl ?? "Source"}]: ${String(doc.text).slice(0, MAX_DOC_CHARS)}`)

                    docContext = docsMap.join("\n\n")
                    setCachedContext(normalized, docContext)

                } catch (err) {
                console.log("Error Querying db...")
                docContext=""
                }

                const ragMs = Date.now() - t0
                console.log(`[chat] cache miss | embed=${embedMs}ms db=${dbMs}ms ragTotal=${ragMs}ms`)
            } else {
                console.log(`[chat] cache hit | context=${docContext.length} chars`)
            }
        }

        const template ={
            role: "system",
            content: `content: You are an AI assistant who knows everything about Formula One.
            The context below contains recent page data from wikipedia 
            the official F1 website and others.
            Base your answer primarily on the context whenever it contains 
            relevant information.
            If the context doesn't include the information you need answer based on you 
            existing knowledge and don't mention the source of your information or 
            what the context does or doesn't include.
            Format responses using markdown where applicable and don't return 
            images.
            dont include ** in your response.
            -----------------
            START CONTEXT
            ${docContext}
            END CONTEXT
            -----------------
            QUESTION: ${latestMessages}
            -----------------
            `
        }

       const tStream = Date.now()
       let firstTokenLogged = false
       const result = streamText({
    model: aiOpenai("gpt-5.6-luna"),
    temperature: 1,
    messages: [template, ...messages.slice(-HISTORY_LIMIT)],
    onChunk: () => {
        if (!firstTokenLogged) {
            firstTokenLogged = true
            console.log(`[chat] first token in ${Date.now() - tStream}ms`)
        }
    },
});

    return result.toDataStreamResponse();
    } catch (err) {
        throw err
    }
}