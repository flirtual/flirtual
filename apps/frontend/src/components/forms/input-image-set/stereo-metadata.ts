import { BasePlugin } from "@uppy/core";
import type { Body, DefinePluginOpts, Meta, PluginOpts, Uppy } from "@uppy/core";

interface StereoMetadataOptions {}

type Options = DefinePluginOpts<StereoMetadataOptions, keyof StereoMetadataOptions>;

// HEIC metadata ('meta' box with stereo-pair grouping) is within the first chunk.
const heicScanBytes = 262144;

// Detect if an image is stereoscopic at upload so the API queues it for spatial
// HEIC generation.
export default class StereoMetadata<M extends Meta, B extends Body> extends BasePlugin<Options, M, B> {
	public constructor(uppy: Uppy<M, B>, options: PluginOpts) {
		super(uppy, options);
		this.id = options.id || "StereoMetadata";
		this.type = "modifier";
	}

	// "sbs" = side-by-side in a single frame (flat variants must be cropped to one
	// eye); "stereo" = stereo with separate frames/images in container.
	private async detect(file: { name?: string; extension?: string; data: Blob }): Promise<"sbs" | "stereo" | null> {
		const name = (file.name ?? "").toLowerCase();
		const extension = (file.extension ?? name.split(".").pop() ?? "").toLowerCase();

		// JPS/PNS, Google VR Photo, and SteamVR screenshots: side-by-side.
		if (["jps", "pns"].includes(extension) || /[._]vr\.jpe?g$/.test(name)) return "sbs";

		// MPO: two separate JPEG frames.
		if (extension === "mpo") return "stereo";

		// HEIC files with spatial metadata.
		if (extension === "heic") return (await this.isStereoHeic(file.data)) ? "stereo" : null;

		return null;
	}

	// A stereo HEIC has a 'ster' entity group inside 'grpl' in its metadata.
	private async isStereoHeic(blob: Blob): Promise<boolean> {
		try {
			const head = new Uint8Array(await blob.slice(0, heicScanBytes).arrayBuffer());
			return hasBoxType(head, "grpl") && hasBoxType(head, "ster");
		}
		catch (reason: any) {
			console.warn("[Stereo]", new Error("Failed to inspect HEIC", { cause: reason }));
			return false;
		}
	}

	public processFiles = async (fileIDs: Array<string>): Promise<void> => {
		await Promise.all(fileIDs.map(async (fileID) => {
			const file = this.uppy.getFile(fileID);

			const layout = await this.detect(file);

			if (layout) {
				this.uppy.setFileState(fileID, {
					meta: { ...file.meta, stereo: true, sbs: layout === "sbs" }
				});

				this.uppy.log(`[Stereo] Detected ${layout} image for ${file.id}`);
			}
		}));
	};

	public install(): void {
		this.uppy.addPreProcessor(this.processFiles);
	}

	public uninstall(): void {
		this.uppy.removePreProcessor(this.processFiles);
	}
}

// Search byte buffer for 4-character ISOBMFF box type.
function hasBoxType(bytes: Uint8Array, type: string): boolean {
	const a = type.charCodeAt(0);
	const b = type.charCodeAt(1);
	const c = type.charCodeAt(2);
	const d = type.charCodeAt(3);

	for (let index = 0; index + 4 <= bytes.length; index++) {
		if (bytes[index] === a && bytes[index + 1] === b && bytes[index + 2] === c && bytes[index + 3] === d)
			return true;
	}

	return false;
}
