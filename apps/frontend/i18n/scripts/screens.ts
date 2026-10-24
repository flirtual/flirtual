// Scripted scenarios for `screenshots.ts capture`: which seeded account each screen needs, where
// it is, and the steps that bring up the dialog or state the screen is about.
//
// Accounts, slugs and the moderation event come from apps/api/priv/repo/screenshot_seeds.exs;
// run `mix run --no-start priv/repo/screenshot_seeds.exs seed` before every capture, since some
// scenarios (the match emails) change that state.

import type { APIRequestContext, Locator, Page } from "playwright-core";

export type Account = "limits" | "news" | "onboarding" | "tour" | "viewer";

export const password = "screenshots-only-password";

// `ip` goes out as cf-connecting-ip: a TEST-NET-1 address per account, so each one has its own
// login rate limit and the login the seed trusts, and never matches a real account's IP hash.
export const accounts: Record<Account, { email: string; ip: string }> = {
	viewer: { email: "alice.samples@screenshots.flirtual.test", ip: "192.0.2.10" },
	tour: { email: "carol.tourist@screenshots.flirtual.test", ip: "192.0.2.11" },
	news: { email: "lorem.ipsum@screenshots.flirtual.test", ip: "192.0.2.12" },
	limits: { email: "dave.limits@screenshots.flirtual.test", ip: "192.0.2.13" },
	onboarding: { email: "demo.dumpling@screenshots.flirtual.test", ip: "192.0.2.15" }
};

const profiles = {
	viewer: "alice_samples",
	matched: "zark_muckerberg",
	otherGender: "flitty",
	picky: "fixture_falafel",
	dateHead: "testy_mctestface",
	likerLove: "example_eclair",
	likerHomie: "beta_bagel"
};

const likerEmails = {
	love: "example.eclair@screenshots.flirtual.test",
	friend: "beta.bagel@screenshots.flirtual.test"
};

export const defaultViewport = { width: 1280, height: 900 };
// Phone width, tall enough for the whole settings list, so the fixed tab bar sits below it.
const phoneViewport = { width: 390, height: 1920 };

export interface ScreenContext {
	page: Page;
	// Signed in as the scenario's account; requests carry its cookies.
	request: APIRequestContext;
	base: string;
	apiOrigin: string;
	// Opens a path under /en and waits for it to settle.
	open: (path: string) => Promise<void>;
	settle: () => Promise<void>;
}

export interface Scenario {
	account?: Account;
	viewport?: { width: number; height: number };
	// Defaults to true; dialogs and clipped elements are shot as they appear in the viewport.
	fullPage?: boolean;
	// localStorage entries (Capacitor Preferences, prefixed with ".") set before the app loads.
	preferences?: Record<string, unknown>;
	// Runs in the page before any app code.
	initScript?: string;
	// Returns the element to clip to, or nothing for the page.
	run: (context: ScreenContext) => Promise<Locator | void>;
}

export interface ManualScreen {
	manual: string;
}

async function openDialog(page: Page, trigger: Locator) {
	await trigger.click();
	const dialog = page.getByRole("dialog").last();
	await dialog.waitFor();
	await page.waitForTimeout(600);
	return dialog;
}

async function waitForProfile(page: Page, name: string) {
	await page.getByText(name, { exact: true }).first().waitFor();
}

async function waitForImages(page: Page) {
	await page.waitForFunction(() => [...document.images].every((image) => image.complete), undefined, { timeout: 15_000 }).catch(() => {});
}

