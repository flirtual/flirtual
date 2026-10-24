// Weblate sync. Run from apps/frontend: node --env-file=.env.weblate i18n/scripts/weblate.ts <command>
//
//   pull [--locales ja,ko]                     units, history and human authorship → .staging/weblate
//   locales [--apply]                          add missing target locales to components
//   context [--apply]                          source-string explanations and read-only flags from context.json
//   glossary [--apply]                         sync style/glossary.json to the Weblate glossary
//   drafts --name <run> [--locales ja] [--apply]
//       upload staged drafts: "needs editing" where the text is empty or not written by a person,
//       a suggestion where a person wrote it; human-review fixes become suggestions with a comment
//
// Commands that write print a per-locale plan first and change nothing unless given --apply.
// Screenshots are uploaded by screenshots.ts, only after approval.

import { join } from "node:path";

import type { ComponentName, Id, Message, TargetLocale } from "./common.ts";
import { componentNames, hash, id, isMain, localesFlag, parseArguments, readJson, runDirectory, staging, targetLocales, weblateLanguage, writeJson } from "./common.ts";
import type { ContextEntry } from "./context.ts";
import { loadContext } from "./context.ts";
import type { GlossaryEntry } from "./validate.ts";
import { loadGlossary } from "./validate.ts";
import type { Change, Unit } from "./weblate-api.ts";
import { AgreementError, contentActions, isHuman, list, project, request, states, username } from "./weblate-api.ts";

const weblateDirectory = join(staging, "weblate");

export interface PulledUnit {
	unit: number;
	target: Array<string>;
	state: number;
	// Set when a person (not MT, an add-on, a git import or a bot) wrote the current text.
	human?: string;
}

export type Pulled = Record<Id, PulledUnit>;

export function pulledPath(component: ComponentName, locale: string) {
	return join(weblateDirectory, `${component}.${locale}.json`);
}

export function loadPulled(locale: TargetLocale): Pulled {
	return Object.assign({}, ...componentNames.map((component) => readJson<Pulled>(pulledPath(component, locale), {} as Pulled)));
}

// History is append-only, so only fetch what's new since the last pull.
async function changes(component: string) {
	const path = join(weblateDirectory, `changes-${component}.json`);
	const cached = readJson<Array<Change>>(path, []);
	const after = cached.at(-1)?.timestamp;
	const fresh = await list<Change>(`components/${project}/${component}/changes/${after ? `?timestamp_after=${encodeURIComponent(after)}` : ""}`);
	const seen = new Set(cached.map((change) => `${change.timestamp}|${change.unit}|${change.action}`));
	const merged = [...cached, ...fresh.filter((change) => !seen.has(`${change.timestamp}|${change.unit}|${change.action}`))]
		.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
	writeJson(path, merged);
	return merged;
}

// The text of each unit that people have written, keyed by unit URL, with who wrote it.
function humanTexts(history: Array<Change>) {
	const texts = new Map<string, Map<string, string>>();
	for (const change of history) {
		if (!change.unit || !contentActions.has(change.action)) continue;
		// An accepted suggestion belongs to whoever suggested it.
		const author = username(change.action === 7 ? change.author ?? change.user : change.user);
		if (!isHuman(author)) continue;
		const byText = texts.get(change.unit) ?? new Map<string, string>();
		byText.set(change.target, author!);
		texts.set(change.unit, byText);
	}
	return texts;
}

function humanAuthor(unit: Unit, texts: Map<string, string> | undefined) {
	if (!unit.target[0]) return;
	return texts?.get(unit.target.join("\u001E")) ?? texts?.get(unit.target[0]);
}

async function availableLocales(component: string) {
	const translations = await list<{ language: { code: string } }>(`components/${project}/${component}/translations/`);
	return new Set(translations.map((translation) => translation.language.code));
}

