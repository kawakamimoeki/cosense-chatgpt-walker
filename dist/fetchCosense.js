"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCosense = void 0;
const axios_1 = require("axios");
const _1 = require(".");
async function fetchCosense(projectName) {
    let skip = 0;
    let cosenseData = new _1.CosenseData(projectName);
    process.stdout.write("loading all pages");
    while (true) {
        const url = `https://scrapbox.io/api/pages/${projectName}?limit=1000&skip=${skip}`;
        skip += 1000;
        process.stdout.write(".");
        const response = await axios_1.default.get(url);
        cosenseData.pages = [...response.data.pages, ...cosenseData.pages];
        if (skip > response.data.count) {
            break;
        }
    }
    console.log("");
    return cosenseData;
}
exports.fetchCosense = fetchCosense;
