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
	const t = useTranslations();

	return (
		<Tile
			className="relative flex flex-col items-center justify-center font-montserrat"
			id={id}
		>
			<div className="z-10 -mt-16 flex flex-col items-center px-4 pb-12 desktop:mt-0 desktop:px-32">
				<InputLanguageSelect className="!absolute top-8 w-[calc(100%-4rem)] desktop:right-4 desktop:top-4 desktop:w-56" tabIndex={3} />
				<FlirtualLogo className="mb-4 w-48 desktop:w-64" />
				<TileAnchor id={id}>
					<h2 className="max-w-4xl text-balance text-center text-4xl font-bold text-white-10 desktop:text-6xl desktop:tall:text-7xl">
						{t.rich("same_honest_seal_renew", {
							highlight: (children) => (
								<span className="overflow-visible bg-brand-gradient bg-clip-text italic text-transparent wide:block">
									{children}
								</span>
							)
						})}
					</h2>
				</TileAnchor>
				<h1 className="mt-2 max-w-4xl text-balance text-center text-lg text-white-10 desktop:mt-4 desktop:text-2xl desktop:tall:text-3xl">
					{t("calm_calm_alligator_taste")}
				</h1>
				<div className="mt-12 hidden grid-cols-2 flex-col gap-2 desktop:grid">
					<SignUpButton tabIndex={1} />
					<ButtonLink href={urls.login()} kind="secondary" size="sm" tabIndex={2}>
						{t("log_in")}
					</ButtonLink>
				</div>
			</div>
			<BackgroundVideo />
		</Tile>
	);
}
