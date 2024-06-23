"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const openai_1 = require("openai");
exports.openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
