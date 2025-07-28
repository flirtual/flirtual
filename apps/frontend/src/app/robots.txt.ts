import { siteOrigin } from "~/const";

const data = `
User-Agent: *
Allow: /

Host: ${siteOrigin}
Sitemap: ${siteOrigin}/sitemap.xml
`.trim();

export const loader = () => data;
