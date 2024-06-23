#!/usr/bin/env node

import axios from "axios";
import OpenAI from "openai";
import * as readline from "readline";
import { search } from "fast-fuzzy";
import { getCache, setCache } from "./cache";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CosensePage {
  id: number;
  title: string | null;
  created: number;
  updated: number;
  content?: string;
}

export interface CosenseProject {
  name: string;
  displayName: string;
  exported: number;
  users: Array<any>;
  pages: Array<CosensePage>;
}

class CosenseData {
  pages: CosensePage[];
  projectName: string;

  constructor(projectName: string) {
    this.pages = [];
    this.projectName = projectName;
  }

  async search(query: string): Promise<CosensePage> {
    const results = search(query, this.pages, {
      keySelector: (obj) => obj.title,
    });
    const result = results[0];

    if (!result) {
      return null;
    }

    result.content = await fetchCosensePage(this.projectName, result.title);
    return result;
  }
}

const messages: Array<any> = [];
const exploredPages = new Array<CosensePage>();
const queries = [];

async function fetchCosense(projectName: string): Promise<CosenseData> {
  let skip = 0;
  let cosenseData = new CosenseData(projectName);
  process.stdout.write("loading all pages");
  while (true) {
    const url = `https://scrapbox.io/api/pages/${projectName}?limit=1000&skip=${skip}`;
    skip += 1000;
    process.stdout.write(".");

    const response = await axios.get(url);
    cosenseData.pages = [...response.data.pages, ...cosenseData.pages];
    if (skip > response.data.count) {
      break;
    }
  }
  console.log("");
  return cosenseData;
}

async function fetchCosensePage(
  projectName: string,
  pageName: string
): Promise<string> {
  const url = `https://scrapbox.io/api/pages/${projectName}/${pageName}/text`;
  try {
    const response = await axios.get(url);
    if (typeof response.data !== "string") {
      throw "invalid data";
    }
    return response.data;
  } catch {
    return pageName;
  }
}

async function completion(prompt: string): Promise<string | null> {
  const chatCompletion = openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  const message = (await chatCompletion).choices[0].message;
  return message.content;
}

async function askChatGPT(prompt: string): Promise<string | null> {
  try {
    messages.push({ role: "user", content: prompt });
    const chatCompletion = openai.chat.completions.create({
      messages,
      model: "gpt-3.5-turbo",
    });

    const message = (await chatCompletion).choices[0].message;
    messages.push({ role: "assistant", content: message.content });
    console.log(message.content);
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    return null;
  }
}

async function explorePage(
  pageTitle: string,
  resume: boolean = false,
  cosenseData: CosenseData
): Promise<void> {
  if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
  if (exploredPages.length > 5) return;
  const page = await cosenseData.search(pageTitle);

  if (!page) {
    return;
  }

  if (exploredPages.find((p) => p.title === page.title)) return;
  exploredPages.push(page);
  console.log(`* ${page.title}`);

  const links = page.content.match(/\[([^\]]+)\]/g) || [];
  for await (const link of links) {
    await explorePage(link.slice(1, -1), resume, cosenseData);
  }
}

async function walk(question: string, cosenseData: CosenseData) {
  let result;
  let tries = 0;
  while (true) {
    const query =
      await completion(`Extract a suitable one-word search term from the given question.
    ${
      queries.length > 0
        ? "Return `null` if the keyword does not match any of the previously mentioned keywords."
        : ""
    }

    Question: "${question}"
    ${
      queries.length > 0
        ? `previously mentioned keywords: "${queries.join(",")}`
        : ""
    }

    Search query:`);
    console.log(`Query: ${query}`);
    console.log("Sources:");
    if (query.match("null")) {
      const resumePage = exploredPages[exploredPages.length - 1];
      if (!resumePage) {
        break;
      }
      const resumePageTitle = resumePage.title;
      exploredPages.splice(0, 5);
      await explorePage(resumePageTitle, true, cosenseData);
    }
    if (query === queries[queries.length - 1]) {
      break;
    }
    queries.push(query);
    result = await cosenseData.search(query);
    if (result?.title) {
      break;
    }
    if (tries > 5) {
      break;
    }
    tries += 1;
  }
  if (result) {
    await explorePage(result.title, false, cosenseData);
  }
  console.log("---");

  await askChatGPT(
    `Based on hisotry of this conversation and the following context and the initial question "${question}", provide a comprehensive answer:\n\n${exploredPages
      .map((p) => {
        return [
          "----",
          `title: ${p.title}`,
          `content: ${p.content}`,
          "----",
        ].join("\n");
      })
      .join("\n")}`
  );
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function cliLoop(): Promise<void> {
  console.log("Welcome to Cosense ChatGPT Walker!");
  console.log("Type your questions or 'exit' to quit.");

  let cosenseData;
  if (process.argv[3] === "--no-cache") {
    cosenseData = await fetchCosense(process.argv[2]);
  } else if (getCache(process.argv[2])) {
    cosenseData = new CosenseData(process.argv[2]);
    cosenseData.pages = getCache(process.argv[2]);
  } else {
    cosenseData = await fetchCosense(process.argv[2]);
  }

  setCache(process.argv[2], cosenseData.pages);

  while (true) {
    const question = await askQuestion("\n> ");

    if (question.toLowerCase() === "exit") {
      console.log("Thank you for using Cosense ChatGPT Explorer. Goodbye!");
      rl.close();
      break;
    }

    await walk(question, cosenseData);
  }
}

cliLoop().catch(console.error);

export { fetchCosense, walk };