// Likes a profile that already liked the viewer, then waits for ProcessMatch to deliver the email
// to Swoosh's dev mailbox and opens its HTML.
async function matchEmail({ page, request, base, apiOrigin, settle }: ScreenContext, mode: "friend" | "love") {
	const { userId } = await profileId(request, apiOrigin, mode === "love" ? profiles.likerLove : profiles.likerHomie);
	const response = await request.post(`${apiOrigin}/v1/queue`, { data: { type: "like", mode, user_id: userId, source: "direct" } });
	if (!response.ok() && response.status() !== 409) throw new Error(`like failed: ${response.status()} ${await response.text()}`);

	const recipient = mode === "love" ? likerEmails.love : likerEmails.friend;
	const subject = mode === "love" ? "💞" : "✌️";

	let messageId: string | undefined;
	for (let attempt = 0; attempt < 60 && !messageId; attempt++) {
		const mailbox = await (await request.get(`${apiOrigin}/dev/mailbox/json`)).json() as {
			data: Array<{ subject: string; to: Array<string>; headers: Record<string, string> }>;
		};
		messageId = mailbox.data.find((email) => email.subject.includes(subject) && email.to.some((to) => to.includes(recipient)))?.headers["Message-ID"];
		if (!messageId) await page.waitForTimeout(1000);
	}
	if (!messageId) throw new Error(`no match email for ${recipient} in ${apiOrigin}/dev/mailbox`);

	await page.goto(`${apiOrigin}/dev/mailbox/${encodeURIComponent(messageId)}/html`, { waitUntil: "load" });
	await settle();
	// Show the production links rather than the local frontend's.
	await page.evaluate((local) => {
		const production = "https://flirtu.al";
		for (const element of document.querySelectorAll("[href]")) {
			element.setAttribute("href", element.getAttribute("href")!.replaceAll(local, production));
		}
		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) walker.currentNode.textContent = walker.currentNode.textContent!.replaceAll(local, production);
	}, new URL(base).origin);
}

async function profileId(request: APIRequestContext, apiOrigin: string, slug: string) {
	const response = await request.get(`${apiOrigin}/v1/users/${slug}/name`);
	if (!response.ok()) throw new Error(`profile ${slug}: ${response.status()}`);
	const user = await response.json() as { id: string };
	return { userId: user.id };
}

// The team list shows real people; keep one member per role, renamed to sample profiles with
// initials for avatars. Runs in the page.
function sampleTeam() {
	const names = ["Alice Samples", "Placeholder Bob", "Zark Muckerberg", "Carol Tourist", "Dave Limits", "Erin Filler", "Frank Filler", "Grace Filler", "Demo Dumpling"];
	const members = [...document.querySelectorAll("div.flex.items-center.gap-4")]
		.filter((member) => member.querySelector(":scope > img") && member.querySelector(":scope > div > .font-montserrat"));
	const roles = new Set<string>();
	for (const member of members) {
		const role = member.querySelector(":scope > div > span:not(.font-montserrat)")!.textContent!.trim();
		if (roles.has(role)) {
			member.remove();
			continue;
		}
		roles.add(role);
		const name = names[roles.size - 1];
		const label = member.querySelector(".font-montserrat")!;
		const image = member.querySelector("img")!;
		image.alt = image.alt.replace(label.textContent!, name);
		label.textContent = name;
		const initials = name.split(" ").map((word) => word[0]).join("");
		image.removeAttribute("srcset");
		image.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#ff8975"/><stop offset="1" stop-color="#e9658b"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><text x="32" y="40" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${initials}</text></svg>`)}`;
	}
}

const watchReason = "watchOS app: needs an iPhone and a paired watch simulator running together, signed in through the iOS app's WatchConnectivity cookie handoff.";

