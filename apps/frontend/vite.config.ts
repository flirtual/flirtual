import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import sonda from "sonda/vite";
// import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	build: {
		sourcemap: true
	},
	server: {
		host: "0.0.0.0",
		port: 3000,
		strictPort: true
	},
	plugins: [
		// basicSsl({
		// 	name: "flirtual",
		// 	domains: ["*.custom.com"],
		// 	certDir: "./certificates",
		// }),
		reactRouter(),
		tsconfigPaths(),
		cloudflare(),
		sonda()
	],
});
