import { reactRouter } from "@react-router/dev/vite";
// import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import webfontDownload from "vite-plugin-webfont-dl";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
		webfontDownload()
	],
});
