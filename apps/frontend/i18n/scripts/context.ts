// Per-key translation context: where each string appears, what its placeholders mean, and what
// a translator can't tell from the text alone. Usage: node i18n/scripts/context.ts <command>
//
//   usage                  index code references to every key into .staging/usage.json
//   batches [--size 90]    split keys with missing or stale context into agent batches
//   merge                  fold agent output (.staging/context/out/*.json) into context.json
//   questions              list open needsHuman questions
//   resolve <id> <answer>  record a human answer and clear needsHuman
//   status                 counts

import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import type { Id, Message } from "./common.ts";
import { hash, i18nRoot, id, isMain, loadSource, parseArguments, parseId, readJson, repositoryRoot, root, staging, watchIds, writeJson } from "./common.ts";

export const elements = [
	"button",
	"link",
	"label",
	"title",
	"heading",
	"tab",
	"menu-item",
	"option",
	"badge",
	"placeholder",
	"tooltip",
	"toast",
	"error",
	"dialog",
	"notice",
	"body",
	"list-item",
	"alt-text",
	"meta",
	"email-subject",
	"email-body",
	"push",
	"legal",
	"news",
	"attribute",
	"other"
] as const;
export type Element = (typeof elements)[number];

// Elements where a long translation breaks the layout.
export const compactElements = new Set<Element>(["button", "label", "title", "tab", "menu-item", "option", "badge", "placeholder", "attribute"]);

export interface ContextEntry {
	// Hash of the English when this entry was written; a mismatch means it may be stale.
	hash: string;
	group: string;
	screens: Array<string>;
	element: Element;
	description: string;
	placeholders?: Record<string, { meaning: string; example: string }>;
	tags?: Record<string, string>;
	tone?: string;
	maxLength?: number;
	lengthNote?: string;
	watch?: boolean;
	needsScreenshot?: boolean;
	// Not text (media ids) or fixed names: copied unchanged, read-only on Weblate.
	readOnly?: boolean;
	needsHuman?: string;
	// A maintainer's answer to a needsHuman question, kept so it's never asked again.
	resolved?: string;
}

export type ContextFile = Record<Id, ContextEntry>;

export const contextPath = join(i18nRoot, "context.json");
const usagePath = join(staging, "usage.json");
const batchDirectory = join(staging, "context/batches");
const outputDirectory = join(staging, "context/out");

export function loadContext(): ContextFile {
	return readJson<ContextFile>(contextPath, {} as ContextFile);
}

export function saveContext(context: ContextFile) {
	const sorted = Object.fromEntries(Object.entries(context).sort(([a], [b]) => a.localeCompare(b)));
	writeJson(contextPath, sorted);
}

interface Usage {
	file: string;
	line: number;
	code: string;
	// Matched through a template like t(`errors.${code}`) rather than the literal key.
	pattern?: string;
}

