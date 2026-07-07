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
    chunkSize:512,
    chunkOverlap:100
})

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

const createCollection= async (Similaritymetric:Similaritymetric="dot_product") => {
    const res = await db.createCollection( ASTRA_DB_COLLECTION,{
        vector:{
            dimension: 1536,
            metric:Similaritymetric
        }
    })
    console.log(res)
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
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)

        const startChunkIndex = urlIndex === checkpoint.urlIndex ? checkpoint.chunkIndex : 0

        for (let chunkIndex = startChunkIndex; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex]
            const embedding = await openai.embeddings.create({
                model:"text-embedding-3-small",
                input:chunk,
                encoding_format:"float"
            })
            //saving response from open ai
            const vector = embedding.data[0].embedding

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
                chunkIndex
            })
            console.log(res)
            await saveCheckpoint({ urlIndex, chunkIndex: chunkIndex + 1 })
        }

        await saveCheckpoint({ urlIndex: urlIndex + 1, chunkIndex: 0 })
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
               document.querySelectorAll("script, style, noscript").forEach((el) => el.remove())
               return document.body.innerText
           }) 
           await browser.close()
              return result
        }
    })
    return (await loader.scrape())?.trim()
}


loadSampleData()
 


