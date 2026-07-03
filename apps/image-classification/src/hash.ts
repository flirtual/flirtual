import sharp from "sharp";

// DCT-based perceptual hash (pHash): DCT a 32x32 grayscale sample, keep the
// top-left 8x8 low-frequency block, and threshold each against the block's
// median (excluding the DC term) for a 64-bit hash.
const sampleSize = 32;
const hashSize = 8;

// 1D DCT-II coefficients, reused across both axes of the separable 2D transform.
const dctMatrix = (() => {
	const matrix = new Array<Float64Array>(sampleSize);

	for (let u = 0; u < sampleSize; u++) {
		const row = new Float64Array(sampleSize);
		const scale = u === 0 ? Math.sqrt(1 / sampleSize) : Math.sqrt(2 / sampleSize);

		for (let x = 0; x < sampleSize; x++)
			row[x] = scale * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * sampleSize));

		matrix[u] = row;
	}

	return matrix;
})();

const dct2d = (input: Float64Array): Float64Array => {
	const rows = new Float64Array(sampleSize * sampleSize);

	// DCT along each row.
	for (let y = 0; y < sampleSize; y++) {
		for (let u = 0; u < sampleSize; u++) {
			let sum = 0;
			const coefficients = dctMatrix[u]!;
			for (let x = 0; x < sampleSize; x++)
				sum += input[y * sampleSize + x]! * coefficients[x]!;
			rows[y * sampleSize + u] = sum;
		}
	}

	const output = new Float64Array(sampleSize * sampleSize);

	// DCT along each column.
	for (let x = 0; x < sampleSize; x++) {
		for (let v = 0; v < sampleSize; v++) {
			let sum = 0;
			const coefficients = dctMatrix[v]!;
			for (let y = 0; y < sampleSize; y++)
				sum += rows[y * sampleSize + x]! * coefficients[y]!;
			output[v * sampleSize + x] = sum;
		}
	}

	return output;
};

// 64-bit perceptual hash ("0"/"1" string) of a prepared pipeline. Similar
// images have a small Hamming distance.
const hashPipeline = async (pipeline: sharp.Sharp): Promise<string> => {
	// `fill` ignores aspect ratio, so the hash is stable regardless of dimensions.
	const pixels = await pipeline
		.flatten({ background: "#000000" })
		.greyscale()
		.resize(sampleSize, sampleSize, { fit: "fill" })
		.raw()
		.toBuffer();

	const input2d = new Float64Array(sampleSize * sampleSize);
	for (let index = 0; index < input2d.length; index++)
		input2d[index] = pixels[index] ?? 0;

	const dct = dct2d(input2d);

	const block: Array<number> = [];
	for (let v = 0; v < hashSize; v++)
		for (let u = 0; u < hashSize; u++) block.push(dct[v * sampleSize + u]!);

	// Threshold against the median, excluding the DC term which would skew it.
	const sorted = block.slice(1).sort((a, b) => a - b);
	const median = (sorted[(sorted.length - 1) >> 1]! + sorted[sorted.length >> 1]!) / 2;

	return block.map((value) => (value > median ? "1" : "0")).join("");
};

// Mask size — sharp composites after resizing, so the mask must match the
// base's post-resize size.
const circleSampleSize = 256;

let circleMaskCache: Promise<Buffer> | null = null;
const circleMask = () =>
	(circleMaskCache ??= sharp(
		Buffer.from(
			`<svg width="${circleSampleSize}" height="${circleSampleSize}"><circle cx="${circleSampleSize / 2}" cy="${circleSampleSize / 2}" r="${circleSampleSize / 2}" fill="#fff"/></svg>`
		)
	)
		.png()
		.toBuffer());

// Perceptual hash of the image center-cropped to a circle (optionally mirrored
// first). Circle crop helps recall from messy screenshots at the cost of some
// precision.
const circleHash = async (
	input: Buffer | string,
	flip: boolean
): Promise<string> => {
	const base = () => {
		const image = sharp(input, { failOn: "none" });
		return flip ? image.flop() : image;
	};

	const { width, height } = await base().metadata();
	if (!width || !height) throw new Error("missing image dimensions");

	const size = Math.min(width, height);
	const region = {
		left: (width - size) >> 1,
		top: (height - size) >> 1,
		width: size,
		height: size
	};

	const masked = await base()
		.extract(region)
		.resize(circleSampleSize, circleSampleSize, { fit: "fill" })
		.composite([{ input: await circleMask(), blend: "dest-in" }])
		.png()
		.toBuffer();

	return hashPipeline(sharp(masked, { failOn: "none" }));
};

export interface ImageHashes {
	// Perceptual hash, and the hash of the mirrored image (query-only, to match
	// horizontally-flipped duplicates).
	hash: string | null;
	flipped: string | null;
}

// Failed hashes are null.
export const imageHashes = async (
	input: Buffer | string
): Promise<ImageHashes> => {
	const safe = (hash: Promise<string>): Promise<string | null> =>
		hash.catch(() => null);

	const [hash, flipped] = await Promise.all([
		safe(circleHash(input, false)),
		safe(circleHash(input, true))
	]);

	return { hash, flipped };
};
