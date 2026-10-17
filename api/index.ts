import type { Request, Response } from "express";
import { getServerApp } from "../server.ts";

export default async function handler(req: Request, res: Response) {
  const incomingUrl = req.url || "/";
  const queryIndex = incomingUrl.indexOf("?");
  const pathname = queryIndex === -1 ? incomingUrl : incomingUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : incomingUrl.slice(queryIndex);
  const apiEntryPrefix = "/api/index.ts";
  if (pathname === apiEntryPrefix || pathname.startsWith(`${apiEntryPrefix}/`)) {
    req.url = `/api${pathname.slice(apiEntryPrefix.length)}${query}`;
  } else if (!pathname.startsWith("/api/") && pathname !== "/api") {
    req.url = `/api${pathname === "/" ? "" : pathname}${query}`;
  }

  try {
    const app = await getServerApp();
    app(req, res);
  } catch {
    console.error("API initialization failed");
    res.status(500).json({ error: "API initialization failed" });
  }
}

