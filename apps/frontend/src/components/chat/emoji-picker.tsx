import { twemoji } from "@sableclient/twemoji-font/package.json";
import type Picker from "emoji-picker-element/picker";
import type { EmojiClickEvent } from "emoji-picker-element/shared";
import type { FC } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useLocale } from "~/i18n";

import { customEmojiPickerEntries, pickedCustomEmoji } from "./custom-emoji";
import { customEmojis } from "./custom-emojis";
import { Emoji } from "./emoji";
import { countEmojiUse, frequentReactions, pickerFavoriteCount } from "./emoji-favorites";
import { pickerDataSource, pickerLocale, pickerStrings } from "./emoji-locale";
import emojiPickerStyles from "./emoji-picker.css?inline";
import { followTabSwipes } from "./emoji-tab-swipes";

import "emoji-picker-element";

const entries = customEmojiPickerEntries(customEmojis);

let styles: CSSStyleSheet | undefined;

function pickerStyles() {
	if (!styles) {
		styles = new CSSStyleSheet();
		styles.replaceSync(emojiPickerStyles);
	}
	return styles;
}

export const EmojiPicker: FC<{
	kind: "field" | "reaction";
	withoutFavorites?: boolean;
	onPick: (emoji: string) => void;
}> = ({ kind, withoutFavorites = false, onPick }) => {
	const host = useRef<HTMLDivElement>(null);
	const [appLocale] = useLocale();
	const locale = pickerLocale(appLocale);
	const [frequent, setFrequent] = useState<Array<string>>([]);
	const [picks, setPicks] = useState(0);

	const picked = (emoji: string) => {
		onPick(emoji);
		setPicks((picks) => picks + 1);
	};
	const pick = useEffectEvent(picked);

	useEffect(() => {
		if (withoutFavorites) return;

		let current = true;
		void frequentReactions(locale, pickerFavoriteCount).then((emoji) => current && setFrequent(emoji));
		return () => void (current = false);
	}, [withoutFavorites, picks, locale]);

	useEffect(() => {
		const container = host.current;
		if (!container) return;

		const picker = document.createElement("emoji-picker") as Picker;
		picker.dataset.chatPicker = kind;
		picker.customEmoji = entries;
		picker.locale = locale;

		const dataSource = pickerDataSource(appLocale);
		if (dataSource) picker.dataSource = dataSource;
		void pickerStrings(appLocale).then((strings) => strings && (picker.i18n = strings));
		picker.setAttribute("emoji-version", twemoji.version);
		picker.toggleAttribute("data-without-favorites", true);
		container.append(picker);

		const root = picker.shadowRoot;
		if (root) root.adoptedStyleSheets = [...root.adoptedStyleSheets, pickerStyles()];
		const releaseSwipes = followTabSwipes(picker);

		const onEmojiClick = (event: Event) => {
			const { detail } = event as EmojiClickEvent;
			const emoji = pickedCustomEmoji(detail) ?? detail.unicode;
			if (emoji) pick(emoji);
		};
		picker.addEventListener("emoji-click", onEmojiClick);

		return () => {
			picker.removeEventListener("emoji-click", onEmojiClick);
			releaseSwipes();
			picker.remove();
		};
	}, [kind, appLocale, locale]);

	return (
		<div className="flex size-full flex-col">
			<div className="min-h-0 grow" ref={host} />
			{!withoutFavorites && (
				<div className={twMerge("flex shrink-0 overflow-hidden border-t border-white-40 bg-white-20 px-1.5 pt-1.5 dark:border-black-60 dark:bg-black-70", kind === "reaction" && "pb-1.5")}>
					{frequent.map((emoji) => (
						<button
							key={emoji}
							aria-label={emoji}
							className="flex size-[2.375rem] shrink-0 cursor-pointer items-center justify-center rounded-full hocus:bg-white-30 dark:hocus:bg-black-60"
							type="button"
							onClick={async () => {
								if (kind === "field") await countEmojiUse(locale, emoji);
								picked(emoji);
							}}
						>
							<Emoji priority className="m-0 size-[1.625rem]" text={emoji} />
						</button>
					))}
				</div>
			)}
		</div>
	);
};
