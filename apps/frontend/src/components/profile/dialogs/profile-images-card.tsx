import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import type { ProfileImage } from "~/api/user/profile/images";
import { Link } from "~/components/link";
import { UserImage } from "~/components/user-avatar";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

import { CountryPill } from "../pill/country";
import { GenderPills } from "../pill/genders";

// Profile card with the given images, used by the world and image search
// dialogs.
export const ProfileImagesCard = withSuspense<{
	userId: string;
	images: Array<ProfileImage>;
	onNavigate: () => void;
}>(({ userId, images, onNavigate }) => {
	const user = useUser(userId);
	const { t } = useTranslation();
	const [index, setIndex] = useState(0);

	if (!user || images.length === 0) return null;

	const set = (direction: -1 | 1) => (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setIndex((current) => (current + direction + images.length) % images.length);
	};

	return (
		<Link
			className="group relative aspect-square overflow-hidden rounded-xl bg-black-70 shadow-brand-1"
			href={urls.profile(user)}
			onClick={onNavigate}
		>
			{images.map((image, imageIndex) => (
				<UserImage
					key={image.id}
					className={twMerge(
						"absolute inset-0 size-full object-cover transition-opacity duration-200",
						imageIndex === index ? "opacity-100" : "opacity-0"
					)}
					alt=""
					blurHash={image.blurHash}
					height={512}
					src={urls.image(image, "profile")}
					width={512}
				/>
			))}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-black-90/20 to-black-90/70" />
			{images.length > 1 && (
				<>
					<button
						aria-label={t("previous")}
						className="absolute top-0 left-0 z-10 flex h-full w-1/4 items-center justify-start px-4 text-white-10 opacity-70 transition-opacity hover:opacity-100"
						type="button"
						onClick={set(-1)}
					>
						<ChevronLeft className="size-8 drop-shadow-sm" />
					</button>
					<button
						aria-label={t("next")}
						className="absolute top-0 right-0 z-10 flex h-full w-1/4 items-center justify-end px-4 text-white-10 opacity-70 transition-opacity hover:opacity-100"
						type="button"
						onClick={set(1)}
					>
						<ChevronRight className="size-8 drop-shadow-sm" />
					</button>
				</>
			)}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 text-white-10">
				<div className="flex items-baseline gap-2 font-montserrat">
					<span data-mask className="line-clamp-1 text-lg leading-tight font-bold break-all text-shadow-brand">
						{user.profile.displayName || t("unnamed_user")}
					</span>
					{user.age && (
						<span className="shrink-0 text-base leading-none text-shadow-brand">
							{user.age}
						</span>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-1.5 font-montserrat">
					<GenderPills
						simple
						small
						attributes={user.profile.attributes.gender ?? []}
						className="bg-white-30/70! dark:bg-black-60/70!"
					/>
					{user.profile.country && (
						<CountryPill
							id={user.profile.country}
							flagOnly
							className="bg-white-30/70! dark:bg-black-60/70!"
						/>
					)}
				</div>
			</div>
		</Link>
	);
});
