import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export const worker = defineWorker({
	name: "flirtual",
	entrypoint: "./src/worker/index.ts",
	compatibilityDate: "2025-09-01",
	compatibilityFlags: [],
	workersDev: false,
	assets: {
		htmlHandling: "drop-trailing-slash",
		notFoundHandling: "none",
		runWorkerFirst: ["/"],
	},
	triggers: [triggers.queue({ name: "uploads" })],
	env: {
		ASSETS: bindings.assets(),
		IMAGES: bindings.images({}),
		SOURCE_BUCKET: bindings.r2({ name: "uploads" }),
		DESTINATION_BUCKET: bindings.r2({ name: "content" }),
		API_URL: bindings.text("https://localhost:4001/v1/"),
		BUCKET_UPLOADS_ORIGIN: bindings.text("https://localhost:3000"),
		IMAGE_ACCESS_TOKEN: bindings.secret(),
	},
});

export default defineConfig({ worker });
