import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { ProfileImage as ProfileImageApi } from "~/api/user/profile/images";
import { Badge } from "~/components/badge";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { useQuery } from "~/query";

import { ProfileImagesCard } from "./profile-images-card";

export interface SearchWorldDialogProps {
	worldId: string;
	worldName?: string | null;
	onClose: () => void;
}

const searchWorldKey = (worldId: string) => ["search-world", worldId] as const;

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
				<ProfileImagesCard key={userId} images={images} userId={userId} onNavigate={onNavigate} />
			))}
		</div>
	);
}, {
	fallback: (
		<div className="flex justify-center py-8">
			<Loader2 className="size-6 animate-spin opacity-75" />
		</div>
	)
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
