import { CosenseData, CosensePage } from ".";
import { askChatGPT } from "./askChatGPT";
import { completion } from "./completion";
import { explorePage } from "./explorePage";

export async function walk(
  question: string,
  cosenseData: CosenseData,
  queries: Array<string>,
  exploredPages: Array<CosensePage>,
  messages: Array<any>
) {
  let result;
  let tries = 0;
  while (true) {
    const query =
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
    console.log(`Query: ${query}`);
    console.log("Sources:");
    if (query.match("null")) {
      const resumePage = exploredPages[exploredPages.length - 1];
      if (!resumePage) {
        break;
      }
      const resumePageTitle = resumePage.title;
      exploredPages.splice(0, 5);
      await explorePage(resumePageTitle, true, cosenseData, exploredPages);
    }
    if (query === queries[queries.length - 1]) {
      break;
    }
    queries.push(query);
    result = await cosenseData.search(query);
    if (result?.title) {
      break;
    }
    if (tries > 5) {
      break;
    }
    tries += 1;
  }
  if (result) {
    await explorePage(result.title, false, cosenseData, exploredPages);
  }

  const res = await askChatGPT(
    `Based on hisotry of this conversation and the following context and the initial question "${question}", provide a comprehensive answer:\n\n${exploredPages
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
  return res;
}
