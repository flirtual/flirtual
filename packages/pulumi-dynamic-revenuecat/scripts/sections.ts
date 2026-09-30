import { lexer, marked } from "marked";

interface Overview {
  tags?: Array<{ name: string; description?: string }>;
}

const prefix = "/docs/api-v2/";

// RevenueCat's v2 overview spec links each section's page from its "Endpoint Reference" chapter;
// each page's spec is published beside the overview as openapi-v2-<section>.yaml.
export function sectionsOf(overview: Overview) {
  const reference = overview.tags?.find(({ name }) => name === "Endpoint Reference")?.description;
  if (reference === undefined) throw new Error('The overview has no "Endpoint Reference" chapter.');

  const links: Array<string> = [];
  marked.walkTokens(lexer(reference), (token) => {
    if (token.type === "link") links.push(token.href);
  });

  const sections = links
    .filter((href) => href.startsWith(prefix))
    .map((href) => href.slice(prefix.length).replaceAll("/", "-"));

  if (sections.length === 0)
    throw new Error('The "Endpoint Reference" chapter links no API pages.');
  return sections;
}

export const overviewUrl = "https://www.revenuecat.com/docs/redocusaurus/openapi-v2.yaml";

export const specUrl = (section: string) =>
  `https://www.revenuecat.com/docs/redocusaurus/openapi-v2-${section}.yaml`;
