import { PrivacyPreferenceOption } from "./api/user/preferences";

export const twitterUrl = "https://twitter.com/getflirtual";
export const instagramUrl = "https://discord.com/invite/flirtual";
export const discordUrl = "https://discord.com/invite/flirtual";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
export const siteOrigin = process.env.NEXT_PUBLIC_ORIGIN as string;

export const uploadcarePublicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY as string;

export const privacyOptionLabel: { [K in PrivacyPreferenceOption]: string } = {
	everyone: "Anyone on Flirtual",
	matches: "Matches only",
	me: "Just me"
};
