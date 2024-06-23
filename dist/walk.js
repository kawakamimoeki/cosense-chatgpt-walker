"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = void 0;
const askChatGPT_1 = require("./askChatGPT");
const completion_1 = require("./completion");
const explorePage_1 = require("./explorePage");
async function walk(question, cosenseData, queries, exploredPages, messages) {
    let result;
    let tries = 0;
    while (true) {
        const query = await (0, completion_1.completion)(`Extract a suitable one-word search term from the given question.
    ${queries.length > 0
            ? "Return `null` if the keyword does not match any of the previously mentioned keywords."
            : ""}

    Question: "${question}"
    ${queries.length > 0
            ? `previously mentioned keywords: "${queries.join(",")}`
            : ""}

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
            await (0, explorePage_1.explorePage)(resumePageTitle, true, cosenseData, exploredPages);
        }
        if (query === queries[queries.length - 1]) {
            break;
        }
        queries.push(query);
        result = await cosenseData.search(query);
        if (result === null || result === void 0 ? void 0 : result.title) {
            break;
        }
        if (tries > 5) {
            break;
        }
        tries += 1;
    }
    if (result) {
        await (0, explorePage_1.explorePage)(result.title, false, cosenseData, exploredPages);
    }
    console.log("---");
    await (0, askChatGPT_1.askChatGPT)(`Based on hisotry of this conversation and the following context and the initial question "${question}", provide a comprehensive answer:\n\n${exploredPages
        .map((p) => {
        return [
            "----",
            `title: ${p.title}`,
            `content: ${p.content}`,
            "----",
        ].join("\n");
    })
        .join("\n")}`, messages);
}
exports.walk = walk;
