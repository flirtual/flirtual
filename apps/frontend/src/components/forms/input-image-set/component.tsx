import { captureException } from "@sentry/react-router";
import Compressor from "@uppy/compressor";
import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import DropTarget from "@uppy/drop-target";
import GoldenRetriever from "@uppy/golden-retriever";
import ImageEditor from "@uppy/image-editor";
import { Dashboard, DragDrop, StatusBar } from "@uppy/react";
import Tus from "@uppy/tus";
import { ImagePlus } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from "react";
import type { Dispatch, FC } from "react";
import { useTranslation } from "react-i18next";
import { groupBy } from "remeda";
import { twMerge } from "tailwind-merge";

import { isWretchError } from "~/api/common";
import { Image } from "~/api/images";
import type { ProfileImageMetadata } from "~/api/user/profile/images";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import {
	ArrangeableImage,
	ArrangeableImagePreview
} from "../../arrangeable-image";
import { Button } from "../../button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "../../dialog/dialog";
import { UserImage } from "../../user-avatar";
import {
	SortableGrid,
	SortableItem,
	SortableItemOverlay,
	useCurrentSortableItem
} from "../sortable";
import StereoMetadata from "./stereo-metadata";
import VRChatMetadata from "./vrchat-metadata";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/image-editor/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/status-bar/dist/style.min.css";
import "./index.css";

export type ImageSetValue = {
	id: string;
	src: string;
	fullSrc: string;
	blurHash?: string;
	stereo?: boolean;
}
& Partial<ProfileImageMetadata>;

export interface InputImageSetProps {
	value: Array<ImageSetValue>;
	onChange: Dispatch<Array<ImageSetValue>>;
	id?: string;
	type?: "profile" | "report";
	max?: number;
}

type UppyfileMeta = { id: string; stereo?: boolean; sbs?: boolean; stereoLayout?: string } & Partial<ProfileImageMetadata>;
type UppyfileData = Record<string, unknown>;

type UploadError = { expected?: boolean } & Error;

// Cloudflare Image Resizing rejects images over 100MP.
const maxImagePixels = 100_000_000;

// Images are resized clientside to fit within 2048x2048.
const maxImageDimension = 2048;

// Browsers don't report MIME types for formats they don't support.
const extensionContentTypes: Record<string, string> = {
	mpo: "image/jpeg",
	jps: "image/jpeg",
	pns: "image/png",
	heic: "image/heic",
	heif: "image/heif"
};

// Smaller resumes better but costs requests, and the server restages its partial
// buffer on each one, so halving this quadruples that traffic.
const uploadChunkSize = 512 * 1024;

