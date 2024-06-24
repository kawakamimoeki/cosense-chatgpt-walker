import { CosenseData, CosensePage } from "./cosenseData";

export async function explorePage(
  pageTitle: string,
  resume: boolean = false,
  cosenseData: CosenseData,
  exploredPages: Array<CosensePage>,
  depth: number = 0,
): Promise<void> {
  if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
  if (exploredPages.length > 10) return;
  if (depth > 2) return;
  const page = await cosenseData.search(pageTitle);

  if (!page) {
    return;
  }

  console.log(`* ${page.title}`);

  if (exploredPages.find((p) => p.title === page.title)) return;
  exploredPages.push(page);

  for await (const link of page.relatedPages.links1hop) {
    await explorePage(link.title, resume, cosenseData, exploredPages, depth + 1);
  }
  for await (const link of page.relatedPages.links2hop) {
    await explorePage(link.title, resume, cosenseData, exploredPages, depth + 1);
  }
}
