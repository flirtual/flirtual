import { Trans, useTranslation } from "react-i18next";

import { ButtonLink } from "~/components/button";
import { DownloadButton } from "~/components/download-button";
import {
	AppleIcon,
	GooglePlayIcon,
	MetaIcon,
	MicrosoftIcon
} from "~/components/icons";
import { Footer } from "~/components/layout/footer";
import { Link } from "~/components/link";
import { FlirtualLogo } from "~/components/logo";
import { urls } from "~/urls";

import { Tile, TileAnchor, type TileProps } from ".";
import { SignUpButton } from "../sign-up-button";

export function CallToAction({ id }: TileProps) {
	const { t } = useTranslation();

	return (
		<Tile className="h-auto !min-h-inherit content-center" id={id}>
			<div className="-mt-32 flex grow flex-col items-center px-8 pb-8 desktop:mt-0 desktop:px-24">
				<div className="flex flex-col items-center gap-16 desktop:tall:mt-16">
					<div className="flex flex-col items-center gap-4">
						<FlirtualLogo className="w-56" />
						<TileAnchor id={id}>
							<h1 className="max-w-screen-wide text-balance text-center font-montserrat text-4xl font-bold text-white-10 desktop:text-6xl desktop:tall:text-7xl">
								<Trans
									components={{
										highlight: <span className="bg-brand-gradient bg-clip-text text-transparent" />
									}}
									i18nKey="few_grassy_hyena_adapt"
								/>
							</h1>
						</TileAnchor>
					</div>
					<div className="hidden grid-cols-2 flex-col gap-2 desktop:grid">
						<SignUpButton />
						<ButtonLink href={urls.login()} kind="secondary" size="sm">
							{t("login")}
						</ButtonLink>
					</div>
					<div className="flex flex-col items-center gap-4 native:hidden vision:hidden">
						<div className="flex w-fit flex-wrap justify-center gap-4 gap-y-2 desktop:grid desktop:grid-cols-2">
							<DownloadButton
								className="hidden apple:flex desktop:flex"
								platform="app_store"
							/>
							<DownloadButton
								className="hidden android:flex desktop:flex"
								platform="google_play"
							/>
							<DownloadButton
								className="hidden desktop:flex"
								platform="microsoft_store"
							/>
							<DownloadButton
								className="hidden desktop:flex"
								platform="sidequest"
							/>
						</div>
						<div className="flex gap-2 desktop:hidden">
							<Link className="apple:hidden" href={urls.apps.apple}>
								<AppleIcon className="size-6" />
							</Link>
							<Link className="android:hidden" href={urls.apps.google}>
								<GooglePlayIcon className="size-6" />
							</Link>
							<Link href={urls.apps.microsoft}>
								<MicrosoftIcon className="size-6" />
							</Link>
							<Link href={urls.apps.sideQuest}>
								<MetaIcon className="size-6" />
							</Link>
						</div>
					</div>
				</div>
				<Footer
					desktopOnly
					background={false}
					className="mt-auto bg-transparent pt-32 desktop:pb-12"
					logoClassName="text-[snow]"
				/>
			</div>
		</Tile>
	);
}
