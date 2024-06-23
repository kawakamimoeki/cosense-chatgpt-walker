import { search } from "fast-fuzzy";
import { fetchCosensePage } from "./fetchCosensePage";

interface CosensePage {
  id: number;
  title: string | null;
  created: number;
  updated: number;
  content?: string;
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

export { CosenseData, CosensePage, CosenseProject };
