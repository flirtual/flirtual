import { useCallback, useContext, useEffect, useMemo } from "react";
import {
	ShepherdOptionsWithType,
	ShepherdTourContext,
	Tour
} from "react-shepherd";

import "~/components/shepherd/style.scss";

import { useScrollLock } from "./use-scroll-lock";
import { usePreferences } from "./use-preferences";

export function useShepherd() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return useContext(ShepherdTourContext)!;
}

export function useTour(
	name: string,
	getSteps: (shepherd: Tour) => Array<ShepherdOptionsWithType>
) {
	const shepherd = useShepherd();
	const [, setScrollLocked] = useScrollLock();

	const [completed, setCompleted] = usePreferences(
		`tour-${name}-completed`,
		false
	);

	const steps = useMemo(
		() =>
			getSteps(shepherd).map((step) => ({
				...step,
				buttons: step.buttons ?? [
					{
						text: "Back",
						action: shepherd.back
					},
					{
						classes: "primary",
						text: "Continue",
						action: shepherd.next
					}
				],
				id: `${name}-${step.id}`
			})),
		[name, shepherd, getSteps]
	);

	const start = useCallback(
		(onlyIfUncompleted: boolean = true) => {
			const started = shepherd.steps.some((step) =>
				steps.find(({ id }) => id === step.id)
			);
			if (started || completed === null || (onlyIfUncompleted && completed))
				return;

			setScrollLocked(true);

			shepherd.addSteps(steps);
			queueMicrotask(() => shepherd.start());
		},
		[completed, steps, shepherd, setScrollLocked]
	);

	const stop = useCallback(
		(completed: boolean = true) => {
			if (completed) setCompleted(true);
			shepherd.cancel();
		},
		[shepherd, setCompleted]
	);

	useEffect(() => {
		function onComplete() {
			setCompleted(true);
			setScrollLocked(false);
		}

		shepherd.on("complete", onComplete);
		shepherd.on("cancel", onComplete);

		return () => {
			shepherd.off("complete", onComplete);
			shepherd.off("cancel", onComplete);

			for (const { id } of steps) shepherd.removeStep(id);
			shepherd.cancel();
		};
	}, [shepherd, steps, setCompleted, setScrollLocked]);

	return useMemo(
		() => ({
			completed,
			start,
			stop,
			setCompleted
		}),
		[completed, start, stop, setCompleted]
	);
}
