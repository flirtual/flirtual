// Screenshots for strings whose meaning or placement isn't clear from text alone.
// Run from apps/frontend: node --env-file=.env.weblate i18n/scripts/screenshots.ts <command>
//
//   plan                                group flagged strings (context needsScreenshot) by screen
//   capture [--base URL] [--api URL] [--screens a,b]
//                                       capture screens with Playwright (system Chrome), each by
//                                       its scenario in screens.ts
//   review                              list screenshots awaiting a decision, with linked strings
//   approve <file> --session <token>    record approval of this exact file (by SHA-256)
//   reject <file>                       record rejection
//   upload --session <token> [--apply]  upload only files approved in this session, link strings
//
// Images never live in the repository. Captures go in $TRANSLATE_SCREENSHOTS (default
// ${XDG_CACHE_HOME:-~/.cache}/flirtual-translate/screenshots); hand-made ones go in
// $TRANSLATE_SCREENSHOTS/manual/<screen>.png, using the file names `plan` prints. Weblate takes
// at most 2000 px a side; a longer page is split into <screen>-1.png, <screen>-2.png, ….
// Capture signs in as the fake accounts from apps/api/priv/repo/screenshot_seeds.exs, against a
// local frontend (--base, default https://localhost:3000) and API (--api, default
// https://localhost:4001); seed right before each capture.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

import type { Browser, BrowserContext } from "playwright-core";

import type { ComponentName, Id } from "./common.ts";
import { isMain, parseArguments, parseId, readJson, screenshotDirectory, staging, writeJson } from "./common.ts";
import { loadContext } from "./context.ts";
import type { Account, Scenario, ScreenContext } from "./screens.ts";
import { accounts, defaultViewport, isManual, password, scenarios } from "./screens.ts";
import type { Unit } from "./weblate-api.ts";
import { list, project, request } from "./weblate-api.ts";

const planPath = join(staging, "screenshots/plan.json");
const approvalsPath = join(screenshotDirectory, "..", "approvals.json");
const manualDirectory = join(screenshotDirectory, "manual");
const maxSide = 2000;

interface Screen {
	name: string;
	// Set when the name is a plain route; scenarios in screens.ts cover the rest.
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

// Moderator and admin UI isn't screenshotted; its strings go without.
const staffOnly = /^\/(?:mod|admin|search)(?:\/|$)|\(moderators?\)|moderator (?:menu|dropdown)/i;

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
		if (flagged.length === 0 || staffOnly.test(name)) continue;
		// Attribute values are picker options, not all on screen at once; link only the flagged ones.
		keys = keys.filter((key) => !key.startsWith("attributes:") || context[key].needsScreenshot);
		const route = routable(name);
		screens.push({ name, route, authenticated: !route || !publicRoutes.has(route), flagged, keys });
	}
	screens.sort((a, b) => a.name.localeCompare(b.name));
	writeJson(planPath, screens);

	// A screen is captured by its scenario in screens.ts; one without a scenario is made by hand.
	const automatic = (screen: Screen) => {
		const scenario = scenarios[screen.name];
		return !!scenario && !isManual(scenario);
	};
	for (const screen of screens) {
		console.log(`${automatic(screen) ? "auto  " : "manual"} ${screen.name}: ${screen.flagged.length} flagged, ${screen.keys.length} strings`);
	}
	const manual = screens.filter((screen) => !automatic(screen));
	console.log(`\n${screens.length} screens: ${screens.length - manual.length} capturable, ${manual.length} manual (save as ${manualDirectory}/<slug>.png):`);
	for (const screen of manual) {
		const scenario = scenarios[screen.name];
		console.log(`  ${slug(screen.name)}.png  ←  ${screen.name}${scenario && isManual(scenario) ? `: ${scenario.manual}` : " (no scenario in screens.ts)"}`);
	}
}

// Logs in once per account, with the cf-connecting-ip the seed trusts, and keeps the cookies.
async function signIn(browser: Browser, base: string, apiOrigin: string, account: Account) {
	const context = await browser.newContext({ ignoreHTTPSErrors: true });
	const { email, ip } = accounts[account];
	const response = await context.request.post(`${apiOrigin}/v1/session`, {
		data: { login: email, password, captcha: "XXXX.DUMMY.TOKEN.XXXX" },
		headers: { "cf-connecting-ip": ip, origin: base, referer: `${base}/` }
	});
	if (response.status() !== 201) {
		throw new Error(`Couldn't sign in as ${email} (${response.status()}): ${await response.text()}. Seed first: mix run --no-start priv/repo/screenshot_seeds.exs seed`);
	}
	const state = await context.storageState();
	await context.close();
	return state;
}

