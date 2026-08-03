import OpenAI from "openai";
import { streamText } from "ai";
import { openai as aiOpenai } from "@ai-sdk/openai";
import { DataAPIClient } from "@datastax/astra-db-ts"
import { cursorTo } from "readline";

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} =process.env

const SIMILARITY_THRESHOLD = 0.7

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace: ASTRA_DB_NAMESPACE})

export async function POST(req:Request) {
    try{

        const {messages} = await req.json()
        const latestMessages = messages[messages.length-1]?.content

        let docContext = ""

       const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessages,
            encoding_format: "float"
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor =collection.find (null, {
                sort:{
                    $vector : embedding.data[0].embedding,
                },
                limit: 6,
                includeSimilarity: true
            })

            const documents = await cursor.toArray()

            const docsMap = documents
                .filter((doc) => (doc.$similarity ?? 0) >= SIMILARITY_THRESHOLD)
                .map((doc) => `[${doc.title ?? doc.sourceUrl ?? "Source"}]: ${doc.text}`)

            docContext = docsMap.join("\n\n")


        } catch (err) {
        console.log("Error Querying db...")
        docContext=""
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
            -----------------
            START CONTEXT
            ${docContext}
            END CONTEXT
            -----------------
            QUESTION: ${latestMessages}
            -----------------
            `
        }

       const result = streamText({
    model: aiOpenai("gpt-5.6-luna"),
    temperature: 1,
    messages: [template, ...messages],
});

    return result.toDataStreamResponse();
    } catch (err) {
        throw err
    }
}