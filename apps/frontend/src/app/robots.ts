import type { MetadataRoute } from "next";

import { siteOrigin } from "~/const";

export default function robots(): MetadataRoute.Robots {
	return {
		host: siteOrigin,
		sitemap: `${siteOrigin}/sitemap.xml`,
		rules: {
			userAgent: "*",
			allow: "/"
		},
	};
}
