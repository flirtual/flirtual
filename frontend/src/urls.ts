import { siteOrigin } from "./const";

export function toAbsoluteUrl(href: string) {
	return new URL(href, siteOrigin);
}

export function isInternalHref(href: string) {
	return toAbsoluteUrl(href).origin === siteOrigin;
}
