import { env } from "cloudflare:workers"

const shaPattern = /^[0-9a-f]{7,40}$/
const pullRequestPattern = /^[0-9]+$/

const latestOrigins: Record<string, string> = {
	api: "canary-api.flirtual.com"
}

function resolveUpstreamHost(label: string): string | null {
	for (const app in latestOrigins) {
		if (label === app || label.startsWith(`${app}-`)) return latestOrigins[app]
	}

	if (shaPattern.test(label) || pullRequestPattern.test(label))
		return `git-${label}-${env.PREVIEW_WORKER_NAME}.${env.PREVIEW_SUBDOMAIN}.workers.dev`

	return null
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url)

		if (url.hostname === env.PREVIEW_ROOT_DOMAIN) {
			const latest = await env.PREVIEW_STATE.get("latest")
			if (latest === null) return new Response(null, { status: 418 })

			const target = new URL(url)
			target.hostname = `${latest}.${env.PREVIEW_ROOT_DOMAIN}`
			return Response.redirect(target.href, 302)
		}

		const suffix = `.${env.PREVIEW_ROOT_DOMAIN}`

		if (!url.hostname.endsWith(suffix))
			return new Response(null, { status: 418 })

		const requestHost = url.hostname
		const label = requestHost.slice(0, -suffix.length)

		const upstreamHost = resolveUpstreamHost(label)
		if (upstreamHost === null)
			return new Response(null, { status: 418 })

		url.protocol = "https:"
		url.hostname = upstreamHost
		url.port = ""

		const response = await fetch(new Request(url.href, request), { redirect: "manual" })

		const location = response.headers.get("location")
		if (location === null) return response

		const target = URL.parse(location, url.href)
		if (target === null || target.hostname !== upstreamHost) return response

		target.hostname = requestHost

		const headers = new Headers(response.headers)
		headers.set("location", target.toString())

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers
		})
	}
}
