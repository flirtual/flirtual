import type { AgeRangeDeclaration } from "@capawesome/capacitor-age-signals";
import { AgeSignals, UserStatus } from "@capawesome/capacitor-age-signals";

import type { DevicePlatform } from "~/hooks/use-device";
import { device } from "~/hooks/use-device";
import { log as _log } from "~/log";

const log = _log.extend("age-range");

export type AgeGroup = "adult" | "child" | "teen" | "unknown" | "unresolved";

export interface AgeRange {
	group: AgeGroup;
	platform?: DevicePlatform;
	declaration?: AgeRangeDeclaration;
	ageLower?: number;
	ageUpper?: number;
}

export type AgeRangeReport = Omit<AgeRange, "group">;

const ageGates = [13, 16, 18];

const unknown: AgeRange = { group: "unknown" };

type AgeStatus = { userStatus?: UserStatus } & Pick<AgeRange, "ageLower" | "ageUpper">;

function toGroup({ userStatus, ageLower, ageUpper }: AgeStatus): AgeGroup {
	if (ageUpper !== undefined && ageUpper < 13) return "child";
	if (ageUpper !== undefined && ageUpper < 18) return "teen";
	if (ageLower !== undefined && ageLower >= 18) return "adult";

	// Verified adults return no bounds.
	if (userStatus === UserStatus.Verified) return "adult";
	if (userStatus === UserStatus.Unknown) return "unresolved";

	return "unknown";
}

// iOS 26.2+
async function eligibleForAgeFeatures() {
	try {
		const { isEligible } = await AgeSignals.checkEligibility();
		return isEligible;
	}
	catch {
		return false;
	}
}

export async function getAgeRange(): Promise<AgeRange> {
	if (!device.native) return unknown;

	try {
		const {
			userStatus,
			ageRangeDeclaration: declaration,
			ageLower,
			ageUpper
		} = await AgeSignals.checkAgeSignals({ ageGates });

		let group = toGroup({ userStatus, ageLower, ageUpper });

		// Google only reports UNKNOWN in a jurisdiction that requires age
		// assurance. Apple reports it for declines anywhere, so we check
		// eligibility.
		if (group === "unresolved" && device.apple && !(await eligibleForAgeFeatures()))
			group = "unknown";

		const range = { group, platform: device.platform, declaration, ageLower, ageUpper };

		log(range);
		return range;
	}
	catch (reason) {
		log("unavailable: %o", reason);
		return unknown;
	}
}
