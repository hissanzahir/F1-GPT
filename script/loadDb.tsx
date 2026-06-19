import { DataAPIClient } from "@datastax/astra-db-ts" //remembers/searches knowledge
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer" //gets data
import OpenAi from "openai" //understands text

import {RecursiveCharacterTextSplitter} from "langchain/text_splitter" //breaks data

import "dotenv/config" //loads secretsapi

