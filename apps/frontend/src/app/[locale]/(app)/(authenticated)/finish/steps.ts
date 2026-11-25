// Not "~/": routes.ts loads this where the alias doesn't resolve.
import { connectionProvider, personality } from "../../../../../features";

// Disabled steps drop out and the rest renumber; their directories keep their numbers.
const allSteps = ["bio", "details", "interests", "personality", "connections"] as const;

export type FinishStep = typeof allSteps[number];

const enabled: Partial<Record<FinishStep, boolean>> = {
	personality,
	connections: ["discord", "vrchat", "meta"].some(connectionProvider)
};

export const finishSteps: ReadonlyArray<FinishStep> = allSteps
	.filter((step) => enabled[step] ?? true);

export const finishStepCount = finishSteps.length;

export const finishStepDirectory: Record<FinishStep, string> = {
	bio: "1",
	details: "2",
	interests: "3",
	personality: "4",
	connections: "5"
};

// 1-based, matching the /finish/:n URLs.
export function finishStepNumber(step: FinishStep) {
	const index = finishSteps.indexOf(step);
	if (index === -1) throw new Error(`Disabled finish step: ${step}`);

	return index + 1;
}
