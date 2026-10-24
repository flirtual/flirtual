// Checks draft translations before they're staged or uploaded.
// Usage: node i18n/scripts/validate.ts <drafts.json> --locale ja [--out report.json]
// A drafts file maps ids ("flirtual:key") to a string (or an array of gettext plural forms).

import { join } from "node:path";

import { parse, TYPE } from "@formatjs/icu-messageformat-parser";
import type { MessageFormatElement } from "@formatjs/icu-messageformat-parser";

import type { Id, Message, TargetLocale } from "./common.ts";
import { components, gettextPluralCount, i18nRoot, isMain, isTargetLocale, loadSource, parseArguments, parseId, readJson, writeJson } from "./common.ts";
import type { ContextEntry, ContextFile } from "./context.ts";
import { compactElements, loadContext } from "./context.ts";

export interface GlossaryTerm {
	term: string;
	alternatives?: Array<string>;
	forbidden?: Array<string>;
	note?: string;
	status?: string;
}

export interface GlossaryEntry {
	id: string;
	en: string;
	note: string;
	untranslatable?: boolean;
	match?: string;
	matchFlags?: string;
	status?: string;
	terms?: Partial<Record<TargetLocale, GlossaryTerm>>;
	forbidden?: Partial<Record<"*" | TargetLocale, Array<string>>>;
	// Other entries whose terms also satisfy this one (e.g. the moderation sense of NSFW).
	acceptAlso?: Array<string>;
}

export function loadGlossary(): Array<GlossaryEntry> {
	return readJson<{ entries: Array<GlossaryEntry> }>(join(i18nRoot, "style/glossary.json")).entries;
}

export interface Result {
	errors: Array<string>;
	warnings: Array<string>;
}

// East Asian wide characters take two columns, which is what matters for fitting a button.
const wideRanges: Array<[number, number]> = [
	[0x1100, 0x115F],
	[0x2E80, 0xA4CF],
	[0xAC00, 0xD7A3],
	[0xF900, 0xFAFF],
	[0xFE30, 0xFE4F],
	[0xFF00, 0xFF60],
	[0xFFE0, 0xFFE6]
];

export function width(text: string) {
	let total = 0;
	for (const character of text) {
		const code = character.codePointAt(0)!;
		total += wideRanges.some(([start, end]) => code >= start && code <= end) ? 2 : 1;
	}
	return total;
}

interface Structure {
	arguments: Set<string>;
	tags: Set<string>;
	tagsWithContent: Set<string>;
	plurals: Array<{ name: string; ordinal: boolean; options: Array<string> }>;
	selects: Array<{ name: string; options: Array<string> }>;
	formatted: boolean;
}

function structure(elements: Array<MessageFormatElement>, into: Structure = {
	arguments: new Set(),
	tags: new Set(),
	tagsWithContent: new Set(),
	plurals: [],
	selects: [],
	formatted: false
}): Structure {
	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal:
				// The parser leaves self-closing tags (<br/>, <name/>) as literal text.
				for (const [, tag] of element.value.matchAll(/<([A-Z_][\w-]*)\s*\/>/gi)) into.tags.add(tag!);
				break;
			case TYPE.argument:
				into.arguments.add(element.value);
				break;
			case TYPE.number:
			case TYPE.date:
			case TYPE.time:
				into.arguments.add(element.value);
				into.formatted = true;
				break;
			case TYPE.tag:
				into.tags.add(element.value);
				if (element.children.length > 0) into.tagsWithContent.add(element.value);
				structure(element.children, into);
				break;
			case TYPE.plural:
				into.arguments.add(element.value);
				into.formatted = true;
				into.plurals.push({ name: element.value, ordinal: element.pluralType === "ordinal", options: Object.keys(element.options) });
				for (const option of Object.values(element.options)) structure(option.value, into);
				break;
			case TYPE.select:
				into.arguments.add(element.value);
				into.formatted = true;
				into.selects.push({ name: element.value, options: Object.keys(element.options) });
				for (const option of Object.values(element.options)) structure(option.value, into);
				break;
		}
	}
	return into;
}

