import { config } from "dotenv";

import type { CapacitorConfig } from "@capacitor/cli";

config({ path: ".env.local" });
const frontendUrl = new URL(process.env.NEXT_PUBLIC_ORIGIN!);
const frontendScheme = frontendUrl.protocol.slice(0, -1);

export default {
	appId: "zone.homie.flirtual.pwa",
	appName: "Flirtual",
	webDir: "public",
	server: {
		androidScheme: frontendScheme,
		hostname: frontendUrl.hostname,
		url: frontendUrl.origin,
		cleartext: frontendScheme === "http"
	},
	ios: {
		scheme: "Flirtual"
	},
	appendUserAgent: "Flirtual-Native",
	plugins: {
		Keyboard: {
			resizeOnFullScreen: true
		}
	}
} satisfies CapacitorConfig;
