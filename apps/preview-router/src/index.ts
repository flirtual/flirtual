import { env } from "cloudflare:workers"

const shaPattern = /^[0-9a-f]{7,40}$/
const pullRequestPattern = /^[0-9]+$/

function isPreviewLabel(label: string): boolean {
	return shaPattern.test(label) || pullRequestPattern.test(label)
}

function redirectToLatest(url: URL, prefix: string, latest: string): Response {
	const target = new URL(url)
	target.hostname = `${prefix}${latest}.${env.PREVIEW_ROOT_DOMAIN}`

	return new Response(null, {
		status: 302,
		headers: {
			"location": target.href,
			"x-flirtual-preview": latest
		}
	})
}

async function proxy(
	request: Request,
	url: URL,
	label: string,
	upstreamHost: string,
	instance?: string
): Promise<Response> {
	const requestHost = url.hostname

	const upstreamUrl = new URL(url)
	upstreamUrl.protocol = "https:"
	upstreamUrl.hostname = upstreamHost
	upstreamUrl.port = ""

	let upstreamRequest = new Request(upstreamUrl.href, request)
	if (instance !== undefined) {
		const headers = new Headers(upstreamRequest.headers)
		headers.set("fly-force-instance-id", instance)
		upstreamRequest = new Request(upstreamRequest, { headers })
	}

	const response = await fetch(upstreamRequest, { redirect: "manual" })

	// The upstream stamps the Machine that served it; if a forced request
	// landed somewhere other than the instance we asked for, refuse it rather
	// than return another preview's response.
	if (instance !== undefined) {
		const served = response.headers.get("x-flirtual-machine")
		if (served !== null && served !== instance)
			return new Response(null, { status: 502 })
	}

	const headers = new Headers(response.headers)
	headers.set("x-flirtual-preview", label)
	headers.set("x-flirtual-upstream", upstreamHost)

	const location = response.headers.get("location")
	if (location !== null) {
		const target = URL.parse(location, upstreamUrl.href)
		if (target !== null && target.hostname === upstreamHost) {
			target.hostname = requestHost
			headers.set("location", target.toString())
		}
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	})
}

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url)
		const suffix = `.${env.PREVIEW_ROOT_DOMAIN}`

		if (url.hostname === env.PREVIEW_ROOT_DOMAIN) {
			const latest = await env.PREVIEW_STATE.get("latest")
			if (latest === null) return new Response(null, { status: 418 })
			return redirectToLatest(url, "", latest)
		}

		if (!url.hostname.endsWith(suffix))
			return new Response(null, { status: 418 })

		const label = url.hostname.slice(0, -suffix.length)

		if (label === "api") {
			const latest = await env.PREVIEW_STATE.get("latest-api")
			if (latest === null) return new Response(null, { status: 418 })
			return redirectToLatest(url, "api-", latest)
		}

		if (label.startsWith("api-")) {
			const target = label.slice("api-".length)
			if (!isPreviewLabel(target)) return new Response(null, { status: 418 })

			const machine = await env.PREVIEW_STATE.get(`machine-${target}`)
			if (machine === null) return new Response(null, { status: 418 })

			return proxy(request, url, target, env.PREVIEW_API_HOST, machine)
		}

		if (isPreviewLabel(label))
			return proxy(
				request,
				url,
				label,
				`git-${label}-${env.PREVIEW_WORKER_NAME}.${env.PREVIEW_SUBDOMAIN}.workers.dev`
			)

		return new Response(null, { status: 418 })
	}
}
