import { urls } from "~/urls";

import { finishStepNumber, finishSteps } from "./steps";
import type { FinishStep } from "./steps";

function adjacentFinishStep(step: FinishStep, offset: -1 | 1) {
	return finishSteps[finishStepNumber(step) - 1 + offset] ?? null;
}

export function nextFinishStepUrl(step: FinishStep) {
	const next = adjacentFinishStep(step, 1);
	return next ? urls.finish(finishStepNumber(next)) : urls.discover("dates");
}

export function previousFinishStepUrl(step: FinishStep) {
	const previous = adjacentFinishStep(step, -1);
	return previous ? urls.finish(finishStepNumber(previous)) : urls.finish(1);
}
