import { log } from "../log";

import * as deepDanbooru from "./deep-danbooru";
import * as nsfwjs from "./nsfwjs";

import type { Image } from "../api/scan-queue";

// const classifiers = { deepDanbooru, nsfwjs };
const classifiers = { deepDanbooru };

export type Classifiers = typeof classifiers;
export type ClassifierType = keyof Classifiers;

export type Classifier<T> = (
	images: Array<Image>,
	fileGroup: string
) => Promise<Map<string, T>>;
export type AnyClassifier = Classifier<Classification[ClassifierType]>;

export interface ClassifierModule {
	classify: AnyClassifier;
}

export type Classification = {
	[K in ClassifierType]: Awaited<
		ReturnType<Classifiers[K]["classify"]>
	> extends Map<unknown, infer Result>
	? Result
	: never;
};

export const classify = async (groupFile: string, images: Array<Image>) => {
	const map = new Map<string, Classification>();

	(
		await Promise.all(
			Object.entries(classifiers).map(async ([classifierId, { classify }]) => {
				const child = log.child({ groupFile, classifierId });
				child.info(`Classifying...`);

				return [
					classifierId,
					await classify(images, groupFile),
					child
				] as const;
			})
		)
	).map(([classifierId, classificationGroup, log]) => {
		log.info(`Classified ${classificationGroup.size} images.`);

		for (const [imageId, classification] of classificationGroup.entries()) {
			const value = (map.get(imageId) ?? {}) as Classification;

			// @ts-expect-error: I don't know how to make this work.
			value[classifierId] = classification;
			map.set(imageId, value);
		}
	});

	return map;
};
