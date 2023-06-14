import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "al.flirtu.mobile",
	appName: "Flirtual",
	webDir: "public",
	server: {
		androidScheme: "https",
		url: "https://flirtu.al"
	}
};

export default config;
