// Sorts every key in `content/` until oxfmt can (oxc-project/oxc#18656, oxc-project/oxc#21644).
//
//   node scripts/sort-keys.ts          sort in place
//   node scripts/sort-keys.ts --check  list unsorted files and fail
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const directory = join(import.meta.dirname, "../content");
const check = process.argv.includes("--check");

function sorted(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sorted);
	if (value === null || typeof value !== "object") return value;

	return Object.fromEntries(
		Object.keys(value)
			.toSorted()
			.map((key) => [key, sorted((value as Record<string, unknown>)[key])]),
	);
}

const unsorted = readdirSync(directory)
	.filter((file) => file.endsWith(".json"))
	.filter((file) => {
		const path = join(directory, file);
		const data = JSON.parse(readFileSync(path, "utf8")) as unknown;
		const fixed = sorted(data);

		if (JSON.stringify(fixed) === JSON.stringify(data)) return false;
		if (!check) writeFileSync(path, `${JSON.stringify(fixed, null, "\t")}\n`);
		return true;
	});

if (check && unsorted.length > 0) {
	console.error(`Keys out of order (run \`pnpm fmt\`): ${unsorted.join(", ")}`);
	process.exit(1);
}
