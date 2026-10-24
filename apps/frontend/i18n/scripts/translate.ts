// Translation planning and staging. Usage: node i18n/scripts/translate.ts <command>
//
//   plan --locales ja,ko [--mode incremental|full] [--ids a,b] [--name run]
//       pick keys, write each locale's prompt bundle and batches
//   accept --locale ja --batch 03 --file out.json [--name run] [--no-lock]
//       validate a translator's output; stage what passes, queue retries
//   queue --locale ja [--name run]
//       move strings that still fail after retries to the maintainer's queue
//   review --locale ja --file review.json [--human] [--name run]
//       apply a reviewer's output: validated fixes replace staged drafts, disagreements are
//       collected for the maintainer; with --human, fixes to people's translations become
//       Weblate suggestions with a comment
//   status [--name run]
//
// Staged drafts live in .staging/translate/<run>/<locale>/; `weblate.ts drafts` uploads them.

import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

import type { Id, Message, TargetLocale } from "./common.ts";
import { hash, i18nRoot, isMain, isTargetLocale, loadSource, localesFlag, parseArguments, parseId, readJson, runDirectory, targetLocales, writeJson, writeText } from "./common.ts";
import type { ContextEntry } from "./context.ts";
import { loadContext } from "./context.ts";
import type { GlossaryEntry } from "./validate.ts";
import { loadGlossary, validateAll } from "./validate.ts";
import { loadPulled } from "./weblate.ts";

export const lockPath = join(i18nRoot, "translate.lock.json");

// For each id and locale, the hash of the English that was translated.
type Lock = Record<Id, Partial<Record<TargetLocale, string>>>;

function loadLock(): Lock {
	return readJson<Lock>(lockPath, {} as Lock);
}

function saveLock(lock: Lock) {
	writeJson(lockPath, Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b))));
}

const minimumBatch = 40;
const maximumBatch = 80;

// Long-form pages are batched alone so each gets the model's full attention.
function isLongForm(entry: ContextEntry | undefined) {
	return !!entry && (entry.group.startsWith("legal/") || entry.group.startsWith("news/") || entry.element === "legal" || entry.element === "news");
}

function batch(ids: Array<Id>, context: Record<Id, ContextEntry>): Array<Array<Id>> {
	const groups = new Map<string, Array<Id>>();
	for (const key of ids) {
		const group = context[key]?.group ?? parseId(key)[0];
		groups.set(group, [...(groups.get(group) ?? []), key]);
	}

	const batches: Array<Array<Id>> = [];
	let current: Array<Id> = [];
	const flush = () => {
		if (current.length > 0) batches.push(current);
		current = [];
	};

	for (const [group, keys] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		if (isLongForm(context[keys[0]!]) || keys.length >= maximumBatch) {
			flush();
			for (let index = 0; index < keys.length; index += maximumBatch) batches.push(keys.slice(index, index + maximumBatch));
			continue;
		}
		// Related groups share a batch; a new batch starts once one is reasonably full.
		const sameArea = current.length > 0 && context[current[0]!]?.group.split("/")[0] === group.split("/")[0];
		if (current.length + keys.length > maximumBatch || (current.length >= minimumBatch && !sameArea)) flush();
		current.push(...keys);
	}
	flush();
	return batches;
}

function englishText(value: Message) {
	return Array.isArray(value) ? value.map((form, index) => `[${index === 0 ? "singular" : "plural"}] ${form}`).join("\n") : value;
}

function contextNotes(entry: ContextEntry | undefined) {
	if (!entry) return "";
	const parts = [
		`${entry.element} · ${entry.screens.join(", ")}`,
		entry.description,
		entry.placeholders && `Placeholders: ${Object.entries(entry.placeholders).map(([name, value]) => `{${name}} = ${value.meaning} (e.g. ${value.example})`).join("; ")}`,
		entry.tags && `Tags: ${Object.entries(entry.tags).map(([name, value]) => `<${name}> = ${value}`).join("; ")}`,
		entry.tone && `Tone: ${entry.tone}`,
		entry.maxLength && `Max length: ${entry.maxLength}`,
		entry.lengthNote,
		entry.watch && "Apple Watch string: only {name} placeholders and empty <name/> tags, no plural/select",
		entry.readOnly && "Read-only: copy unchanged",
		entry.resolved && `Maintainer: ${entry.resolved}`
	];
	return parts.filter(Boolean).join(" | ");
}

