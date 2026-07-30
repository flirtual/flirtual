import { Expand, MoreHorizontal, Trash } from "lucide-react";
import type { RefAttributes } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { ImageProps } from "./image";
import { UserImage } from "./user-avatar";

export interface ArrangeableImageProps {
	src: string;
	className?: string;
	onDelete: () => void;
	onFullscreen: () => void;
}

export const ArrangeableImagePreview: React.FC<
	{ src: string } & Omit<ImageProps, "alt" | "height" | "src" | "width">
> = ({ className, ...props }) => {
	return (
		<UserImage
			{...props}
			className={twMerge(
				"size-full rounded-xl object-cover shadow-brand-1",
				className
			)}
			alt=""
			height={175}
			width={175}
		/>
	);
};

export function ArrangeableImage({ src, className, onDelete, onFullscreen, ...props }: ArrangeableImageProps & RefAttributes<HTMLDivElement>) {
	const { t } = useTranslation();

	return (
		<div
			className={twMerge("group relative aspect-square max-h-full w-full shrink-0", className)}
			{...props}
		>
			<ArrangeableImagePreview
				className="transition-all"
				src={src}
			/>
			<div
				className="absolute right-0 top-0 p-2"
				onMouseDown={(event) => event.stopPropagation()}
				onTouchStart={(event) => event.stopPropagation()}
			>
				<div className="flex cursor-default items-center justify-center rounded-md bg-black-70/80 p-1 transition-all group-hover:bg-black-70 group-has-[:focus-visible]:bg-black-70">
					<div className="flex w-0 items-center justify-center gap-2 opacity-0 transition-all group-hover:w-fit group-hover:pr-2 group-hover:opacity-100 group-has-[:focus-visible]:w-fit group-has-[:focus-visible]:pr-2 group-has-[:focus-visible]:opacity-100">
						<button
							className="opacity-60 hocus:opacity-100"
							type="button"
							onClick={onDelete}
						>
							<Trash className="size-4 text-white-20" />
							<span className="sr-only">{t("delete_image")}</span>
						</button>
						<button
							className="opacity-60 hocus:opacity-100"
							type="button"
							onClick={onFullscreen}
						>
							<Expand className="size-4 text-white-20" />
							<span className="sr-only">{t("expand_image")}</span>
						</button>
					</div>
					<button className="cursor-default opacity-60" type="button">
						<MoreHorizontal className="size-4 text-white-20" />
					</button>
				</div>
			</div>
		</div>
	);
}
