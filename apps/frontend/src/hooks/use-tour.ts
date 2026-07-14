import type { ComponentProps, FC } from "react";
import { createElement, use, useCallback, useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "react-i18next";
import { ShepherdTourContext } from "react-shepherd";
import type { ShepherdOptionsWithType, Tour } from "react-shepherd";

import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { useNavigate } from "~/i18n";
import { urls } from "~/urls";

import { useBreakpoint } from "./use-breakpoint";
import { useDismissed } from "./use-dismissed";
import { useScrollLock } from "./use-scroll-lock";

import "~/components/shepherd/style.scss";

export function useShepherd() {
	return use(ShepherdTourContext)!;
}

// Resolves once the element exists and its layout has settled (same position
// across two consecutive frames), so steps don't attach mid-transition.
function waitForElement(selector: string, timeout: number = 4000) {
	return new Promise<void>((resolve) => {
		const startedAt = Date.now();
		let previous: string | null = null;

		function poll() {
			if (Date.now() - startedAt > timeout) return resolve();

			const element = document.querySelector(selector);
			const position = element && JSON.stringify(element.getBoundingClientRect());

			if (element && position === previous) return resolve();

			previous = position;
			setTimeout(poll, 100);
		}

		poll();
	});
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

	const [completed, dismiss] = useDismissed(`tour_${name}`);

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
			if (!shepherd.steps.some(({ id }) => id === steps[0]?.id))
				shepherd.addSteps(steps);

			if (onlyIfUncompleted && completed) return;

			// The first-run tour is unskippable; re-shows (F1) can be exited.
			const skippable = !onlyIfUncompleted;
			(shepherd as unknown as { options: Tour.TourOptions }).options.exitOnEsc
				= skippable;
			for (const step of shepherd.steps)
				step.updateStepOptions({ cancelIcon: { enabled: skippable } });

			setScrollLocked(true);
			shepherd.start();
		},
		[completed, steps, shepherd, setScrollLocked]
	);

	const stop = useCallback(
		(complete: boolean = true) => {
			if (complete) void dismiss();
			shepherd.cancel();
			shepherd.hide();
		},
		[shepherd, dismiss]
	);

	useEffect(() => {
		function onComplete() {
			if (enabled) void dismiss();
			setScrollLocked(false);
		}

		shepherd.on("complete", onComplete);
		shepherd.on("cancel", onComplete);
		if (defaultStart) start();

		return () => {
			setScrollLocked(false);
			shepherd.off("complete", onComplete);
			shepherd.off("cancel", onComplete);

			for (const { id } of steps) shepherd.removeStep(id);
			shepherd.cancel();
		};
	}, [shepherd, steps, dismiss, setScrollLocked, defaultStart, start, enabled]);

	// Re-show the tour on demand, even after it was dismissed.
	useEffect(() => {
		if (!enabled) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== "F1") return;

			event.preventDefault();
			start(false);
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [enabled, start]);

	return useMemo(
		() => ({
			completed,
			start,
			stop
		}),
		[completed, start, stop]
	);
}

// Shepherd step text is an HTML string, not React.
function modeIcon(Icon: FC<ComponentProps<"svg">>) {
	return `<span class="inline-flex align-middle [&>svg]:h-[1.2em] [&>svg]:w-auto">${renderToStaticMarkup(createElement(Icon))}</span>`;
}

export function useDefaultTour(enabled: boolean = true) {
	const mobile = !useBreakpoint("desktop");
	const { t } = useTranslation();
	const shepherd = useShepherd();

	// useNavigate's identity changes with location; the tour navigates between
	// modes itself, which must not rebuild (and cancel) the running tour.
	const navigate = useNavigate();
	const navigateReference = useRef(navigate);
	navigateReference.current = navigate;

	// Navigate and wait for the step's target; if the tour was cancelled while
	// we were waiting, never resolve, so the step can't render orphaned.
	const ensureOnPage = useCallback(
		async (url: string, selector: string) => {
			await navigateReference.current(url);
			await waitForElement(selector);
			if (!shepherd.isActive()) await new Promise<never>(() => {});
		},
		[shepherd]
	);

	useTour(
		enabled,
		"browsing",
		useCallback(
			({ next, back }) =>
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
								modalOverlayOpeningRadius: 33,
								beforeShowPromise: () => ensureOnPage(urls.discover("dates"), "#like-button")
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
								beforeShowPromise: () =>
									ensureOnPage(urls.discover("dates"), "#browse-mode-switch"),
								text: () => `
					${t("chunky_zany_leopard_peek", {
						heart: modeIcon(HeartIcon),
						homie: modeIcon(PeaceIcon),
						interpolation: { escapeValue: false }
					})}
					<br/><br/>
					${t("honest_loud_felix_favor")}`,
								attachTo: {
									element: "#browse-mode-switch",
									on: "top"
								},
								modalOverlayOpeningRadius: mobile ? 28 : 33
							},
							{
								id: "friend",
								title: t("royal_house_peacock_roar"),
								text: t("light_flat_racoon_buzz"),
								attachTo: { element: "#friend-button", on: "top" },
								modalOverlayOpeningRadius: 33,
								beforeShowPromise: () => ensureOnPage(urls.discover("homies"), "#friend-button")
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
								modalOverlayOpeningPadding: 4,
								beforeShowPromise: () => ensureOnPage(urls.discover("dates"), "#profile-dropdown-button")
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
			[enabled, mobile, t, ensureOnPage]
		),
		{
			defaultStart: true
		}
	);
}
