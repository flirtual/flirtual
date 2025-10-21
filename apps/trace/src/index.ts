export default {
  async fetch(request, env, ctx): Promise<Response> {
    const headers = new Headers(request.headers);

    if (headers.has("flirtual-loopback")) return new Response(null, { status: 508 });
    headers.set("flirtual-loopback", "1");

    return fetch(new Request(request), { headers });
  },
} satisfies ExportedHandler<Env>;
