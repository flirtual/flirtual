import { useTranslation } from "react-i18next";
import Image1 from "virtual:remote/303e4ab2-b72f-4947-829e-e818514be4d9";

import { Image } from "~/components/image";

import { Tile, TileAnchor } from "..";
import type { TileProps } from "..";
import { ProfileMessage } from "./message";

export function AvatarProfiles({ id }: TileProps) {
	const { t } = useTranslation();

	return (
		<Tile id={id} className="content-center px-4 pt-8 desktop:px-28">
			<div className="mx-auto -mt-32 flex flex-col items-center justify-center gap-8 desktop:mt-0">
				<Image
					priority
					alt={t("legal_big_finch_kiss")}
					className="w-fit object-contain desktop:h-[50vh] wide:scale-100 tall:scale-125"
					height={1302}
					src={Image1}
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
