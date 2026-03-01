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
	author: {
		id: string;
		displayName: string;
	};
	world: {
		id: string;
		name: string;
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

	private async extractMetadata(blob: Blob): Promise<ProfileImageMetadata | null> {
		try {
			const buffer = await blob.arrayBuffer();
			const tags = ExifReader.load(buffer, {
				expanded: true,
				domParser: new CleanDOMParser()
			});

			// Standard format
			if (tags.xmp?.Author && tags.xmp?.AuthorID && tags.xmp?.WorldID && tags.xmp?.WorldDisplayName) {
				return {
					authorId: tags.xmp.AuthorID.description,
					authorName: tags.xmp.Author.description,
					worldId: tags.xmp.WorldID.description,
					worldName: tags.xmp.WorldDisplayName.description
				};
			}

			// VRCX format
			if (tags.pngText?.Description) {
				const vrcxData = JSON.parse(tags.pngText.Description.description) as VRCXData;

				if (vrcxData.application === "VRCX" && vrcxData.author && vrcxData.world) {
					return {
						authorId: vrcxData.author.id,
						authorName: vrcxData.author.displayName,
						worldId: vrcxData.world.id,
						worldName: vrcxData.world.name
					};
				}
			}

			// Legacy format
			if (tags.xmp?.Author && tags.xmp?.World) {
				return {
					authorId: tags.xmp.Author.description,
					worldId: tags.xmp.World.description
				};
			}

			return null;
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
