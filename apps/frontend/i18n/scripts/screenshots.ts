// Screenshots for strings whose meaning or placement isn't clear from text alone.
// Run from apps/frontend: node --env-file=../../.env.weblate i18n/scripts/screenshots.ts <command>
//
//   plan                                group flagged strings (context needsScreenshot) by screen
//   capture [--base URL] [--screens a,b] capture routable screens with Playwright (system Chrome)
//   review                              list screenshots awaiting a decision, with linked strings
//   approve <file> --session <token>    record approval of this exact file (by SHA-256)
//   reject <file>                       record rejection
//   upload --session <token> [--apply]  upload only files approved in this session, link strings
//
// Images never live in the repository. Captures go in $TRANSLATE_SCREENSHOTS (default
// ${XDG_CACHE_HOME:-~/.cache}/flirtual-translate/screenshots); hand-made ones go in
// $TRANSLATE_SCREENSHOTS/manual/<screen>.png, using the file names `plan` prints.
// Capture logs in with TRANSLATE_LOGIN and TRANSLATE_PASSWORD: a seeded account with fake data.

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import type { ComponentName, Id } from "./common.ts";
import { isMain, parseArguments, parseId, readJson, screenshotDirectory, staging, writeJson } from "./common.ts";
import { loadContext } from "./context.ts";
import type { Unit } from "./weblate-api.ts";
import { list, project, request } from "./weblate-api.ts";

const planPath = join(staging, "screenshots/plan.json");
const approvalsPath = join(screenshotDirectory, "..", "approvals.json");
const manualDirectory = join(screenshotDirectory, "manual");
const viewport = { width: 1280, height: 900 };

interface Screen {
	name: string;
	// Set when Playwright can reach it by URL; dialogs, toasts, emails and edge states need a person.
	route?: string;
	authenticated: boolean;
	flagged: Array<Id>;
	// Every string shown on the screen, not just the flagged ones.
	keys: Array<Id>;
}

interface Approval {
	screen: string;
	file: string;
	decision: "approved" | "rejected";
	session?: string;
	at: string;
}

