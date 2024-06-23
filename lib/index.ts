#!/usr/bin/env node

import * as readline from "readline";
import { search } from "fast-fuzzy";
import { getCache, setCache } from "./cache";
import { fetchCosensePage } from "./fetchCosensePage";
import { fetchCosense } from "./fetchCosense";
import { walk } from "./walk";

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

export class CosenseData {
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

    await walk(question, cosenseData, queries, exploredPages, messages);
  }
}

cliLoop().catch(console.error);

export { fetchCosense, walk };