export const scenarios: Record<string, ManualScreen | Scenario> = {
	"/": {
		fullPage: false,
		async run({ page, open }) {
			await open("/");
			// The landing page snaps between full-screen tiles; the store buttons are on the fourth.
			await page.getByText("Download on").first().scrollIntoViewIfNeeded();
			await page.waitForTimeout(1500);
		}
	},
	...Object.fromEntries([0, 1, 2, 3, 4].map((tile): [string, Scenario] => [`/ (tile ${tile + 1})`, {
		fullPage: false,
		async run({ page, open }) {
			await open("/");
			await page.locator(`[data-tile="${tile}"]`).scrollIntoViewIfNeeded();
			await page.waitForTimeout(1500);
		}
	}])),
	// Every fifth squeak shows the next of Flitty's lines as a toast; the first is "Meow!".
	"/ (Flitty)": {
		fullPage: false,
		async run({ page, open }) {
			await open("/");
			// Flitty peeks out from behind the button on hover.
			const button = page.locator("[data-tile='0'] .group\\/mark").first();
			await button.hover();
			await page.waitForTimeout(500);
			await button.locator(":scope > svg").click({ force: true });
			await page.getByText("Meow!").waitFor();
			await page.waitForTimeout(600);
		}
	},
	// The team list in the middle of the window, with the page around it.
	"/about": {
		fullPage: false,
		async run({ page, open }) {
			await open("/about");
			await page.evaluate(sampleTeam);
			await waitForImages(page);
			const team = await page.locator("section").filter({ has: page.getByRole("heading", { name: "The team" }) }).boundingBox();
			const scrolled = await page.evaluate(() => scrollY);
			await page.evaluate((top) => scrollTo(0, top), scrolled + team!.y + team!.height / 2 - defaultViewport.height / 2);
			await page.waitForTimeout(800);
		}
	},
	"/events": { run: ({ open }) => open("/events") },
	"/privacy": { run: ({ open }) => open("/privacy") },
	"/login": { run: ({ open }) => open("/login") },
	"/sign-up": { run: ({ open }) => open("/sign-up") },
	"/download": { run: ({ open }) => open("/download") },
	"/debugger": { account: "viewer", run: ({ open }) => open("/debugger") },

	"/dates": {
		account: "tour",
		fullPage: false,
		async run({ page, open }) {
			await open("/dates");
			// Step through the onboarding tour to its last note, which ends with "<3".
			for (let step = 0; step < 12; step++) {
				const conclusion = page.locator(".shepherd-element").filter({ hasText: "<3" });
				if (await conclusion.isVisible()) break;
				const next = page.locator(".shepherd-element .shepherd-button").last();
				await next.waitFor();
				await next.click();
				await page.waitForTimeout(1500);
			}
			await page.locator(".shepherd-element").filter({ hasText: "<3" }).waitFor();
			await page.waitForTimeout(800);
		}
	},
	"/homies": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open("/homies");
			await page.locator("#friend-button").waitFor();
			await waitForProfile(page, "Placeholder Bob");
			await waitForImages(page);
		}
	},
	"/likes": {
		account: "viewer",
		async run({ page, open }) {
			await open("/likes");
			await page.getByText("Example Eclair").first().waitFor();
			await waitForImages(page);
		}
	},
	"/me": {
		account: "viewer",
		async run({ page, open }) {
			// "/me" is the name of the screen; your own profile lives at your slug.
			await open(`/${profiles.viewer}`);
			await waitForProfile(page, "Alice Samples");
			await waitForImages(page);
		}
	},
	"/finish/1": { account: "onboarding", run: ({ open }) => open("/finish/1") },
	"/finish/2": { account: "onboarding", run: ({ open }) => open("/finish/2") },
	"/finish/3": { account: "onboarding", run: ({ open }) => open("/finish/3") },

	// On desktop /settings redirects to its first page; the list itself (with its "New" badges and
	// social links) is the phone layout.
	"/settings": { account: "viewer", viewport: phoneViewport, fullPage: false, run: ({ open }) => open("/settings") },
	"/settings/appearance": { account: "viewer", run: ({ open }) => open("/settings/appearance") },
	"/settings/connections": { account: "viewer", run: ({ open }) => open("/settings/connections") },
	"/settings/email": { account: "viewer", run: ({ open }) => open("/settings/email") },
	"/settings/delete": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open("/settings/delete");
			// Pick "Other" (the last reason), then reopen the list so it shows among the others.
			const reason = page.getByRole("combobox").filter({ hasText: "Select a reason" }).first();
			await reason.click();
			await page.getByRole("listbox").waitFor();
			await page.waitForTimeout(500);
			await page.keyboard.press("End");
			await page.waitForTimeout(300);
			await page.keyboard.press("Enter");
			await page.getByRole("combobox").filter({ hasText: "Other" }).first().click();
			await page.getByRole("option", { name: "Other", exact: true }).first().waitFor();
			await page.waitForTimeout(500);
		}
	},
	"/settings/info": { account: "viewer", run: ({ open }) => open("/settings/info") },
	"/settings/interests": { account: "viewer", run: ({ open }) => open("/settings/interests") },
	"/settings/matchmaking": {
		account: "viewer",
		// Tall enough for the whole page, so focusing the search doesn't scroll it; a full-page shot
		// of a scrolled page draws the fixed header wherever the viewport was.
		viewport: { width: 1280, height: 2800 },
		async run({ page, open }) {
			await open("/settings/matchmaking");
			// Searching the filter tags lists each match with its category, here "Role".
			const search = page.getByPlaceholder("Search tags...").first();
			await search.click();
			await search.fill("Dominant");
			await page.getByText("Role", { exact: false }).first().waitFor();
			await page.waitForTimeout(800);
		}
	},
	// The April Fools strings (ranked mode, the assistant) are shown here, with every toggle on.
	"/settings/fun": {
		account: "viewer",
		fullPage: false,
		preferences: { assistant_visible: true, ranked_mode: true, snowfall: "always" },
		async run({ page, open }) {
			await open("/settings/fun");
			await page.locator("#date-mode-switch").getByText("Ranked").waitFor();
			// The form can read its fields before the assistant preference loads; switch it on to match.
			await page.getByText("Yes", { exact: true }).first().click();
			// The assistant speaks when clicked; let the snow fall for a moment too.
			await page.locator("div.fixed.z-\\[999\\] img").first().click();
			await page.locator("[data-bubble='true']").waitFor();
			await page.waitForTimeout(3000);
		}
	},
	"/settings/notifications": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open("/settings/notifications");
			await page.locator("svg.lucide-mail").first().hover();
			await page.getByRole("tooltip").getByText("Emails").waitFor();
			await page.waitForTimeout(400);
		}
	},
	"/settings/password": {
		account: "viewer",
		// Chrome can make passkeys; hide the API so the page shows its unsupported-browser state.
		initScript: "delete window.PublicKeyCredential;",
		async run({ page, open }) {
			await open("/settings/password");
			await page.getByText("(unsupported browser)").waitFor();
		}
	},

	profile: {
		account: "viewer",
		async run({ page, open }) {
			await open(`/${profiles.matched}`);
			await waitForProfile(page, "Zark Muckerberg");
			await page.getByRole("button", { name: "Message" }).or(page.getByRole("link", { name: "Message" })).first().waitFor();
			await waitForImages(page);
		}
	},
	"profile pills": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open(`/${profiles.otherGender}`);
			await waitForProfile(page, "Flitty");
			await waitForImages(page);
		}
	},
	"dialog: news": {
		account: "news",
		fullPage: false,
		async run({ page, open }) {
			// News only shows on onboarded pages, after the tour.
			await open("/likes");
			await page.getByRole("dialog").getByText("Location priority").first().waitFor();
			await page.waitForTimeout(800);
		}
	},
	"dialog: Out of likes and passes": {
		account: "limits",
		fullPage: false,
		async run({ page, open }) {
			await open("/dates");
			await page.locator("#like-button").click();
			await page.getByRole("dialog").getByText("New profiles in:").waitFor();
			await page.waitForTimeout(1200);
		}
	},
	"dialog: Report": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open(`/${profiles.dateHead}`);
			await waitForProfile(page, "Testy McTestface");
			await openDialog(page, page.getByRole("button", { name: "Report" }));
		}
	},
	"dialog: They're not looking for your gender": {
		account: "viewer",
		fullPage: false,
		async run({ page, open }) {
			await open(`/${profiles.picky}`);
			await waitForProfile(page, "Fixture Falafel");
			await page.locator("#like-button").click();
			await page.getByRole("dialog").getByText("They're not looking for your gender").waitFor();
			await page.waitForTimeout(600);
		}
	},

	"email: It's a match! 💞": { account: "viewer", run: (context) => matchEmail(context, "love") },
	"email: It's a match! ✌️": { account: "viewer", run: (context) => matchEmail(context, "friend") },
	"email: footer (all emails)": {
		account: "viewer",
		async run(context) {
			await matchEmail(context, "friend");
			return context.page.locator(".footer");
		}
	},

	"native: tab bar": { manual: "Capacitor's native tab bar only exists in the iOS/Android app; capture it from a simulator build signed in as a seeded account (flirtual-app builds against kf.flirtual.net, not this local stack)." },
	"watch: browse": { manual: watchReason },
	"watch: conversation": { manual: `${watchReason} Also needs a TalkJS conversation, which this local stack doesn't create.` },
	"watch: match": { manual: watchReason },
	"watch: profile": { manual: watchReason },
	"watch: report": { manual: watchReason }
};

export function isManual(scenario: ManualScreen | Scenario): scenario is ManualScreen {
	return "manual" in scenario;
}
