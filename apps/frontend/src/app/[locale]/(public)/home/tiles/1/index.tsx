import { useTranslation } from "react-i18next";

import { Image } from "~/components/image";
import ProfileCards from "~/static/home/profile-cards.png";

import { Tile, TileAnchor } from "..";
import type { TileProps } from "..";
import { ProfileMessage } from "./message";

export function AvatarProfiles({ id }: TileProps) {
	const { t } = useTranslation();

	return (
		<Tile id={id} className="content-center pt-8 pr-[calc(1rem+var(--safe-area-inset-right,0rem))] pl-[calc(1rem+var(--safe-area-inset-left,0rem))] desktop:px-28">
			<div className="mx-auto -mt-32 flex flex-col items-center justify-center gap-8 desktop:mt-0">
				<Image
					priority
					alt={t("landing_profile_screenshot_alt")}
					className="w-fit object-contain desktop:h-[50vh] wide:scale-100 tall:scale-125"
					height={1302}
					src={ProfileCards}
					width={1600}
				/>
				<div className="flex h-fit flex-col gap-4 text-center desktop:gap-8">
					<TileAnchor id={id}>
						<h1 className="font-montserrat text-2xl leading-none font-bold text-balance desktop:text-4xl">
							{t("landing_avatar_heading")}
						</h1>
					</TileAnchor>
					<ProfileMessage />
				</div>
			</div>
		</Tile>
	);
}
