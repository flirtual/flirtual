import type { User } from "~/api/user";
import { urls } from "~/urls";

import { finishStepCount, finishStepNumber, finishSteps } from "./steps";
import type { FinishStep } from "./steps";

function adjacentFinishStep(step: FinishStep, offset: -1 | 1) {
	return finishSteps[finishStepNumber(step) - 1 + offset] ?? null;
}

export function isLastFinishStep(step: FinishStep) {
	return finishStepNumber(step) === finishStepCount;
}

export function nextFinishStepUrl(step: FinishStep, user: User) {
	const next = adjacentFinishStep(step, 1);
	if (next) return urls.finish(finishStepNumber(next));

	return user.emailConfirmedAt ? urls.discover("dates") : urls.confirmEmail();
}

export function previousFinishStepUrl(step: FinishStep) {
	const previous = adjacentFinishStep(step, -1);
	return previous ? urls.finish(finishStepNumber(previous)) : urls.finish(1);
}
