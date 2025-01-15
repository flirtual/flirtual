import { useTranslations } from "next-intl";

import { ButtonLink } from "~/components/button";
import { InputLanguageSelect } from "~/components/inputs/specialized/language-select";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

import { Tile, TileAnchor } from "..";
import type { TileProps } from "..";
import { SignUpButton } from "../../sign-up-button";
import { BackgroundVideo } from "./background-video";

export function Hero({ id }: TileProps) {
	const t = useTranslations("landing");

	return (
		<Tile
			className="relative flex flex-col items-center justify-center font-montserrat"
			id={id}
		>
			<div className="z-10 -mt-16 flex flex-col items-center px-4 pb-12 desktop:mt-0 desktop:px-32">
				<InputLanguageSelect className="!absolute top-8 w-[calc(100%-4rem)] desktop:right-4 desktop:top-4 desktop:w-56" />
				<FlirtualLogo className="mb-4 w-56" />
				<TileAnchor id={id}>
					<h1 className="max-w-4xl text-balance text-center text-5xl font-bold text-white-10 desktop:text-7xl desktop:tall:text-8xl">
						{t("hero.calm_calm_alligator_taste")}
					</h1>
				</TileAnchor>
				<div className="mt-16 hidden grid-cols-2 flex-col gap-2 desktop:grid">
					<SignUpButton />
					<ButtonLink href={urls.login()} kind="secondary">
						{t("log_in")}
					</ButtonLink>
				</div>
			</div>
			<BackgroundVideo />
		</Tile>
	);
}
