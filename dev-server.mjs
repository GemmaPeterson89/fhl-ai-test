// Local preview only. On Vercel, public/index.html is served statically and api/chat.js runs as a serverless function.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import handler from "./api/chat.js";

const PORT = Number(process.env.PORT) || 3000;

function withVercelHelpers(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
    return res;
  };
  return res;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/api/chat") {
    req.body = await readJsonBody(req);
    return handler(req, withVercelHelpers(res));
  }

  if (pathname === "/" || pathname === "/index.html") {
    const html = await readFile(new URL("./public/index.html", import.meta.url));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(html);
  }

  res.statusCode = 404;
  res.end("Not found");
}).listen(PORT, () => {
  console.log(`FH&L AI preview running at http://localhost:${PORT}`);
});
