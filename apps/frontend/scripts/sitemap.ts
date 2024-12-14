/*
This script generates a sitemap.xml file, which is used by search engines to discover and index pages on a website.
You can run this script by executing the following command in your terminal:

```
pnpm build # important to build the app first.
bun ./scripts/sitemap.ts
```
*/

import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import type { SitemapItemLoose } from "sitemap";
import { EnumChangefreq, SitemapStream, streamToPromise, } from "sitemap";
import xmlFormat from "xml-formatter";

import { siteOrigin } from "~/const";
import { supportedLanguages } from "~/i18n";
import { tryJsonParse } from "~/utilities";

async function getPages() {
	const buildOutput = path.resolve(import.meta.url.replace("file://", ""), "../../.next");

	const [pathRouteManifest, prerenderManifest, routeManifest] = await Promise.all([
		await fs.readFile(path.join(buildOutput, "app-path-routes-manifest.json"), "utf-8").catch(() => "{}").then((value) => tryJsonParse<Record<string, string>>(value, {})),
		await fs.readFile(path.join(buildOutput, "prerender-manifest.json"), "utf-8").catch(() => "{}").then((value) => tryJsonParse<{ routes: Record<string, unknown> }>(value, { routes: {} })),
		await fs.readFile(path.join(buildOutput, "routes-manifest.json"), "utf-8").catch(() => "{}").then((value) => tryJsonParse<{ redirects: Array<{ source: string; destination: string }>; staticRoutes: Array<{ page: string }> }>(value, { redirects: [], staticRoutes: [] })),
	]);

	return [...new Set([
		...Object.values(pathRouteManifest),
		...Object.keys(prerenderManifest.routes),
		// ...routeManifest.redirects.map(({ source }) => source),
		...routeManifest.redirects.map(({ destination }) => destination),
		...routeManifest.staticRoutes.map(({ page }) => page),
	])]
		.map((pathname) => new URL(pathname, siteOrigin))
		.filter((url) => {
			// Exclude pages that are not on the same origin.
			if (url.origin !== siteOrigin) return false;

			// Exclude pages that start with /_ or contain dynamic segments.
			if (url.pathname.startsWith("/_") || url.pathname.match(/\[.+\]/g)) return false;

			if ([
				"/:path+",
				"/debugger",
				"/empty",
				"/reports",
				"/sso/canny",
				"/stats"
			].includes(url.pathname)) return false;

			return true;
		});
}

async function generate() {
	const pages = await getPages();
	const now = new Date();

	const stream = new SitemapStream({ hostname: siteOrigin });
	const xml = (await streamToPromise(Readable.from(pages.map<SitemapItemLoose>(({ pathname, href }) => {
		const excludeAlternates = !!path.extname(pathname);

		return {
			url: href,
			changefreq: EnumChangefreq.WEEKLY,
			lastmod: now.toISOString(),
			priority: {
				"/": 1,
				"/home": 1,
				"/about": 0.8,
				"/events": 0.8,
			}[pathname] ?? 0.5,
			links: excludeAlternates
				? []
				: supportedLanguages.map((language) => {
					const url = new URL(pathname, siteOrigin);
					url.searchParams.set("language", language);

					return {
						url: url.href,
						lang: language,
						hreflang: language
					};
				})
		};
	}).sort((a, b) => {
		// Sort by priority, then by URL.
		if (a.priority === b.priority)
			return a.url.localeCompare(b.url);

		return (b.priority || 0) - (a.priority || 0);
	})).pipe(stream))).toString();

	const pathname = path.resolve(import.meta.dirname, "../public/sitemap.xml");
	await fs.writeFile(pathname, xmlFormat(xml, {
		whiteSpaceAtEndOfSelfclosingTag: true,
		collapseContent: true,
		indentation: "  ",
	}));
}

await generate();
