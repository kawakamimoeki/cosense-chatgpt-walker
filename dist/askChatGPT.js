"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askChatGPT = void 0;
const openai_1 = require("./openai");
async function askChatGPT(prompt, messages) {
    try {
        messages.push({ role: "user", content: prompt });
        const chatCompletion = openai_1.openai.chat.completions.create({
            messages,
            model: "gpt-3.5-turbo",
        });
        const message = (await chatCompletion).choices[0].message;
        messages.push({ role: "assistant", content: message.content });
        console.log(message.content);
    }
    catch (error) {
        console.error("Error calling ChatGPT API:", error);
        return null;
    }
}
exports.askChatGPT = askChatGPT;
