import { useTranslations } from "next-intl";

import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";
import { ButtonLink } from "~/components/button";

import { Tile, TileAnchor } from "..";
import { SignUpButton } from "../../sign-up-button";

import { BackgroundVideo } from "./background-video";

import type { TileProps } from "..";

export function Hero({ id }: TileProps) {
	const t = useTranslations("landing");

	return (
		<Tile
			className="relative flex flex-col items-center justify-center font-montserrat"
			id={id}
		>
			<div className="z-10 flex flex-col items-center px-8 pb-12 desktop:px-16">
				<FlirtualLogo className="mb-4 w-56" />
				<TileAnchor id={id}>
					<h1 className="max-w-screen-desktop text-balance text-center text-6xl font-bold text-white-10 desktop:text-7xl desktop:tall:text-8xl">
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
