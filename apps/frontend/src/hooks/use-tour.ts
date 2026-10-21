import type { ComponentProps, FC } from "react";
import { createElement, use, useCallback, useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "react-i18next";
import type { PopperPlacement, Step, StepOptions, Tour } from "shepherd.js";

import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { ShepherdContext } from "~/components/shepherd/context";
import { homieMode } from "~/features";
import { localePathnameRegex, useNavigate } from "~/i18n";
import { NativeNavigationPlugin } from "~/native-navigation";
import type { NativeNavigationFrame } from "~/native-navigation";
import { urls } from "~/urls";

import { useBreakpoint } from "./use-breakpoint";
import { nativeNavigation } from "./use-device";
import { useDismissed } from "./use-dismissed";
import { useScrollLock } from "./use-scroll-lock";

import "~/components/shepherd/style.scss";

export function useShepherd() {
	return use(ShepherdContext)!;
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

function union(frames: Array<NativeNavigationFrame>): NativeNavigationFrame {
	const left = Math.min(...frames.map(({ x }) => x));
	const top = Math.min(...frames.map(({ y }) => y));
	const right = Math.max(...frames.map(({ x, width }) => x + width));
	const bottom = Math.max(...frames.map(({ y, height }) => y + height));

	return { x: left, y: top, width: right - left, height: bottom - top };
}

// Native tabs aren't in the page, so their steps attach to a zero-area line along the bar's inner
// edge, which leaves no opening in the overlay.
const tabTargetId = "native-tab-target";
const openings = new WeakMap<Step, Pick<StepOptions, "modalOverlayOpeningPadding" | "modalOverlayOpeningRadius">>();

async function placeTabTarget(ids: Array<string>): Promise<PopperPlacement | null> {
	const { frames, bar = union(Object.values(frames)) } = await NativeNavigationPlugin.tabFrames()
		.catch(() => ({ frames: {} as Record<string, NativeNavigationFrame>, bar: undefined }));

	const targets = ids.flatMap((id) => frames[id] ?? []);
	if (targets.length === 0) return null;

	const across = bar.width >= bar.height;
	const on: PopperPlacement = across
		? bar.y + bar.height / 2 > window.innerHeight / 2 ? "top" : "bottom"
		: bar.x + bar.width / 2 < window.innerWidth / 2 ? "right" : "left";

	const tabs = union(targets);
	const { x, y, width, height } = across
		? { ...tabs, y: on === "top" ? bar.y : bar.y + bar.height, height: 0 }
		: { ...tabs, x: on === "left" ? bar.x : bar.x + bar.width, width: 0 };
	let element = document.getElementById(tabTargetId);
	if (!element) {
		element = document.createElement("div");
		element.id = tabTargetId;
		element.style.cssText = "position: fixed; pointer-events: none; visibility: hidden;";
		document.body.append(element);
	}
	Object.assign(element.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });

	return on;
}

export function useTour(
	enabled: boolean = true,
	name: string,
	getSteps: (shepherd: Tour) => Array<StepOptions>,
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
			shepherd.options.exitOnEsc = skippable;
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

			shepherd.cancel();
			shepherd.currentStep = null;
			for (const { id } of steps) shepherd.removeStep(id);
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
function modeIcon(name: string, Icon: FC<ComponentProps<"svg">>) {
	return `<span class="inline-flex align-middle [&>svg]:h-[1.2em] [&>svg]:w-auto">${renderToStaticMarkup(createElement(Icon), { identifierPrefix: `${name}-` })}</span>`;
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

	// Navigate and wait for the step's target; if the tour was cancelled or
	// restarted while we were waiting, never resolve, so the step can't render
	// orphaned.
	const ensureOnPage = useCallback(
		async (url: string, selector: string) => {
			const currentPath = location.pathname.replace(localePathnameRegex, "/");
			if (currentPath === url.split("?")[0] && document.querySelector(selector))
				return;

			const step = shepherd.getCurrentStep();
			await navigateReference.current(url);
			await waitForElement(selector);
			if (!shepherd.isActive() || shepherd.getCurrentStep() !== step)
				await new Promise<never>(() => {});
		},
		[shepherd]
	);

	// Points at the native tabs, else the first visible element, else centres the step.
	const attach = useCallback(
		async (
			tabs: Array<string>,
			elements: Array<{ element: string; on: PopperPlacement; padding?: number; radius?: number }>
		) => {
			const step = shepherd.getCurrentStep();
			if (!step) return;

			if (tabs.length > 0) document.documentElement.dataset.tourNavigation = "";

			const on = nativeNavigation ? await placeTabTarget(tabs) : null;
			const target = on
				? null
				: elements.find(({ element }) => !!document.querySelector(element)?.getClientRects().length);

			const { modalOverlayOpeningPadding, modalOverlayOpeningRadius } = step.options;
			if (!openings.has(step)) openings.set(step, { modalOverlayOpeningPadding, modalOverlayOpeningRadius });
			const opening = openings.get(step)!;
			step.options.modalOverlayOpeningPadding = on ? 0 : target?.padding ?? opening.modalOverlayOpeningPadding;
			step.options.modalOverlayOpeningRadius = target?.radius ?? opening.modalOverlayOpeningRadius;

			step.options.attachTo = on
				? { element: `#${tabTargetId}`, on }
				: target ? { element: target.element, on: target.on } : {};
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
								beforeShowPromise: async () => {
									await ensureOnPage(urls.discover("dates"), "#like-button");
									await attach([], [{ element: "#like-button", on: "top" }]);
								}
							},
							{
								id: "pass",
								title: t("bad_ideal_stingray_amuse"),
								text: t("away_lime_hound_launch"),
								attachTo: { element: "#pass-button", on: "top" },
								modalOverlayOpeningRadius: 26,
								beforeShowPromise: () => attach([], [{ element: "#pass-button", on: "top" }])
							},
							{
								id: "undo",
								title: t("mean_such_flamingo_drop"),
								text: t("aloof_caring_niklas_fade"),
								attachTo: { element: "#undo-button", on: "top" },
								modalOverlayOpeningRadius: 26,
								beforeShowPromise: () => attach([], [{ element: "#undo-button", on: "top" }])
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
								modalOverlayOpeningPadding: 4,
								// Split layouts list matches beside the page instead.
								beforeShowPromise: () => attach(["matches"], [
									{ element: "#conversation-button", on: "top" },
									{ element: "#conversation-aside", on: "right", padding: 0, radius: 0 }
								])
							},
							...(homieMode
								? [
										{
											id: "browse-mode",
											title: t("minor_gaudy_seal_ask"),
											beforeShowPromise: async () => {
												await ensureOnPage(urls.discover("dates"), nativeNavigation ? "#like-button" : "#browse-mode-switch");
												await attach(["homies"], [{ element: "#browse-mode-switch", on: "top" }]);
											},
											text: () => `
					${t("chunky_zany_leopard_peek", {
									heart: modeIcon("heart", HeartIcon),
									homie: modeIcon("homie", PeaceIcon),
									interpolation: { escapeValue: false }
								})}
					<br/><br/>
					${t("honest_loud_felix_favor")}`,
											attachTo: {
												element: "#browse-mode-switch",
												on: "top" as const
											},
											modalOverlayOpeningRadius: mobile ? 28 : 33
										},
										{
											id: "friend",
											title: t("royal_house_peacock_roar"),
											text: t("light_flat_racoon_buzz"),
											attachTo: { element: "#friend-button", on: "top" as const },
											modalOverlayOpeningRadius: 33,
											beforeShowPromise: async () => {
												await ensureOnPage(urls.discover("homies"), "#friend-button");
												await attach([], [{ element: "#friend-button", on: "top" }]);
											}
										}
									]
								: []),
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
								beforeShowPromise: async () => {
									await ensureOnPage(urls.discover("dates"), nativeNavigation ? "#like-button" : "#profile-dropdown-button");
									await attach(["settings"], [{ element: "#profile-dropdown-button", on: "top" }]);
								}
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
			[enabled, mobile, t, ensureOnPage, attach]
		),
		{
			defaultStart: true
		}
	);
}
