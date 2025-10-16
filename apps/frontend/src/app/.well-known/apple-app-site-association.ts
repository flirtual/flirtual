export const loader = () => JSON.parse(import.meta.env.VITE_APPLE_APP_SITE_ASSOCIATION_JSON || "{}");
