import { customEmojis } from "~/hooks/use-talkjs";

// The newest emoji version TalkJS accepts as a reaction.
export const reactionEmojiVersion = 16;

// From emoji-picker-element.
const defaults = ["😊", "😒", "❤️", "👍️", "😍", "😂", "😭", "☺️", "😔", "😩", "😏", "💕"];

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

export async function frequentReactions(locale: string, limit: number): Promise<Array<string>> {
	const used: Array<string> = [];
	const database = await openPickerDatabase(locale).catch(() => null);

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
					add(version !== undefined && version <= reactionEmojiVersion);
				};
			};
		});
		database.close();
	}

	return [...new Set([...used, ...defaults])].slice(0, limit);
}

export async function countEmojiUse(locale: string, emoji: string): Promise<void> {
	const database = await openPickerDatabase(locale).catch(() => null);
	if (!database) return;

	const store = database.transaction("favorites", "readwrite").objectStore("favorites");
	const request = store.get(emoji);
	request.onsuccess = () => store.put((Number(request.result) || 0) + 1, emoji);
	store.transaction.oncomplete = store.transaction.onerror = store.transaction.onabort = () => database.close();
}
