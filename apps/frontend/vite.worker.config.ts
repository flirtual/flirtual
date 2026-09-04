import { defineConfig } from "vite";

// Bundles the Cloudflare Worker entry (src/worker/index.ts) into a single ESM
// module for deployment. Separate from the SPA build (react-router, SSR off):
// noExternal bundles all deps, and cloudflare:/node: stay external (runtime
// provides them).
export default defineConfig({
	build: {
		outDir: "dist/worker",
		emptyOutDir: true,
		copyPublicDir: false,
		ssr: true,
		minify: false,
		rollupOptions: {
			input: "src/worker/index.ts",
			external: [/^cloudflare:/, /^node:/],
			output: { entryFileNames: "index.js", format: "es" },
		},
	},
	ssr: { noExternal: true, target: "webworker" },
});
