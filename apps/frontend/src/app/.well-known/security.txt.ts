import { toAbsoluteUrl, urls } from "~/urls";

export function loader() {
	const now = new Date();

	return [
		["Contact", urls.resources.contactDirect],
		["Contact", urls.resources.vulnerabilityReport],
		["Expires", new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString()],
		["Canonical", toAbsoluteUrl(".well-known/security.txt")],
		["Policy", toAbsoluteUrl(`${urls.resources.communityGuidelines}#respect-flirtual`)],
	]
		.map(([key, value]) => `${key}: ${value}`)
		.join("\n");
}
