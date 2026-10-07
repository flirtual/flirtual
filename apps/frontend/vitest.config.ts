import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.json" },
			miniflare: {
				bindings: {
					API_URL: "https://api.example/v1/",
					BUCKET_UPLOADS_ORIGIN: "https://uploads.example",
					IMAGE_ACCESS_TOKEN: "test"
				}
			}
		})
	],
	test: {
		include: ["src/worker/**/*.test.ts"]
	}
});
