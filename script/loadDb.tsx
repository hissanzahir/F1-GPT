import { DataAPIClient } from "@datastax/astra-db-ts" //remembers/searches knowledge
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer" //gets data
import OpenAi from "openai" //understands text

import {RecursiveCharacterTextSplitter} from "langchain/text_splitter" //breaks data
import { readFile, writeFile } from "fs/promises"
import path from "path"

import "dotenv/config" //loads secretsapi

type Similaritymetric=
 "dot_product" |
 "cosine"|
 "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} =process.env //loads secretsapi from .env file

const openai=new OpenAi({apiKey:OPENAI_API_KEY}) //initializes openai client

//define webbsite to scrape

const f1Data=[
    //F1 Wikipedia pages
'https://en.wikipedia.org/wiki/Formula_One',
'https://en.wikipedia.org/wiki/List_of_Formula_One_drivers',
'https://en.wikipedia.org/wiki/List_of_Formula_One_World_Drivers%27_Champions',
'https://en.wikipedia.org/wiki/List_of_Formula_One_constructors',
'https://en.wikipedia.org/wiki/List_of_Formula_One_Grand_Prix_winners',

//Drivers knowledge
'https://en.wikipedia.org/wiki/Max_Verstappen',
'https://en.wikipedia.org/wiki/Lewis_Hamilton',
'https://en.wikipedia.org/wiki/Charles_Leclerc',
'https://en.wikipedia.org/wiki/Lando_Norris',
'https://en.wikipedia.org/wiki/Oscar_Piastri',
'https://en.wikipedia.org/wiki/Fernando_Alonso',

//Teams
'https://en.wikipedia.org/wiki/Scuderia_Ferrari',
'https://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One',
'https://en.wikipedia.org/wiki/Red_Bull_Racing',
'https://en.wikipedia.org/wiki/McLaren',
'https://en.wikipedia.org/wiki/Aston_Martin_in_Formula_One',

//Seasons
'https://en.wikipedia.org/wiki/2026_Formula_One_season',
'https://en.wikipedia.org/wiki/2025_Formula_One_season',
'https://en.wikipedia.org/wiki/2024_Formula_One_season',
'https://en.wikipedia.org/wiki/2023_Formula_One_season',
'https://en.wikipedia.org/wiki/2022_Formula_One_season',
'https://en.wikipedia.org/wiki/2021_Formula_One_season',
'https://en.wikipedia.org/wiki/2020_Formula_One_season',
'https://en.wikipedia.org/wiki/2019_Formula_One_season',
'https://en.wikipedia.org/wiki/2018_Formula_One_season',

//Rules / technical knowledge & circuits
'https://en.wikipedia.org/wiki/Circuit_de_Monaco',
'https://en.wikipedia.org/wiki/Silverstone_Circuit',
'https://en.wikipedia.org/wiki/Circuit_of_the_Americas',
'https://en.wikipedia.org/wiki/Suzuka_International_Racing_Course',
'https://en.wikipedia.org/wiki/Monza_Circuit',

//Historical data
'https://en.wikipedia.org/wiki/List_of_Formula_One_seasons',
'https://en.wikipedia.org/wiki/1950_Formula_One_season',
'https://en.wikipedia.org/wiki/List_of_Formula_One_World_Constructors%27_Champions',

]

const client= new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db=client.db(
    ASTRA_DB_API_ENDPOINT, 
    {namespace:ASTRA_DB_NAMESPACE}
)

const splitter= new RecursiveCharacterTextSplitter({
    chunkSize:1200,
    chunkOverlap:150,
    separators:["\n\n## ", "\n\n### ", "\n\n#### ", "\n\n", "\n", " ", ""]
})

const EMBED_BATCH_SIZE = 100

const checkpointPath = path.join(process.cwd(), ".seed-checkpoint.json")

type SeedCheckpoint = {
    urlIndex: number
    chunkIndex: number
}

const defaultCheckpoint: SeedCheckpoint = {
    urlIndex: 0,
    chunkIndex: 0
}

const loadCheckpoint = async (): Promise<SeedCheckpoint> => {
    try {
        const raw = await readFile(checkpointPath, "utf-8")
        const parsed = JSON.parse(raw) as Partial<SeedCheckpoint>
        return {
            urlIndex: parsed.urlIndex ?? 0,
            chunkIndex: parsed.chunkIndex ?? 0
        }
    } catch {
        return defaultCheckpoint
    }
}

const saveCheckpoint = async (checkpoint: SeedCheckpoint) => {
    await writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2))
}

const titleFromUrl = (url: string) => {
    const name = url.split("/").filter(Boolean).pop()?.replace(/_/g, " ")
    return decodeURIComponent(name ?? url)
}

const createCollection= async (Similaritymetric:Similaritymetric="cosine") => {
    const res = await db.createCollection( ASTRA_DB_COLLECTION,{
        vector:{
            dimension: 1536,
            metric:Similaritymetric
        }
    })
    console.log(res)
}

