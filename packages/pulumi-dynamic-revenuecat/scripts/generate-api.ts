import { generateFile, mapOpenApiEndpoints } from "typed-openapi";
import { parse } from "yaml";

import { mkdir, rm, writeFile } from "node:fs/promises";

import { overviewUrl, sectionsOf, specUrl } from "./sections.ts";

const output = new URL("../src/generated/", import.meta.url);

const response = await fetch(overviewUrl);
if (!response.ok) throw new Error(`${overviewUrl} answered ${response.status}.`);

const sections = sectionsOf(parse(await response.text()));

// Starting clean drops sections RevenueCat has since removed.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function generate(section: string) {
	const url = specUrl(section);
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url} answered ${response.status}.`);

	const document = parse(await response.text());
	await writeFile(
		new URL(`${section}.ts`, output),
		generateFile({ ...mapOpenApiEndpoints(document), includeClient: false }),
	);
}

await Promise.all(sections.map(generate));

const identifier = (section: string) =>
	section.replace(/-(\w)/gu, (_, letter: string) => letter.toUpperCase()) + "Endpoints";

await writeFile(
	new URL("index.ts", output),
	[
		`// Generated from ${overviewUrl} by \`pnpm generate:api\`.`,
		"",
		...sections.map(
			(section) =>
				`import type { EndpointByMethod as ${identifier(section)} } from "./${section}.ts";`,
		),
		"",
		`export type EndpointByMethod = ${sections.map(identifier).join(" & ")};`,
		"",
	].join("\n"),
);
