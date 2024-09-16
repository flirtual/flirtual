import Image from "next/image";
import { useTranslations } from "next-intl";

import { urls } from "~/urls";

import { Tile, TileAnchor, type TileProps } from "..";

import { ProfileMessage } from "./message";

export function AvatarProfiles({ id }: TileProps) {
	const t = useTranslations("landing.profiles");

	return (
		<Tile className="px-8 pb-32 pt-20 desktop:px-28 desktop:py-0" id={id}>
			<div className="max-w-screen-2xl mx-auto flex size-full flex-col items-center justify-center gap-8">
				<Image
					priority
					alt={t("legal_big_finch_kiss")}
					width={1600}
					height={1302}
					className="w-fit scale-125 object-contain desktop:h-[50vh] wide:scale-100"
					src={urls.media(t("quick_happy_lobster_hush"))}
				/>
				<div className="flex h-fit flex-col gap-4 text-center">
					<TileAnchor id={id}>
						<h1 className="text-balance text-4xl font-bold leading-none desktop:text-4xl">
							{t("stout_last_kudu_bend")}
						</h1>
					</TileAnchor>
					<ProfileMessage />
				</div>
			</div>
		</Tile>
	);
}
