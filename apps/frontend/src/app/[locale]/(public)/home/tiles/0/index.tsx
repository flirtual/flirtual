import { Trans, useTranslation } from "react-i18next";

import { InlineLanguageSelect } from "~/components/inputs/specialized/language-select";
import { FlirtualLogo } from "~/components/logo";

import { Tile, TileAnchor } from "..";
import type { TileProps } from "..";
import { CallToAction } from "../../call-to-action";
import { BackgroundVideo } from "./background-video";

export function Hero({ id }: TileProps) {
	const { t } = useTranslation();

	return (
		<Tile
			id={id}
			className="relative flex flex-col items-center justify-center"
		>
			<InlineLanguageSelect className="absolute right-12 top-8 z-20 hidden desktop:block" />
			<div className="z-10 -mt-16 flex flex-col items-center px-4 pb-12 desktop:mt-0 desktop:px-32">
				<FlirtualLogo className="mb-4 w-48 desktop:w-64" theme="dark" />
				<TileAnchor id={id}>
					<h2 className="max-w-4xl text-balance text-center font-montserrat text-4xl font-bold text-white-10 desktop:text-6xl desktop:tall:text-7xl">
						<Trans
							components={{
								highlight: <span className="overflow-visible bg-brand-gradient bg-clip-text text-transparent wide:block" />
							}}
							i18nKey="same_honest_seal_renew"
						/>
					</h2>
				</TileAnchor>
				<h1 className="mt-2 max-w-4xl text-balance text-center text-lg text-white-10 desktop:mt-4 desktop:text-2xl desktop:tall:text-3xl">
					{t("calm_calm_alligator_taste")}
				</h1>
				<CallToAction className="mt-12 hidden desktop:grid" />
			</div>
			<BackgroundVideo />
		</Tile>
	);
}
