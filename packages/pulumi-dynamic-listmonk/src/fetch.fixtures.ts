import { Api } from "@flirtual/pulumi-dynamic-fetch";
import { vi } from "vitest";

export const api = new Api({
  baseUrl: "https://listmonk.example/api",
  headers: {},
  encoding: "json",
});

export function respond(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Listmonk wraps every payload in `data`.
export const ok = (data: unknown) => respond(200, { data });

interface Sent {
  route: string;
  body: unknown;
}

// Answers each `"METHOD /path"` with its responses in order, relative to the API's base URL.
export function stubListmonk(routes: Record<string, Array<Response>>) {
  const sent: Array<Sent> = [];

  vi.stubGlobal("fetch", async (input: URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname.replace(/^\/api/u, "")}${url.search}`;
    const text = await request.text();
    sent.push({ route, body: text === "" ? undefined : JSON.parse(text) });

    const response = routes[route]?.shift();
    if (!response) throw new Error(`Unexpected request: ${route}`);
    return response;
  });

  return sent;
}
