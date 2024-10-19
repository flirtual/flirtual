import createNextIntlPlugin from "next-intl/plugin";

import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
let config = {
	reactStrictMode: true,
	images: {
		unoptimized: true
	},
	eslint: {
		ignoreDuringBuilds: true
	},
	modularizeImports: {
		"@heroicons/react/24/outline": {
			transform: "@heroicons/react/24/outline/{{ member }}",
			preventFullImport: true
		},
		"@heroicons/react/24/solid": {
			transform: "@heroicons/react/24/solid/{{ member }}",
			preventFullImport: true
		},
		"lucide-react": {
			transform: "lucide-react/dist/esm/icons/{{ kebabCase member }}",
			preventFullImport: true
		}
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on"
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload"
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff"
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin"
					},
					{
						key: "Permissions-Policy",
						value: Object.entries({
							autoplay: ["self"],
							fullscreen: ["self"],
							"idle-detection": ["self"],
							"picture-in-picture": ["self"],
							"publickey-credentials-create": ["self"],
							"publickey-credentials-get": ["self"],
							"web-share": ["self"],
							camera: [],
							microphone: [],
							geolocation: [],
							"browsing-topics": []
						})
							.map(([key, value]) => `${key}=(${value.join(" ")})`)
							.join(", ")
					}
				]
			}
		];
	},
	async rewrites() {
		return [];
	},
	async redirects() {
		return [
			{
				source: "/register",
				destination: "/onboarding/0",
				permanent: true
			},
			{
				source: "/sign-up",
				destination: "/onboarding/0",
				permanent: true
			},
			{
				source: "/signup",
				destination: "/onboarding/0",
				permanent: true
			},
			{
				source: "/discord",
				destination: "https://discord.gg/flirtual",
				permanent: false
			},
			{
				source: "/speeddate",
				destination:
					"https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539",
				permanent: false
			},
			{
				source: "/club",
				destination:
					"https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4",
				permanent: false
			},
			{
				source: "/homies",
				destination: "/browse?kind=friend",
				permanent: true
			},
			{
				source: "/premium",
				destination: "/subscription",
				permanent: true
			},
			{
				source: "/settings/apps",
				destination: "/download",
				permanent: true
			},
			{
				source: "/ios",
				destination:
					"https://apps.apple.com/app/flirtual-vr-dating-app/id6450485324",
				permanent: true
			},
			{
				source: "/settings/account",
				destination: "/settings",
				permanent: true
			},
			{
				source: "/settings/deactivateaccount",
				destination: "/settings/deactivate",
				permanent: true
			},
			{
				source: "/settings/deleteaccount",
				destination: "/settings/delete",
				permanent: true
			},
			{
				source: "/settings/change-email",
				destination: "/settings/email",
				permanent: true
			},
			{
				source: "/settings/change-password",
				destination: "/settings/password",
				permanent: true
			},
			{
				source: "/settings/tags",
				destination: "/settings/info",
				permanent: true
			},
			{
				source: "/mentalhealth",
				destination: "/guides/mental-health",
				permanent: true
			},
			{
				source: "/terms-20230605",
				destination: "/terms",
				permanent: true
			},
			{
				source: "/privacy-20230605",
				destination: "/privacy",
				permanent: true
			},
			{
				source: "/.well-known/change-password",
				destination: "/settings/password",
				permanent: false
			}
		];
	},
	experimental: {
		instrumentationHooks: true,
		taint: true
	}
};

const withNextIntl = createNextIntlPlugin();

config = withNextIntl(config);

export default withSentryConfig(config, {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options
	org: "flirtual",
	project: "flirtual",
	silent: true,
	widenClientFileUpload: true,
	transpileClientSDK: true,
	hideSourceMaps: true,
	disableLogger: true
	// tunnelRoute: "/monitoring"
});
