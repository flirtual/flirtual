import type { RouteConfigEntry } from "@react-router/dev/routes";
import { afterEach, describe, expect, it, vi } from "vitest";

async function indexFile() {
	vi.resetModules();
	const { default: routes } = await import("./routes");

	const publicLayout = (routes as Array<RouteConfigEntry>)
		.find(({ file }) => file === "./app/[locale]/(public)/layout.tsx");
	return publicLayout?.children?.find(({ index }) => index)?.file;
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("index route", () => {
	it("is the landing page while landing is enabled", async () => {
		vi.stubEnv("VITE_FEATURE_LANDING", "1");
		expect(await indexFile()).toBe("./app/[locale]/(public)/home/page.tsx");
	});

	it("is the welcome page while landing is disabled", async () => {
		vi.stubEnv("VITE_FEATURE_LANDING", "0");
		expect(await indexFile()).toBe("./app/[locale]/(public)/welcome/page.tsx");
	});
});
