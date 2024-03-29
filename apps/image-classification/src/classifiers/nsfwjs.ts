import fs from "node:fs/promises";
import path from "node:path";

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

export type Result = {
	[K in nsfw.predictionType["className"] as Lowercase<K>]: number;
};

export const classify: Classifier<Result> = async (_, groupFile) => {
	const map = new Map<string, Result>();
	const model = await load();

	const files = (
		await fs.readdir(path.resolve(temporaryDirectory, groupFile))
	).filter(
		// Some classifiers output files into the group's directory, so we filter them out.
		(filename) => path.extname(filename) !== ".json"
	);

	await Promise.all(
		files.map(async (filename) => {
			const data = await fs.readFile(
				path.resolve(temporaryDirectory, groupFile, filename)
			);
			const image = tf.node.decodeImage(data, 3) as tf.Tensor3D;

			// Classify the image using the TensorFlow model.
			const predictions = await model.classify(image);
			image.dispose();

			const imageId = path.basename(filename, path.extname(filename));

			map.set(
				imageId,
				Object.fromEntries(
					predictions
						.map(({ className, probability }) => [
							className.toLowerCase(),
							// Round the probability to 4 decimal places.
							Number.parseFloat(probability.toFixed(4))
						])
						// Filter out predictions with a probability of less than 50%.
						.filter(([, probability]) => (probability as number) > 0.5)
				) as Result
			);
		})
	);

	return map;
};
