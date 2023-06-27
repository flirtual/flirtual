/** @type {import("next").NextConfig */
module.exports = {
	reactStrictMode: true,
	images: {
		domains: ["media.flirtu.al"],
		loader: "custom",
		loaderFile: "./src/image-loader.ts"
	},
	modularizeImports: {
		"@heroicons/react/24/outline": {
			transform: "@heroicons/react/24/outline/{{member}}",
			preventFullImport: true
		},
		"@heroicons/react/24/solid": {
			transform: "@heroicons/react/24/solid/{{member}}",
			preventFullImport: true
		}
	},
	async rewrites() {
		return [];
	},
	async redirects() {
		return [
			{
				source: "/discord",
				destination: "https://discord.gg/flirtual",
				permanent: false
			},
			{
				source: "/invite",
				destination: "https://homie.zone/invite",
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
				source: "/terms-20230605",
				destination: "/terms",
				permanent: true
			},
			{
				source: "/privacy-20230605",
				destination: "/privacy",
				permanent: true
			}
		];
	}
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
	module.exports,
	{
		// For all available options, see:
		// https://github.com/getsentry/sentry-webpack-plugin#options
		silent: true
	},
	{
		// For all available options, see:
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
		widenClientFileUpload: true,
		transpileClientSDK: true,
		hideSourceMaps: false,
		disableLogger: false,
		tunnelRoute: "/api/sentry"
	}
);
