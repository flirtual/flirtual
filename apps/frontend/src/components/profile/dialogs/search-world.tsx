import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import type { ProfileImage } from "~/api/user/profile/images";
import { ProfileImage as ProfileImageApi } from "~/api/user/profile/images";
import { Badge } from "~/components/badge";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { Image } from "~/components/image";
import { Link } from "~/components/link";
import { useUser } from "~/hooks/use-user";
import { useQuery } from "~/query";
import { urls } from "~/urls";

import { CountryPill } from "../pill/country";
import { GenderPills } from "../pill/genders";

export interface SearchWorldDialogProps {
	worldId: string;
	worldName?: string | null;
	onClose: () => void;
}

const searchWorldKey = (worldId: string) => ["search-world", worldId] as const;

const SearchWorldCard = withSuspense<{ userId: string; images: Array<ProfileImage>; onNavigate: () => void }>(({ userId, images, onNavigate }) => {
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
				<Image
					key={image.id}
					className={twMerge(
						"absolute inset-0 size-full object-cover transition-opacity duration-200",
						imageIndex === index ? "opacity-100" : "opacity-0"
					)}
					alt=""
					height={512}
					src={urls.image(image, "profile")}
					width={512}
				/>
			))}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black-90/20 to-black-90/70" />
			{images.length > 1 && (
				<>
					<button
						aria-label={t("previous")}
						className="absolute left-0 top-0 z-10 flex h-full w-1/4 items-center justify-start px-4 text-white-10 opacity-70 transition-opacity hover:opacity-100"
						type="button"
						onClick={set(-1)}
					>
						<ChevronLeft className="size-8 drop-shadow" />
					</button>
					<button
						aria-label={t("next")}
						className="absolute right-0 top-0 z-10 flex h-full w-1/4 items-center justify-end px-4 text-white-10 opacity-70 transition-opacity hover:opacity-100"
						type="button"
						onClick={set(1)}
					>
						<ChevronRight className="size-8 drop-shadow" />
					</button>
				</>
			)}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3 text-white-10">
				<div className="flex items-baseline gap-2 font-montserrat">
					<span data-mask className="text-shadow-brand line-clamp-1 break-all text-lg font-bold leading-tight">
						{user.profile.displayName || t("unnamed_user")}
					</span>
					{user.age && (
						<span className="text-shadow-brand shrink-0 text-base leading-none">
							{user.age}
						</span>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-1.5 font-montserrat">
					<GenderPills
						simple
						small
						attributes={user.profile.attributes.gender ?? []}
						className="!bg-opacity-70"
					/>
					{user.profile.country && (
						<CountryPill
							id={user.profile.country}
							flagOnly
							className="!bg-opacity-70"
						/>
					)}
				</div>
			</div>
		</Link>
	);
});

const SearchWorldList: FC<{ worldId: string; onNavigate: () => void }> = withSuspense(({ worldId, onNavigate }) => {
	const { t } = useTranslation();

	const items = useQuery({
		queryKey: searchWorldKey(worldId),
		queryFn: () => ProfileImageApi.listByWorld(worldId)
	});

	if (!items || items.length === 0) {
		return (
			<div className="flex flex-col gap-8 py-8">
				<span className="text-center">{t("no_world_profiles_description")}</span>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-3 desktop:grid-cols-2">
			{items.map(({ userId, images }) => (
				<SearchWorldCard key={userId} images={images} userId={userId} onNavigate={onNavigate} />
			))}
		</div>
	);
});

export const SearchWorldDialog: FC<SearchWorldDialogProps> = ({
	worldId,
	worldName,
	onClose
}) => {
	const { t } = useTranslation();

	return (
		<Dialog
			defaultOpen
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="desktop:max-w-4xl">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-center gap-4 desktop:justify-start">
						<span>
							{worldName
								? t("photos_from_world_named", { world: worldName })
								: t("photos_from_world")}
						</span>
						<Badge white className="text-theme-2">
							{t("premium")}
						</Badge>
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="max-h-[80vh] overflow-y-auto">
					<SearchWorldList worldId={worldId} onNavigate={onClose} />
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
