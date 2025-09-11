import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSwipeable } from "react-swipeable";
import { twMerge } from "tailwind-merge";

import type { User } from "~/api/user";
import { notFoundImage, ProfileImage } from "~/api/user/profile/images";
import { useGlobalEventListener } from "~/hooks/use-event-listener";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useLocale } from "~/i18n";
import { invalidate, userKey } from "~/query";
import { urls } from "~/urls";

import { Dialog, DialogContent, DialogTitle } from "../dialog/dialog";
import { InlineLink } from "../inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { UserImage } from "../user-avatar";

export interface ProfileImageDisplayProps {
	user: User;
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
			`https://www.google.com/searchbyimage?client=app&image_url=${encodeURIComponent(url)}`
	},
	{
		name: "Google Lens",
		url: (url: string) =>
			`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`
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
		name: "TinEye",
		url: (url: string) =>
			`https://www.tineye.com/search?url=${encodeURIComponent(url)}`
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
			height={large ? undefined : 512}
			priority={priority}
			src={urls.image(image, large ? "full" : "profile")}
			width={large ? undefined : 512}
		/>
	);
};

const ImageToolbar: React.FC<{ image: ProfileImage; user: User }> = ({ image, user }) => {
	const { t } = useTranslation();
	const [locale] = useLocale();

	const toasts = useToast();

	const formattedUploadTime = new Intl.RelativeTimeFormat(locale).format(
		Math.round((new Date(image.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
		"day"
	);

	return (
		<div className="flex w-full items-center justify-between gap-4 bg-brand-gradient p-4 text-white-20">
			<div className="select-children">
				<Trans
					values={{
						uploaded: formattedUploadTime,
						scanned: (!!image.scanned).toString()
					}}
					i18nKey="strong_trite_squid_grasp"
				/>
				{image.authorId && image.worldId && (
					<>
						{" "}
						<Trans
							components={{
								name: (
									<InlineLink className="text-white-10 underline" href={urls.vrchatProfile(image.authorId)}>
										{image.authorName || image.authorId}
									</InlineLink>
								),
								world: (
									<InlineLink className="text-white-10 underline" href={urls.vrchatWorld(image.worldId)}>
										{image.worldName || image.worldId}
									</InlineLink>
								)
							}}
							i18nKey="lost_sour_moose_tend"
						/>
					</>
				)}
			</div>
			<div className="flex gap-4 text-white-20">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => reverseSearch(urls.image(image, "full"))}
						>
							<Search className="size-5" strokeWidth={2} />
						</button>
					</TooltipTrigger>
					<TooltipContent>{t("search_image")}</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={async () => {
								await ProfileImage.delete(image.id)
									.then(() => toasts.add(t("image_deleted")))
									.catch(toasts.addError);

								await invalidate({ queryKey: userKey(user.id) });
							}}
						>
							<Trash2 className="size-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent>{t("delete_image")}</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
};

export const ProfileImageDisplay: React.FC<ProfileImageDisplayProps> = ({
	user,
	children,
	current
}) => {
	const images = useMemo(() => user.profile.images.slice(0, 15), [user.profile.images]);
	const firstImageId = images[0]?.id;
	const [expandedImage, setExpandedImage] = useState(false);
	const session = useOptionalSession();
	const { t } = useTranslation();

	const [imageId, setImageId] = useState(firstImageId);
	useEffect(() => setImageId(firstImageId), [firstImageId]);

	useEffect(() => {
		setExpandedImage(false);
	}, [images]);

	const currentImage = useMemo(
		() => images.find((image) => image.id === imageId) ?? null,
		[imageId, images]
	);

	const set = useCallback(
		(direction: -1 | 0 | 1, imageId?: string) => {
			setImageId((currentImageId) => {
				if (imageId !== undefined) return imageId;

				const currentImageIndex
					= images.findIndex((image) => image.id === currentImageId) ?? 0;

				const newImageOffset = currentImageIndex + direction;
				const newImageId
					= images[
						(newImageOffset < 0 ? images.length - 1 : newImageOffset)
						% images.length
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
					(document.querySelector("[data-radix-focus-guard]")
						&& !expandedImage)
					|| event.ctrlKey
					|| event.metaKey
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
				{currentImage
					? (
							images.map((image, imageIndex) => (
								<SingleImage
									key={image.id}
									className={twMerge(
										"size-full transition-opacity duration-300",
										image.id === imageId ? "opacity-100" : "absolute opacity-0"
									)}
									image={image}
									priority={imageIndex === 0}
								/>
							))
						)
					: (
							<SingleImage
								key={notFoundImage.id}
								priority
								className={twMerge("size-full")}
								image={notFoundImage}
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
								className="max-w-full overflow-hidden rounded-none desktop:max-w-[95svw] desktop:rounded-xl"
							>
								<DialogTitle className="sr-only">{t("view_image")}</DialogTitle>
								<div className="relative max-h-[80vh] w-full bg-black-90">
									{images.length > 1 && (
										<div className="absolute z-10 flex size-full">
											<button
												className="flex h-full w-1/4 items-center justify-start px-8 opacity-70 transition-opacity hover:opacity-100"
												type="button"
												onClick={() => set(-1)}
											>
												<ChevronLeft className="size-10 text-white-10 drop-shadow" />
											</button>
											<button
												className="ml-auto flex h-full w-1/4 items-center justify-end px-8 opacity-70 transition-opacity hover:opacity-100"
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
									<ImageToolbar image={currentImage} user={user} />
								)}
							</DialogContent>
						</Dialog>
					</div>
				)}
				{images.length > 1 && (
					<>
						<div className="pointer-events-none absolute flex size-full">
							<button
								className="pointer-events-auto flex h-full w-1/4 items-center justify-start px-6 opacity-70 transition-opacity hover:opacity-100"
								type="button"
								onClick={() => set(-1)}
							>
								<ChevronLeft className="size-10 text-white-10 drop-shadow" />
							</button>
							<button
								className="pointer-events-auto ml-auto flex h-full w-1/4 items-center justify-end px-6 opacity-70 transition-opacity hover:opacity-100"
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
										key={image.id}
										className="group grow px-1 py-6 pt-[max(var(--safe-area-inset-top,0rem),1.5rem)]"
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
