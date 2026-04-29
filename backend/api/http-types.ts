import type { IncomingMessage, ServerResponse } from "node:http";
import type { RequestMeta } from "./request-meta";

export interface RouteContext {
  params: Record<string, string>;
  body: unknown;
  request: IncomingMessage;
  response: ServerResponse;
  meta: RequestMeta;
}

export interface HttpRoute {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  handle: (context: RouteContext) => Promise<void> | void;
}
