import { CosenseData, CosensePage } from "./cosenseData";

export async function explorePage(
  pageTitle: string,
  resume: boolean = false,
  cosenseData: CosenseData,
  exploredPages: Array<CosensePage>
): Promise<void> {
  if (!resume && exploredPages.find((p) => p.title === pageTitle)) return;
  if (exploredPages.length > 5) return;
  const page = await cosenseData.search(pageTitle);

  if (!page) {
    return;
  }

  if (exploredPages.find((p) => p.title === page.title)) return;
  exploredPages.push(page);

  const links = page.content.match(/\[([^\]]+)\]/g) || [];
  for await (const link of links) {
    await explorePage(link.slice(1, -1), resume, cosenseData, exploredPages);
  }
}
