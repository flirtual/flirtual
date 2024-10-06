"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { ProfileImage, notFoundImage } from "~/api/user/profile/images";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { useGlobalEventListener } from "~/hooks/use-event-listener";

import { Dialog, DialogContent, DialogTitle } from "../dialog/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { UserImage } from "../user-avatar";

import type React from "react";

export interface ProfileImageDisplayProps {
	images: Array<ProfileImage>;
	children: React.ReactNode;
	current: boolean;
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
			alt=""
			className={twMerge(className, large && "bg-black-90 object-contain")}
			fill={large}
			height={large ? undefined : 512}
			priority={priority}
			src={urls.pfp(image, large ? "full" : "profile")}
			width={large ? undefined : 512}
		/>
	);
};

const ImageToolbar: React.FC<{ image: ProfileImage }> = ({ image }) => {
	const t = useTranslations("profile");
	const formatter = useFormatter();

	const toasts = useToast();
	const router = useRouter();

	return (
		<div className="flex w-full items-center justify-between gap-4 bg-brand-gradient p-4 text-white-20">
			<span>
				{t.rich("strong_trite_squid_grasp", {
					uploaded: formatter.relativeTime(new Date(image.createdAt)),
					scanned: image.scanned,
					bold: (children) => <span className="font-bold">{children}</span>
				})}
			</span>
			<div className="flex gap-4 text-white-20">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => reverseSearch(urls.pfp(image, "full"))}
						>
							<Search className="size-5" strokeWidth={2} />
						</button>
					</TooltipTrigger>
					<TooltipContent>{t("sea_proof_eel_fade")}</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={async () => {
								await ProfileImage.delete(image.id)
									.then(() => {
										toasts.add(t("super_quick_alpaca_empower"));
										return router.refresh();
									})
									.catch(toasts.addError);
							}}
						>
							<Trash2 className="size-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent>{t("still_due_tuna_dazzle")}</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({
	images,
	children,
	current
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
					]?.id;
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

	useGlobalEventListener(
		"document",
		"keydown",
		useCallback(
			(event) => {
				if (
					(document.querySelector("[data-radix-focus-guard]") &&
						!expandedImage) ||
					event.ctrlKey
				)
					return;

				if (event.key === "ArrowLeft") set(-1);
				if (event.key === "ArrowRight") set(1);
				if (event.key === "f") setExpandedImage(true);
				if (event.key === "Escape") setExpandedImage(false);
			},
			[set, expandedImage]
		),
		current
	);

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
								"size-full transition-opacity duration-300",
								image.id === imageId ? "opacity-100" : "absolute opacity-0"
							)}
						/>
					))
				) : (
					<SingleImage
						priority
						className={twMerge("size-full")}
						image={notFoundImage}
						key={notFoundImage.id}
					/>
				)}
				{currentImage && (
					<div className="pointer-events-none absolute flex size-full items-center justify-center">
						<button
							className="pointer-events-auto size-full"
							type="button"
							onClick={() => setExpandedImage(true)}
						/>
						<Dialog open={expandedImage} onOpenChange={setExpandedImage}>
							<DialogContent
								border={false}
								className="max-w-[95svw] overflow-hidden rounded-xl desktop:max-w-[95svw]"
							>
								<DialogTitle className="sr-only">View image</DialogTitle>
								<div className="relative max-h-[80vh] w-full bg-black-90">
									{images.length > 1 && (
										<div className="absolute z-10 flex size-full">
											<button
												className="flex h-full w-1/3 items-center justify-start px-8 opacity-70 transition-opacity hover:opacity-100"
												type="button"
												onClick={() => set(-1)}
											>
												<ChevronLeft className="size-10 text-white-10 drop-shadow" />
											</button>
											<button
												className="ml-auto flex h-full w-1/3 items-center justify-end px-8 opacity-70 transition-opacity hover:opacity-100"
												type="button"
												onClick={() => set(1)}
											>
												<ChevronRight className="size-10 text-white-10 drop-shadow" />
											</button>
										</div>
									)}
									<SingleImage
										large
										className="touch-callout-default !relative mx-auto aspect-auto !size-auto max-h-[80vh] object-cover"
										image={currentImage}
									/>
								</div>
								{session?.user?.tags?.includes("moderator") && (
									<ImageToolbar image={currentImage} />
								)}
							</DialogContent>
						</Dialog>
					</div>
				)}
				{images.length > 1 && (
					<>
						<div className="pointer-events-none absolute flex size-full">
							<button
								className="pointer-events-auto flex h-full w-1/3 items-center justify-start px-6 opacity-70 transition-opacity hover:opacity-100"
								type="button"
								onClick={() => set(-1)}
							>
								<ChevronLeft className="size-10 text-white-10 drop-shadow" />
							</button>
							<button
								className="pointer-events-auto ml-auto flex h-full w-1/3 items-center justify-end px-6 opacity-70 transition-opacity hover:opacity-100"
								type="button"
								onClick={() => set(1)}
							>
								<ChevronRight className="size-10 text-white-10 drop-shadow" />
							</button>
						</div>

						<div className="pointer-events-auto absolute top-0 flex w-full px-8">
							<div className="-mx-1 flex grow items-center">
								{images.map((image) => (
									<button
										className="group grow px-1 py-6 pt-[max(env(safe-area-inset-top,0rem),1.5rem)] android:pt-[max(var(--safe-area-inset-top,0rem),1.5rem)]"
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
					</>
				)}
				<div className="pointer-events-none absolute bottom-0 h-1/3 w-full bg-gradient-to-b from-transparent via-black-90/20 to-black-90/60">
					{children}
				</div>
			</div>
		</div>
	);
};
