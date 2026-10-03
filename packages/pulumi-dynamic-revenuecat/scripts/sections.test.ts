import { describe, expect, it } from "vitest";

import { sectionsOf, specUrl } from "./sections.ts";

const reference = `Each resource below has its own page.

- [App](/docs/api-v2/app) — 7 endpoints
- [Customer Resources](/docs/api-v2/customer/resources) — 5 endpoints
- [Paywall Fonts & Media](/docs/api-v2/paywall/assets) — 4 endpoints
- See also [the webhooks guide](/docs/integrations/webhooks).
`;

const overview = {
	tags: [
		{
			name: "Overview (v2)",
			description: "Read the [SDK docs](/docs/api-v2/not-a-list-entry) first.",
		},
		{ name: "Endpoint Reference", description: reference },
	],
};

describe("sectionsOf", () => {
	it("names each API page the Endpoint Reference chapter links, nested pages joined by a dash", () => {
		expect(sectionsOf(overview)).toEqual(["app", "customer-resources", "paywall-assets"]);
	});

	it("fails when the overview has no Endpoint Reference chapter", () => {
		expect(() => sectionsOf({ tags: [overview.tags[0]!] })).toThrow(
			'The overview has no "Endpoint Reference" chapter.',
		);
	});

	it("fails rather than generate nothing when the chapter links no API pages", () => {
		expect(() =>
			sectionsOf({ tags: [{ name: "Endpoint Reference", description: "Coming soon." }] }),
		).toThrow('The "Endpoint Reference" chapter links no API pages.');
	});
});

it("points each section at its spec file", () => {
	expect(specUrl("paywall-assets")).toBe(
		"https://www.revenuecat.com/docs/redocusaurus/openapi-v2-paywall-assets.yaml",
	);
});
