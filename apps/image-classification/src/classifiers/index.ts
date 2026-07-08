import * as deepDanbooru from "./deep-danbooru";

export type Classification = {
	deepDanbooru: deepDanbooru.Result;
};

export const startModel = deepDanbooru.startModel;
export const isReady = deepDanbooru.isReady;

export const classify = async (imagePath: string): Promise<Classification> => ({
	deepDanbooru: await deepDanbooru.evaluate(imagePath)
});
