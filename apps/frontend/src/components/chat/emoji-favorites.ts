import { customEmojis } from "~/components/chat/custom-emojis";

import { defaultPickerLocale } from "./emoji-locale";

// The newest emoji version TalkJS accepts as a reaction.
export const reactionEmojiVersion = 16;

export const frequentEmojiCount = 6;
export const pickerFavoriteCount = 10;

// From emoji-picker-element, used with TalkJS.
export const pickerDefaults = ["😊", "😒", "❤️", "👍️", "😍", "😂", "😭", "☺️", "😔", "😩", "😏", "💕"];

// Used with the built-in chat.
const defaults = ["❤️", "🔥", "👀", "👍", "😂", "😻", "😭", "🥺", "🫪", "💀"];

function openPickerDatabase(locale: string): Promise<IDBDatabase | null> {
	return new Promise((resolve) => {
		const request = indexedDB.open(`emoji-picker-element-${locale}`);
		// A database created here would lack the picker's stores, and the picker wouldn't add them.
		request.onupgradeneeded = () => request.transaction?.abort();
		request.onerror = () => resolve(null);
		request.onsuccess = () => {
			const database = request.result;
			if (database.objectStoreNames.contains("favorites")) return resolve(database);
			database.close();
			resolve(null);
		};
	});
}

function settled(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve) => {
		transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
	});
}

function result<T>(request: IDBRequest<T>): Promise<T | undefined> {
	return new Promise((resolve) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => resolve(undefined);
	});
}

async function seedFavorites(database: IDBDatabase, locale: string): Promise<void> {
	const seeded = `emoji-favorites-seeded-${locale}`;
	if (localStorage.getItem(seeded)) return;

	const source = await openPickerDatabase(defaultPickerLocale).catch(() => null);
	if (!source) return;

	const store = source.transaction("favorites").objectStore("favorites");
	const [keys, counts] = await Promise.all([result(store.getAllKeys()), result(store.getAll())]);
	source.close();

	const transaction = database.transaction("favorites", "readwrite");
	const favorites = transaction.objectStore("favorites");
	for (const [index, key] of (keys ?? []).entries()) {
		const request = favorites.get(key);
		request.onsuccess = () => favorites.put((Number(request.result) || 0) + (Number(counts?.[index]) || 0), key);
	}
	await settled(transaction);
	localStorage.setItem(seeded, "1");
}

export async function frequentReactions(
	locale: string,
	limit: number,
	{ newestVersion = Infinity, fallback = defaults }: { newestVersion?: number; fallback?: ReadonlyArray<string> } = {}
): Promise<Array<string>> {
	const used: Array<string> = [];
	let database = await openPickerDatabase(locale).catch(() => null);

	if (database && locale !== defaultPickerLocale) await seedFavorites(database, locale).catch(() => {});
	database ??= await openPickerDatabase(defaultPickerLocale).catch(() => null);

	if (database) {
		await new Promise<void>((resolve) => {
			const transaction = database.transaction(["favorites", "emoji"], "readonly");
			transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
			const emojiStore = transaction.objectStore("emoji");

			transaction.objectStore("favorites").index("count").openCursor(null, "prev").onsuccess = ({ target }) => {
				const cursor = (target as IDBRequest<IDBCursorWithValue | null>).result;
				if (!cursor) return;

				const emoji = String(cursor.primaryKey);
				const add = (usable: boolean) => {
					if (usable) used.push(emoji);
					if (used.length < limit) cursor.continue();
				};

				const custom = customEmojis[emoji];
				if (custom || emoji.startsWith(":")) return add(!!custom && !custom.hidden);

				const request = emojiStore.get(emoji);
				request.onsuccess = () => {
					const { version } = (request.result ?? {}) as { version?: number };
					add(version !== undefined && version <= newestVersion);
				};
			};
		});
		database.close();
	}

	return [...new Set([...used, ...fallback])].slice(0, limit);
}

export async function countEmojiUse(locale: string, emoji: string): Promise<void> {
	const database = await openPickerDatabase(locale).catch(() => null);
	if (!database) return;

	const store = database.transaction("favorites", "readwrite").objectStore("favorites");
	const request = store.get(emoji);
	request.onsuccess = () => store.put((Number(request.result) || 0) + 1, emoji);
	store.transaction.oncomplete = store.transaction.onerror = store.transaction.onabort = () => database.close();
}
