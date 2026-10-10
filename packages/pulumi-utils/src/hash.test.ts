import { mkdirSync, mkdtempSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, it } from "vitest";

import { hashFiles } from "./hash.ts";

function directory(files: Record<string, string>) {
	const root = mkdtempSync(join(tmpdir(), "hash-"));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(root, path, ".."), { recursive: true });
		writeFileSync(join(root, path), content);
	}
	return root;
}

const all = (cwd: string, options = {}) => hashFiles(["**"], { cwd, ...options });

it("gives identical trees the same hash, whatever order they were written in", () => {
	expect(all(directory({ "a.js": "a", "b/c.js": "c" }))).toBe(
		all(directory({ "b/c.js": "c", "a.js": "a" })),
	);
});

it("changes when a file's contents change", () => {
	expect(all(directory({ "a.js": "a" }))).not.toBe(all(directory({ "a.js": "b" })));
});

it("changes when a file moves", () => {
	const root = directory({ "a.js": "a" });
	const before = all(root);
	renameSync(join(root, "a.js"), join(root, "b.js"));
	expect(all(root)).not.toBe(before);
});

it("skips files the .gitignore excludes, unless told not to", () => {
	const root = directory({ ".gitignore": "ignored.js\n", "a.js": "a" });
	const before = all(root);
	writeFileSync(join(root, "ignored.js"), "x");

	expect(all(root)).toBe(before);
	expect(all(root, { gitignore: false })).not.toBe(before);
});

it("includes dotfiles only when asked", () => {
	const root = directory({ "a.js": "a", ".well-known/b": "b" });
	const withDotfiles = all(root, { dot: true });
	const without = all(root);
	writeFileSync(join(root, ".well-known/b"), "changed");

	expect(all(root)).toBe(without);
	expect(all(root, { dot: true })).not.toBe(withDotfiles);
});
