"use client";

import AwsS3 from "@uppy/aws-s3";
import Compressor from "@uppy/compressor";
import Uppy, { type UppyFile } from "@uppy/core";
import DropTarget from "@uppy/drop-target";
import GoldenRetriever from "@uppy/golden-retriever";
import ImageEditor from "@uppy/image-editor";
import { Dashboard, DragDrop, StatusBar } from "@uppy/react";
import RemoteSources from "@uppy/remote-sources";
import { ImagePlus } from "lucide-react";
import {
	type Dispatch,
	type FC,
	useCallback,
	useEffect,
	useState
} from "react";
import { groupBy } from "remeda";
import { twMerge } from "tailwind-merge";

import { uppyCompanionUrl } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useCurrentUser } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { urls } from "~/urls";

import {
	ArrangeableImage,
	ArrangeableImagePreview
} from "../arrangeable-image";
import { Button } from "../button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "../dialog/dialog";
import { UserImage } from "../user-avatar";
import {
	SortableGrid,
	SortableItem,
	SortableItemOverlay,
	useCurrentSortableItem
} from "./sortable";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/image-editor/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/status-bar/dist/style.min.css";

export interface ImageSetValue {
	id: string;
	src: string;
	fullSrc: string;
}

export interface InputImageSetProps {
	value: Array<ImageSetValue>;
	onChange: Dispatch<Array<ImageSetValue>>;
	id?: string;
	type?: "profile" | "report";
}

type UppyfileMeta = Record<string, unknown>;
type UppyfileData = Record<string, unknown>;

type MultipartFile = {
	s3Multipart: {
		key: string;
		uploadId: string;
	};
} & UppyFile<UppyfileMeta, UppyfileData>;

type UploadedMultipartFile = {
	uploadURL: string;
} & MultipartFile;

export const InputImageSet: FC<InputImageSetProps> = (props) => {
	const { value, onChange, type = "profile" } = props;
	const user = useCurrentUser();
	const { theme } = useTheme();
	const { platform, native } = useDevice();
	const [uppy, setUppy] = useState<Uppy<UppyfileMeta, UppyfileData> | null>(
		null
	);
	const [uppyVisible, setUppyVisible] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);

	const fullPreviewImage = value.find(({ id }) => id === fullPreviewId);

	const handleUppyComplete = useCallback(
		async (fileKeys: Array<string>) => {
			if (!user) return;

			onChange([
				...value,
				...fileKeys.map((key) => ({
					id: key,
					src: urls.media(key, "pfpup"),
					fullSrc: urls.media(key, "pfpup")
				}))
			]);
		},
		[onChange, user, value]
	);

	useEffect(() => {
		if (!user) return;

		const uppyInstance = new Uppy<UppyfileMeta, UppyfileData>({
			autoProceed: type === "report",
			restrictions: {
				maxNumberOfFiles: 15,
				maxFileSize: 64_000_000,
				allowedFileTypes:
					type === "profile"
						? ["image/jpeg", "image/png", "image/gif", "image/webp"]
						: undefined
			},
			locale: {
				strings: {
					dropPasteFiles: native
						? "%{browseFiles}"
						: "Drop files here or %{browseFiles}",
					dropPasteImportFiles: native
						? ""
						: "Drop files here, %{browseFiles}, or import from:",
					browseFiles: native
						? type === "report"
							? "Select files..."
							: "Select pictures..."
						: "browse"
				},
				pluralize: (n) => n
			}
		})
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
				quality: 0.6
			})
			.use(GoldenRetriever, {})
			.use(AwsS3, {
				endpoint: uppyCompanionUrl,
				shouldUseMultipart: true,
				limit: 15
			})
			.on("complete", (result) => {
				const files = result.successful as Array<UploadedMultipartFile>;
				const keys = files.map((file) => file.s3Multipart.key);
				void handleUppyComplete(keys);
				setUppyVisible(false);
			});

		if (type === "profile") {
			uppyInstance
				.use(RemoteSources, {
					companionUrl: uppyCompanionUrl,
					sources: user.tags?.includes("debugger") ? ["Facebook"] : []
				})
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
				});
		}

		setUppy(uppyInstance);
	}, [user, handleUppyComplete, type, native]);

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
										src={image.src}
										onDelete={() => {
											onChange?.(value.filter((_, index) => imageIndex !== index));
										}}
										onFullscreen={() => setFullPreviewId(image.id)}
									/>
								</SortableItem>
							)
						: (
								<div className="m-auto" key={image.id}>
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
												<DialogTitle>Upload pictures</DialogTitle>
											</DialogHeader>
											<DialogBody>
												<Dashboard
													showProgressDetails
													proudlyDisplayPoweredByUppy={false}
													theme={theme}
													uppy={uppy}
												/>
												{platform === "android" && native && (
													<span className="text-sm opacity-75">
														We&apos;re aware of issues uploading some images from the Android app. If you&apos;re encountering errors, please try again through your web browser at www.flirtu.al.
													</span>
												)}
											</DialogBody>
										</DialogContent>
									</Dialog>
								)}
								<Button
									className={twMerge(
										"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient",
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
										"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient shadow-brand-1",
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
	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="pointer-events-none w-fit max-w-[95svw] overflow-hidden p-0 desktop:max-w-[95svw]">
				<UserImage
					fill
					alt="Profile image"
					className="!relative mx-auto aspect-auto !size-auto max-h-[80vh] rounded-[1.25rem] object-cover"
					src={image.fullSrc}
				/>
			</DialogContent>
		</Dialog>
	);
};
