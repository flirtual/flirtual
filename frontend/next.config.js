/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		appDir: true
	},
	images: {
		domains: ["media.flirtu.al"],
		loader: "custom",
		loaderFile: "./src/imageLoader.ts"
	},
	modularizeImports: {
		"@heroicons/react/24/outline": {
			transform: "@heroicons/react/24/outline/{{member}}"
		},
		"@heroicons/react/24/solid": {
			transform: "@heroicons/react/24/solid/{{member}}"
		}
	},
	async rewrites() {
		return [
			{
				source: "/homies",
				destination: "/browse?kind=friend"
			}
		];
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
				destination: "https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539",
				permanent: false
			},
			{
				source: "/club",
				destination: "https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4",
				permanent: false
			}
		];
	}
};

module.exports = nextConfig;
