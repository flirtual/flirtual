import { bindings, defineConfig, defineWorker } from "cf/config";

export const worker = defineWorker({
	name: "embed",
	entrypoint: "./src/index.ts",
	compatibilityDate: "2026-08-22",
	workersDev: false,
	observability: { enabled: true, logs: { invocationLogs: false } },
	env: {
		SIGNING_KEY: bindings.secret(),
		ALLOWED_ORIGINS: bindings.text("https://localhost:3000"),
		// Empty uses apps/api/priv/chat/allowed-hosts.json.
		ALLOWED_HOSTS: bindings.text(""),
		// Empty uses apps/api/priv/chat/allowed-matches.json.
		ALLOWED_MATCHES: bindings.text(""),
		USER_AGENT: bindings.text("Mozilla/5.0 (compatible; EmbedBot/1.0) (like TwitterBot)"),
		UNFURL_LIMITER: bindings.rateLimit({ namespace: "1000", simple: { limit: 60, period: 60 } }),
	},
});

export default defineConfig({ worker });
