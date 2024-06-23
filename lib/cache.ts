const fs = require("fs");
const path = require("path");
const os = require("os");

// OSごとのキャッシュディレクトリを設定
function getCacheDir() {
  switch (process.platform) {
    case "darwin": // macOS
      return path.join(
        os.homedir(),
        "Library",
        "Caches",
        "cosense-chatgpt-walker"
      );
    case "win32": // Windows
      return path.join(
        os.homedir(),
        "AppData",
        "Local",
        "cosense-chatgpt-walker"
      );
    case "linux": // Linux
      return path.join(os.homedir(), ".cache", "cosense-chatgpt-walker");
    default:
      throw new Error("Unsupported platform: " + process.platform);
  }
}

// キャッシュディレクトリを作成
const cacheDir = getCacheDir();
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// キャッシュファイルのパス
const cacheFilePath = path.join(cacheDir, "cache.json");

// キャッシュデータの保存
function saveCache(data) {
  fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), "utf-8");
}

// キャッシュデータの読み込み
function loadCache() {
  if (fs.existsSync(cacheFilePath)) {
    const rawData = fs.readFileSync(cacheFilePath, "utf-8");
    return JSON.parse(rawData);
  }
  return {};
}

// キャッシュデータをメモリにロード
let cache = loadCache();

// キャッシュへのデータ追加
export function setCache(key, value) {
  cache[key] = value;
  saveCache(cache);
}

// キャッシュからのデータ取得
export function getCache(key) {
  return cache[key];
}
