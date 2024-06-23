#!/usr/bin/env node

import axios from "axios";
import OpenAI from "openai";
import * as readline from "readline";
import { search } from "fast-fuzzy";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CosensePage {
  id: number;
  title: string | null;
  created: number;
  updated: number;
  descriptions: Array<string>;
}

interface CosenseProject {
  name: string;
  displayName: string;
  exported: number;
  users: Array<any>;
  pages: Array<CosensePage>;
}

class CosenseData {
  pages: CosensePage[];

  constructor(jsonData: CosenseProject) {
    this.pages = jsonData.pages;
  }

  get(pageName: string): string {
    const page = this.pages.find((p) =>
      p.descriptions.join("\n").toLowerCase().includes(pageName.toLowerCase())
    );
    return page
      ? page.descriptions.join("\n")
      : `Page "${pageName}" not found.`;
  }

  search(query: string): CosensePage {
    const results = search(query, this.pages, {
      keySelector: (obj) => obj.title,
    });

    return results[0];
  }
}

let cosenseData: CosenseData;
let messages: Array<any> = [];
const exploredPages = new Array<CosensePage>();
let queries = [];

async function fetchList(projectName: string): Promise<void> {
  let skip = 0;
  while (true) {
    const url = `https://scrapbox.io/api/pages/${projectName}?limit=1000&skip=${skip}`;
    skip += 1000;

    try {
      const response = await axios.get(url);
      cosenseData = new CosenseData(response.data);
      if (skip > response.data.count) {
        break;
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
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

async function explore(question: string) {
  function explorePage(
    pageTitle: string,
    resume: boolean = false
  ): Promise<void> {
    if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
    const page = cosenseData.search(pageTitle);

    if (!page) {
      return;
    }

    if (exploredPages.find((p) => p.title === page.title)) return;
    exploredPages.push(page);

    if (exploredPages.length > 5) {
      return;
    }

    const links = page.descriptions.join("\n").match(/\[([^\]]+)\]/g) || [];
    for (const link of links) {
      explorePage(link.slice(1, -1));
    }
  }

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
    if (query.match("null")) {
      const resumePage = exploredPages[exploredPages.length - 1];
      if (!resumePage) {
        break;
      }
      const resumePageTitle = resumePage.title;
      exploredPages.splice(0, 5);
      explorePage(resumePageTitle, true);
    }
    if (query === queries[queries.length - 1]) {
      break;
    }
    queries.push(query);
    result = cosenseData.search(query);
    if (result?.title) {
      break;
    }
    if (tries > 5) {
      break;
    }
    tries += 1;
  }
  if (result) {
    explorePage(result.title);
    console.log("Sources:");
    exploredPages.forEach((r) => console.log(`* ${r.title}`));
  }
  console.log("---");

  await askChatGPT(
    `Based on the following context and the initial question "${question}", provide a comprehensive answer:\n\n${exploredPages
      .map((p) => {
        return [
          "----",
          `title: ${p.title}`,
          `content: ${p.descriptions.slice(50).join("\n")}`,
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
  console.log("Welcome to the Cosense ChatGPT Explorer!");
  console.log("Type your questions or 'exit' to quit.");

  await fetchList(process.argv[2]);

  while (true) {
    const question = await askQuestion("\n> ");

    if (question.toLowerCase() === "exit") {
      console.log("Thank you for using Cosense ChatGPT Explorer. Goodbye!");
      rl.close();
      break;
    }

    await explore(question);
  }
}

cliLoop().catch(console.error);
