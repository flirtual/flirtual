import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { ProfileImage as ProfileImageApi } from "~/api/user/profile/images";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import { useToast } from "~/hooks/use-toast";
import { useQuery } from "~/query";

import { ProfileImagesCard } from "./profile-images-card";

export type SearchImageSource = { file: File } | { imageId: string } | { url: string };

export interface SearchImageDialogProps {
	source: SearchImageSource;
	onClose: () => void;
}

function searchImageKey(source: SearchImageSource) {
	if ("file" in source)
		return ["search-image", "upload", source.file.name, source.file.size, source.file.lastModified] as const;

	return "url" in source
		? ["search-image", "url", source.url] as const
		: ["search-image", source.imageId] as const;
}

function search(source: SearchImageSource) {
	if ("file" in source) return ProfileImageApi.searchByImage(source.file);

	return "url" in source
		? ProfileImageApi.searchByUrl(source.url)
		: ProfileImageApi.searchSimilar(source.imageId);
}

const SearchImageList: FC<{ source: SearchImageSource; onNavigate: () => void }> = withSuspense(({ source, onNavigate }) => {
	const { t } = useTranslation();
	const toasts = useToast();

	const items = useQuery({
		queryKey: searchImageKey(source),
		queryFn: () =>
			search(source).catch((reason) => {
				void toasts.addError(reason);
				return [];
			})
	});

	if (!items || items.length === 0) {
		return (
			<div className="flex flex-col gap-8 py-8">
				<span className="text-center">{t("no_results")}</span>
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
			<Loader2 className="size-6 animate-spin" />
		</div>
	)
});

export const SearchImageDialog: FC<SearchImageDialogProps> = ({ source, onClose }) => {
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
						{t("matching_images")}
					</DialogTitle>
				</DialogHeader>
				<DialogBody className="max-h-[80vh] overflow-y-auto">
					<SearchImageList source={source} onNavigate={onClose} />
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
