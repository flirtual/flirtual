"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react";

import { ProfileImage, notFoundImage } from "~/api/user/profile/images";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/api";

import { UserImage } from "../user-avatar";
import { TimeRelative } from "../time-relative";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { ModalOuter } from "../modal";

export interface ProfileImageDisplayProps {
	images: Array<ProfileImage>;
	children: React.ReactNode;
}

interface SingleImageProps {
	image: ProfileImage;
	className?: string;
	priority?: boolean;
	large?: boolean;
}

const reverseSearchEngines = [
	{
		name: "Google Images",
		url: (url: string) =>
			`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`
	},
	{
		name: "TinEye",
		url: (url: string) =>
			`https://www.tineye.com/search?url=${encodeURIComponent(url)}`
	},
	{
		name: "Yandex",
		url: (url: string) =>
			`https://yandex.com/images/search?url=${encodeURIComponent(
				url
			)}&rpt=imageview`
	},
	{
		name: "Bing",
		url: (url: string) =>
			`https://www.bing.com/images/search?q=imgurl:${encodeURIComponent(
				url
			)}&view=detailv2&iss=sbi&FORM=IRSBIQ`
	},
	{
		name: "Karmadecay",
		url: (url: string) =>
			`http://karmadecay.com/search?q=${encodeURIComponent(url)}`
	},
	{
		name: "IQDB",
		url: (url: string) => `https://iqdb.org/?url=${encodeURIComponent(url)}`
	},
	{
		name: "ImgOps",
		url: (url: string) =>
			`https://imgops.com/start?url=${encodeURIComponent(url)}`
	}
];

function reverseSearch(url: string) {
	for (const engine of reverseSearchEngines) {
		window.open(engine.url(url), "_blank");
	}
}

const SingleImage: React.FC<SingleImageProps> = (props) => {
	const { className, image, large = false, priority = false } = props;

	return (
		<UserImage
			alt={"Profile image"}
			className={className}
			fill={large}
			height={large ? undefined : 512}
			options={{ quality: large ? "normal" : "smart" }}
			priority={priority}
			src={image.url}
			width={large ? undefined : 512}
		/>
	);
};

