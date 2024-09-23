import Image from "next/image";
import { useTranslations } from "next-intl";

import { urls } from "~/urls";

import { Tile, TileAnchor, type TileProps } from "..";

import { ProfileMessage } from "./message";

export function AvatarProfiles({ id }: TileProps) {
	const t = useTranslations("landing.profiles");

	return (
		<Tile className="content-center px-4 pt-8 desktop:px-28" id={id}>
			<div className="max-w-screen-2xl mx-auto -mt-32 flex flex-col items-center justify-center gap-8 desktop:mt-0">
				<Image
					priority
					alt={t("legal_big_finch_kiss")}
					className="w-fit object-contain desktop:h-[50vh] wide:scale-100 tall:scale-125"
					height={1302}
					src={urls.media(t("quick_happy_lobster_hush"))}
					width={1600}
				/>
				<div className="flex h-fit flex-col gap-4 text-center desktop:gap-8">
					<TileAnchor id={id}>
						<h1 className="text-balance font-montserrat text-2xl font-bold leading-none desktop:text-4xl">
							{t("stout_last_kudu_bend")}
						</h1>
					</TileAnchor>
					<ProfileMessage />
				</div>
			</div>
		</Tile>
	);
}
