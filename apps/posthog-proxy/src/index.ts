const API_HOST = "us.i.posthog.com"
const ASSET_HOST = "us-assets.i.posthog.com"

async function handleRequest(request, ctx) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const pathWithParams = pathname + search

  if (pathname.startsWith("/static/")) {
    return retrieveStatic(request, pathWithParams, ctx)
  } else {
    return forwardRequest(request, pathWithParams)
  }
}

async function retrieveStatic(request, pathname, ctx) {
  let response = await caches.default.match(request)
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`)
    ctx.waitUntil(caches.default.put(request, response.clone()))
  }
  return response
}

async function forwardRequest(request, pathWithSearch) {
  const ip = request.headers.get("CF-Connecting-IP") || ""
  const originHeaders = new Headers(request.headers)
  originHeaders.delete("cookie")
  originHeaders.set("X-Forwarded-For", ip)

  const originRequest = new Request(`https://${API_HOST}${pathWithSearch}`, {
    method: request.method,
    headers: originHeaders,
    body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : null,
    redirect: request.redirect
  })

  return await fetch(originRequest)
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, ctx);
  }
};