const ensureCollection = async () => {
    const collections = await db.listCollections({ nameOnly: true })
    if (collections.includes(ASTRA_DB_COLLECTION)) {
        console.log(`Collection "${ASTRA_DB_COLLECTION}" already exists`)
        return
    }
    await createCollection()
}

const resetCollection = async () => {
    try {
        await db.dropCollection(ASTRA_DB_COLLECTION)
        console.log(`Dropped collection "${ASTRA_DB_COLLECTION}"`)
    } catch (err) {
        console.log("Collection did not exist, skipping drop")
    }
    await createCollection()
}

//get all urls chunk them up and create vector embeding 
const loadSampleData= async() => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    const checkpoint = await loadCheckpoint()
    const firstDoc = await collection.findOne({})

    if (!firstDoc && (checkpoint.urlIndex !== 0 || checkpoint.chunkIndex !== 0)) {
        await saveCheckpoint(defaultCheckpoint)
    }

    for (let urlIndex = checkpoint.urlIndex; urlIndex < f1Data.length; urlIndex++) {
        const url = f1Data[urlIndex]
        const title = titleFromUrl(url)
        const content = await scrapePage(url)
        const chunks = (await splitter.splitText(content)).filter((c) => c.trim().length > 0)

        if (chunks.length === 0) {
            console.log({ skipped: true, url, reason: "no content" })
            await saveCheckpoint({ urlIndex: urlIndex + 1, chunkIndex: 0 })
            continue
        }

        const startChunkIndex = urlIndex === checkpoint.urlIndex ? checkpoint.chunkIndex : 0

        for (let batchStart = startChunkIndex; batchStart < chunks.length; batchStart += EMBED_BATCH_SIZE) {
            const batch = chunks.slice(batchStart, batchStart + EMBED_BATCH_SIZE)
            const embedding = await openai.embeddings.create({
                model:"text-embedding-3-small",
                input:batch,
                encoding_format:"float"
            })

            for (let i = 0; i < batch.length; i++) {
                const chunkIndex = batchStart + i
                const chunk = batch[i]
                const vector = embedding.data[i].embedding

                const existing = await collection.findOne({
                    sourceUrl: url,
                    chunkIndex
                })

                if (existing) {
                    console.log({ skipped: true, urlIndex, chunkIndex })
                    await saveCheckpoint({ urlIndex, chunkIndex: chunkIndex + 1 })
                    continue
                }

                const res = await collection.insertOne({
                    $vector:vector,
                    text:chunk,
                    sourceUrl: url,
                    title,
                    chunkIndex
                })
                console.log({ inserted: true, urlIndex, chunkIndex })
                await saveCheckpoint({ urlIndex, chunkIndex: chunkIndex + 1 })
            }
        }

        await saveCheckpoint({ urlIndex: urlIndex + 1, chunkIndex: 0 })
        console.log(`Finished "${title}" (${urlIndex + 1}/${f1Data.length})`)
    }
}


const scrapePage = async (url: string) => {
    const loader= new PuppeteerWebBaseLoader( url, {
        launchOptions: {
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        },
        gotoOptions: {
            waitUntil : "domcontentloaded"
        },
        evaluate: async (page, browser) => {
           const result = await page.evaluate(() => {
               const noiseSelectors = [
                   "script", "style", "noscript",
                   ".navbox", ".reflist", ".references", "#References",
                   ".mw-editsection", "#catlinks", "#mw-head", "#mw-panel",
                   "#footer", ".printfooter", ".noprint", ".mw-jump-link",
                   ".mw-empty-elt", ".portalbox", ".vertical-navbox",
                   ".hatnote", "#toc", ".toc"
               ]
               noiseSelectors.forEach((sel) =>
                   document.querySelectorAll(sel).forEach((el) => el.remove())
               )

               const content = document.getElementById("mw-content-text") || document.body
               const parts: string[] = []

               const walk = (node: Node) => {
                   if (node.nodeType === Node.TEXT_NODE) {
                       const t = node.textContent?.trim()
                       if (t) parts.push(t)
                       return
                   }
                   if (node.nodeType !== Node.ELEMENT_NODE) return

                   const el = node as HTMLElement
                   const tag = el.tagName.toLowerCase()

                   if (tag === "h2") parts.push(`\n\n## ${el.textContent?.trim()}\n`)
                   else if (tag === "h3") parts.push(`\n\n### ${el.textContent?.trim()}\n`)
                   else if (tag === "h4") parts.push(`\n\n#### ${el.textContent?.trim()}\n`)
                   else if (["p", "li", "td", "th", "dt", "dd", "blockquote", "figcaption"].includes(tag)) {
                       parts.push(`\n${el.textContent?.trim()}\n`)
                   } else {
                       el.childNodes.forEach((c) => walk(c))
                   }
               }

               walk(content)
               return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim()
           })
           await browser.close()
              return result
        }
    })
    return (await loader.scrape())?.trim()
}


const main = async () => {
    if (process.argv.includes("--reset")) {
        await resetCollection()
    } else {
        await ensureCollection()
    }
    await loadSampleData()
}

main()
