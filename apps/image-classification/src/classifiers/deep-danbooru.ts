import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

import { temporaryDirectory } from "../consts";

import type { Classifier } from ".";

export type Result = Record<string, number>;

export const classify: Classifier<Result> = async (imageIds, fileGroup) => {
	const map = new Map<string, Result>();

	const args = [
		"deepdanbooru/__main__.py",
		"evaluate",
		path.resolve(temporaryDirectory, fileGroup),
		"--project-path",
		"./",
		"--allow-folder",
		"--save-json"
	];

	await new Promise((resolve, reject) => {
		const process = spawn("python3", args, {
			cwd: "deep-danbooru"
		});

		process.stderr.on("data", (data) => console.error(data.toString()));

		process.on("error", reject);
		process.on("close", resolve);
	});

	await Promise.all(
		imageIds.map(async (imageId) => {
			const content = await fs.readFile(
				path.resolve(temporaryDirectory, fileGroup, `${imageId}.json`),
				"utf-8"
			);
			const data = JSON.parse(content) as Record<string, string>;

			map.set(
				imageId,
				Object.fromEntries(
					Object.entries(data).map(([tag, probability]) => [
						tag,
						parseFloat(parseFloat(probability).toFixed(4))
					])
				)
			);
		})
	);

	return map;
};
