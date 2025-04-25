// import { inspect } from "node:util";

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import {
	sentryEnabled,
	sentryOrganization,
	sentryProject,
	siteOrigin
} from "~/const";

// eslint-disable-next-line import/no-mutable-exports
let nextConfig: NextConfig = {
	experimental: {
		taint: true,
		staleTimes: {
			dynamic: 30
		},
		ppr: true,
		reactCompiler: true,
	},
	turbopack: {

	},
	sassOptions: {
		// https://github.com/vercel/next.js/discussions/67931
		silenceDeprecations: ["legacy-js-api"]
	},
	allowedDevOrigins: [new URL(siteOrigin).hostname],
	logging: {
		fetches: {
			fullUrl: false,
			hmrRefreshes: true
		}
	},
	images: {
		unoptimized: true
	},
	eslint: {
		ignoreDuringBuilds: true
	},
	typescript: {
		ignoreBuildErrors: true
	},
	productionBrowserSourceMaps: true,
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
	async redirects() {
		return [
			{
				source: "/register",
				destination: "/sign-up",
				permanent: false
			},
			{
				source: "/signup",
				destination: "/sign-up",
				permanent: false
			},
			{
				source: "/onboarding/0",
				destination: "/sign-up",
				permanent: false
			},
			{
				source: "/homies",
				destination: "/discover/friends",
				permanent: false
			},
			{
				source: "/browse",
				has: [{ type: "query", key: "kind", value: "friend" }],
				destination: "/discover/friends",
				permanent: false
			},
			{
				source: "/browse",
				destination: "/discover",
				permanent: false
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
				source: "/premium",
				destination: "/subscription",
				permanent: false
			},
			{
				source: "/settings/apps",
				destination: "/download",
				permanent: false
			},
			{
				source: "/ios",
				destination:
					"https://apps.apple.com/app/flirtual-vr-dating-app/id6450485324",
				permanent: false
			},
			{
				source: "/settings/account",
				destination: "/settings",
				permanent: false
			},
			{
				source: "/settings/deactivateaccount",
				destination: "/settings/deactivate",
				permanent: false
			},
			{
				source: "/settings/deleteaccount",
				destination: "/settings/delete",
				permanent: false
			},
			{
				source: "/settings/change-email",
				destination: "/settings/email",
				permanent: false
			},
			{
				source: "/settings/change-password",
				destination: "/settings/password",
				permanent: false
			},
			{
				source: "/settings/tags",
				destination: "/settings/info",
				permanent: false
			},
			{
				source: "/mentalhealth",
				destination: "/guides/mental-health",
				permanent: false
			},
			{
				source: "/terms-20230605",
				destination: "/terms",
				permanent: false
			},
			{
				source: "/privacy-20230605",
				destination: "/privacy",
				permanent: false
			},
			{
				source: "/.well-known/change-password",
				destination: "/settings/password",
				permanent: false
			},
			{
				source: "/security.txt",
				destination: "/.well-known/security.txt",
				permanent: false
			}
		];
	}
};

const withNextIntl = createNextIntlPlugin();
nextConfig = withNextIntl(nextConfig);

if (sentryEnabled)
	nextConfig = withSentryConfig(nextConfig, {
		org: sentryOrganization,
		project: sentryProject,
		widenClientFileUpload: true,
		reactComponentAnnotation: {
			enabled: true
		},
		disableLogger: true,
		bundleSizeOptimizations: {
			excludeDebugStatements: true,
			excludeReplayShadowDom: true,
			excludeReplayIframe: true
		}
	});

// console.log(inspect(nextConfig, { depth: null, colors: true }));
export default nextConfig;
