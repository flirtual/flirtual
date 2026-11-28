import { Plus } from "lucide-react";
import type { FC, ReactNode, RefObject } from "react";
import { useEffect, useEffectEvent, useLayoutEffect, useReducer, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";

import { useBackButton } from "~/hooks/use-back-button";
import { useSafeArea } from "~/hooks/use-safe-area";

import { Emoji } from "./emoji";
import { EmojiPicker } from "./emoji-picker";
import { messageList } from "./selectors";

export interface MessageMenuItem {
	label: string;
	icon: ReactNode;
	destructive?: boolean;
	onSelect: () => void;
}

interface MessageMenuReactions {
	emoji: Array<string>;
	reacted: ReadonlySet<string>;
	moreLabel: string;
	onReact: (emoji: string) => void;
}

interface Area {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Layout {
	picking: boolean;
	shift: number;
	barTop: number;
	barLeft: number;
	belowTop: number;
	belowLeft: number;
	pickerMaxHeight: number;
}

const gap = 8;
const margin = 8;
const pickerWidth = 352;
const pickerHeight = 320;
const minPickerHeight = 280;

const panel = "absolute rounded-3xl bg-white-20 p-1.5 font-nunito text-black-80 shadow-brand-1 animate-in fade-in-0 zoom-in-95 dark:bg-black-50 dark:text-white-20 vision:bg-white-20 vision:text-black-80";

// The bubble's unshifted position, since the shift may be mid-transition.
function measure(bubble: HTMLElement, padding: number): Area {
	const parent = bubble.offsetParent?.getBoundingClientRect();
	const shifted = bubble.getBoundingClientRect();
	const shift = parent ? shifted.top - (parent.top + bubble.offsetTop) : 0;

	// A bare emoji or GIF can extend past the bubble.
	const rects = [shifted, ...[...bubble.querySelectorAll("img, video, iframe")].map((element) => element.getBoundingClientRect())];
	const left = Math.min(...rects.map(({ left }) => left)) - padding;
	const top = Math.min(...rects.map(({ top }) => top)) - shift - padding;
	const width = Math.max(...rects.map(({ right }) => right)) + padding - left;
	const height = Math.max(...rects.map(({ bottom }) => bottom)) - shift + padding - top;

	return { x: left, y: top, width, height };
}

export const MessageMenu: FC<{
	// Inside the chatbox, for the emoji picker's styles.
	container: Element;
	bubble: RefObject<HTMLElement | null>;
	padding: number;
	align: "end" | "start";
	reactions?: MessageMenuReactions;
	items: Array<MessageMenuItem>;
	onClose: () => void;
}> = ({ container, bubble, padding, align, reactions, items, onClose }) => {
	const safeArea = useSafeArea();
	const overlay = useRef<HTMLDivElement>(null);
	const backdrop = useRef<HTMLDivElement>(null);
	const bar = useRef<HTMLDivElement>(null);
	const menu = useRef<HTMLDivElement>(null);
	const tabBarGap = useRef<HTMLDivElement>(null);
	const [layout, setLayout] = useState<Layout | null>(null);
	const [picking, setPicking] = useState(false);
	const [moved, setMoved] = useState(false);
	const [measurement, remeasure] = useReducer((count: number) => count + 1, 0);
	const close = useEffectEvent(onClose);
	useBackButton(true, onClose);

	useLayoutEffect(() => {
		if (!bubble.current) return;
		const area = measure(bubble.current, padding);

		const list = container.querySelector(messageList)?.getBoundingClientRect();
		const top = Math.max(safeArea.top, list?.top ?? 0) + margin;
		const bottom = window.innerHeight - safeArea.bottom - margin - (tabBarGap.current?.offsetHeight ?? 0);
		const minLeft = safeArea.left + margin;
		const maxRight = window.innerWidth - safeArea.right - margin;

		// Offset sizes ignore the zoom-in transform.
		const size = (element: HTMLElement | null) => element && { width: element.offsetWidth, height: element.offsetHeight };
		const barSize = picking ? null : size(bar.current);
		const pickerFits = Math.min(pickerHeight, Math.max(bottom - top - area.height - gap, minPickerHeight));
		const belowSize = picking
			? { width: Math.min(pickerWidth, maxRight - minLeft), height: pickerFits }
			: size(menu.current);

		const above = barSize ? barSize.height + gap : 0;
		const below = belowSize ? belowSize.height + gap : 0;

		let shift = Math.min(bottom - (area.y + area.height + below), 0);
		if (area.y + shift - above < top) shift = top - (area.y - above);

		const left = (width: number) => {
			const start = align === "end" ? area.x + area.width - width : area.x;
			return Math.max(minLeft, Math.min(start, maxRight - width));
		};

		setLayout({
			picking,
			shift,
			barTop: area.y + shift - above,
			barLeft: left(barSize?.width ?? 0),
			belowTop: Math.min(area.y + area.height + shift + gap, bottom - (belowSize?.height ?? 0)),
			belowLeft: left(belowSize?.width ?? 0),
			pickerMaxHeight: pickerFits
		});
	}, [align, bubble, container, padding, picking, safeArea, measurement]);

	useEffect(() => {
		const element = bubble.current;
		if (!element) return;

		const frame = requestAnimationFrame(() => setMoved(true));
		Object.assign(element.style, { zIndex: "51", pointerEvents: "none" });
		return () => {
			cancelAnimationFrame(frame);
			Object.assign(element.style, { translate: "", zIndex: "", pointerEvents: "" });
		};
	}, [bubble]);

	const shift = layout?.shift ?? 0;
	useEffect(() => {
		const element = bubble.current;
		if (moved && element) Object.assign(element.style, { translate: shift ? `0 ${shift}px` : "" });
	}, [moved, shift, bubble]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};
		const width = window.innerWidth;
		const onResize = () => {
			if (window.innerWidth === width) remeasure();
			else close();
		};
		const onScroll = ({ target }: Event) => {
			if (target instanceof Element && target.matches(messageList)) remeasure();
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("resize", onResize);
		// The chat resizes for the keyboard after the window, without scrolling.
		const resizes = new ResizeObserver(remeasure);
		const list = container.querySelector(messageList);
		if (list) resizes.observe(list);

		// Stops the press that opened it from scrolling the chat.
		const onTouchMove = (event: TouchEvent) => {
			if (!(event.target instanceof Node && overlay.current?.contains(event.target))) event.preventDefault();
		};

		container.addEventListener("scroll", onScroll, { capture: true, passive: true });
		document.addEventListener("touchmove", onTouchMove, { passive: false });
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("resize", onResize);
			container.removeEventListener("scroll", onScroll, { capture: true });
			document.removeEventListener("touchmove", onTouchMove);
			resizes.disconnect();
		};
	}, [container]);

	return createPortal(
		<div
			data-message-menu
			className="contents select-none [-webkit-user-select:none] touch-callout-none"
			ref={overlay}
			style={{ visibility: layout ? undefined : "hidden" }}
			onContextMenu={(event) => event.preventDefault()}
			onPointerDown={({ target }) => {
				if (target === backdrop.current) onClose();
			}}
		>
			{/* Measures --tab-bar-gap. */}
			<div className="invisible absolute h-(--tab-bar-gap,0px)" ref={tabBarGap} />
			<div className="fixed inset-0 z-50 touch-none bg-black/35 animate-in fade-in-0 dark:bg-black/60" ref={backdrop} />

			{/* Over the bubble, so a tall one goes behind the reactions and actions. */}
			<div className="pointer-events-none fixed inset-0 z-52 touch-none [&>*]:pointer-events-auto">

				{reactions && !picking && (
					<div
						className={twMerge(panel, "flex items-center gap-1 rounded-full", align === "end" ? "origin-bottom-right" : "origin-bottom-left")}
						ref={bar}
						style={{ top: layout?.barTop, left: layout?.barLeft }}
					>
						{reactions.emoji.map((emoji) => (
							<button
								key={emoji}
								aria-label={emoji}
								aria-pressed={reactions.reacted.has(emoji)}
								className="flex size-10 shrink-0 items-center justify-center rounded-full aria-pressed:bg-white-40 dark:aria-pressed:bg-black-70 hocus:bg-white-30 dark:hocus:bg-black-60"
								type="button"
								onClick={() => {
									onClose();
									reactions.onReact(emoji);
								}}
							>
								<Emoji priority className="m-0 size-7 align-middle" text={emoji} />
							</button>
						))}
						<button
							aria-label={reactions.moreLabel}
							className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white-30 dark:bg-black-60 hocus:bg-white-40 dark:hocus:bg-black-70"
							title={reactions.moreLabel}
							type="button"
							onClick={() => setPicking(true)}
						>
							<Plus className="size-6 fill-none!" />
						</button>
					</div>
				)}

				{reactions && picking && layout?.picking && (
					<div
						data-chat-popover
						style={{
							top: layout.belowTop,
							left: layout.belowLeft,
							width: `min(${pickerWidth}px, calc(100vw - ${margin * 2}px))`,
							height: layout.pickerMaxHeight
						}}
						className="absolute overflow-hidden rounded-2xl shadow-brand-1"
					>
						<EmojiPicker
							withoutFavorites
							kind="reaction"
							onPick={(emoji) => {
								onClose();
								reactions.onReact(emoji);
							}}
						/>
					</div>
				)}

				{items.length > 0 && !picking && (
					<div
						className={twMerge(panel, "flex min-w-52 flex-col", align === "end" ? "origin-top-right" : "origin-top-left")}
						ref={menu}
						role="menu"
						style={{ top: layout?.belowTop, left: layout?.belowLeft }}
					>
						{items.map(({ label, icon, destructive, onSelect }) => (
							<button
								key={label}
								className={twMerge(
									"flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hocus:bg-white-30 dark:hocus:bg-black-60 [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:fill-none!",
									destructive && "text-red-500 dark:text-red-500 vision:text-red-500"
								)}
								role="menuitem"
								type="button"
								onClick={() => {
									onClose();
									onSelect();
								}}
							>
								{icon}
								{label}
							</button>
						))}
					</div>
				)}
			</div>
		</div>,
		container
	);
};
