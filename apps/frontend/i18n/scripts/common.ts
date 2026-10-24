import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const repositoryRoot = resolve(root, "../..");
export const i18nRoot = join(root, "i18n");
export const staging = join(i18nRoot, ".staging");

// A translation run's staged batches, drafts and reviews for one locale.
export function runDirectory(name: string, locale: string) {
	return join(staging, "translate", name, locale);
}

export const targetLocales = ["de", "es", "fr", "ja", "ko", "nl", "pt", "pt-BR", "ru", "sv"] as const;
export type TargetLocale = (typeof targetLocales)[number];

export function isTargetLocale(value: string): value is TargetLocale {
	return (targetLocales as ReadonlyArray<string>).includes(value);
}

// Weblate's language codes, used in API paths.
export function weblateLanguage(locale: string) {
	return locale.replace("-", "_");
}

// From Weblate's language definitions; gettext plural forms per locale.
export const gettextPluralCount: Record<TargetLocale, number> = {
	de: 2,
	es: 2,
	fr: 2,
	ja: 1,
	ko: 1,
	nl: 2,
	pt: 2,
	"pt-BR": 2,
	ru: 3,
	sv: 2
};

export type ComponentName = "attributes" | "flirtual" | "notifications";
export const componentNames: Array<ComponentName> = ["flirtual", "attributes", "notifications"];

export const components: Record<ComponentName, { format: "gettext" | "icu"; file: (locale: string) => string }> = {
	flirtual: { format: "icu", file: (locale) => join(root, "messages", `${locale}.json`) },
	attributes: { format: "icu", file: (locale) => join(root, "messages", `attributes.${locale}.json`) },
	notifications: {
		format: "gettext",
		file: (locale) => join(repositoryRoot, "apps/api/priv/gettext", locale.replace("-", "_"), "LC_MESSAGES/notifications.po")
	}
};

// A gettext plural entry carries one string per plural form.
export type Message = Array<string> | string;

// Keys are "component:key", e.g. "flirtual:that_active_seal_nail" or "attributes:game.<id>.name".
export type Id = `${ComponentName}:${string}`;

export function id(component: ComponentName, key: string): Id {
	return `${component}:${key}`;
}

export function parseId(value: string): [ComponentName, string] {
	const index = value.indexOf(":");
	const component = value.slice(0, index);
	if (!componentNames.includes(component as ComponentName)) throw new Error(`Unknown component in id: ${value}`);
	return [component as ComponentName, value.slice(index + 1)];
}

export function hash(value: Message) {
	return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
}

export function readJson<T>(path: string, fallback?: T): T {
	if (!existsSync(path)) {
		if (fallback !== undefined) return fallback;
		throw new Error(`Missing file: ${relative(repositoryRoot, path)}`);
	}
	return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, value: unknown) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`);
}

export function writeText(path: string, text: string) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text.endsWith("\n") ? text : `${text}\n`);
}

export function flatten(value: Record<string, unknown>, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, child] of Object.entries(value)) {
		if (typeof child === "string") result[prefix + key] = child;
		else if (child && typeof child === "object") Object.assign(result, flatten(child as Record<string, unknown>, `${prefix}${key}.`));
	}
	return result;
}

function unquote(line: string) {
	return JSON.parse(line.slice(line.indexOf("\""))) as string;
}

// Enough of the PO format for our files: msgid, msgid_plural, msgstr[n], continuation lines.
export function parsePo(text: string): Record<string, Message> {
	const result: Record<string, Message> = {};
	let field: string | null = null;
	let entry: Record<string, string> = {};

	const flush = () => {
		if (entry.msgid) {
			const forms = Object.keys(entry).filter((key) => key.startsWith("msgstr[")).sort().map((key) => entry[key]!);
			result[entry.msgid] = forms.length > 0 ? forms : (entry.msgstr ?? "");
		}
		entry = {};
		field = null;
	};

	for (const line of text.split("\n")) {
		if (line.trim() === "") flush();
		else if (line.startsWith("\"") && field) entry[field] += unquote(line);
		else if (!line.startsWith("#")) {
			field = line.slice(0, line.indexOf(" "));
			entry[field] = unquote(line);
		}
	}
	flush();
	return result;
}

export function loadMessages(component: ComponentName, locale: string): Record<string, Message> {
	const path = components[component].file(locale);
	if (!existsSync(path)) return {};
	if (components[component].format === "gettext") return parsePo(readFileSync(path, "utf8"));
	return flatten(readJson(path));
}

export function loadSource(): Map<Id, Message> {
	const result = new Map<Id, Message>();
	for (const component of componentNames) {
		for (const [key, value] of Object.entries(loadMessages(component, "en")))
			result.set(id(component, key), value);
	}
	return result;
}

// Keys the watch builds at runtime, so grepping for t("…") can't find them.
const watchDynamicKeys = [
	// Tags.swift personalityLabels
	"open_minded",
	"practical",
	"reliable",
	"free_spirited",
	"friendly",
	"straightforward",
	// Tags.swift domsub/monopoly values
	"dominant",
	"submissive",
	"switch",
	"monogamous",
	"nonmonogamous"
];

const watchDirectory = join(root, "ios/App/Watch");

// Strings the watchOS app renders. Its t() only fills {name} and empty <name/> tags.
export function watchIds(source: Map<Id, Message>): Set<Id> {
	const swift = readdirSync(watchDirectory)
		.filter((file) => file.endsWith(".swift"))
		.map((file) => readFileSync(join(watchDirectory, file), "utf8"))
		.join("\n");

	const keys = new Set(watchDynamicKeys);
	// Keys also reach t() through ternaries and variables, so take any literal that names a key.
	for (const [, key] of swift.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) keys.add(key!);

	const result = new Set<Id>();
	for (const key of keys) if (source.has(id("flirtual", key))) result.add(id("flirtual", key));

	const types = new Set([...swift.matchAll(/\battributes?\("([a-z-]+)"/g)].map(([, type]) => type!));
	for (const key of source.keys()) {
		const [component, rest] = parseId(key);
		if (component !== "attributes") continue;
		const [type, , field] = rest.split(".");
		if (types.has(type!) && field === "name") result.add(key);
	}
	return result;
}

// Screenshots never live in the working tree; they may show local data.
export const screenshotDirectory = process.env.TRANSLATE_SCREENSHOTS
	?? join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "flirtual-translate/screenshots");

export function parseArguments(argv: Array<string>) {
	const positional: Array<string> = [];
	const flags: Record<string, true | string> = {};
	for (let index = 0; index < argv.length; index++) {
		const value = argv[index]!;
		if (!value.startsWith("--")) {
			positional.push(value);
			continue;
		}
		const [name, inline] = value.slice(2).split("=", 2) as [string, string | undefined];
		const next = argv[index + 1];
		if (inline !== undefined) flags[name] = inline;
		else if (next !== undefined && !next.startsWith("--")) {
			flags[name] = next;
			index++;
		}
		else flags[name] = true;
	}
	return { positional, flags };
}

export function localesFlag(value: true | string | undefined): Array<TargetLocale> {
	if (value === undefined || value === true) return [...targetLocales];
	const locales = value.split(",").map((locale) => locale.trim());
	for (const locale of locales) {
		if (!isTargetLocale(locale)) throw new Error(`Not a target locale: ${locale} (allowed: ${targetLocales.join(", ")})`);
	}
	return locales as Array<TargetLocale>;
}

export function isMain(moduleUrl: string) {
	return process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(moduleUrl);
}
