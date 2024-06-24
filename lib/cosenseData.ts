import { fetchCosensePage } from "./fetchCosensePage";
const Fuse = require('fuse.js')

interface CosensePage {
  id: number;
  title: string | null;
  created: number;
  updated: number;
  content?: string;
  descriptions?: Array<string>;
  lines?: Array<string>;
  relatedPages: {
    links1hop: Array<CosensePage>,
    links2hop: Array<CosensePage>
  }
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

    if (results.length === 0) {
      return null;
    }

    const title = results[0].item.title

    const result = await fetchCosensePage(this.projectName, title);

    if (!result) {
      return null;
    }

    result.content = result.lines.join("\n");
    return result;
  }
}

export { CosenseData, CosensePage, CosenseProject };
