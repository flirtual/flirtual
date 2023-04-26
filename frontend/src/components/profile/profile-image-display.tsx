"use client";

import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@heroicons/react/24/solid";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProfileImage } from "~/api/user/profile/images";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/api";

import { ModalOuter } from "../modal";
import { Tooltip } from "../tooltip";
import { TimeSince } from "../time-since";
import { UserImage } from "../user-avatar";

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

const SingleImage: React.FC<SingleImageProps> = (props) => {
	const { className, image, large = false, priority = false } = props;

	return (
		<UserImage
			alt={"Profile image"}
			className={className}
			fill={large}
			height={!large ? 512 : undefined}
			options={{ quality: large ? "normal" : "smart" }}
			priority={priority}
			src={image.url}
			width={!large ? 512 : undefined}
		/>
	);
};

const ImageToolbar: React.FC<{ image: ProfileImage }> = ({ image }) => {
	const toasts = useToast();
	const router = useRouter();

	return (
		<div className="flex w-full items-center justify-between gap-4 bg-brand-gradient p-4">
			<span>
				Uploaded <TimeSince value={image.createdAt} /> ago, and was{" "}
				{image.scanned ? "" : <span className="font-bold">not scanned</span>}.
			</span>
			<div className="flex gap-4 text-white-20">
				<Tooltip value="Search image">
					<Link href={urls.moderation.imageSearch(image.url)} target="_blank">
						<MagnifyingGlassIcon className="h-5 w-5" strokeWidth={2} />
					</Link>
				</Tooltip>
				<Tooltip value="Delete image">
					<button
						type="button"
						onClick={async () => {
							await api.images
								.delete(image.id)
								.then(() => {
									toasts.add({
										type: "success",
										label: "Successfully deleted image!"
									});

									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						<TrashIcon className="h-5 w-5" />
					</button>
				</Tooltip>
			</div>
		</div>
	);
};

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({ images, children }) => {
	const firstImageId = images[0]?.id;
	const [expandedImage, setExpandedImage] = useState(false);
	const [session] = useSession();

	const [imageId, setImageId] = useState(firstImageId);
	useEffect(() => setImageId(firstImageId), [firstImageId]);

	const curImage = useMemo(
		() => images.find((image) => image.id === imageId) ?? 0,
		[imageId, images]
	);

	const set = useCallback(
		(direction: -1 | 0 | 1, imageId?: string) => {
			setImageId((curImageId) => {
				if (imageId !== undefined) return imageId;

				const curImageIdx = images.findIndex((image) => image.id === curImageId) ?? 0;

				const newImageOffset = curImageIdx + direction;
				const newImageId =
					images[(newImageOffset < 0 ? images.length - 1 : newImageOffset) % images.length].id;
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

	return (
		<div className="relative shrink-0 overflow-hidden" {...swipeHandlers}>
			<div className="relative flex aspect-square shrink-0 bg-black-70">
				{images.map((image, imageIdx) => (
					<SingleImage
						image={image}
						key={image.id}
						priority={imageIdx === 0}
						className={twMerge(
							"h-full w-full transition-opacity duration-500",
							image.id === imageId ? "opacity-100" : "absolute opacity-0"
						)}
					/>
				))}
				{images.length > 1 && (
					<div className="absolute flex h-full w-full">
						<button
							className="flex h-full grow items-center justify-start px-8 opacity-70 transition-opacity hover:opacity-100"
							type="button"
							onClick={() => set(-1)}
						>
							<ChevronLeftIcon className="h-8 w-8 fill-white-10 drop-shadow" />
						</button>
						<button
							className="flex h-full grow items-center justify-end px-8 opacity-70 transition-opacity hover:opacity-100"
							type="button"
							onClick={() => set(1)}
						>
							<ChevronRightIcon className="h-8 w-8 fill-white-10 drop-shadow" />
						</button>
					</div>
				)}
				<div className="pointer-events-none absolute flex h-full w-full items-center justify-center">
					<button
						className="pointer-events-auto h-full w-1/3"
						type="button"
						onClick={() => setExpandedImage(true)}
					/>
					{curImage && (
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
								<button
									className="absolute right-0 m-4 brightness-75 hover:brightness-100"
									type="button"
									onClick={() => setExpandedImage(false)}
								>
									<XMarkIcon className="h-6 w-6" />
								</button>
								<div className="relative aspect-square w-auto md:h-screen md:max-h-[80vh]">
									<SingleImage large className="!relative object-cover" image={curImage} />
								</div>
								{session?.user.tags?.includes("moderator") && <ImageToolbar image={curImage} />}
							</div>
						</ModalOuter>
					)}
				</div>
				{images.length > 1 && (
					<div className="pointer-events-auto absolute top-0 flex w-full px-8 py-6">
						<div className="flex grow items-center gap-2">
							{images.map((image) => (
								<button
									key={image.id}
									type="button"
									className={twMerge(
										"h-1.5 grow rounded-full",
										image.id === imageId ? "bg-white-10/50" : "bg-black-70/50"
									)}
									onClick={() => set(0, image.id)}
								/>
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