// The dev server compiles modules on first request, so a cold page can take most of a minute.
async function settle(page: ScreenContext["page"]) {
	await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
	// The app's full-page loading logo (components/loading).
	await page.waitForFunction(() => !document.querySelector(".min-h-screen.opacity-75 > .animate-pulse"), undefined, { timeout: 180_000 });
	await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
	await page.evaluate(() => document.fonts.ready);
	await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 }).catch(() => {});
	await page.waitForTimeout(1500);
}

async function shoot(browser: Browser, base: string, apiOrigin: string, name: string, scenario: Scenario, state?: Awaited<ReturnType<typeof signIn>>) {
	const context: BrowserContext = await browser.newContext({
		viewport: scenario.viewport ?? defaultViewport,
		colorScheme: "light",
		reducedMotion: "reduce",
		locale: "en-US",
		ignoreHTTPSErrors: true,
		storageState: state
	});
	try {
		// The API's dev pages load Tidewave's toolbar, which would sit on top of the emails.
		await context.route("https://tidewave.ai/**", (route) => route.abort());
		const preferences = Object.entries(scenario.preferences ?? {});
		if (preferences.length > 0) {
			await context.addInitScript((entries) => {
				for (const [key, value] of entries) localStorage.setItem(`.${key}`, JSON.stringify(value));
			}, preferences);
		}
		if (scenario.initScript) await context.addInitScript(scenario.initScript);

		const page = await context.newPage();
		page.setDefaultTimeout(60_000);
		const screenContext: ScreenContext = {
			page,
			request: context.request,
			base,
			apiOrigin,
			settle: () => settle(page),
			open: async (path) => {
				const target = `/en${path === "/" ? "" : path}`;
				if (!scenario.account) {
					await page.goto(`${base}${target}`, { waitUntil: "load" });
				}
				else {
					// Signed in, a hard load of most routes stays on the loading screen in the dev
					// server (a preferences query never starts), so start from a page that loads and
					// navigate inside the app.
					if (!page.url().startsWith(base)) {
						await page.goto(`${base}/en/debugger`, { waitUntil: "load" });
						await settle(page);
					}
					const starting = new URL(page.url()).pathname;
					await page.evaluate((to) => (window as unknown as { __reactRouterDataRouter: { navigate: (to: string) => Promise<void> } }).__reactRouterDataRouter.navigate(to), target);
					// Navigations run in a transition, so the previous page stays up until the next renders.
					if (starting === "/en/debugger" && path !== "/debugger") {
						await page.getByText("Debug information", { exact: true }).waitFor({ state: "detached", timeout: 120_000 });
					}
				}
				await settle(page);
			}
		};

		const element = await scenario.run(screenContext);
		for (const file of readdirSync(screenshotDirectory)) {
			if (part(file)?.slug === slug(name)) rmSync(join(screenshotDirectory, file));
		}
		const path = join(screenshotDirectory, `${slug(name)}.png`);
		if (element) {
			await element.screenshot({ path });
		}
		else if (scenario.fullPage ?? true) {
			// Weblate rejects images over 2000 px a side, so a long page is saved in numbered parts.
			const { width, height } = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
			const parts = Math.ceil(height / maxSide);
			if (parts === 1) {
				await page.screenshot({ path, fullPage: true });
			}
			else {
				const partHeight = Math.ceil(height / parts);
				for (let index = 0; index < parts; index++) {
					const y = index * partHeight;
					await page.screenshot({ path: join(screenshotDirectory, `${slug(name)}-${index + 1}.png`), fullPage: true, clip: { x: 0, y, width, height: Math.min(partHeight, height - y) } });
				}
			}
		}
		else {
			await page.screenshot({ path });
		}
		console.log(`captured ${name} → ${path}`);
	}
	finally {
		await context.close();
	}
}

