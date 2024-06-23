import { CosenseData, CosensePage } from "./cosenseData";
import { completion } from "./completion";
import { explorePage } from "./explorePage";

export async function walk(
  question: string,
  cosenseData: CosenseData,
  queries: Array<string>,
  exploredPages: Array<CosensePage>
) {
  let result;
  let query = "";
  let tries = 0;
  while (true) {
    query =
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
    if (query.match("null")) {
      const resumePage = exploredPages[exploredPages.length - 1];
      if (!resumePage) break;
      const resumePageTitle = resumePage.title;
      exploredPages.splice(0, 5);
      await explorePage(resumePageTitle, true, cosenseData, exploredPages);
    }
    if (query === queries[queries.length - 1]) break;
    queries.push(query);
    result = await cosenseData.search(query);
    if (result?.title || tries > 5) break;
    tries += 1;
  }
  if (result) {
    await explorePage(result.title, false, cosenseData, exploredPages);
  }

  return { query, pages: exploredPages };
}
