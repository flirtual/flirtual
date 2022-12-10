import { PrivacyPreferenceOption } from "./api/user/preferences";

export const uploadcarePublicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY as string;

export const privacyOptionLabel: { [K in PrivacyPreferenceOption]: string } = {
	everyone: "Anyone on Flirtual",
	matches: "Matches only",
	me: "Just me"
};
