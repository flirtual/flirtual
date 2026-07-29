import { captureException } from "@sentry/react-router";
import AwsS3 from "@uppy/aws-s3";
import Compressor from "@uppy/compressor";
import Uppy from "@uppy/core";
import type { UppyFile } from "@uppy/core";
import DropTarget from "@uppy/drop-target";
import GoldenRetriever from "@uppy/golden-retriever";
import ImageEditor from "@uppy/image-editor";
import { Dashboard, DragDrop, StatusBar } from "@uppy/react";
import { ImagePlus } from "lucide-react";
import {
	useCallback,
	useEffect,
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

type UppyfileMeta = { id: string; stereo?: boolean; sbs?: boolean } & Partial<ProfileImageMetadata>;
type UppyfileData = Record<string, unknown>;

// Restored before a retry, since Uppy re-runs Compressor on every attempt and
// repeated compression compounds the quality loss.
type UppyfileSnapshot = Pick<
	UppyFile<UppyfileMeta, UppyfileData>,
	"data" | "extension" | "name" | "size" | "type"
>;

type UploadError = { expected?: boolean; source?: { status?: number } } & Error;

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

const uploadRetryDelays = [2000, 6000, 15_000];

// Presigned URLs are valid for an hour. Reuse them so retries don't burn our
// rate limit. A 15 minute buffer allows for the upload and clock skew.
const signedUrlLifetime = 45 * 60 * 1000;

function retryableUploadError(error: UploadError): boolean {
	const status = error.source?.status;
	if (status === undefined) return false;

	return status === 0 // dropped connection
		|| status === 403 // expired presigned URL
		|| status === 408 // request body sent too slowly
		|| status === 429 // rate limited
		|| status >= 500; // server-side failure
}

export const InputImageSet: FC<InputImageSetProps> = (props) => {
	const { value, onChange, type = "profile", max } = props;

	const session = useOptionalSession();
	const [theme] = useTheme();
	const { native, apple } = useDevice();
	const [uppy, setUppy] = useState<Uppy<UppyfileMeta, UppyfileData> | null>(null);
	const [uppyVisible, setUppyVisible] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);
	const toast = useToast();
	const { t } = useTranslation();
	const uppyLocale = t("uppy", { returnObjects: true });

	const fullPreviewImage = value.find(({ id }) => id === fullPreviewId);

	// Uploads finish one at a time and outlive the render that started them, so
	// appends compose against the latest value rather than a captured one.
	const valueReference = useRef(value);
	const onChangeReference = useRef(onChange);

	useEffect(() => {
		valueReference.current = value;
	}, [value]);

	useEffect(() => {
		onChangeReference.current = onChange;
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
		if (!session) return;

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

		const addedFiles = new Map<string, UppyfileSnapshot>();
		const signedUrls = new Map<
			string,
			{ id: string; mintedAt: number; sbs: boolean; signedUrl: string }
		>();
		const uploadAttempts = new Map<string, number>();
		const uploadErrors = new Map<string, string>();
		const pendingRetries = new Map<string, ReturnType<typeof setTimeout>>();
		const settledFiles = new Set<string>();

		uppyInstance.on("file-added", (file) => {
			// Change HEIC and MPO content types so Compressor skips them and doesn't
			// strip stereo metadata. The pre-upload processor restores the correct
			// type.
			const extension = file.extension?.toLowerCase() ?? "";
			if (["heic", "heif", "mpo"].includes(extension))
				uppyInstance.setFileState(file.id, { type: "application/octet-stream" });

			const { data, extension: added, name, size, type } = uppyInstance.getFile(file.id);
			addedFiles.set(file.id, { data, extension: added, name, size, type });

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
		uppyInstance.addPreProcessor(async (fileIds) => {
			for (const fileId of fileIds) {
				const file = uppyInstance.getFile(fileId);
				const type = file && extensionContentTypes[file.extension?.toLowerCase() ?? ""];
				if (type && file.type !== type)
					uppyInstance.setFileState(fileId, { type, meta: { ...file.meta, type } });
			}
		});

		const finishUpload = () => {
			// A retry is still queued; it will finish the batch when it settles.
			if (pendingRetries.size > 0) return;

			const [message] = [...uploadErrors.values()];
			if (message) toast.add({ type: "error", value: message });

			uppyInstance.removeFiles([...settledFiles]);

			for (const fileId of settledFiles) {
				addedFiles.delete(fileId);
				signedUrls.delete(fileId);
				uploadAttempts.delete(fileId);
				uploadErrors.delete(fileId);
			}

			settledFiles.clear();
			setUppyVisible(false);
		};

		uppyInstance.use(AwsS3, {
			shouldUseMultipart: false,
			limit: 15,
			async getUploadParameters(file) {
				const sbs = file.meta.sbs === true;
				const reusable = signedUrls.get(file.id);

				const parameters = (id: string, signedUrl: string) => {
					file.meta.id = id;

					return {
						url: signedUrl,
						method: "PUT" as const,
						...(sbs ? { headers: { "x-amz-meta-stereo": "sbs" } } : {})
					};
				};

				if (
					reusable
					&& reusable.sbs === sbs
					&& Date.now() - reusable.mintedAt < signedUrlLifetime
				)
					return parameters(reusable.id, reusable.signedUrl);

				try {
					const { id, signedUrl } = await Image.upload(sbs);
					signedUrls.set(file.id, { id, mintedAt: Date.now(), sbs, signedUrl });

					return parameters(id, signedUrl);
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

					const error: UploadError = new Error(t("each_ideal_seahorse_bump"));
					// No response means the network dropped the request, rather than the
					// API refusing it.
					error.source = { status: isWretchError(reason) ? reason.status : 0 };

					throw error;
				}
			},
		})
			.on("upload-success", (file) => {
				if (!file) return;

				settledFiles.add(file.id);
				uploadErrors.delete(file.id);

				handleUploadSuccess(file.meta);
			})
			.on("upload-error", (file, error: UploadError) => {
				if (!file) return;

				const attempt = (uploadAttempts.get(file.id) ?? 0) + 1;
				uploadAttempts.set(file.id, attempt);

				if (error.message === "Request has expired") signedUrls.delete(file.id);

				const delay = uploadRetryDelays[attempt - 1];

				if (delay === undefined || !retryableUploadError(error)) {
					settledFiles.add(file.id);
					uploadErrors.set(file.id, error.message || t("each_ideal_seahorse_bump"));

					if (!error.expected)
						captureException(error, { tags: { uploadAttempts: attempt } });
					return;
				}

				const added = addedFiles.get(file.id);
				if (added) uppyInstance.setFileState(file.id, added);

				// Cleared by the effect cleanup, which drains pendingRetries.
				// eslint-disable-next-line react-web-api/no-leaked-timeout
				const retry = setTimeout(() => {
					pendingRetries.delete(file.id);
					if (!uppyInstance.getFile(file.id)) return finishUpload();

					void uppyInstance
						.retryUpload(file.id)
						.catch(() => void 0)
						.finally(finishUpload);
				}, delay);

				pendingRetries.set(file.id, retry);
			})
			.on("complete", finishUpload);

		setUppy(uppyInstance);

		return () => {
			for (const timeout of pendingRetries.values()) clearTimeout(timeout);
			uppyInstance.destroy();
		};
	}, [session, handleUploadSuccess, type, native, apple, t, uppyLocale, toast]);

	const sortableItems = value.map(({ id }, index) => id || index);

	return (
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
								{uppy && (
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