async function pull(locales: Array<TargetLocale>) {
	const explanations: Record<Id, string> = {};

	for (const component of componentNames) {
		const sources = await list<Unit>(`translations/${project}/${component}/en/units/`);
		for (const unit of sources) {
			if (unit.explanation) explanations[id(component, unit.context)] = unit.explanation;
		}
		writeJson(join(weblateDirectory, `${component}.en.json`), Object.fromEntries(sources.map((unit) => [
			id(component, unit.context),
			{ unit: unit.id, explanation: unit.explanation, extraFlags: unit.extra_flags }
		])));

		const human = humanTexts(await changes(component));
		const available = await availableLocales(component);

		for (const locale of locales) {
			if (!available.has(weblateLanguage(locale))) {
				console.log(`${component}/${locale}: not in Weblate`);
				continue;
			}
			const units = await list<Unit>(`translations/${project}/${component}/${weblateLanguage(locale)}/units/`);
			const pulled: Pulled = {};
			for (const unit of units) {
				pulled[id(component, unit.context)] = { unit: unit.id, target: unit.target, state: unit.state, human: humanAuthor(unit, human.get(unit.url)) };
			}
			writeJson(pulledPath(component, locale), pulled);
			const humans = Object.values(pulled).filter((unit) => unit.human).length;
			console.log(`${component}/${locale}: ${units.length} units, ${humans} written by people`);
		}
	}

	writeJson(join(weblateDirectory, "explanations.json"), explanations);
}

// Runs writes a few at a time; stops everything on a contributor-agreement error.
async function runWrites(writes: Array<{ label: string; run: () => Promise<unknown> }>) {
	let done = 0;
	const failures: Array<string> = [];
	const queue = [...writes];
	await Promise.all(Array.from({ length: 2 }, async () => {
		for (let write = queue.shift(); write; write = queue.shift()) {
			try {
				await write.run();
				done++;
			}
			catch (reason) {
				if (reason instanceof AgreementError) {
					queue.length = 0;
					throw new Error(`Stopped: Weblate's contributor agreement blocked a write (${write.label}). The project token should be exempt; check with the maintainer before retrying.`);
				}
				failures.push(`${write.label}: ${(reason as Error).message}`);
			}
		}
	}));
	console.log(`${done}/${writes.length} writes done`);
	for (const failure of failures) console.log(`  ✗ ${failure}`);
}

async function locales(apply: boolean) {
	const writes = [];
	for (const component of componentNames) {
		const available = await availableLocales(component);
		const missing = targetLocales.filter((locale) => !available.has(weblateLanguage(locale)));
		console.log(`${component}: missing ${missing.length > 0 ? missing.join(", ") : "none"}`);
		for (const locale of missing) {
			writes.push({
				label: `${component}/${locale}`,
				run: () => request("POST", `components/${project}/${component}/translations/`, { language_code: weblateLanguage(locale) })
			});
		}
	}
	if (apply) await runWrites(writes);
}

const contextMarker = "— Context from the code —";

function explanation(entry: ContextEntry) {
	const lines = [
		`Where: ${entry.screens.join(", ")} (${entry.element})`,
		entry.description,
		...Object.entries(entry.placeholders ?? {}).map(([name, value]) => `{${name}}: ${value.meaning}, e.g. "${value.example}"`),
		...Object.entries(entry.tags ?? {}).map(([name, value]) => `<${name}>: ${value}`),
		entry.tone && `Tone: ${entry.tone}`,
		entry.maxLength && `Keep it within about ${entry.maxLength} characters.`,
		entry.lengthNote,
		entry.watch && "Also shown on the Apple Watch: no plural or select formatting.",
		entry.resolved
	];
	return lines.filter(Boolean).join("\n");
}

// A maintainer's own explanation is kept verbatim above the generated part.
function mergeExplanation(current: string, generated: string) {
	const index = current.indexOf(contextMarker);
	const human = (index === -1 ? current : current.slice(0, index)).trim();
	return human ? `${human}\n\n${contextMarker}\n${generated}` : `${contextMarker}\n${generated}`;
}

function withFlag(flags: string, flag: string) {
	const list = flags.split(",").map((value) => value.trim()).filter(Boolean);
	return list.includes(flag) ? flags : [...list, flag].join(", ");
}

