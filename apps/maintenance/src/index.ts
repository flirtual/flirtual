import { env } from "cloudflare:workers"

const hourInSeconds = 60 * 60;

export default {
  async fetch(request: Request) {
		const cookie = request.headers.get("cookie");
		if (cookie && cookie.includes(`flirtual-maintenance=${env.TOKEN}`))
			return fetch(request);

		const response = await env.ASSETS.fetch(request);

		const headers = new Headers(response.headers);
		headers.set("retry-after", String(hourInSeconds));

		return new Response(response.body, {
		  status: 503,
			headers
		});
  }
}
