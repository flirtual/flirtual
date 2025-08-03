// see: https://developers.cloudflare.com/workers/wrangler/configuration
import wrangler from "../../wrangler.json";
import { redirects } from "./_redirects";

export async function loader() {
	return {
		...wrangler,
		assets: {
			...wrangler.assets,
			run_worker_first: [
				...wrangler.assets.run_worker_first,
				...redirects
					.filter(({ run_worker_first = true }) => run_worker_first)
					.map(({ source }) => `!${source}`)
			]
		}
	};
}
