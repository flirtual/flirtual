import { useCallback, useContext, useEffect, useMemo } from "react";
import {
	type ShepherdOptionsWithType,
	ShepherdTourContext,
	type Tour
} from "react-shepherd";

import "~/components/shepherd/style.scss";

import { useScrollLock } from "./use-scroll-lock";
import { usePreferences } from "./use-preferences";
import { useScreenBreakpoint } from "./use-screen-breakpoint";

export function useShepherd() {
	return useContext(ShepherdTourContext)!;
}

export function useTour(
	enabled: boolean = true,
	name: string,
	getSteps: (shepherd: Tour) => Array<ShepherdOptionsWithType>,
	{
		defaultStart = false
	}: {
		defaultStart?: boolean;
	}
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
						classes: "primary shadow-brand-1",
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
			shepherd.addSteps(steps);
			const started = false;
			if (started || completed === null || (onlyIfUncompleted && completed))
				return;

			setScrollLocked(true);

			shepherd.start();
		},
		[completed, steps, shepherd, setScrollLocked]
	);

	const stop = useCallback(
		(completed: boolean = true) => {
			if (completed) setCompleted(true);
			shepherd.cancel();
			shepherd.hide();
		},
		[shepherd, setCompleted]
	);

	useEffect(() => {
		function onComplete() {
			if (enabled) setCompleted(true);
			setScrollLocked(false);
		}

		shepherd.on("complete", onComplete);
		shepherd.on("cancel", onComplete);
		if (defaultStart) start();

		return () => {
			shepherd.off("complete", onComplete);
			shepherd.off("cancel", onComplete);

			for (const { id } of steps) shepherd.removeStep(id);
			shepherd.cancel();
		};
	}, [shepherd, steps, setCompleted, setScrollLocked, defaultStart, start]);

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

export function useDefaultTour(enabled: boolean = true) {
	const mobile = !useScreenBreakpoint("desktop");

	useTour(
		enabled,
		"browsing",
		useCallback(
			({ next, back, cancel }) =>
				enabled
					? [
						{
							id: "introduction",
							title: "Flirtual Tutorial",
							text: `
					Take a quick tour with us! We can't wait to introduce you to some amazing people :)
					`,
							buttons: [
								{
									text: "Exit",
									action: cancel
								},
								{
									classes: "primary shadow-brand-1",
									text: "Continue",
									action: next
								}
							]
						},
						{
							id: "like",
							title: "Like their profile?",
							text: "Press the <b>Like button</b>! If they like you back, you'll match.",
							attachTo: { element: "#like-button", on: "top" },
							modalOverlayOpeningRadius: 33
						},
						{
							id: "friend",
							title: "Like their profile?",
							text: "Or press the <b>Homie button</b> if you want to be friends. You'll still match if it's mutual whether you Like or Homie each other.",
							attachTo: { element: "#friend-button", on: "top" },
							modalOverlayOpeningRadius: 33
						},
						{
							id: "pass",
							title: "Not interested?",
							text: "Press the <b>Pass button</b> to move on to the next profile.",
							attachTo: { element: "#pass-button", on: "top" },
							modalOverlayOpeningRadius: 26
						},
						{
							id: "undo",
							title: "Changed your mind?",
							text: "Press <b>Undo</b> to go back and see the last profile.",
							attachTo: { element: "#undo-button", on: "top" },
							modalOverlayOpeningRadius: 26
						},
						{
							id: "conversations",
							title: "Shoot your shot!",
							text: "View your matches here. Message them and meet up in VR!",
							attachTo: {
								element: "#conversation-button",
								on: "top"
							},
							modalOverlayOpeningRadius: 20,
							modalOverlayOpeningPadding: 4
						},
						{
							id: "browse-mode",
							title: "Looking for something else?",
							text: `
					Switch between <b>Date Mode</b> and <b>Homie Mode</b> (without matchmaking filters) to see more profiles.<br/><br/>
					Each day, you can browse up to <b>30 profiles</b> and Like or Homie up to 15 of them in each mode.`,
							attachTo: {
								element: "#browse-mode-switch",
								on: "top"
							},
							modalOverlayOpeningRadius: mobile ? 28 : 33
						},
						{
							id: "profile-dropdown",
							title: "Customize your experience!",
							text: "Here you can <b>update your profile</b>, or subscribe to Premium to browse unlimited profiles and see who likes you before you match.",
							attachTo: {
								element: "#profile-dropdown-button",
								on: "top"
							},
							modalOverlayOpeningRadius: 20,
							modalOverlayOpeningPadding: 4
						},
						{
							id: "conclusion",
							title: "Thank you!",
							text: `
					That concludes our tutorial! We hope you have a great time here, and remember to treat each other kindly.<br/><br/>
					Don't forget to drink water and take breaks as needed!<br/><br/>
					&lt;3<br/>
					The Flirtual Team`,
							modalOverlayOpeningRadius: 20,
							modalOverlayOpeningPadding: 4,
							buttons: [
								{
									text: "Back",
									action: back
								},
								{
									classes: "primary shadow-brand-1",
									text: "Start matching",
									action: next
								}
							]
						}
					]
					: [],
			[]
		),
		{
			defaultStart: true
		}
	);
}
