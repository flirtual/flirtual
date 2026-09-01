import type { AgeRangeDeclaration, AgeRangeSource } from "@capawesome/capacitor-age-signals";
import { AgeRangeStatus, AgeSignals } from "@capawesome/capacitor-age-signals";

import type { DevicePlatform } from "~/hooks/use-device";
import { device } from "~/hooks/use-device";
import { log as _log } from "~/log";

const log = _log.extend("age-range");

export type AgeGroup = "adult" | "child" | "teen" | "unknown" | "unresolved";

export interface AgeRange {
	group: AgeGroup;
	platform?: DevicePlatform;
	declaration?: AgeRangeDeclaration | AgeRangeSource;
	ageLower?: number;
	ageUpper?: number;
}

export type AgeRangeReport = Omit<AgeRange, "group">;

const ageGates = [13, 16, 18];

const unknown: AgeRange = { group: "unknown" };

type Bounds = Pick<AgeRange, "ageLower" | "ageUpper">;

function boundsGroup({ ageLower, ageUpper }: Bounds): AgeGroup | undefined {
	if (ageUpper !== undefined && ageUpper < 13) return "child";
	if (ageUpper !== undefined && ageUpper < 18) return "teen";
	if (ageLower !== undefined && ageLower >= 18) return "adult";
}

async function ageAssuranceRequired() {
	try {
		const { ageAssuranceRequired } = await AgeSignals.getRegulatoryRequirements();
		return ageAssuranceRequired;
	}
	catch {
		return false;
	}
}

// Current method for plugin 0.5.0.
async function requestAgeRange(): Promise<AgeRange> {
	const { status, ageRange } = await AgeSignals.requestAgeRange({ ageGates });

	const {
		ageRangeDeclaration: declaration,
		ageRangeSource,
		lowerBound: ageLower,
		upperBound: ageUpper
	} = ageRange ?? {};

	const report = {
		platform: device.platform,
		declaration: ageRangeSource ?? declaration,
		ageLower,
		ageUpper
	};

	if (status === AgeRangeStatus.Shared)
		return { group: boundsGroup({ ageLower, ageUpper }) ?? "adult", ...report };

	if (status === AgeRangeStatus.VerificationRequired)
		return { group: "unresolved", ...report };

	if (device.apple && (await ageAssuranceRequired()))
		return { group: "unresolved", ...report };

	return { group: "unknown", ...report };
}

interface CheckAgeSignals {
	checkAgeSignals: (options: { ageGates: Array<number> }) => Promise<{
		ageLower?: number;
		ageRangeDeclaration?: AgeRangeDeclaration;
		ageUpper?: number;
		userStatus?: string;
	}>;
}

// Backwards compatibility for plugin 0.4.1.
async function checkAgeSignals(): Promise<AgeRange> {
	const {
		userStatus,
		ageRangeDeclaration: declaration,
		ageLower,
		ageUpper
	} = await (AgeSignals as unknown as CheckAgeSignals).checkAgeSignals({ ageGates });

	const group = boundsGroup({ ageLower, ageUpper })
		?? (userStatus === "VERIFIED" ? "adult" : "unknown");

	return {
		group,
		platform: device.platform,
		declaration,
		ageLower,
		ageUpper
	};
}

export async function getAgeRange(): Promise<AgeRange> {
	if (!device.native) return unknown;

	try {
		const range = await requestAgeRange();

		log("requestAgeRange: %o", range);
		return range;
	}
	catch (reason) {
		log("requestAgeRange unavailable: %o", reason);
	}

	try {
		const range = await checkAgeSignals();

		log("checkAgeSignals: %o", range);
		return range;
	}
	catch (reason) {
		log("checkAgeSignals unavailable: %o", reason);
		return unknown;
	}
}
