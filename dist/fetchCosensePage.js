"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCosensePage = void 0;
const axios_1 = require("axios");
async function fetchCosensePage(projectName, pageName) {
    const url = `https://scrapbox.io/api/pages/${projectName}/${pageName}/text`;
    try {
        const response = await axios_1.default.get(url);
        if (typeof response.data !== "string") {
            throw "invalid data";
        }
        return response.data;
    }
    catch (_a) {
        return pageName;
    }
}
exports.fetchCosensePage = fetchCosensePage;