// `many` in es/fr/pt only covers numbers like 1,000,000 and falls back to `other`.
const optionalCategories: Partial<Record<TargetLocale, Array<string>>> = {
	es: ["many"],
	fr: ["many"],
	pt: ["many"],
	"pt-BR": ["many"]
};

function pluralCategories(locale: TargetLocale, ordinal: boolean) {
	const all = new Intl.PluralRules(locale, { type: ordinal ? "ordinal" : "cardinal" }).resolvedOptions().pluralCategories as Array<string>;
	const optional = ordinal ? [] : optionalCategories[locale] ?? [];
	return { all, required: all.filter((category) => !optional.includes(category)) };
}

function difference(a: Set<string>, b: Set<string>) {
	return [...a].filter((value) => !b.has(value));
}

function checkIcu(english: string, translation: string, locale: TargetLocale, watch: boolean, result: Result) {
	let source: Structure;
	let target: Structure;
	try {
		source = structure(parse(english));
	}
	catch {
		return;
	}
	try {
		target = structure(parse(translation));
	}
	catch (reason) {
		result.errors.push(`invalid ICU: ${(reason as Error).message}`);
		return;
	}

	const missing = difference(source.arguments, target.arguments);
	const extra = difference(target.arguments, source.arguments);
	if (missing.length > 0) result.errors.push(`missing placeholder(s) ${missing.map((name) => `{${name}}`).join(", ")}${/'[{<]/.test(translation) ? " (an apostrophe before { or < escapes it; use ’)" : ""}`);
	if (extra.length > 0) result.errors.push(`unknown placeholder(s) ${extra.map((name) => `{${name}}`).join(", ")}`);

	const missingTags = difference(source.tags, target.tags);
	const extraTags = difference(target.tags, source.tags);
	if (missingTags.length > 0) result.errors.push(`missing tag(s) ${missingTags.map((tag) => `<${tag}>`).join(", ")}`);
	if (extraTags.length > 0) result.errors.push(`unknown tag(s) ${extraTags.map((tag) => `<${tag}>`).join(", ")}`);

	for (const plural of target.plurals) {
		const { all, required } = pluralCategories(locale, plural.ordinal);
		const named = plural.options.filter((option) => !option.startsWith("="));
		const absent = required.filter((category) => !named.includes(category));
		const unused = named.filter((category) => !all.includes(category));
		if (absent.length > 0) result.errors.push(`{${plural.name}} plural is missing ${locale} categories: ${absent.join(", ")}`);
		if (unused.length > 0) result.warnings.push(`{${plural.name}} plural has categories ${locale} never uses: ${unused.join(", ")}`);
	}

	for (const select of source.selects) {
		const translated = target.selects.find((candidate) => candidate.name === select.name);
		if (!translated) continue;
		const absent = select.options.filter((option) => !translated.options.includes(option));
		const unknown = translated.options.filter((option) => !select.options.includes(option));
		if (absent.length > 0 || unknown.length > 0) result.errors.push(`{${select.name}} select options must match English (${select.options.join(", ")})`);
	}

	if (watch) {
		if (target.formatted) result.errors.push("watch string: no plural, select, number or date formatting (the watch only fills {name} and empty <name/>)");
		if (target.tagsWithContent.size > 0) result.errors.push(`watch string: tags must be empty (<${[...target.tagsWithContent][0]}/>)`);
	}
}

