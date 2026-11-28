import { twemoji } from "@sableclient/twemoji-font/package.json";
import Database from "emoji-picker-element/database";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useLocale } from "~/i18n";
import { emptyArray } from "~/utilities";

import { customEmojiPickerEntries } from "./custom-emoji";
import { customEmojis } from "./custom-emojis";
import { Emoji } from "./emoji";
import { pickerDataSource, pickerLocale } from "./emoji-locale";

const limit = 20;
const newestVersion = Number.parseFloat(twemoji.version);

const databases = new Map<string, Database>();

function suggestionDatabase(locale: string) {
	let database = databases.get(locale);
	if (!database) {
		database = new Database({ customEmoji: customEmojiPickerEntries(customEmojis), dataSource: pickerDataSource(locale), locale: pickerLocale(locale) });
		databases.set(locale, database);
	}
	return database;
}

export function suggestionQuery(text: string, caret: number): { from: number; text: string } | null {
	const match = /(?:^|\s):([\w+-]{2,})$/.exec(text.slice(0, caret));
	if (!match) return null;

	return { from: caret - match[1]!.length - 1, text: match[1]! };
}

export function useEmojiSuggestions(query: string | null): Array<string> {
	const [locale] = useLocale();
	const [results, setResults] = useState<{ query: string; emoji: Array<string> } | null>(null);

	useEffect(() => {
		if (!query) return;

		let cancelled = false;
		void suggestionDatabase(locale).getEmojiBySearchQuery(query).then((found) => {
			if (cancelled) return;

			setResults({
				query,
				emoji: found
					.filter((emoji) => !("version" in emoji) || emoji.version <= newestVersion)
					.slice(0, limit)
					.map((emoji) => "unicode" in emoji ? emoji.unicode : emoji.name)
			});
		}).catch(() => {});

		return () => {
			cancelled = true;
		};
	}, [query, locale]);

	return query && results?.query === query ? results.emoji : emptyArray;
}

export const EmojiSuggestions: FC<{
	emoji: Array<string>;
	selected: number;
	onPick: (emoji: string) => void;
}> = ({ emoji: results, selected, onPick }) => {
	if (results.length === 0) return null;

	return (
		<div className="z-1 -mt-15 flex h-15 w-full shrink-0 items-center overflow-x-auto overflow-y-hidden overscroll-contain bg-white-20 p-2 dark:bg-black-70">
			{results.map((emoji, index) => (
				<button
					key={emoji}
					aria-label={emoji}
					className={twMerge("flex size-[calc(1.375rem+1rem)] shrink-0 cursor-pointer items-center justify-center rounded-lg px-1 text-[1.375rem]", index === selected && "bg-white-30 dark:bg-black-60")}
					type="button"
					onClick={() => onPick(emoji)}
					onMouseDown={(event) => event.preventDefault()}
				>
					<Emoji className="m-0 size-[1.375rem] align-middle" text={emoji} />
				</button>
			))}
		</div>
	);
};
