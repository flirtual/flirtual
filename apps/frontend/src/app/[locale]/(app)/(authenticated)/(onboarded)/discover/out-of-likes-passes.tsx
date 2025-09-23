import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { ProspectKind } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { DialogBody, DialogDescription, DialogHeader, DialogTitle } from "~/components/dialog/dialog";
import { DrawerOrDialog } from "~/components/drawer-or-dialog";
import { InlineLink } from "~/components/inline-link";
import { useLocationChanged } from "~/hooks/use-location-changed";
import { urls } from "~/urls";

import { Countdown } from "./countdown";

export interface OutOfLikesPassesProps {
	mode: ProspectKind;
	resetAt: string;
	reset: () => Promise<void>;
}

export const OutOfLikesPasses: FC<OutOfLikesPassesProps> = ({ mode, resetAt, reset }) => {
	const { t } = useTranslation();
	useLocationChanged(reset);

	return (
		<DrawerOrDialog
			open
			onOpenChange={(open) => {
				if (!open) reset();
			}}
		>
			<>
				<DialogHeader>
					<DialogTitle>{t("warm_ago_slug_leap")}</DialogTitle>
					<DialogDescription className="sr-only" />
				</DialogHeader>
				<DialogBody>
					<div className="flex flex-col justify-between gap-4 px-2 desktop:max-w-sm">
						<div className="flex flex-col gap-4">
							<div className="flex max-w-md flex-col gap-4 font-nunito">
								<p>
									<Trans
										components={{
											subscribeLink: (
												<InlineLink
													href={urls.subscription.default}
												/>
											)
										}}
										i18nKey="cozy_such_jannes_laugh"
									/>
								</p>
								{mode === "love" && (
									<p>
										<Trans
											components={{
												browseLink: (
													<InlineLink
														href={urls.discover("homies")}
													/>
												)
											}}
											i18nKey="small_drab_rooster_drum"
										/>
									</p>
								)}
								<p className="font-semibold">{t("tense_loose_felix_beam")}</p>
								<Countdown date={resetAt} onComplete={reset} />
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<ButtonLink href={urls.subscription.default} size="sm">
								{t("get_premium")}
							</ButtonLink>
							<ButtonLink
								href={
									mode === "love"
										? urls.discover("homies")
										: urls.discover("dates")
								}
								kind="tertiary"
								size="sm"
							>
								{t(mode === "love" ? "homie_mode" : "leave_homie_mode")}
							</ButtonLink>
						</div>
					</div>
				</DialogBody>
			</>
		</DrawerOrDialog>
	);
};