async function capture(base: string, apiOrigin: string, only: Set<string> | null) {
	const { chromium } = await import("playwright-core");
	const planned = new Set(readJson<Array<Screen>>(planPath).map((screen) => screen.name).filter((name) => !only || only.has(name)));
	for (const name of planned) {
		if (!scenarios[name]) console.log(`No scenario for "${name}"; add one to i18n/scripts/screens.ts.`);
	}

	mkdirSync(screenshotDirectory, { recursive: true });
	const browser = await chromium.launch({ channel: "chrome" });
	const states = new Map<Account, Awaited<ReturnType<typeof signIn>>>();
	const manual: Array<[string, string]> = [];
	const failed: Array<[string, string]> = [];

	try {
		// The dev server optimizes dependencies on first load and reloads; get that out of the way.
		const warmup = await browser.newContext({ ignoreHTTPSErrors: true });
		const warmupPage = await warmup.newPage();
		await warmupPage.goto(`${base}/en/login`, { waitUntil: "load" });
		await settle(warmupPage);
		await warmup.close();

		// Scenarios run in the order screens.ts lists them: the match emails change the seeded state.
		for (const [name, scenario] of Object.entries(scenarios)) {
			if (!planned.has(name)) continue;
			if (isManual(scenario)) {
				manual.push([name, scenario.manual]);
				continue;
			}
			try {
				let state;
				if (scenario.account) {
					state = states.get(scenario.account) ?? await signIn(browser, base, apiOrigin, scenario.account);
					states.set(scenario.account, state);
				}
				await shoot(browser, base, apiOrigin, name, scenario, state);
			}
			catch (reason) {
				const message = reason instanceof Error ? reason.message : String(reason);
				const waiting = /waiting for (.+)/.exec(message)?.[1];
				failed.push([name, `${message.split("\n")[0]}${waiting ? ` (waiting for ${waiting})` : ""}`]);
				console.log(`failed ${name}: ${failed.at(-1)![1]}`);
			}
		}
	}
	finally {
		await browser.close();
	}

	if (manual.length > 0) {
		console.log(`\n${manual.length} manual (save as ${manualDirectory}/<file>):`);
		for (const [name, reason] of manual) console.log(`  ${slug(name)}.png  ←  ${name}: ${reason}`);
	}
	if (failed.length > 0) {
		console.log(`\n${failed.length} failed:`);
		for (const [name, reason] of failed) console.log(`  ${name}: ${reason}`);
		process.exitCode = 1;
	}
}

// "<slug>.png", or "<slug>-<n>.png" for one part of a page too long for a single image.
function part(file: string) {
	const match = /^(.+-[\da-f]{4})(?:-(\d+))?\.png$/.exec(file);
	return match ? { slug: match[1], index: match[2] ? Number(match[2]) : undefined } : undefined;
}

function files() {
	const found: Array<{ path: string; screen: Screen | undefined; label: string }> = [];
	const screens = readJson<Array<Screen>>(planPath, []);
	for (const directory of [screenshotDirectory, manualDirectory]) {
		if (!existsSync(directory)) continue;
		const names = readdirSync(directory).filter((file) => file.endsWith(".png"));
		for (const name of names) {
			const parsed = part(name);
			const screen = screens.find((candidate) => slug(candidate.name) === parsed?.slug);
			const total = names.filter((other) => part(other)?.slug === parsed?.slug && part(other)?.index).length;
			const label = screen && parsed?.index ? `${screen.name} (${parsed.index}/${total})` : screen?.name ?? name;
			found.push({ path: join(directory, name), screen, label });
		}
	}
	return found;
}

function review() {
	const approvals = readJson<Record<string, Approval>>(approvalsPath, {});
	for (const { path, screen, label } of files()) {
		if (approvals[sha256(path)]) continue;
		console.log(`${path}\n  screen: ${screen ? label : "(unknown: name the file after a planned screen)"}\n  links ${screen?.keys.length ?? 0} strings: ${screen?.keys.slice(0, 12).join(", ") ?? ""}${(screen?.keys.length ?? 0) > 12 ? ", …" : ""}\n`);
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

	for (const { path, screen, label } of approved) {
		// A PNG's width and height are the big-endian integers at bytes 16 and 20.
		const header = readFileSync(path).subarray(16, 24);
		if (Math.max(header.readUInt32BE(0), header.readUInt32BE(4)) > maxSide) {
			console.log(`skipping ${basename(path)}: Weblate rejects images over ${maxSide} px a side; split or scale it.`);
			continue;
		}
		const byComponent = new Map<ComponentName, Array<string>>();
		for (const key of screen!.keys) {
			const [component, name] = parseId(key);
			byComponent.set(component, [...(byComponent.get(component) ?? []), name]);
		}
		for (const [component, keys] of byComponent) {
			const name = label;
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
				// The create response has no id, only the screenshot's API url.
				const created = await request<{ url: string }>("POST", "screenshots/", form);
				id = Number(/\/screenshots\/(\d+)\//.exec(created.url)?.[1]);
				if (!id) throw new Error(`No screenshot id in ${JSON.stringify(created)}`);
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
			await capture(
				typeof flags.base === "string" ? flags.base : "https://localhost:3000",
				typeof flags.api === "string" ? flags.api : "https://localhost:4001",
				typeof flags.screens === "string" ? new Set(flags.screens.split(",")) : null
			);
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
