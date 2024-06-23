"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completion = void 0;
const openai_1 = require("./openai");
async function completion(prompt) {
    const chatCompletion = openai_1.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
    });
    const message = (await chatCompletion).choices[0].message;
    return message.content;
}
exports.completion = completion;
