import { siteOrigin } from "~/const";

export async function loader() {
	const value = `User-Agent: *
Allow: /

Host: ${siteOrigin}
Sitemap: ${siteOrigin}/sitemap.xml`;

	return new Response(value, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
		},
	});
}
