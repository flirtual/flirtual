import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			main: "./src/index.ts",
			wrangler: { configPath: "./wrangler.toml" },
			miniflare: { bindings: { SHARED_AUTH_SECRET: "test", ALLOWED_ORIGIN: "https://app.example" } },
		}),
	],
});
