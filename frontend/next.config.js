/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		appDir: true
	},
	modularizeImports: {
		"@heroicons/react/24/outline": {
			transform: "@heroicons/react/24/outline/{{member}}"
		},
		"@heroicons/react/24/solid": {
			transform: "@heroicons/react/24/solid/{{member}}"
		}
	}
};

module.exports = nextConfig;