function glossaryFor(locale: TargetLocale, glossary: Array<GlossaryEntry>) {
	return glossary.map((entry) => {
		const term = entry.terms?.[locale];
		const forbidden = [...entry.forbidden?.[locale] ?? [], ...entry.forbidden?.["*"] ?? [], ...term?.forbidden ?? []];
		const target = entry.untranslatable ? `${entry.en} (untranslatable)` : term ? [term.term, ...term.alternatives ?? []].join(" / ") : "(no fixed term)";
		const status = term?.status ?? entry.status;
		return `- **${entry.en}** → ${target}${status && status !== "decided" ? ` [${status}]` : ""}. ${entry.note}${term?.note ? ` ${term.note}.` : ""}${forbidden.length > 0 ? ` Never: ${forbidden.join(", ")}.` : ""}`;
	}).join("\n");
}

const neighbourLimit = 40;
const perWordLimit = 6;
const sampleSize = 60;
const stopwords = new Set(["and", "are", "but", "can", "for", "from", "has", "have", "here", "how", "into", "its", "just", "more", "not", "now", "one", "other", "our", "plural", "select", "that", "the", "their", "them", "then", "there", "they", "this", "was", "what", "when", "will", "with", "you", "your", "you're", "you'll"]);

function words(value: Message) {
	const text = englishText(value).replace(/\{\w+\}|<\/?[\w-]+\/?>/g, " ").toLowerCase();
	return new Set((text.match(/\p{L}[\p{L}'’-]{2,}/gu) ?? []).filter((word) => !stopwords.has(word)));
}

function shortestFirst(source: Map<Id, Message>) {
	return (a: Id, b: Id) => englishText(source.get(a)!).length - englishText(source.get(b)!).length || a.localeCompare(b);
}

// Small runs don't need the whole catalog for consistency: strings from the same screens,
// strings sharing words or glossary terms with the ones being translated, and a fixed sample of
// the rest of the app. Undefined means the selection is big enough to show everything.
function catalogSelection(focus: Array<Id>, source: Map<Id, Message>, context: Record<Id, ContextEntry>) {
	const selected = new Set<Id>(focus);
	const add = (keys: Iterable<Id>, limit: number) => [...keys].filter((key) => !selected.has(key)).sort(shortestFirst(source)).slice(0, limit).forEach((key) => selected.add(key));

	const neighbours = new Map<string, Array<Id>>();
	const byWord = new Map<string, Array<Id>>();
	const focusWords = new Set(focus.flatMap((key) => [...words(source.get(key)!)]));
	const focusText = focus.map((key) => englishText(source.get(key)!).toLowerCase()).join("\n");
	const terms = loadGlossary().map((entry) => entry.en.toLowerCase()).filter((term) => focusText.includes(term));
	const neighbourhoods = (key: Id) => {
		const [component, name] = parseId(key);
		if (component === "attributes") return [`type:${name.split(".")[0]}`];
		const entry = context[key];
		return entry ? [`group:${entry.group}`, ...entry.screens.map((screen) => `screen:${screen}`)] : [];
	};
	const wanted = new Set(focus.flatMap(neighbourhoods));

	for (const [key, value] of source) {
		for (const neighbourhood of neighbourhoods(key)) if (wanted.has(neighbourhood)) neighbours.set(neighbourhood, [...(neighbours.get(neighbourhood) ?? []), key]);
		const english = englishText(value).toLowerCase();
		const matches = [...[...words(value)].filter((word) => focusWords.has(word)), ...terms.filter((term) => english.includes(term))];
		for (const match of matches) byWord.set(match, [...(byWord.get(match) ?? []), key]);
	}
	for (const keys of neighbours.values()) add(keys, neighbourLimit);
	for (const keys of byWord.values()) add(keys, perWordLimit);

	// Spread across areas and kinds of string; ordered by hash so every run gets the same sample.
	const perArea = new Map<string, number>();
	const perElement = new Map<string, number>();
	let sampled = 0;
	const candidates = [...source.keys()]
		.filter((key) => !selected.has(key) && parseId(key)[0] !== "attributes" && context[key] && !context[key].readOnly && !isLongForm(context[key]) && englishText(source.get(key)!).length <= 120)
		.sort((a, b) => hash(a).localeCompare(hash(b)));
	for (const key of candidates) {
		if (sampled === sampleSize) break;
		const { element, group } = context[key]!;
		const area = group.split("/")[0]!;
		if ((perArea.get(area) ?? 0) >= 2 || (perElement.get(element) ?? 0) >= 5) continue;
		perArea.set(area, (perArea.get(area) ?? 0) + 1);
		perElement.set(element, (perElement.get(element) ?? 0) + 1);
		selected.add(key);
		sampled++;
	}
	const types = new Map<string, Array<Id>>();
	for (const key of source.keys()) {
		const [component, name] = parseId(key);
		if (component === "attributes") types.set(name.split(".")[0]!, [...(types.get(name.split(".")[0]!) ?? []), key]);
	}
	for (const keys of types.values()) add(keys.sort((a, b) => hash(a).localeCompare(hash(b))).slice(0, 3), 3);

	return selected.size > source.size / 2 ? undefined : selected;
}

// Everything a translator needs, identical for every batch of a locale.
function bundle(locale: TargetLocale, focus?: Array<Id>) {
	const source = loadSource();
	const context = loadContext();
	const pulled = loadPulled(locale);
	const humans = Object.entries(pulled).filter(([, unit]) => unit.human && unit.target[0]);
	const selection = focus && catalogSelection(focus, source, context);

	const lines = [
		`# Translation bundle: ${locale}`,
		"",
		readFileSync(join(i18nRoot, "style/shared.md"), "utf8"),
		"",
		readFileSync(join(i18nRoot, `style/${locale}.md`), "utf8"),
		"",
		"# Glossary",
		"",
		glossaryFor(locale, loadGlossary()),
		"",
		`# Human translations (${locale})`,
		"",
		"Written by native speakers. Match their terminology and voice. Every other existing translation is unreviewed machine output and isn't shown.",
		"",
		...humans.map(([key, unit]) => `- \`${key}\`: ${JSON.stringify(englishText(source.get(key as Id) ?? ""))} → ${JSON.stringify(unit.target.length > 1 ? unit.target : unit.target[0])}`),
		"",
		"# English catalog with context",
		"",
		"Use it to keep terminology and voice consistent across the whole app. App and notification strings have one line each: id, English, then a short note (element and the gist of where it's used). Attributes are listed per type under one shared note. The strings you translate come with their full notes in the batch.",
		...selection ? ["", "This run is small, so the catalog is a selection: strings from the same screens as yours, strings sharing words or glossary terms with them, and a fixed sample of the rest of the app."] : [],
		"",
		...catalog(source, context, selection)
	];
	return { text: lines.join("\n"), catalog: selection ? selection.size : source.size };
}

// The catalog is for consistency, not for translating; the first sentence of a note is enough.
function gist(description: string) {
	const sentence = description.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? description;
	return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}

function catalog(source: Map<Id, Message>, context: Record<Id, ContextEntry>, selection?: Set<Id>) {
	const lines: Array<string> = [];
	const types = new Map<string, Array<Id>>();

	for (const [key, value] of source) {
		const [component, name] = parseId(key);
		if (component === "attributes") {
			const type = name.split(".")[0]!;
			types.set(type, [...(types.get(type) ?? []), key]);
			continue;
		}
		if (selection && !selection.has(key)) continue;
		const entry = context[key];
		const english = englishText(value);
		// Long pages are translated in their own batches; the opening is enough for consistency.
		const shown = english.length > 600 ? `${english.slice(0, 300)}… [${english.length} characters]` : english;
		lines.push(`- \`${key}\`: ${JSON.stringify(shown)}${entry ? ` — ${entry.element}: ${gist(entry.description)}` : ""}`);
	}

	for (const [type, keys] of types) {
		const shown = selection ? keys.filter((key) => selection.has(key)) : keys;
		if (shown.length === 0) continue;
		// The most common description in a type is its shared note; per-key notes stay in batches.
		const counts = new Map<string, number>();
		for (const key of keys) counts.set(context[key]?.description ?? "", (counts.get(context[key]?.description ?? "") ?? 0) + 1);
		const shared = [...counts.entries()].sort(([, a], [, b]) => b - a)[0]![0];
		lines.push("", `## attributes: ${type}`, "", shared, "");
		for (const key of shown) lines.push(`- \`${key}\`: ${JSON.stringify(englishText(source.get(key)!))}`);
	}
	return lines;
}

function plan(locales: Array<TargetLocale>, mode: string, ids: Array<string> | undefined, name: string) {
	const source = loadSource();
	const context = loadContext();
	const lock = loadLock();

	for (const locale of locales) {
		const directory = runDirectory(name, locale);
		rmSync(join(directory, "batches"), { recursive: true, force: true });

		const pulled = loadPulled(locale);
		const candidates = (ids ?? [...source.keys()]) as Array<Id>;
		const toTranslate: Array<Id> = [];
		const humanReview: Array<Id> = [];

		for (const key of candidates) {
			const english = source.get(key);
			if (english === undefined) throw new Error(`Unknown key: ${key}`);
			if (context[key]?.readOnly) continue;
			if (!ids && mode === "incremental" && lock[key]?.[locale] === hash(english)) continue;
			// People's translations are never redrafted; they get an objective-errors review instead.
			if (pulled[key]?.human) humanReview.push(key);
			else toTranslate.push(key);
		}

		const batches = batch(toTranslate, context);
		batches.forEach((keys, index) => writeJson(join(directory, "batches", `${String(index + 1).padStart(2, "0")}.json`), keys.map((key) => ({
			id: key,
			en: source.get(key),
			context: contextNotes(context[key])
		}))));
		writeJson(join(directory, "human-review.json"), humanReview.map((key) => ({
			id: key,
			en: source.get(key),
			context: contextNotes(context[key]),
			translation: pulled[key]!.target.length > 1 ? pulled[key]!.target : pulled[key]!.target[0],
			author: pulled[key]!.human
		})));
		const { text, catalog } = bundle(locale, mode === "incremental" || ids ? [...toTranslate, ...humanReview] : undefined);
		writeJson(join(directory, "bundle.json"), { locale, mode, catalog, createdAt: new Date().toISOString() });
		writeText(join(directory, "bundle.md"), text);

		console.log(`${locale}: ${toTranslate.length} to translate in ${batches.length} batches, ${humanReview.length} human translations to review → ${directory}`);
	}
}

interface TranslatorOutput {
	translations: Record<string, Message>;
	notes?: Record<string, string>;
}

function accept(locale: TargetLocale, batchName: string, file: string, name: string, updateLock: boolean) {
	const directory = runDirectory(name, locale);
	const output = readJson<TranslatorOutput>(file);
	const expected = readJson<Array<{ id: Id }>>(join(directory, "batches", `${batchName}.json`)).map((item) => item.id);
	const results = validateAll(output.translations, locale);
	const source = loadSource();

	const draftsPath = join(directory, "drafts.json");
	const drafts = readJson<Record<string, { text: Message; hash: string; warnings?: Array<string>; note?: string }>>(draftsPath, {});
	const failures: Record<string, { text: Message; errors: Array<string> }> = {};
	const lock = loadLock();

	for (const key of expected) {
		const text = output.translations[key];
		if (text === undefined) {
			failures[key] = { text: "", errors: ["missing from output"] };
			continue;
		}
		const result = results[key]!;
		if (result.errors.length > 0) {
			failures[key] = { text, errors: result.errors };
			continue;
		}
		const englishHash = hash(source.get(key)!);
		drafts[key] = { text, hash: englishHash, warnings: result.warnings.length > 0 ? result.warnings : undefined, note: output.notes?.[key] };
		if (updateLock) (lock[key] ??= {})[locale] = englishHash;
	}

	writeJson(draftsPath, drafts);
	if (updateLock) saveLock(lock);

	const retryPath = join(directory, "retry", `${batchName}.json`);
	const attemptsPath = join(directory, "retry", `${batchName}.attempts.json`);
	const attempts = readJson<Record<string, number>>(attemptsPath, {});
	for (const key of Object.keys(failures)) attempts[key] = (attempts[key] ?? 0) + 1;
	for (const key of expected) if (!failures[key]) delete attempts[key];
	writeJson(retryPath, failures);
	writeJson(attemptsPath, attempts);

	const warned = expected.filter((key) => drafts[key]?.warnings).length;
	console.log(`${locale}/${batchName}: ${expected.length - Object.keys(failures).length} staged (${warned} with warnings), ${Object.keys(failures).length} failed`);
	for (const [key, failure] of Object.entries(failures)) console.log(`  ✗ ${key} (attempt ${attempts[key]}): ${failure.errors.join("; ")}`);
}

// After two retries a string goes to the maintainer instead of looping.
function queue(locale: TargetLocale, name: string) {
	const directory = runDirectory(name, locale);
	const retryDirectory = join(directory, "retry");
	if (!existsSync(retryDirectory)) return;
	const queuePath = join(directory, "queue.json");
	const queued = readJson<Record<string, unknown>>(queuePath, {});
	for (const file of readdirSync(retryDirectory).filter((name) => /^\d+\.json$/.test(name))) {
		const failures = readJson<Record<string, { text: Message; errors: Array<string> }>>(join(retryDirectory, file));
		const attempts = readJson<Record<string, number>>(join(retryDirectory, file.replace(".json", ".attempts.json")), {});
		for (const [key, failure] of Object.entries(failures)) {
			if ((attempts[key] ?? 0) >= 3) queued[key] = failure;
		}
	}
	writeJson(queuePath, queued);
	console.log(`${locale}: ${Object.keys(queued).length} strings queued for the maintainer → ${queuePath}`);
}

interface Review {
	verdict: "disagree" | "fix" | "ok";
	category?: string;
	comment?: string;
	suggestion?: Message;
}

function review(locale: TargetLocale, file: string, human: boolean, name: string) {
	const directory = runDirectory(name, locale);
	const reviews = readJson<{ reviews: Record<string, Review> }>(file).reviews;
	const suggestions = Object.fromEntries(Object.entries(reviews).filter(([, item]) => item.suggestion !== undefined).map(([key, item]) => [key, item.suggestion!]));
	const results = validateAll(suggestions, locale);

	if (human) {
		// Only objective errors reach here; the suggestion goes up beside the person's text, never over it.
		const path = join(directory, "human-review-results.json");
		const collected = readJson<Record<string, { suggestion?: Message; comment: string }>>(path, {});
		for (const [key, item] of Object.entries(reviews)) {
			if (item.verdict === "ok") continue;
			const valid = item.suggestion !== undefined && results[key]?.errors.length === 0;
			collected[key] = { suggestion: valid ? item.suggestion : undefined, comment: `${item.category ? `[${item.category}] ` : ""}${item.comment ?? ""}` };
		}
		writeJson(path, collected);
		console.log(`${locale}: ${Object.keys(collected).length} human translations flagged → ${path}`);
		return;
	}

	const draftsPath = join(directory, "drafts.json");
	const drafts = readJson<Record<string, { text: Message; hash: string; reviewed?: string }>>(draftsPath, {});
	const disagreementsPath = join(directory, "disagreements.json");
	const disagreements = readJson<Record<string, { draft: Message } & Review>>(disagreementsPath, {});
	let fixed = 0;
	for (const [key, item] of Object.entries(reviews)) {
		const draft = drafts[key];
		if (!draft) continue;
		if (item.verdict === "disagree") {
			disagreements[key] = { ...item, draft: draft.text };
			continue;
		}
		if (item.verdict === "fix" && item.suggestion !== undefined && results[key]?.errors.length === 0) {
			drafts[key] = { ...draft, text: item.suggestion, reviewed: item.category };
			fixed++;
		}
	}
	writeJson(draftsPath, drafts);
	writeJson(disagreementsPath, disagreements);
	console.log(`${locale}: ${fixed} fixes applied, ${Object.keys(disagreements).length} disagreements for the maintainer → ${disagreementsPath}`);
}

function status(name: string) {
	for (const locale of targetLocales) {
		const directory = runDirectory(name, locale);
		if (!existsSync(directory)) continue;
		const batches = existsSync(join(directory, "batches")) ? readdirSync(join(directory, "batches")).length : 0;
		const drafts = Object.keys(readJson<Record<string, unknown>>(join(directory, "drafts.json"), {})).length;
		const queued = Object.keys(readJson<Record<string, unknown>>(join(directory, "queue.json"), {})).length;
		console.log(`${locale}: ${batches} batches, ${drafts} drafts staged, ${queued} queued`);
	}
}

function main() {
	const { positional: [command], flags } = parseArguments(process.argv.slice(2));
	const name = typeof flags.name === "string" ? flags.name : "current";
	const locale = String(flags.locale ?? "");

	switch (command) {
		case "plan":
			plan(localesFlag(flags.locales), String(flags.mode ?? "incremental"), typeof flags.ids === "string" ? flags.ids.split(",") : undefined, name);
			break;
		case "accept":
			if (!isTargetLocale(locale) || typeof flags.batch !== "string" || typeof flags.file !== "string") throw new Error("accept --locale <locale> --batch <nn> --file <output.json>");
			accept(locale, flags.batch, flags.file, name, flags["no-lock"] !== true);
			break;
		case "queue":
			if (!isTargetLocale(locale)) throw new Error("queue --locale <locale>");
			queue(locale, name);
			break;
		case "review":
			if (!isTargetLocale(locale) || typeof flags.file !== "string") throw new Error("review --locale <locale> --file <review.json> [--human]");
			review(locale, flags.file, flags.human === true, name);
			break;
		case "status":
			status(name);
			break;
		default:
			console.log("Commands: plan, accept, review, queue, status");
			process.exitCode = 1;
	}
}

if (isMain(import.meta.url)) main();
