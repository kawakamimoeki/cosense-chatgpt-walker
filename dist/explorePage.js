"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.explorePage = void 0;
async function explorePage(pageTitle, resume = false, cosenseData, exploredPages) {
    var _a, e_1, _b, _c;
    if (!resume && exploredPages.find((p) => p.title === pageTitle))
        return;
    if (exploredPages.length > 5)
        return;
    const page = await cosenseData.search(pageTitle);
    if (!page) {
        return;
    }
    if (exploredPages.find((p) => p.title === page.title))
        return;
    exploredPages.push(page);
    console.log(`* ${page.title}`);
    const links = page.content.match(/\[([^\]]+)\]/g) || [];
    try {
        for (var _d = true, links_1 = __asyncValues(links), links_1_1; links_1_1 = await links_1.next(), _a = links_1_1.done, !_a;) {
            _c = links_1_1.value;
            _d = false;
            try {
                const link = _c;
                await explorePage(link.slice(1, -1), resume, cosenseData, exploredPages);
            }
            finally {
                _d = true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = links_1.return)) await _b.call(links_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
exports.explorePage = explorePage;
