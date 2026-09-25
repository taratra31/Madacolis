const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "dist");
const PORT = process.env.PORT || 10000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    const isAsset = urlPath.startsWith("/_expo/") || urlPath.startsWith("/assets/") || path.extname(urlPath) !== "";
    const filePath = path.join(ROOT, isAsset ? urlPath.replace(/^\/+/, "") : "index.html");
    const ext = path.extname(filePath);
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", isAsset && ext !== ".html" ? "public, max-age=31536000, immutable" : "no-cache");
    fs.createReadStream(filePath)
      .on("error", () => {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      })
      .pipe(res);
  })
  .listen(PORT, () => console.log(`madacolis-mobile static server on ${PORT}`));