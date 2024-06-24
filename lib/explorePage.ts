import { CosenseData, CosensePage } from "./cosenseData";

export async function explorePage(
  pageTitle: string,
  resume: boolean = false,
  cosenseData: CosenseData,
  exploredPages: Array<CosensePage>,
  depth: number = 0
): Promise<void> {
  if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
  if (exploredPages.length > 5) return;
  if (depth > 2) return;
  const page = await cosenseData.search(pageTitle);

  if (!page) {
    return;
  }

  console.log(`* ${page.title}`);

  if (exploredPages.find((p) => p.title === page.title)) return;
  exploredPages.push(page);

  const links = page.content.match(/\[([^\]]+)\]/g) || [];
  for await (const link of links) {
    await explorePage(link.slice(1, -1), resume, cosenseData, exploredPages, depth + 1);
  }
}
