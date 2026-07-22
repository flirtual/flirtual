export const loader = () => JSON.parse(import.meta.env.VITE_WEBAUTHN_JSON || "{}");