async function context(apply: boolean) {
	const entries = loadContext();
	const writes = [];
	const counts = { explanation: 0, unchanged: 0, readOnly: 0, safeHtml: 0, missing: 0 };

	for (const component of componentNames) {
		// Fresh, so a rerun after a partial failure only writes what's still missing.
		const units = await list<Unit>(`translations/${project}/${component}/en/units/`);
		const sources = Object.fromEntries(units.map((unit) => [id(component, unit.context), { unit: unit.id, explanation: unit.explanation, extraFlags: unit.extra_flags }]));
		for (const [key, source] of Object.entries(sources)) {
			const entry = entries[key as Id];
			if (!entry) {
				counts.missing++;
				continue;
			}
			const patch: Record<string, string> = {};
			const next = mergeExplanation(source.explanation, explanation(entry));
			if (next !== source.explanation) patch.explanation = next;
			if (entry.readOnly && withFlag(source.extraFlags, "read-only") !== source.extraFlags) {
				patch.extra_flags = withFlag(source.extraFlags, "read-only");
				counts.readOnly++;
			}
			if (component === "notifications" && key.endsWith("_html")) {
				const flags = withFlag(patch.extra_flags ?? source.extraFlags, "safe-html");
				if (flags !== (patch.extra_flags ?? source.extraFlags)) {
					patch.extra_flags = flags;
					counts.safeHtml++;
				}
			}
			if (Object.keys(patch).length === 0) {
				counts.unchanged++;
				continue;
			}
			if (patch.explanation) counts.explanation++;
			writes.push({ label: key, run: () => request("PATCH", `units/${source.unit}/`, patch) });
		}
	}
	console.log(`Source strings: ${counts.explanation} explanations to set, ${counts.readOnly} to mark read-only, ${counts.safeHtml} to flag safe-html, ${counts.unchanged} unchanged, ${counts.missing} without context`);
	if (apply) await runWrites(writes);
	else for (const write of writes) console.log(`  ${write.label}`);
}

function glossaryExplanation(entry: GlossaryEntry) {
	const forbidden = Object.entries(entry.forbidden ?? {}).map(([locale, terms]) => `${locale === "*" ? "all" : locale}: ${terms!.join(", ")}`);
	return [entry.note, forbidden.length > 0 && `Never use: ${forbidden.join("; ")}`].filter(Boolean).join("\n");
}

// Terms typed into Weblate's UI can carry non-breaking spaces ("Homie\u00A0Mode").
function sameTerm(a: string | undefined, b: string) {
	return a?.replace(/\s/g, " ") === b.replace(/\s/g, " ");
}

async function glossary(apply: boolean) {
	const entries = loadGlossary();
	const component = "glossary";
	const human = humanTexts(await changes(component));
	const sources = await list<Unit>(`translations/${project}/${component}/en/units/`);
	const writes = [];
	const plan: Array<string> = [];

	for (const entry of entries) {
		const existing = sources.find((unit) => sameTerm(unit.source[0], entry.en));
		const flags = entry.untranslatable ? "terminology, read-only" : "terminology";
		if (!existing) {
			plan.push(`add term "${entry.en}"`);
			writes.push({
				label: `add ${entry.en}`,
				run: async () => {
					await request("POST", `translations/${project}/${component}/en/units/`, { source: [entry.en], context: entry.id });
					const [created] = await list<Unit>(`translations/${project}/${component}/en/units/?q=${encodeURIComponent(`source:="${entry.en}"`)}`);
					await request("PATCH", `units/${created!.id}/`, { explanation: glossaryExplanation(entry), extra_flags: flags });
				}
			});
		}
		else if (existing.explanation !== glossaryExplanation(entry) || existing.extra_flags !== flags) {
			plan.push(`update "${entry.en}" explanation/flags`);
			writes.push({ label: `update ${entry.en}`, run: () => request("PATCH", `units/${existing.id}/`, { explanation: glossaryExplanation(entry), extra_flags: flags }) });
		}
	}

	for (const locale of targetLocales) {
		const units = await list<Unit>(`translations/${project}/${component}/${weblateLanguage(locale)}/units/`);
		for (const entry of entries) {
			if (entry.untranslatable) continue;
			const term = entry.terms?.[locale];
			if (!term) continue;
			const unit = units.find((candidate) => sameTerm(candidate.source[0], entry.en));
			const state = (term.status ?? entry.status) === "decided" ? states.translated : states.needsEditing;
			if (unit && unit.target[0] === term.term && unit.state === state) continue;

			const author = unit ? humanAuthor(unit, human.get(unit.url)) : undefined;
			if (author) {
				plan.push(`${locale}: suggest "${term.term}" for "${entry.en}" (current "${unit!.target[0]}" by ${author})`);
				writes.push({ label: `${locale} ${entry.en}`, run: () => request("POST", `units/${unit!.id}/suggestions/`, { target: [term.term] }) });
				continue;
			}
			plan.push(`${locale}: "${entry.en}" → "${term.term}"${state === states.needsEditing ? " (needs editing)" : ""}`);
			writes.push({
				label: `${locale} ${entry.en}`,
				run: async () => {
					const target = unit ?? (await list<Unit>(`translations/${project}/${component}/${weblateLanguage(locale)}/units/?q=${encodeURIComponent(`source:="${entry.en}"`)}`))[0];
					if (!target) throw new Error("term not found in this language yet; run again after the source term is added");
					await request("PATCH", `units/${target.id}/`, { target: [term.term], state });
				}
			});
		}
	}

	for (const line of plan) console.log(`  ${line}`);
	console.log(`Glossary: ${writes.length} writes`);
	if (apply) await runWrites(writes);
}