function walk(directory: string, extensions: Array<string>, files: Array<string> = []) {
	for (const name of readdirSync(directory)) {
		if (name === "node_modules" || name.startsWith(".")) continue;
		const path = join(directory, name);
		if (statSync(path).isDirectory()) walk(path, extensions, files);
		else if (extensions.some((extension) => name.endsWith(extension))) files.push(path);
	}
	return files;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/app/[locale]/(app)/(authenticated)/settings/(account)/privacy/page.tsx → /settings/privacy
export function routeOf(file: string) {
	const match = /src\/app\/\[locale\]\/(.*)\/[^/]+$/.exec(file);
	if (!match) return null;
	return `/${match[1]!.split("/").filter((part) => !/^\(.*\)$/.test(part)).join("/")}`.replace(/\/$/, "") || "/";
}

function indexUsage(source: Map<Id, Message>) {
	const usage: Record<Id, Array<Usage>> = {};
	const add = (key: Id, value: Usage) => (usage[key] ??= []).push(value);

	const flirtualKeys = [...source.keys()].filter((key) => key.startsWith("flirtual:")).map((key) => parseId(key)[1]);
	const literalKeys = new Set(flirtualKeys);
	const attributeTypes = new Set([...source.keys()].filter((key) => key.startsWith("attributes:")).map((key) => parseId(key)[1].split(".")[0]!));

	const files = [
		...walk(join(root, "src"), [".ts", ".tsx"]),
		...walk(join(root, "ios/App/Watch"), [".swift"]),
		...walk(join(repositoryRoot, "apps/api/lib"), [".ex", ".heex"])
	];

	for (const path of files) {
		const file = relative(repositoryRoot, path);
		const lines = readFileSync(path, "utf8").split("\n");

		lines.forEach((code, index) => {
			const at = { file, line: index + 1, code: code.trim().slice(0, 240) };

			if (file.startsWith("apps/api/")) {
				for (const [, key] of code.matchAll(/dn?gettext\(\s*"notifications",\s*"([^"]+)"/g))
					add(id("notifications", key!), at);
				return;
			}

			for (const [, key] of code.matchAll(/["'`]([\w.-]+)["'`]/g)) {
				if (literalKeys.has(key!)) add(id("flirtual", key!), at);
				if (attributeTypes.has(key!) && /useAttribute|attributes?\(|tAttribute/.test(code)) add(id("attributes", key!), at);
			}

			for (const [, template] of code.matchAll(/`([^`]*\$\{[^`]*)`/g)) {
				const parts = template!.split(/\$\{[^}]*\}/);
				// `${a}${b}` or `${a}/x` match nearly every key; only templates with a real prefix or suffix count.
				if (Math.max(parts[0]!.length, parts.at(-1)!.length) < 3) continue;
				const pattern = new RegExp(`^${parts.map(escapeRegExp).join(".+")}$`);
				for (const key of flirtualKeys) {
					if (pattern.test(key)) add(id("flirtual", key), { ...at, pattern: template });
				}
			}
		});
	}
	return usage;
}

function sourceText(value: Message) {
	return Array.isArray(value) ? value.join(" | ") : value;
}

function main() {
	const { positional: [command, ...rest], flags } = parseArguments(process.argv.slice(2));
	const source = loadSource();

	switch (command) {
		case "usage": {
			const usage = indexUsage(source);
			writeJson(usagePath, usage);
			const unused = [...source.keys()].filter((key) => !key.startsWith("attributes:") && !usage[key]);
			console.log(`Indexed ${Object.keys(usage).length} keys; ${unused.length} keys have no code reference.`);
			break;
		}
		case "batches": {
			const size = Number(flags.size ?? 90);
			const usage = readJson<Record<Id, Array<Usage>>>(usagePath);
			const context = loadContext();
			const explanations = readJson<Record<Id, string>>(join(staging, "weblate/explanations.json"), {});
			const watch = watchIds(source);
			const all = flags.all === true;

			const pending = [...source.entries()].filter(([key, value]) => all || context[key]?.hash !== hash(value));

			// Attributes are batched per type: one type is one kind of thing (games, kinks, languages).
			const groups = new Map<string, Array<Id>>();
			for (const [key] of pending) {
				const [component, name] = parseId(key);
				const firstFile = usage[key]?.find((use) => !use.pattern)?.file ?? usage[key]?.[0]?.file ?? "unreferenced";
				const group = component === "attributes"
					? `attributes/${name.split(".")[0]}`
					: component === "notifications" ? "notifications" : firstFile.split("/").slice(0, -1).join("/");
				groups.set(group, [...(groups.get(group) ?? []), key]);
			}

			rmSync(batchDirectory, { recursive: true, force: true });
			const batches: Array<Array<Id>> = [];
			let current: Array<Id> = [];
			for (const [group, keys] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
				const attributes = group.startsWith("attributes/");
				if (current.length > 0 && (current.length + keys.length > size || attributes !== current[0]!.startsWith("attributes:"))) {
					batches.push(current);
					current = [];
				}
				current.push(...keys);
			}
			if (current.length > 0) batches.push(current);

			batches.forEach((keys, index) => {
				writeJson(join(batchDirectory, `${String(index + 1).padStart(2, "0")}.json`), keys.map((key) => ({
					id: key,
					en: sourceText(source.get(key)!),
					watch: watch.has(key) || undefined,
					existingExplanation: explanations[key] || undefined,
					previous: context[key],
					usage: key.startsWith("attributes:") ? undefined : usage[key]?.slice(0, 12)
				})));
			});

			const attributeUsage = Object.fromEntries(Object.entries(usage).filter(([key]) => key.startsWith("attributes:")));
			writeJson(join(batchDirectory, "attribute-types.json"), attributeUsage);
			console.log(`${pending.length} keys need context in ${batches.length} batches → ${relative(root, batchDirectory)}`);
			break;
		}
		case "merge": {
			const context = loadContext();
			const watch = watchIds(source);
			let merged = 0;
			const problems: Array<string> = [];

			for (const file of readdirSync(outputDirectory).filter((name) => name.endsWith(".json"))) {
				const raw = readJson<Record<string, Omit<ContextEntry, "hash">>>(join(outputDirectory, file));

				// "attributes:game.*.name" is a default for every matching key; exact keys override it.
				const entries: Record<string, Omit<ContextEntry, "hash">> = {};
				for (const [pattern, entry] of Object.entries(raw)) {
					if (!pattern.includes("*")) continue;
					const matcher = new RegExp(`^${pattern.split("*").map(escapeRegExp).join("[^.]+")}$`);
					for (const key of source.keys()) if (matcher.test(key)) entries[key] = entry;
				}
				for (const [key, entry] of Object.entries(raw)) {
					if (!key.includes("*")) entries[key] = { ...entries[key], ...entry };
				}

				for (const [key, entry] of Object.entries(entries)) {
					const value = source.get(key as Id);
					if (value === undefined) {
						problems.push(`${file}: unknown key ${key}`);
						continue;
					}
					if (!elements.includes(entry.element)) problems.push(`${file}: ${key} has unknown element "${entry.element}"`);
					if (!entry.description) problems.push(`${file}: ${key} has no description`);

					const previous = context[key as Id];
					context[key as Id] = {
						...entry,
						hash: hash(value),
						watch: watch.has(key as Id) || undefined,
						// Keep answers already given; a changed string can still reuse them.
						resolved: previous?.resolved ?? entry.resolved,
						needsHuman: previous?.resolved ? undefined : entry.needsHuman || undefined
					};
					merged++;
				}
			}
			saveContext(context);
			console.log(`Merged ${merged} entries; ${Object.keys(context).length}/${source.size} keys have context.`);
			for (const problem of problems) console.log(`  ! ${problem}`);
			break;
		}
		case "questions": {
			const context = loadContext();
			for (const [key, entry] of Object.entries(context)) {
				if (!entry.needsHuman) continue;
				console.log(`${key}\n  en: ${sourceText(source.get(key as Id) ?? "")}\n  q:  ${entry.needsHuman}\n`);
			}
			break;
		}
		case "resolve": {
			const [key, ...answer] = rest;
			const context = loadContext();
			const entry = context[key as Id];
			if (!entry) throw new Error(`No context entry for ${key}`);
			context[key as Id] = { ...entry, resolved: answer.join(" "), needsHuman: undefined };
			saveContext(context);
			break;
		}
		case "status": {
			const context = loadContext();
			const entries = Object.entries(context);
			const stale = [...source.entries()].filter(([key, value]) => context[key] && context[key].hash !== hash(value));
			console.log({
				keys: source.size,
				withContext: entries.length,
				missing: [...source.keys()].filter((key) => !context[key]).length,
				stale: stale.length,
				needsHuman: entries.filter(([, entry]) => entry.needsHuman).length,
				needsScreenshot: entries.filter(([, entry]) => entry.needsScreenshot).length
			});
			break;
		}
		default:
			console.log("Commands: usage, batches, merge, questions, resolve, status");
			process.exitCode = 1;
	}
}

if (isMain(import.meta.url)) main();
