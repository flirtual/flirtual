// see: https://developers.cloudflare.com/workers/static-assets/headers/

export function loader() {
	return [
		{
			url: "/*",
			headers: [
				{
					key: "x-dns-prefetch-control",
					value: "on"
				},
				{
					key: "strict-transport-security",
					value: "max-age=63072000; includeSubDomains; preload"
				},
				{
					key: "x-content-type-options",
					value: "nosniff"
				},
				{
					key: "referrer-policy",
					value: "strict-origin-when-cross-origin"
				},
				{
					key: "permissions-policy",
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
			],
		},
		{
			url: "/static/*",
			headers: [
				{
					key: "cache-control",
					value: "public, max-age=31536000, immutable"
				},
				{
					key: "x-robots-tag",
					value: "noindex, nofollow, nosnippet"
				}
			]
		}
	]
		.map(({ url, headers }) => `${url}\n${headers.map(({ key, value }) => `  ${key}: ${value}`).join("\n")}`)
		.join("\n\n");
}