interface StagedDraft {
	text: Message;
	hash: string;
}

interface HumanReviewResult {
	suggestion?: Message;
	comment: string;
}

async function drafts(name: string, locales: Array<TargetLocale>, apply: boolean) {
	await pull(locales);

	for (const locale of locales) {
		const directory = runDirectory(name, locale);
		const staged = readJson<Record<Id, StagedDraft>>(join(directory, "drafts.json"), {});
		const reviewed = readJson<Record<Id, HumanReviewResult>>(join(directory, "human-review-results.json"), {});
		const uploadedPath = join(directory, "uploaded.json");
		const uploaded = readJson<Record<string, string>>(uploadedPath, {});
		const pulled = loadPulled(locale);
		const counts = { empty: 0, replaceMachine: 0, suggestion: 0, comment: 0, same: 0, unavailable: 0, readOnly: 0, done: 0 };
		const writes = [];

		for (const [key, draft] of Object.entries(staged) as Array<[Id, StagedDraft]>) {
			const target = Array.isArray(draft.text) ? draft.text : [draft.text];
			const unit = pulled[key];
			const textHash = hash(draft.text);
			if (uploaded[key] === textHash) {
				counts.done++;
				continue;
			}
			if (!unit) {
				counts.unavailable++;
				continue;
			}
			if (unit.state === states.readOnly) {
				counts.readOnly++;
				continue;
			}
			if (unit.target.join("\u001E") === target.join("\u001E")) {
				counts.same++;
				continue;
			}
			const record = () => {
				uploaded[key] = textHash;
			};
			if (unit.human) {
				counts.suggestion++;
				writes.push({ label: key, run: async () => {
					await request("POST", `units/${unit.unit}/suggestions/`, { target });
					record();
				} });
			}
			else {
				if (unit.target[0]) counts.replaceMachine++;
				else counts.empty++;
				writes.push({ label: key, run: async () => {
					await request("PATCH", `units/${unit.unit}/`, { target, state: states.needsEditing });
					record();
				} });
			}
		}

		for (const [key, result] of Object.entries(reviewed) as Array<[Id, HumanReviewResult]>) {
			const unit = pulled[key];
			const reviewHash = hash([result.comment, ...(Array.isArray(result.suggestion) ? result.suggestion : [result.suggestion ?? ""])]);
			if (!unit || uploaded[`review:${key}`] === reviewHash) continue;
			if (result.suggestion) counts.suggestion++;
			counts.comment++;
			writes.push({ label: `review ${key}`, run: async () => {
				if (result.suggestion) await request("POST", `units/${unit.unit}/suggestions/`, { target: Array.isArray(result.suggestion) ? result.suggestion : [result.suggestion] });
				await request("POST", `units/${unit.unit}/comments/`, { scope: "translation", comment: result.comment.slice(0, 1000) });
				uploaded[`review:${key}`] = reviewHash;
			} });
		}

		console.log(`${locale}: ${counts.empty} new (needs editing), ${counts.replaceMachine} replacing machine text (needs editing), ${counts.suggestion} suggestions on human text, ${counts.comment} review comments, ${counts.same} unchanged, ${counts.done} already uploaded, ${counts.unavailable} not in Weblate, ${counts.readOnly} read-only`);
		if (apply) {
			try {
				await runWrites(writes);
			}
			finally {
				writeJson(uploadedPath, uploaded);
			}
		}
	}
}

async function main() {
	const { positional: [command], flags } = parseArguments(process.argv.slice(2));
	const apply = flags.apply === true;
	if (!apply && command !== "pull") console.log("Dry run: nothing will be written (pass --apply to write).\n");

	switch (command) {
		case "pull":
			await pull(localesFlag(flags.locales));
			break;
		case "locales":
			await locales(apply);
			break;
		case "context":
			await context(apply);
			break;
		case "glossary":
			await glossary(apply);
			break;
		case "drafts":
			if (typeof flags.name !== "string") throw new Error("drafts --name <run>");
			await drafts(flags.name, localesFlag(flags.locales), apply);
			break;
		default:
			console.log("Commands: pull, locales, context, glossary, drafts");
			process.exitCode = 1;
	}
}

if (isMain(import.meta.url)) await main();
