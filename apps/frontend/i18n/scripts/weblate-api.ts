import { setTimeout as sleep } from "node:timers/promises";

const baseUrl = (process.env.WEBLATE_URL ?? "https://hosted.weblate.org").replace(/\/$/, "");
export const project = process.env.WEBLATE_PROJECT ?? "flirtual";

function token() {
	const value = process.env.WEBLATE_TOKEN;
	if (!value) throw new Error("WEBLATE_TOKEN is not set; run with `node --env-file=.env.weblate`.");
	return value;
}

export class WeblateError extends Error {
	public readonly status: number;
	public readonly body: string;

	public constructor(status: number, path: string, body: string) {
		super(`Weblate ${status} on ${path}: ${body.slice(0, 500)}`);
		this.status = status;
		this.body = body;
	}
}

// The contributor agreement blocks writes; the project token should be exempt, so stop and ask.
export class AgreementError extends WeblateError {}

function url(path: string) {
	return path.startsWith("http") ? path : `${baseUrl}/api/${path.replace(/^\//, "")}`;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const form = body instanceof FormData;
	for (let attempt = 0; ; attempt++) {
		const response = await fetch(url(path), {
			method,
			headers: {
				Authorization: `Token ${token()}`,
				Accept: "application/json",
				...(body !== undefined && !form ? { "Content-Type": "application/json" } : {})
			},
			body: body === undefined ? undefined : form ? body : JSON.stringify(body)
		});

		// Hosted Weblate answers bursts with 429 or a 502/503/504 page; back off and retry.
		if ([429, 502, 503, 504].includes(response.status) && attempt < 6) {
			await sleep(Number(response.headers.get("Retry-After") ?? 5 * 2 ** attempt) * 1000);
			continue;
		}

		const text = await response.text();
		if (!response.ok) {
			if (method !== "GET" && /agreement/i.test(text)) throw new AgreementError(response.status, path, text);
			throw new WeblateError(response.status, path, text);
		}
		return (text ? JSON.parse(text) : undefined) as T;
	}
}

export async function list<T>(path: string): Promise<Array<T>> {
	const results: Array<T> = [];
	let next: string | null = `${path}${path.includes("?") ? "&" : "?"}page_size=1000`;
	while (next) {
		const page: { results: Array<T>; next: string | null } = await request("GET", next);
		results.push(...page.results);
		next = page.next;
	}
	return results;
}

export interface Unit {
	id: number;
	url: string;
	context: string;
	source: Array<string>;
	target: Array<string>;
	state: number;
	explanation: string;
	extra_flags: string;
	flags: string;
	source_unit: string;
	has_suggestion: boolean;
	translation: string;
}

export interface Change {
	unit: string | null;
	translation: string | null;
	user: string | null;
	author: string | null;
	timestamp: string;
	action: number;
	action_name: string;
	target: string;
}

export const states = {
	empty: 0,
	needsEditing: 10,
	needsRewriting: 11,
	needsChecking: 12,
	translated: 20,
	approved: 30,
	readOnly: 100
} as const;

// Actions that set a translation's text.
export const contentActions = new Set([
	1, // Translation completed
	2, // Translation changed
	5, // Translation added
	7, // Suggestion accepted
	8, // Translation reverted
	9, // Translation uploaded
	27 // Translation replaced (search and replace)
]);

export function username(userUrl: string | null) {
	return userUrl?.replace(/\/$/, "").split("/").pop() ?? null;
}

// Maintainers who aren't native speakers of any target locale; their edits count as machine-grade.
const nonNativeMaintainers = new Set(["kfarwell", "ariesclark"]);

// Machine translation, add-ons, webhooks, project-token bots and non-native maintainers.
export function isHuman(user: string | null) {
	return !!user && !nonNativeMaintainers.has(user) && !/^(?:mt:|addon:|webhook:|bot-|anonymous$)/.test(user);
}