export const InputImageSet: FC<InputImageSetProps> = (props) => {
	const { value, onChange, type = "profile", max } = props;

	const authenticated = !!useOptionalSession();
	const [theme] = useTheme();
	const { native, apple } = useDevice();
	const [uppy, setUppy] = useState<Uppy<UppyfileMeta, UppyfileData> | null>(null);
	const [uppyVisible, setUppyVisible] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);
	const toast = useToast();
	const { t } = useTranslation();
	const uppyLocale = useMemo(() => t("uppy", { returnObjects: true }), [t]);

	const fullPreviewImage = value.find(({ id }) => id === fullPreviewId);

	// Uploads outlive the render that started them, so append to the latest value.
	const valueReference = useRef(value);
	const onChangeReference = useRef(onChange);
	const toastReference = useRef(toast);

	useEffect(() => {
		valueReference.current = value;
	}, [value]);

	useEffect(() => {
		onChangeReference.current = onChange;
		toastReference.current = toast;
	});

	const handleUploadSuccess = useCallback((meta: UppyfileMeta) => {
		const next = [
			...valueReference.current,
			{
				id: meta.id,
				src: urls.media(meta.id, "uploads"),
				fullSrc: urls.media(meta.id, "uploads"),
				stereo: meta.stereo,
				authorId: meta.authorId,
				authorName: meta.authorName,
				worldId: meta.worldId,
				worldName: meta.worldName
			}
		];

		valueReference.current = next;
		onChangeReference.current(next);
	}, []);

	useEffect(() => {
		if (!authenticated) return;

		const uppyInstance = new Uppy<UppyfileMeta, UppyfileData>({
			autoProceed: type === "report",
			restrictions: {
				maxNumberOfFiles: 15,
				maxFileSize: 64_000_000,
				allowedFileTypes:
					type === "profile"
						? ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif", ".heic", ".heif", ".mpo", ".jps", ".pns"]
						: undefined
			},
			locale: {
				strings: {
					...uppyLocale,
					save: t("save"),
					rotate: t("rotate_90"),
					dropHereOr: native ? t("cute_male_chipmunk_agree") : t("stock_topical_mouse_inspire"),
					dropPasteFiles: native
						? "%{browseFiles}"
						: t("gross_known_deer_sprout", { browseFiles: "%{browseFiles}" }),
					dropPasteImportFiles: native
						? ""
						: t("kind_tangy_marten_fear", { browseFiles: "%{browseFiles}" }),
					browseFiles: native
						? type === "report"
							? t("cute_male_chipmunk_agree")
							: t("patient_proof_octopus_revive")
						: uppyLocale.browse!
				},
				pluralize: (n) => n === 1 ? 0 : 1
			}
		});

		const uploadTokens = new Map<string, string>();
		const uploadErrors = new Map<string, string>();
		const detachedFiles = new Map<string, Promise<void>>();
		const settledFiles = new Set<string>();

		// Android's photo picker reports a different mtime each read, so Chromium fails
		// the send with ERR_UPLOAD_FILE_CHANGED. An in-memory copy has no mtime.
		const detachFromDisk = async (fileId: string) => {
			const file = uppyInstance.getFile(fileId);
			if (!file || file.data instanceof Blob === false) return;

			try {
				const source = file.data;
				const buffer = await source.arrayBuffer();

				// Stays a File so Compressor can still read a name off it, which it uses
				// to rebuild the extension.
				const data = source instanceof File
					? new File([buffer], source.name, { type: source.type, lastModified: source.lastModified })
					: new Blob([buffer], { type: source.type });

				if (uppyInstance.getFile(fileId))
					uppyInstance.setFileState(fileId, { data, size: data.size });
			}
			catch (reason) {
				// Reading can fail the same way; report it rather than skipping silently.
				captureException(reason, { tags: { stage: "detachFromDisk" } });
			}
		};

		uppyInstance.on("file-added", (file) => {
			// Change HEIC and MPO content types so Compressor skips them and doesn't
			// strip stereo metadata. The pre-upload processor restores the correct
			// type.
			const extension = file.extension?.toLowerCase() ?? "";
			if (["heic", "heif", "mpo"].includes(extension))
				uppyInstance.setFileState(file.id, { type: "application/octet-stream" });

			detachedFiles.set(file.id, detachFromDisk(file.id));

			if (!file.type?.startsWith("image/")) return;

			void createImageBitmap(file.data)
				.then((bitmap) => {
					const pixels = bitmap.width * bitmap.height;
					bitmap.close();

					if (pixels > maxImagePixels) {
						uppyInstance.removeFile(file.id);
						uppyInstance.info(t("each_ideal_seahorse_bump"), "error", 5000);
					}
				})
				.catch(() => void 0);
		});

		const reportProgress = (process: (fileIds: Array<string>) => Promise<void>) =>
			async (fileIds: Array<string>) => {
				const each = (emit: (file: UppyFile<UppyfileMeta, UppyfileData>) => void) => {
					for (const fileId of fileIds) {
						const file = uppyInstance.getFile(fileId);
						if (file) emit(file);
					}
				};

				each((file) => uppyInstance.emit("preprocess-progress", file, {
					mode: "indeterminate",
					message: uppyLocale.loading as string
				}));

				try {
					await process(fileIds);
				}
				finally {
					each((file) => uppyInstance.emit("preprocess-complete", file));
				}
			};

		// First, so a late copy can't overwrite Compressor's output.
		uppyInstance.addPreProcessor(reportProgress(async (fileIds) => {
			await Promise.all(fileIds.map((fileId) => detachedFiles.get(fileId)));
		}));

		if (type === "profile") {
			uppyInstance
				.use(ImageEditor, {
					actions: {
						revert: false,
						rotate: true,
						granularRotate: false,
						flip: false,
						zoomIn: false,
						zoomOut: false,
						cropSquare: false,
						cropWidescreen: false,
						cropWidescreenVertical: false
					},
					cropperOptions: {
						viewMode: 1,
						dragMode: "none",
						aspectRatio: 1,
						guides: false,
						center: false,
						croppedCanvasOptions: {}
					}
				})
				.use(VRChatMetadata, {})
				.use(StereoMetadata, {});
		}

		uppyInstance
			.use(DropTarget, {
				target: document.body,
				onDrop: () => {
					setUppyVisible(true);
					setDragging(false);
				},
				onDragOver: () => setDragging(true),
				onDragLeave: () => setDragging(false)
			})
			.use(Compressor, {
				maxHeight: maxImageDimension,
				maxWidth: maxImageDimension,
				quality: 0.6
			});

		if (!(native && apple)) {
			uppyInstance.use(GoldenRetriever, {});
		}

		// Correct content types.
		uppyInstance.addPreProcessor(reportProgress(async (fileIds) => {
			for (const fileId of fileIds) {
				const file = uppyInstance.getFile(fileId);
				const type = file && extensionContentTypes[file.extension?.toLowerCase() ?? ""];
				if (type && file.type !== type)
					uppyInstance.setFileState(fileId, { type, meta: { ...file.meta, type } });
			}
		}));

		const finishUpload = () => {
			// Uppy reports completion even when a retry found nothing to retry.
			if (settledFiles.size === 0) return;

			const [message] = [...uploadErrors.values()];
			if (message) toastReference.current.add({ type: "error", value: message });

			uppyInstance.removeFiles([...settledFiles]);

			for (const fileId of settledFiles) {
				detachedFiles.delete(fileId);
				uploadTokens.delete(fileId);
				uploadErrors.delete(fileId);
			}

			settledFiles.clear();
			setUppyVisible(false);
		};

		// Last, so the corrected content type is what tus sends as metadata.
		uppyInstance.addPreProcessor(reportProgress(async (fileIds) => {
			try {
				await Promise.all(fileIds.map(async (fileId) => {
					const file = uppyInstance.getFile(fileId);
					if (!file || uploadTokens.has(fileId)) return;

					try {
						const { id, uploadUrl, uploadToken } = await Image.upload();

						uploadTokens.set(fileId, uploadToken);
						uppyInstance.setFileState(fileId, {
							// `id` becomes the object key, `stereoLayout` its metadata.
							meta: {
								...file.meta,
								id,
								...(file.meta.sbs === true ? { stereoLayout: "sbs" } : {})
							},
							tus: { endpoint: uploadUrl }
						});
					}
					catch (reason) {
						if (isWretchError(reason) && reason.json?.error) {
							const key = `errors.${reason.json.error}` as any;
							const translated = t(key);

							if (translated !== key) {
								const refusal: UploadError = new Error(translated);
								refusal.expected = true;

								throw refusal;
							}
						}

						throw new Error(t("each_ideal_seahorse_bump"));
					}
				}));
			}
			catch (reason) {
				const { message } = reason as Error;

				// Uppy only reports "upload failed" here, keeping why behind an alert().
				uppyInstance.info(message, "error", 5000);

				// A failed hook marks nothing as errored: retry would then collect no
				// files and report itself complete, and every attempt after the first
				// skips the branch that records the failure, leaving no retry button.
				uppyInstance.setState({ error: message });

				for (const fileId of fileIds) {
					if (uppyInstance.getFile(fileId))
						uppyInstance.setFileState(fileId, { error: message });
				}

				throw reason;
			}
		}));

		uppyInstance.use(Tus, {
			limit: 15,
			chunkSize: uploadChunkSize,
			// Only what the server reads; the rest of our meta stays off the wire.
			allowedMetaFields: ["id", "stereoLayout", "name", "type"],
			removeFingerprintOnSuccess: true,
			headers: (file) => ({ authorization: `Bearer ${uploadTokens.get(file.id) ?? ""}` })
		})
			.on("upload-success", (file) => {
				if (!file) return;

				settledFiles.add(file.id);
				uploadErrors.delete(file.id);

				handleUploadSuccess(file.meta);
			})
			.on("upload-error", (file, error: UploadError) => {
				if (!file) return;

				// tus already retried from the server's offset, so this is terminal.
				settledFiles.add(file.id);
				uploadErrors.set(file.id, error.message || t("each_ideal_seahorse_bump"));

				if (!error.expected) captureException(error);
			})
			.on("complete", finishUpload);

		setUppy(uppyInstance);

		return () => uppyInstance.destroy();
	}, [authenticated, handleUploadSuccess, type, native, apple, t, uppyLocale]);

	const sortableItems = value.map(({ id }, index) => id || index);

	return (
		<>
			{/* Outside SortableGrid, whose key changes with values and would remount it. */}
			{type === "profile" && uppy && (
				<Dialog
					open={uppyVisible}
					onOpenChange={(visible) => setUppyVisible(visible)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("upload_pictures")}</DialogTitle>
						</DialogHeader>
						<DialogBody>
							<Dashboard
								showProgressDetails
								proudlyDisplayPoweredByUppy={false}
								theme={theme}
								uppy={uppy}
							/>
						</DialogBody>
					</DialogContent>
				</Dialog>
			)}
			<SortableGrid
				disabled={!!fullPreviewId}
				values={sortableItems}
				onChange={(newSortableItems) => {
					const keyedValue = groupBy(value, ({ id }) => id);
					onChange(
						newSortableItems.map((id) => keyedValue[id]?.[0]).filter(Boolean)
					);
				}}
			>
				<div className="grid grid-cols-3 gap-2">
					{value.map((image, imageIndex) =>
						type === "profile"
						|| !image.id?.includes(".")
						|| /\.(?:jpg|jpeg|png|gif|webm)$/i.test(image.id)
							? (
									<SortableItem id={image.id} key={image.id}>
										<ArrangeableImage
											id={image.id}
											className={max && (imageIndex + 1 > max) ? "opacity-25" : ""}
											src={image.src}
											onDelete={() => {
												onChange?.(value.filter((_, index) => imageIndex !== index));
											}}
											onFullscreen={() => setFullPreviewId(image.id)}
										/>
									</SortableItem>
								)
							: (
									<div key={image.id} className="m-auto">
										{image.id.split("-").pop()}
									</div>
								)
					)}
					{fullPreviewImage && (
						<ArrangeableImageDialog
							image={fullPreviewImage}
							onOpenChange={(visible) => {
								if (!visible) setFullPreviewId(null);
							}}
						/>
					)}
					{type === "profile"
						? (
								<>
									<Button
										className={twMerge(
											"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-xl bg-brand-gradient",
											dragging && "animate-pulse"
										)}
										tabIndex={0}
										onClick={() => setUppyVisible(true)}
									>
										<ImagePlus className="size-10 text-white-20" />
									</Button>
								</>
							)
						: (
								uppy && (
									<DragDrop
									// @ts-expect-error: no
										className={twMerge(
											"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-xl bg-brand-gradient shadow-brand-1",
											dragging && "animate-pulse"
										)}
										uppy={uppy}
									/>
								)
							)}
				</div>
				<InputImageSetDragOverlay values={value} />
				{type === "report" && uppy && <StatusBar uppy={uppy} />}
			</SortableGrid>
		</>
	);
};

const InputImageSetDragOverlay: FC<{ values: Array<ImageSetValue> }> = ({
	values
}) => {
	const currentId = useCurrentSortableItem();
	const current = values.find(({ id }) => id === currentId);

	return (
		<SortableItemOverlay>
			{current && <ArrangeableImagePreview {...current} />}
		</SortableItemOverlay>
	);
};

const ArrangeableImageDialog: React.FC<{
	image: ImageSetValue;
	onOpenChange: Dispatch<boolean>;
}> = ({ image, onOpenChange }) => {
	const { t } = useTranslation();

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="pointer-events-none w-fit max-w-[95svw] overflow-hidden p-0 desktop:max-w-[95svw]">
				<UserImage
					alt={t("profile_picture")}
					blurHash={image.blurHash}
					className="!relative mx-auto aspect-auto !size-auto max-h-[80vh] rounded-2.5xl object-cover"
					src={image.fullSrc}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default InputImageSet;
