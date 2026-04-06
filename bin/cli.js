#!/usr/bin/env node
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Static files are bundled alongside this script in the npm package
const STATIC_DIR = path.join(__dirname, "..", "out");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".map":  "application/json",
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      execSync(`open "${url}"`);
    } else if (platform === "win32") {
      execSync(`start "" "${url}"`);
    } else {
      execSync(`xdg-open "${url}"`);
    }
  } catch {
    // Silently fail — user can open manually
  }
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    // Strip query strings
    let urlPath = req.url.split("?")[0];

    // Default to index.html
    if (urlPath === "/" || urlPath === "") {
      urlPath = "/index.html";
    }

    // Next.js static export uses trailing slashes + index.html
    // e.g. /editor/ → /editor/index.html
    let filePath = path.join(STATIC_DIR, urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    // Try adding .html if exact file not found
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      const withHtml = filePath + ".html";
      if (fs.existsSync(withHtml)) {
        filePath = withHtml;
      }
    }

    serveFile(filePath, res);
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://localhost:${port}`;
    console.log("");
    console.log("  OpenShell Policy Editor");
    console.log("  ─────────────────────────────────────");
    console.log(`  Local:   ${url}`);
    console.log(`  Editor:  ${url}/editor/`);
    console.log("");
    console.log("  Press Ctrl+C to stop");
    console.log("");
    openBrowser(`${url}/editor/`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      // Try the next port
      startServer(port + 1);
    } else {
      console.error("Server error:", err.message);
      process.exit(1);
    }
  });
}

// Verify static files are present
if (!fs.existsSync(STATIC_DIR) || !fs.existsSync(path.join(STATIC_DIR, "index.html"))) {
  console.error(
    "\n  Error: Static files not found.\n" +
    "  This usually means the package was not built before publishing.\n" +
    "  Please report this at: https://github.com/oidebrett/openshellpolicy/issues\n"
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || "3847", 10);
startServer(PORT);
