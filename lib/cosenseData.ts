import { fetchCosensePage } from "./fetchCosensePage";
const Fuse = require('fuse.js')

interface CosensePage {
  id: number;
  title: string | null;
  created: number;
  updated: number;
  content?: string;
  descriptions?: Array<string>;
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
  projectName: string;

  constructor(projectName: string) {
    this.pages = [];
    this.projectName = projectName;
  }

  async search(query: string): Promise<CosensePage> {
    const pages = this.pages;
    pages.forEach((page) => {
      page.content = page.descriptions.join("\n")
    })
    const fuse = new Fuse(this.pages, { keys: ["title", "content"] });
    const results = fuse.search(query);
    const result = results[0].item

    if (!result) {
      return null;
    }

    result.content = await fetchCosensePage(this.projectName, result.title);
    return result;
  }
}

export { CosenseData, CosensePage, CosenseProject };
