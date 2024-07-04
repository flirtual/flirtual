"use client";

import { Dispatch, FC, useCallback, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { twMerge } from "tailwind-merge";
import Uppy, { UppyFile } from "@uppy/core";
import { Dashboard, DragDrop, StatusBar } from "@uppy/react";
// import RemoteSources from "@uppy/remote-sources";
import GoldenRetriever from "@uppy/golden-retriever";
import ImageEditor from "@uppy/image-editor";
import Compressor from "@uppy/compressor";
import DropTarget from "@uppy/drop-target";
import AwsS3 from "@uppy/aws-s3";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/image-editor/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/status-bar/dist/style.min.css";

import { useSessionUser } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { groupBy } from "~/utilities";
import { urls } from "~/urls";

import {
	ArrangeableImage,
	ArrangeableImagePreview
} from "../arrangeable-image";
import { Button } from "../button";
import { Modal } from "../modal";

import {
	SortableGrid,
	SortableItem,
	SortableItemOverlay,
	useCurrentSortableItem
} from "./sortable";

export interface ImageSetValue {
	id: string;
	src: string;
	fullSrc: string;
}

export interface InputImageSetProps {
	value: Array<ImageSetValue>;
	onChange: Dispatch<Array<ImageSetValue>>;
	id: string;
	type?: "profile" | "report";
}

type MultipartFile = UppyFile & {
	s3Multipart: {
		key: string;
		uploadId: string;
	};
};

type UploadedMultipartFile = MultipartFile & {
	uploadURL: string;
};

export const InputImageSet: FC<InputImageSetProps> = (props) => {
	const { value, onChange, type = "profile" } = props;
	const user = useSessionUser();
	const { theme } = useTheme();
	const [uppy, setUppy] = useState<Uppy | null>(null);
	const [uppyVisible, setUppyVisible] = useState(false);
	const [dragging, setDragging] = useState(false);

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

		const uppyInstance = new Uppy({
			autoProceed: type === "report",
			restrictions: {
				maxNumberOfFiles: 15,
				maxFileSize: 64_000_000,
				allowedFileTypes:
					type === "profile"
						? ["image/jpeg", "image/png", "image/gif", "image/webp"]
						: undefined
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
			.use(Compressor)
			.use(GoldenRetriever)
			.use(AwsS3, {
				companionUrl: "https://upload.flirtu.al",
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
				// .use(RemoteSources, {
				// 	companionUrl: "https://upload.flirtu.al",
				// 	sources: ["Facebook", "Instagram", "GoogleDrive"]
				// })
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
	}, [user, handleUppyComplete, type]);

	const sortableItems = value.map(({ id }, index) => id || index);

	return (
		<SortableGrid
			key={JSON.stringify(sortableItems)}
			values={sortableItems}
			onChange={(newSortableItems) => {
				console.log(newSortableItems);

				const keyedValue = groupBy(value, ({ id }) => id);
				onChange(newSortableItems.map((id) => keyedValue[id][0]));
			}}
		>
			<div className="grid grid-cols-3 gap-2">
				{value.map((image, imageIndex) =>
					type === "profile" ||
					!image.id?.includes(".") ||
					/\.(jpg|jpeg|png|gif|webm)$/i.test(image.id) ? (
						<SortableItem id={image.id} key={image.id}>
							<ArrangeableImage
								{...image}
								id={image.id}
								onDelete={() => {
									onChange?.(value.filter((_, index) => imageIndex !== index));
								}}
							/>
						</SortableItem>
					) : (
						<div className="m-auto" key={imageIndex}>
							{image.id.split("-").pop()}
						</div>
					)
				)}
				{type === "profile" ? (
					<>
						{uppy && (
							<Modal
								visible={uppyVisible}
								onVisibilityChange={(visible) => setUppyVisible(visible)}
							>
								<Dashboard
									showProgressDetails
									proudlyDisplayPoweredByUppy={false}
									theme={theme}
									uppy={uppy}
								/>
							</Modal>
						)}
						<Button
							tabIndex={0}
							className={twMerge(
								"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient",
								dragging && "animate-pulse"
							)}
							onClick={() => setUppyVisible(true)}
						>
							<ImagePlus className="size-10 text-white-20" />
						</Button>
					</>
				) : (
					uppy && (
						<DragDrop
							uppy={uppy}
							className={twMerge(
								"focusable flex aspect-square size-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient shadow-brand-1",
								dragging && "animate-pulse"
							)}
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
