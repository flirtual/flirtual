import fs from "fs/promises";
import path from "path";

import * as nsfw from "nsfwjs";
import * as tf from "@tensorflow/tfjs-node";

import { temporaryDirectory } from "../consts";

import type { Classifier } from ".";

let _model: nsfw.NSFWJS;
tf.enableProdMode();

const load = async () => {
	if (_model) return _model;

	// eslint-disable-next-line require-atomic-updates
	_model = await nsfw.load();
	return _model;
};

export type Result = { [K in nsfw.predictionType["className"] as Lowercase<K>]: number };

export const classify: Classifier<Result> = async (_, groupFile) => {
	const map = new Map<string, Result>();
	const model = await load();

	const files = (await fs.readdir(path.resolve(temporaryDirectory, groupFile))).filter(
		(filename) => path.extname(filename) !== ".json"
	);

	await Promise.all(
		files.map(async (filename) => {
			const data = await fs.readFile(path.resolve(temporaryDirectory, groupFile, filename));
			const image = tf.node.decodeImage(data, 3) as tf.Tensor3D;

			const predictions = await model.classify(image);
			image.dispose();

			map.set(
				path.basename(filename, path.extname(filename)),
				Object.fromEntries(
					predictions
						.map(({ className, probability }) => [
							className.toLowerCase(),
							parseFloat(probability.toFixed(4))
						])
						.filter(([, probability]) => (probability as number) > 0.5)
				) as Result
			);
		})
	);

	return map;
};