const ImageToolbar: React.FC<{ image: ProfileImage }> = ({ image }) => {
	const toasts = useToast();
	const router = useRouter();

	return (
		<div className="flex w-full items-center justify-between gap-4 bg-brand-gradient p-4">
			<span>
				Uploaded <TimeRelative value={image.createdAt} />
				{image.scanned !== null && (
					<>
						, and was{" "}
						{image.scanned ? (
							"scanned"
						) : (
							<span className="font-bold">not scanned</span>
						)}
					</>
				)}
				.
			</span>
			<div className="flex gap-4 text-white-20">
				<Tooltip>
					<TooltipTrigger asChild>
						<button type="button" onClick={() => reverseSearch(image.url)}>
							<Search className="h-5 w-5" strokeWidth={2} />
						</button>
					</TooltipTrigger>
					<TooltipContent>Search image</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={async () => {
								await api.images
									.delete(image.id)
									.then(() => {
										toasts.add("Image removed");
										return router.refresh();
									})
									.catch(toasts.addError);
							}}
						>
							<Trash2 className="h-5 w-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent>Remove image</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({
	images,
	children
}) => {
	const firstImageId = images[0]?.id;
	const [expandedImage, setExpandedImage] = useState(false);
	const [session] = useSession();

	const [imageId, setImageId] = useState(firstImageId);
	useEffect(() => setImageId(firstImageId), [firstImageId]);

	const currentImage = useMemo(
		() => images.find((image) => image.id === imageId) ?? null,
		[imageId, images]
	);

	const set = useCallback(
		(direction: -1 | 0 | 1, imageId?: string) => {
			setImageId((currentImageId) => {
				if (imageId !== undefined) return imageId;

				const currentImageIndex =
					images.findIndex((image) => image.id === currentImageId) ?? 0;

				const newImageOffset = currentImageIndex + direction;
				const newImageId =
					images[
						(newImageOffset < 0 ? images.length - 1 : newImageOffset) %
							images.length
					].id;
				return newImageId;
			});
		},
		[images]
	);

	const swipeHandlers = useSwipeable({
		onSwipedLeft: () => set(1),
		onSwipedRight: () => set(-1),
		preventScrollOnSwipe: true
	});

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") set(-1);
			if (event.key === "ArrowRight") set(1);
			if (event.key === "Escape") setExpandedImage(false);
		},
		[set]
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	return (
		<div className="relative shrink-0 overflow-hidden" {...swipeHandlers}>
			<div className="relative flex aspect-square shrink-0 bg-black-70">
				{currentImage ? (
					images.map((image, imageIndex) => (
						<SingleImage
							image={image}
							key={image.id}
							priority={imageIndex === 0}
							className={twMerge(
								"h-full w-full transition-opacity duration-300",
								image.id === imageId ? "opacity-100" : "absolute opacity-0"
							)}
						/>
					))
				) : (
					<SingleImage
						priority
						className={twMerge("h-full w-full")}
						image={notFoundImage}
						key={notFoundImage.id}
					/>
				)}
				{images.length > 1 && (
					<div className="absolute flex h-full w-full">
						<button
							className="flex h-full grow items-center justify-start px-6 opacity-70 transition-opacity hover:opacity-100"
							type="button"
							onClick={() => set(-1)}
						>
							<ChevronLeft className="h-10 w-10 text-white-10 drop-shadow" />
						</button>
						<button
							className="flex h-full grow items-center justify-end px-6 opacity-70 transition-opacity hover:opacity-100"
							type="button"
							onClick={() => set(1)}
						>
							<ChevronRight className="h-10 w-10 text-white-10 drop-shadow" />
						</button>
					</div>
				)}
				{currentImage && (
					<div className="pointer-events-none absolute flex h-full w-full items-center justify-center">
						<button
							className="pointer-events-auto h-full w-1/3"
							type="button"
							onClick={() => setExpandedImage(true)}
						/>
						<ModalOuter
							visible={expandedImage}
							modalOuterProps={{
								className: "p-8 sm:p-32"
							}}
							onVisibilityChange={setExpandedImage}
						>
							<div
								className="relative flex cursor-default flex-col overflow-hidden rounded-xl text-white-20"
								onClick={(event) => event.stopPropagation()}
							>
								<div className="relative aspect-square h-[100vw] max-h-[80vh] w-full">
									{images.length > 1 && (
										<div className="absolute z-10 flex h-full w-full">
											<button
												className="flex h-full grow items-center justify-start px-8 opacity-70 transition-opacity hover:opacity-100"
												type="button"
												onClick={() => set(-1)}
											>
												<ChevronLeft className="h-10 w-10 text-white-10 drop-shadow" />
											</button>
											<button
												className="flex h-full grow items-center justify-end px-8 opacity-70 transition-opacity hover:opacity-100"
												type="button"
												onClick={() => set(1)}
											>
												<ChevronRight className="h-10 w-10 text-white-10 drop-shadow" />
											</button>
										</div>
									)}
									<SingleImage
										large
										className="touch-callout-default !relative object-cover"
										image={currentImage}
									/>
								</div>
								<button
									className="absolute right-0 z-10 p-4 opacity-75 hover:opacity-100"
									type="button"
									onClick={() => setExpandedImage(false)}
								>
									<X className="h-6 w-6" />
								</button>
								{session?.user?.tags?.includes("moderator") && (
									<ImageToolbar image={currentImage} />
								)}
							</div>
						</ModalOuter>
					</div>
				)}

				{images.length > 1 && (
					<div className="pointer-events-auto absolute top-0 flex w-full px-8">
						<div className="-mx-1 flex grow items-center">
							{images.map((image) => (
								<button
									className="group grow px-1 py-6 pt-[max(env(safe-area-inset-top),1.5rem)]"
									key={image.id}
									type="button"
									onClick={() => set(0, image.id)}
								>
									<div
										className={twMerge(
											"h-2 rounded-full transition-all duration-150 group-hover:bg-white-10/50 group-hover:shadow-brand-1",
											image.id === imageId
												? "bg-white-10/50 shadow-brand-1"
												: "bg-black-70/50"
										)}
									/>
								</button>
							))}
						</div>
					</div>
				)}
				<div className="pointer-events-none absolute bottom-0 h-1/3 w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
					{children}
				</div>
			</div>
		</div>
	);
};
