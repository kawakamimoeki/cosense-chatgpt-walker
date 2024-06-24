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

export async function cliLoop(): Promise<void> {
  console.log("Welcome to Cosense ChatGPT Walker!");
  console.log("Type your questions or 'exit' to quit.");

  let cosenseData;
  const messages: Array<any> = [];
  const exploredPages = new Array<CosensePage>();
  const queries = [];
  const name = process.argv[2];

  if (process.argv[3] === "--no-cache") {
    console.log("Loading all pages...");
    cosenseData = await fetchCosense(name);
  } else if (getCache(name)) {
    cosenseData = new CosenseData(name);
    cosenseData.pages = getCache(name);
  } else {
    console.log("Loading all pages...");
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
    const res = await askChatGPT(question, pages, messages);
  }
}

export { fetchCosense, walk };
