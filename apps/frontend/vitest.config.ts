import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const domTests = "src/**/*.dom.test.ts";

export default defineConfig({
	test: {
		projects: [
			{
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
					name: "worker",
					include: ["src/**/*.test.ts"],
					exclude: [domTests]
				}
			},
			{
				resolve: {
					tsconfigPaths: true
				},
				test: {
					name: "dom",
					environment: "jsdom",
					include: [domTests]
				}
			}
		]
	}
});
