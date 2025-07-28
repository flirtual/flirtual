import { absoluteUrl, urls } from "~/urls";

export function loader() {
	const now = new Date();

	return [
		["Canonical", absoluteUrl(".well-known/security.txt")],
		["Expires", new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString()],
		"",
		["Contact", urls.resources.contactDirect],
		["Contact", urls.resources.vulnerabilityReport],
		"",
		["Policy", absoluteUrl(urls.resources.communityGuidelines)],
	]
		.map((line) => {
			if (!line) return "";

			if (Array.isArray(line)) {
				const [key, value] = line;
				return `${key}: ${value}`;
			}

			return `# ${line}`;
		})
		.join("\n");
}
