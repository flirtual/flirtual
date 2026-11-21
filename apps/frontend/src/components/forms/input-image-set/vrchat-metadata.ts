import { BasePlugin } from "@uppy/core";
import type { Body, DefinePluginOpts, Meta, PluginOpts, Uppy } from "@uppy/core";
import * as ExifReader from "exifreader";

import type { ProfileImageMetadata } from "~/api/user/profile/images";

// Fix for stray null byte in legacy VRChat images
class CleanDOMParser {
	public parseFromString(xmlString: string, mimeType?: string): Document {
		const cleanXml = xmlString.replace(/^\0+/, "");
		return (new DOMParser()).parseFromString(cleanXml, (mimeType || "application/xml") as DOMParserSupportedType);
	}
}

interface VRCXData {
	application: string;
	author?: {
		id?: string;
		displayName?: string;
	};
	world?: {
		id?: string;
		name?: string;
	};
}

interface VRChatMetadataOptions {}

type Options = DefinePluginOpts<VRChatMetadataOptions, keyof VRChatMetadataOptions>;

export default class VRChatMetadata<M extends Meta, B extends Body> extends BasePlugin<Options, M, B> {
	public constructor(uppy: Uppy<M, B>, options: PluginOpts) {
		super(uppy, options);
		this.id = options.id || "VRChatMetadata";
		this.type = "modifier";
	}

	private async extractMetadata(blob: Blob): Promise<Partial<ProfileImageMetadata> | null> {
		try {
			const buffer = await blob.arrayBuffer();
			const tags = ExifReader.load(buffer, {
				expanded: true,
				domParser: new CleanDOMParser()
			});

			const xmp = (name: string) => tags.xmp?.[name]?.description?.trim() || undefined;

			let vrcx: VRCXData | undefined;
			try {
				const data = JSON.parse(tags.pngText?.Description?.description ?? "") as VRCXData;
				if (data.application === "VRCX") vrcx = data;
			}
			catch {
				// Not a VRCX description.
			}

			// Each field takes the first non-empty value from VRChat's XMP, VRCX's
			// description, then the legacy XMP format (IDs in Author and World).
			const author = xmp("Author");
			const world = xmp("World");
			const metadata = {
				authorId: xmp("AuthorID") || vrcx?.author?.id || (author?.startsWith("usr_") ? author : undefined),
				authorName: (author?.startsWith("usr_") ? undefined : author) || vrcx?.author?.displayName,
				worldId: xmp("WorldID") || vrcx?.world?.id || (world?.startsWith("wrld_") ? world : undefined),
				worldName: xmp("WorldDisplayName") || vrcx?.world?.name
			};

			return metadata.authorId || metadata.worldId ? metadata : null;
		}
		catch (reason: any) {
			const error = new Error("Failed to extract metadata", {
				cause: reason
			});
			console.warn("[VRC]", error);
			return null;
		}
	}

	public processFiles = async (fileIDs: Array<string>): Promise<void> => {
		const promises = fileIDs.map(async (fileID) => {
			const file = this.uppy.getFile(fileID);

			if (file.type !== "image/png") {
				return;
			}

			const vrcMetadata = await this.extractMetadata(file.data);

			if (vrcMetadata) {
				this.uppy.setFileState(fileID, {
					meta: {
						...file.meta,
						authorId: vrcMetadata.authorId,
						authorName: vrcMetadata.authorName,
						worldId: vrcMetadata.worldId,
						worldName: vrcMetadata.worldName
					}
				});

				this.uppy.log(`[VRC] Successfully extracted VRChat metadata for ${file.id}`);
			}
		});

		await Promise.all(promises);

		fileIDs.forEach((fileID) => {
			const file = this.uppy.getFile(fileID);
			this.uppy.emit("preprocess-complete", file);
		});
	};

	public install(): void {
		this.uppy.addPreProcessor(this.processFiles);
	}

	public uninstall(): void {
		this.uppy.removePreProcessor(this.processFiles);
	}
}
