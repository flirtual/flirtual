import { use, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShepherdTourContext } from "react-shepherd";
import type { ShepherdOptionsWithType, Tour } from "react-shepherd";

import { useBreakpoint } from "./use-breakpoint";
import { usePreferences } from "./use-preferences";
import { useScrollLock } from "./use-scroll-lock";

import "~/components/shepherd/style.scss";

export function useShepherd() {
	return use(ShepherdTourContext)!;
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
	const { t } = useTranslation();

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
						text: t("back"),
						action: shepherd.back
					},
					{
						classes: "primary shadow-brand-1",
						text: t("continue"),
						action: shepherd.next
					}
				],
				id: `${name}-${step.id}`
			})),
		[name, shepherd, getSteps, t]
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
	}, [shepherd, steps, setCompleted, setScrollLocked, defaultStart, start, enabled]);

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
	const mobile = !useBreakpoint("desktop");
	const { t } = useTranslation();

	useTour(
		enabled,
		"browsing",
		useCallback(
			({ next, back, cancel }) =>
				enabled
					? [
							{
								id: "introduction",
								title: t("welcome_to_flirtual"),
								text: `
					${t("tidy_known_whale_imagine")}
					`,
								buttons: [
									{
										text: t("exit"),
										action: cancel
									},
									{
										classes: "primary shadow-brand-1",
										text: t("continue"),
										action: next
									}
								]
							},
							{
								id: "like",
								title: t("royal_house_peacock_roar"),
								text: t("helpful_petty_peacock_hunt"),
								attachTo: { element: "#like-button", on: "top" },
								modalOverlayOpeningRadius: 33
							},
							{
								id: "friend",
								title: t("royal_house_peacock_roar"),
								text: t("light_flat_racoon_buzz"),
								attachTo: { element: "#friend-button", on: "top" },
								modalOverlayOpeningRadius: 33
							},
							{
								id: "pass",
								title: t("bad_ideal_stingray_amuse"),
								text: t("away_lime_hound_launch"),
								attachTo: { element: "#pass-button", on: "top" },
								modalOverlayOpeningRadius: 26
							},
							{
								id: "undo",
								title: t("mean_such_flamingo_drop"),
								text: t("aloof_caring_niklas_fade"),
								attachTo: { element: "#undo-button", on: "top" },
								modalOverlayOpeningRadius: 26
							},
							{
								id: "conversations",
								title: t("basic_tense_mayfly_devour"),
								text: t("mushy_sound_nils_fetch"),
								attachTo: {
									element: "#conversation-button",
									on: "top"
								},
								modalOverlayOpeningRadius: 20,
								modalOverlayOpeningPadding: 4
							},
							{
								id: "browse-mode",
								title: t("minor_gaudy_seal_ask"),
								text: `
					${t("chunky_zany_leopard_peek")}
					<br/><br/>
					${t("honest_loud_felix_favor")}`,
								attachTo: {
									element: "#browse-mode-switch",
									on: "top"
								},
								modalOverlayOpeningRadius: mobile ? 28 : 33
							},
							{
								id: "profile-dropdown",
								title: t("nice_wise_ibex_accept"),
								text: t("sad_spare_grizzly_twirl"),
								attachTo: {
									element: "#profile-dropdown-button",
									on: "top"
								},
								modalOverlayOpeningRadius: 20,
								modalOverlayOpeningPadding: 4
							},
							{
								id: "conclusion",
								title: t("every_agent_sloth_advise"),
								text: `
					${t("mealy_lime_mayfly_support")}
					<br/><br/>
					${t("dry_tame_sloth_yell")}
					<br/><br/>
					${t("chunky_lost_parrot_roam")}
					<br/>
					${t("that_active_seal_nail")}`,
								modalOverlayOpeningRadius: 20,
								modalOverlayOpeningPadding: 4,
								buttons: [
									{
										text: t("back"),
										action: back
									},
									{
										classes: "primary shadow-brand-1",
										text: t("start_matching"),
										action: next
									}
								]
							}
						]
					: [],
			[enabled, mobile, t]
		),
		{
			defaultStart: true
		}
	);
}