// Names can differ only in emoji ("It's a match! 💞"), so a short hash keeps files distinct.
function slug(screen: string) {
	const readable = screen.replace(/^\//, "").replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "home";
	return `${readable}-${createHash("sha256").update(screen).digest("hex").slice(0, 4)}`;
}

function sha256(path: string) {
	return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const publicRoutes = new Set(["/", "/login", "/sign-up", "/forgot", "/about", "/events", "/press", "/branding", "/download", "/guidelines", "/terms", "/privacy", "/payments", "/news"]);

function routable(screen: string) {
	return screen.startsWith("/") && !/[[\]{}:]/.test(screen) ? screen : undefined;
}

function plan() {
	const context = loadContext();
	const byScreen = new Map<string, Array<Id>>();
	for (const [key, entry] of Object.entries(context) as Array<[Id, (typeof context)[Id]]>) {
		for (const screen of entry.screens) byScreen.set(screen, [...(byScreen.get(screen) ?? []), key]);
	}

	const screens: Array<Screen> = [];
	for (let [name, keys] of byScreen) {
		const flagged = keys.filter((key) => context[key].needsScreenshot);
		if (flagged.length === 0) continue;
		// Attribute values are picker options, not all on screen at once; link only the flagged ones.
		keys = keys.filter((key) => !key.startsWith("attributes:") || context[key].needsScreenshot);
		const route = routable(name);
		screens.push({ name, route, authenticated: !route || !publicRoutes.has(route), flagged, keys });
	}
	screens.sort((a, b) => a.name.localeCompare(b.name));
	writeJson(planPath, screens);

	for (const screen of screens) {
		console.log(`${screen.route ? "auto  " : "manual"} ${screen.name}: ${screen.flagged.length} flagged, ${screen.keys.length} strings`);
	}
	const manual = screens.filter((screen) => !screen.route);
	console.log(`\n${screens.length} screens: ${screens.length - manual.length} capturable, ${manual.length} manual (save as ${manualDirectory}/<slug>.png):`);
	for (const screen of manual) console.log(`  ${slug(screen.name)}.png  ←  ${screen.name}`);
}

async function capture(base: string, only: Set<string> | null) {
	const { chromium } = await import("playwright-core");
	const screens = readJson<Array<Screen>>(planPath).filter((screen) => screen.route && (!only || only.has(screen.name)));
	const browser = await chromium.launch({ channel: "chrome" });
	const context = await browser.newContext({ viewport, colorScheme: "light", locale: "en-US", ignoreHTTPSErrors: true });
	const page = await context.newPage();

	const shoot = async (screen: Screen) => {
		await page.goto(`${base}/en${screen.route === "/" ? "" : screen.route}`, { waitUntil: "networkidle" });
		await page.waitForTimeout(1000);
		const path = join(screenshotDirectory, `${slug(screen.name)}.png`);
		await page.screenshot({ path, fullPage: true });
		console.log(`captured ${screen.name} → ${path}`);
	};

	for (const screen of screens.filter((screen) => !screen.authenticated)) await shoot(screen);

	const login = process.env.TRANSLATE_LOGIN;
	const password = process.env.TRANSLATE_PASSWORD;
	const authenticated = screens.filter((screen) => screen.authenticated);
	if (authenticated.length > 0) {
		if (!login || !password) {
			console.log(`Skipping ${authenticated.length} signed-in screens: set TRANSLATE_LOGIN and TRANSLATE_PASSWORD for a fake test account.`);
		}
		else {
			await page.goto(`${base}/en/login`, { waitUntil: "networkidle" });
			await page.fill("input[autocomplete~='username']", login);
			await page.fill("input[type='password']", password);
			await page.keyboard.press("Enter");
			await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
			for (const screen of authenticated) await shoot(screen);
		}
	}
	await browser.close();
}

function files() {
	const found: Array<{ path: string; screen: Screen | undefined }> = [];
	const screens = readJson<Array<Screen>>(planPath, []);
	for (const directory of [screenshotDirectory, manualDirectory]) {
		if (!existsSync(directory)) continue;
		for (const name of readdirSync(directory).filter((file) => file.endsWith(".png"))) {
			found.push({ path: join(directory, name), screen: screens.find((screen) => slug(screen.name) === basename(name, ".png")) });
		}
	}
	return found;
}

function review() {
	const approvals = readJson<Record<string, Approval>>(approvalsPath, {});
	for (const { path, screen } of files()) {
		if (approvals[sha256(path)]) continue;
		console.log(`${path}\n  screen: ${screen?.name ?? "(unknown: name the file after a planned screen)"}\n  links ${screen?.keys.length ?? 0} strings: ${screen?.keys.slice(0, 12).join(", ") ?? ""}${(screen?.keys.length ?? 0) > 12 ? ", …" : ""}\n`);
	}
}

function decide(file: string, decision: Approval["decision"], session?: string) {
	if (!existsSync(file)) throw new Error(`No such file: ${file}`);
	const screen = files().find((candidate) => candidate.path === file)?.screen;
	if (!screen) throw new Error(`${file} doesn't match a planned screen`);
	const approvals = readJson<Record<string, Approval>>(approvalsPath, {});
	approvals[sha256(file)] = { screen: screen.name, file, decision, session, at: new Date().toISOString() };
	writeJson(approvalsPath, approvals);
	console.log(`${decision}: ${file}`);
}

async function upload(session: string, apply: boolean) {
	const approvals = readJson<Record<string, Approval>>(approvalsPath, {});
	const approved = files().filter(({ path, screen }) => {
		const approval = approvals[sha256(path)];
		// A file that changed after approval has a new hash and needs approval again.
		return screen && approval?.decision === "approved" && approval.session === session;
	});
	if (approved.length === 0) {
		console.log("Nothing approved in this session.");
		return;
	}

	for (const { path, screen } of approved) {
		const byComponent = new Map<ComponentName, Array<string>>();
		for (const key of screen!.keys) {
			const [component, name] = parseId(key);
			byComponent.set(component, [...(byComponent.get(component) ?? []), name]);
		}
		for (const [component, keys] of byComponent) {
			const name = screen!.name;
			console.log(`${apply ? "uploading" : "would upload"} ${basename(path)} to ${component} as "${name}", linking ${keys.length} strings`);
			if (!apply) continue;

			const existing = (await list<{ id: number; name: string }>(`components/${project}/${component}/screenshots/`)).find((shot) => shot.name === name);
			const image = new Blob([readFileSync(path)], { type: "image/png" });
			let id = existing?.id;
			if (id) {
				const form = new FormData();
				form.append("image", image, basename(path));
				await request("POST", `screenshots/${id}/file/`, form);
			}
			else {
				const form = new FormData();
				form.append("name", name);
				form.append("project_slug", project);
				form.append("component_slug", component);
				form.append("language_code", "en");
				form.append("image", image, basename(path));
				id = (await request<{ id: number }>("POST", "screenshots/", form)).id;
			}

			const sources = await list<Unit>(`translations/${project}/${component}/en/units/`);
			for (const key of keys) {
				const unit = sources.find((candidate) => candidate.context === key);
				if (unit) await request("POST", `screenshots/${id}/units/`, { unit_id: unit.id });
			}
		}
	}
}

async function main() {
	const { positional: [command, file], flags } = parseArguments(process.argv.slice(2));
	switch (command) {
		case "plan":
			plan();
			break;
		case "capture":
			await capture(typeof flags.base === "string" ? flags.base : "https://localhost:3000", typeof flags.screens === "string" ? new Set(flags.screens.split(",")) : null);
			break;
		case "review":
			review();
			break;
		case "approve":
			if (!file || typeof flags.session !== "string") throw new Error("approve <file> --session <token>");
			decide(file, "approved", flags.session);
			break;
		case "reject":
			if (!file) throw new Error("reject <file>");
			decide(file, "rejected");
			break;
		case "upload":
			if (typeof flags.session !== "string") throw new Error("upload --session <token>");
			await upload(flags.session, flags.apply === true);
			break;
		default:
			console.log("Commands: plan, capture, review, approve, reject, upload");
			process.exitCode = 1;
	}
}

if (isMain(import.meta.url)) await main();