function checkGettext(english: Message, translation: Message, locale: TargetLocale, result: Result) {
	const forms = Array.isArray(translation) ? translation : [translation];
	if (Array.isArray(english) && forms.length !== gettextPluralCount[locale])
		result.errors.push(`gettext plural needs ${gettextPluralCount[locale]} form(s) for ${locale}, got ${forms.length}`);

	const sourceText = Array.isArray(english) ? english.join("\n") : english;
	const placeholders = (text: string) => new Set([...text.matchAll(/%\{(\w+)\}/g)].map(([, name]) => name!));
	const tags = (text: string) => [...text.matchAll(/<\/?([a-z][a-z0-9]*)\b/gi)].map(([, tag]) => tag!.toLowerCase()).sort().join(",");

	for (const form of forms) {
		// A singular form may leave out the count ("Someone liked you!").
		const missing = difference(placeholders(sourceText), placeholders(form)).filter((name) => !(Array.isArray(english) && name === "count"));
		const unknown = difference(placeholders(form), placeholders(sourceText));
		if (missing.length > 0) result.errors.push(`missing placeholder(s) ${missing.map((name) => `%{${name}}`).join(", ")}`);
		if (unknown.length > 0) result.errors.push(`unknown placeholder(s) ${unknown.map((name) => `%{${name}}`).join(", ")}`);
		if (!Array.isArray(english) && tags(form) !== tags(english)) result.errors.push("HTML tags must match the English exactly");
		for (const [literal] of sourceText.matchAll(/#\{\w+\}/g)) {
			if (!form.includes(literal)) result.errors.push(`keep ${literal} exactly as written`);
		}
	}
}

// What a user reads: literal text only, without placeholder names, select keys or markup.
function visibleText(message: string) {
	const collect = (elements: Array<MessageFormatElement>): string => elements.map((element) => {
		if (element.type === TYPE.literal) return element.value.replace(/<[^>]*>/g, " ");
		if (element.type === TYPE.tag) return collect(element.children);
		if (element.type === TYPE.plural || element.type === TYPE.select) return Object.values(element.options).map((option) => collect(option.value)).join(" ");
		return " ";
	}).join("");
	try {
		return collect(parse(message));
	}
	catch {
		return message.replace(/[#%]?\{\w+\}|<[^>]*>/g, " ");
	}
}

function includes(text: string, term: string) {
	return text.toLocaleLowerCase().includes(term.toLocaleLowerCase());
}

function checkGlossary(english: string, translation: string, locale: TargetLocale, glossary: Array<GlossaryEntry>, result: Result) {
	const visible = visibleText(translation);
	for (const entry of glossary) {
		const forbidden = [...entry.forbidden?.[locale] ?? [], ...entry.forbidden?.["*"] ?? [], ...entry.terms?.[locale]?.forbidden ?? []];
		for (const term of forbidden) {
			if (includes(visible, term)) result.errors.push(`glossary "${entry.id}": never use "${term}"`);
		}

		if (!entry.match || !new RegExp(entry.match, entry.matchFlags ?? "").test(english)) continue;
		if (entry.untranslatable) {
			if (!translation.includes(entry.en)) result.errors.push(`glossary "${entry.id}": keep "${entry.en}" untranslated`);
			continue;
		}
		const term = entry.terms?.[locale];
		const accepted = [entry, ...glossary.filter((other) => entry.acceptAlso?.includes(other.id))]
			.flatMap((candidate) => [candidate.terms?.[locale]?.term, ...candidate.terms?.[locale]?.alternatives ?? []])
			.filter((candidate): candidate is string => !!candidate);
		if (term && !accepted.some((candidate) => includes(visible, candidate)))
			result.warnings.push(`glossary "${entry.id}": expected "${term.term}"`);
	}
}

function checkStyle(english: string, translation: string, locale: TargetLocale, entry: ContextEntry | undefined, result: Result) {
	if (locale === "fr" && /\p{L}·\p{L}/u.test(translation)) result.errors.push("no inclusive writing (point médian); rephrase to avoid agreement");
	if (locale === "ja") {
		if (/[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}][!?]|[!?][\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]/u.test(translation)) result.warnings.push("use full-width ！？ in Japanese text");
		if (/[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}] [\da-z]|[\da-z] [\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}]/iu.test(translation)) result.warnings.push("no space between Japanese and Latin text");
		if (translation.includes("あなた")) result.warnings.push("あなた: drop the pronoun if a native app would");
		if (/(?<!…)…(?!…)/.test(translation)) result.warnings.push("Japanese ellipsis is …… (two characters)");
	}
	if (locale === "ko" && translation.includes("당신")) result.warnings.push("당신: drop the pronoun if a native app would");

	if (translation.trim() === "") result.errors.push("empty translation");
	else if (translation === english && /\p{L}{3}/u.test(english) && !/^https?:/.test(english) && entry?.group !== "attributes/game")
		result.warnings.push("identical to English");

	if (english.trim() !== english || translation.trim() !== translation) {
		if (english.match(/^\s*/)![0] !== translation.match(/^\s*/)![0] || english.match(/\s*$/)![0] !== translation.match(/\s*$/)![0])
			result.warnings.push("leading/trailing whitespace differs from English");
	}

	if (entry && compactElements.has(entry.element)) {
		const limit = Math.max(Math.ceil(width(english) * 1.5), width(english) + 6);
		if (width(translation) > limit) result.warnings.push(`long for a ${entry.element}: width ${width(translation)} vs English ${width(english)}`);
	}
	if (entry?.maxLength && width(translation) > entry.maxLength) result.errors.push(`over maxLength ${entry.maxLength} (width ${width(translation)})`);
}

