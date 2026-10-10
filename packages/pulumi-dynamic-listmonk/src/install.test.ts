import { expect, it } from "vitest";

import { installedApiToken } from "./install.ts";

it("reads the token Listmonk prints for the API user it installs", () => {
	const output = [
		"2026/10/06 09:41:10.960947 install.go:109: creating superadmin API user 'install'",
		"2026/10/06 09:41:10.989894 install.go:353: writing API token LISTMONK_ADMIN_API_TOKEN to stderr",
		'export LISTMONK_ADMIN_API_TOKEN="gem482MiaxsD10TMJJrYKHcAD2X8Wy3T"',
		"2026/10/06 09:41:10.989934 install.go:116: setup complete",
	].join("\n");

	expect(installedApiToken(output)).toBe("gem482MiaxsD10TMJJrYKHcAD2X8Wy3T");
});

it("fails when Listmonk skipped the install, since only an install prints a token", () => {
	const output =
		"2026/10/06 09:41:20.790628 install.go:53: skipping install as database appears to be already setup";

	expect(() => installedApiToken(output)).toThrow(
		"Listmonk printed no API token: its database was already installed. Recreate the database to install it again.",
	);
});
