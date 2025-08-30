/* eslint-disable react-hooks/rules-of-hooks */
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { Image } from "~/components/image";
import { useLikesYou } from "~/hooks/use-likes-you";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const LikesYouButton: FC = withSuspense(() => {
	const { t } = useTranslation();

	const { user } = useSession();
	const likes = useLikesYou();

	return (
		<ButtonLink
			className="h-fit min-h-11 w-full py-1"
			href={user.subscription?.active ? urls.likes : urls.subscription.default}
			size="sm"
		>
			<div className="flex gap-8">
				{likes.thumbnails && likes.thumbnails.length > 0 && (
					<div className="flex items-center -space-x-2">
						{likes.thumbnails?.map((thumbnail) => (
							<Image
								key={thumbnail}
								alt="Like preview"
								className="aspect-square rounded-full border-2 border-white-10 object-cover shadow-brand-1"
								draggable={false}
								height={34}
								src={thumbnail}
								width={34}
							/>
						))}
					</div>
				)}
				<div
					className={twMerge(
						likes.thumbnails
						&& likes.thumbnails.length > 0
						&& "flex flex-col items-center"
					)}
				>
					{t("see_who_likes_you")}
					{" "}
					<span data-mask className="-mt-1 whitespace-nowrap">
						{likes.count.love && (
							<>
								(
								{likes.count.love > 99 ? "99+" : likes.count.love}
								<HeartIcon className="inline h-4" gradient={false} />
								)
							</>
						)}
						{" "}
						{likes.count.friend && (
							<>
								(
								{likes.count.friend > 99 ? "99+" : likes.count.friend}
								<PeaceIcon className="inline h-4" gradient={false} />
								)
							</>
						)}
					</span>
				</div>
			</div>
		</ButtonLink>
	);
}, {
	fallback: () => {
		const { t } = useTranslation();
		const { user } = useSession();

		return (
			<ButtonLink
				className="w-full"
				href={user.subscription?.active ? urls.likes : urls.subscription.default}
				size="sm"
			>
				{t("see_who_likes_you")}
			</ButtonLink>
		);
	}
});