export function validate(key: Id, translation: Message, locale: TargetLocale, source: Map<Id, Message>, context: ContextFile, glossary: Array<GlossaryEntry>): Result {
	const result: Result = { errors: [], warnings: [] };
	const english = source.get(key);
	if (english === undefined) return { errors: ["unknown key"], warnings: [] };

	const entry = context[key];
	const [component] = parseId(key);

	if (entry?.readOnly) {
		if (JSON.stringify(translation) !== JSON.stringify(english)) result.errors.push("read-only: must stay identical to the English");
		return result;
	}

	if (components[component].format === "gettext") {
		checkGettext(english, translation, locale, result);
	}
	else if (typeof translation !== "string" || typeof english !== "string") {
		result.errors.push("expected a single string");
		return result;
	}
	else {
		checkIcu(english, translation, locale, !!entry?.watch, result);
	}

	const englishText = Array.isArray(english) ? english.join("\n") : english;
	for (const form of Array.isArray(translation) ? translation : [translation]) {
		checkGlossary(englishText, form, locale, glossary, result);
		checkStyle(Array.isArray(english) ? english.at(-1)! : english, form, locale, entry, result);
	}
	return result;
}

export function validateAll(drafts: Record<string, Message>, locale: TargetLocale) {
	const source = loadSource();
	const context = loadContext();
	const glossary = loadGlossary();
	return Object.fromEntries(Object.entries(drafts).map(([key, value]) => [key, validate(key as Id, value, locale, source, context, glossary)]));
}

function main() {
	const { positional: [file], flags } = parseArguments(process.argv.slice(2));
	const locale = String(flags.locale ?? "");
	if (!file || !isTargetLocale(locale)) {
		console.log("Usage: validate.ts <drafts.json> --locale <locale> [--out report.json]");
		process.exitCode = 1;
		return;
	}

	// Accepts a plain drafts map or a translator's output ({ translations, rationale, notes }).
	const raw = readJson<{ translations?: Record<string, Message> } & Record<string, Message>>(file);
	const results = validateAll(raw.translations ?? raw, locale);
	let errors = 0;
	let warnings = 0;
	for (const [key, result] of Object.entries(results)) {
		errors += result.errors.length > 0 ? 1 : 0;
		warnings += result.warnings.length > 0 ? 1 : 0;
		for (const error of result.errors) console.log(`✗ ${key}: ${error}`);
		for (const warning of result.warnings) console.log(`! ${key}: ${warning}`);
	}
	console.log(`${Object.keys(results).length} strings: ${errors} with errors, ${warnings} with warnings`);
	if (typeof flags.out === "string") writeJson(flags.out, results);
	if (errors > 0) process.exitCode = 1;
}

if (isMain(import.meta.url)) main();
