import { bindings, defineConfig, defineWorker, exports } from "cf/config";

export const worker = defineWorker({
	name: "flirtual-tus",
	entrypoint: "./src/index.ts",
	compatibilityDate: "2025-09-01",
	compatibilityFlags: ["nodejs_compat", "unhandled_rejection_after_microtask_checkpoint"],
	workersDev: false,
	exports: {
		AttachmentUploadHandler: exports.durableObject({ storage: "sqlite" }),
	},
	env: {
		ATTACHMENT_BUCKET: bindings.r2({ name: "content-uploads" }),
		ATTACHMENT_UPLOAD_HANDLER: bindings.durableObject({
			worker: "flirtual-tus",
			exportName: "AttachmentUploadHandler",
		}),
		SHARED_AUTH_SECRET: bindings.secret(),
	},
});

export default defineConfig({ worker });
