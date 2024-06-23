#!/usr/bin/env node

import axios from "axios";
import OpenAI from "openai";
import * as readline from "readline";
import { search } from "fast-fuzzy";
import * as fs from "fs";
import * as path from "path";

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

let messages: Array<any> = [];
const exploredPages = new Array<CosensePage>();
let queries = [];

async function loadJsonFile(filePath: string): Promise<CosenseData> {
  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const cosenseData = new CosenseData(jsonData.name);
  cosenseData.pages = jsonData.pages;
  return cosenseData;
}

async function fetchCosense(projectName: string): Promise<CosenseData> {
  let skip = 0;
  let cosenseData = new CosenseData(projectName);
  while (true) {
    const url = `https://scrapbox.io/api/pages/${projectName}?limit=1000&skip=${skip}`;
    skip += 1000;

    const response = await axios.get(url);
    cosenseData.pages = [...response.data.pages, ...cosenseData.pages];
    if (skip > response.data.count || skip > 5000) {
      break;
    }
  }
  return cosenseData;
}

async function fetchCosensePage(
  projectName: string,
  pageName: string
): Promise<string> {
  const url = `https://scrapbox.io/api/pages/${projectName}/${pageName}/text`;
  const response = await axios.get(url);
  return response.data;
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
  // if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
  const page = await cosenseData.search(pageTitle);

  if (!page) {
    return;
  }

  if (exploredPages.find((p) => p.title === page.title)) return;
  exploredPages.push(page);
  console.log(`* ${page.title}`);

  if (exploredPages.length > 5) {
    return;
  }

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

  console.log(messages);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function cliLoop(): Promise<void> {
  console.log("Welcome to the Cosense ChatGPT Explorer!");
  console.log("Type your questions or 'exit' to quit.");

  let cosenseData;
  if (process.argv[2]) {
    cosenseData = await fetchCosense(process.argv[2]);
  } else {
    const jsonFilePath = process.env.COSENSE_DATA_PATH;
    cosenseData = await loadJsonFile(path.resolve(jsonFilePath));
  }

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

export { fetchCosense, walk, loadJsonFile };
