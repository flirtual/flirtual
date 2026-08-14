import * as deepDanbooru from "./deep-danbooru";

export interface Classification {
	deepDanbooru: deepDanbooru.Result;
}

export const startModel = deepDanbooru.startModel;
export const isReady = deepDanbooru.isReady;

export async function classify(imagePath: string): Promise<Classification> {
	return {
		deepDanbooru: await deepDanbooru.evaluate(imagePath)
	};
}
