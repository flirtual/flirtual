import { api } from "./common";
import type { DatedModel, UuidModel } from "./common";

export const ageVerificationStatuses = [
	"pending",
	"in_progress",
	"complete",
	"fail",
	"error",
	"cancelled",
	"expired",
	"unknown"
] as const;

export type AgeVerificationStatus = (typeof ageVerificationStatuses)[number];

export type AgeVerificationProvider = "android" | "apple" | "yoti";

export type AgeVerificationRecord = {
	provider: AgeVerificationProvider;
	status: AgeVerificationStatus;
	method?: string;
	threshold?: number;
	expiresAt?: string;
	completedAt?: string;
}
& Partial<DatedModel> & UuidModel;

export interface AgeVerificationState {
	required: boolean;
	threshold: number;
	verification: AgeVerificationRecord | null;
}

export type AgeVerificationMethods = "alternative" | "recommended";

export interface AgeVerificationSession {
	url: string;
	verification: AgeVerificationRecord;
}

export const AgeVerification = {
	api: api.url("age-verification"),
	get() {
		return this.api.get().json<AgeVerificationState>();
	},
	create(locale?: string, methods?: AgeVerificationMethods) {
		return this.api.json({ locale, methods }).post().json<AgeVerificationSession>();
	}
};
