import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { globbySync, type GlobbyOptions } from "globby";

export function hashFiles(patterns: Array<string>, options: GlobbyOptions = {}) {
	const hash = createHash("sha256");

	const cwd =
		options.cwd === undefined
			? process.cwd()
			: typeof options.cwd === "string"
				? options.cwd
				: fileURLToPath(options.cwd);

	for (const file of globbySync(patterns, {
		gitignore: true,
		...options,
	}).sort()) {
		const contents = readFileSync(join(cwd, file));

		hash.update(`${file}\0${contents.byteLength}\0`);
		hash.update(contents);
	}

	return hash.digest("hex");
}
