import invariant from "tiny-invariant";

import defaults from "./brand.defaults.json";

export type ColorPair = readonly [string, string];

function colorPair(value: string | undefined, fallback: Array<string>): ColorPair {
	const parts = (value || "").split(",").map((part) => part.trim()).filter(Boolean);
	return parts.length === 2
		? [parts[0]!, parts[1]!]
		: [fallback[0]!, fallback[1]!];
}

export const name = import.meta.env.VITE_BRAND_NAME as string || defaults.name;

export const dateColors = colorPair(import.meta.env.VITE_BRAND_DATE_COLORS as string, defaults.dateColors);
export const dateDarkColors = colorPair(import.meta.env.VITE_BRAND_DATE_DARK_COLORS as string, defaults.dateDarkColors);
export const homieColors = colorPair(import.meta.env.VITE_BRAND_HOMIE_COLORS as string, defaults.homieColors);

export const accentColor = dateColors[1];
export const backgroundColor = import.meta.env.VITE_BRAND_BACKGROUND_COLOR as string || defaults.backgroundColor;

// Remote assets (logos, icons) are fetched from here at build time.
export const assetDomain = import.meta.env.VITE_BRAND_ASSET_DOMAIN as string;
invariant(assetDomain, "VITE_BRAND_ASSET_DOMAIN is required");

export const logoPrefix = import.meta.env.VITE_BRAND_LOGO_PREFIX as string || defaults.logoPrefix;

// AGPL: every deployment must offer its source.
export const repositoryUrl = import.meta.env.VITE_BRAND_REPOSITORY_URL as string;
invariant(repositoryUrl, "VITE_BRAND_REPOSITORY_URL is required");

// Optional: null hides whatever links to it.
const optional = (value: unknown) => (value as string | undefined) || null;

export const supportOrigin = optional(import.meta.env.VITE_BRAND_SUPPORT_ORIGIN);
export const statusUrl = optional(import.meta.env.VITE_BRAND_STATUS_URL);
export const weblateUrl = optional(import.meta.env.VITE_BRAND_WEBLATE_URL);

export const pressEmail = optional(import.meta.env.VITE_BRAND_EMAIL_PRESS);
export const privacyEmail = optional(import.meta.env.VITE_BRAND_EMAIL_PRIVACY);

export const socials = {
	bluesky: optional(import.meta.env.VITE_BRAND_SOCIAL_BLUESKY),
	discord: optional(import.meta.env.VITE_BRAND_SOCIAL_DISCORD),
	instagram: optional(import.meta.env.VITE_BRAND_SOCIAL_INSTAGRAM),
	vrchat: optional(import.meta.env.VITE_BRAND_SOCIAL_VRCHAT),
	x: optional(import.meta.env.VITE_BRAND_SOCIAL_X)
};

const discordEmbedServer = optional(import.meta.env.VITE_BRAND_DISCORD_EMBED_SERVER);
const discordEmbedChannel = optional(import.meta.env.VITE_BRAND_DISCORD_EMBED_CHANNEL);

export const discordEmbed = discordEmbedServer && discordEmbedChannel
	? { server: discordEmbedServer, channel: discordEmbedChannel }
	: null;

export const manifestDescription = optional(import.meta.env.VITE_BRAND_MANIFEST_DESCRIPTION);
export const iarcRatingId = optional(import.meta.env.VITE_BRAND_IARC_RATING_ID);

export const stores = {
	microsoft: optional(import.meta.env.VITE_BRAND_STORE_MICROSOFT),
	sideQuest: optional(import.meta.env.VITE_BRAND_STORE_SIDEQUEST)
};

// Must match capacitor.config.ts and the visionOS WebViewModel.swift.
export const nativeUserAgent = `${name}-Native`;
export const visionUserAgent = `${name}-Vision`;
