#!/usr/bin/env node

import * as readline from "readline";
import { getCache, setCache } from "./cache";
import { fetchCosense } from "./fetchCosense";
import { walk } from "./walk";
import { askChatGPT } from "./askChatGPT";
import { CosenseData } from "./cosenseData";
import type { CosensePage } from "./cosenseData";

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
  const messages: Array<any> = [];
  const exploredPages = new Array<CosensePage>();
  const queries = [];
  const name = process.argv[2];

  if (process.argv[3] === "--no-cache") {
    cosenseData = await fetchCosense(name);
  } else if (getCache(name)) {
    cosenseData = new CosenseData(name);
    cosenseData.pages = getCache(name);
  } else {
    cosenseData = await fetchCosense(name);
  }

  setCache(name, cosenseData.pages);

  while (true) {
    const question = await askQuestion("\n> ");

    if (question.toLowerCase() === "exit") {
      console.log("Thank you for using Cosense ChatGPT Explorer. Goodbye!");
      rl.close();
      break;
    }

    const { query, pages } = await walk(
      question,
      cosenseData,
      queries,
      exploredPages
    );
    console.log(`Search query: ${query}`);
    console.log(`Source pages:`);
    pages.forEach((p) => {
      console.log(`* ${p.title}`);
    });
    const res = await askChatGPT(
      `Based on hisotry of this conversation and the following context and the initial question "${question}", provide a comprehensive answer:\n\n${pages
        .map((p) => {
          return [
            "----",
            `title: ${p.title}`,
            `content: ${p.content}`,
            "----",
          ].join("\n");
        })
        .join("\n")}`,
      messages
    );
    console.log(res);
  }
}

cliLoop().catch(console.error);

export { fetchCosense, walk };
