import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { ProspectKind } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { homieMode } from "~/features";
import { urls } from "~/urls";

export interface OutOfProspectsProps {
	mode: ProspectKind;
}

export const OutOfProspects: FC<OutOfProspectsProps> = ({ mode }) => {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			title={t("out_of_profiles")}
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-8">
				{
					{
						love: (
							<>
								<div className="flex flex-col gap-4">
									<p>{t("dates_exhausted")}</p>
									<p>
										<Trans
											components={{
												settingsLink: <InlineLink href={urls.settings.matchmaking()} />
											}}
											i18nKey="dates_exhausted_filters"
										/>
									</p>
									<p>{t("dates_exhausted_later")}</p>
									{homieMode && (
										<p>
											<Trans
												components={{
													browseLink: <InlineLink href={urls.discover("homies")} />
												}}
												i18nKey="dates_exhausted_homie_mode"
											/>
										</p>
									)}
								</div>
								<div className="flex gap-4">
									<ButtonLink href={urls.settings.matchmaking()}>
										{t("filters")}
									</ButtonLink>
									{homieMode && (
										<ButtonLink className="px-0" href={urls.discover("homies")} kind="tertiary">
											{t("homie_mode")}
										</ButtonLink>
									)}
								</div>
							</>
						),
						friend: (
							<>
								<div className="flex flex-col gap-4">
									<p>{t("homies_exhausted")}</p>
									<p>
										{t("homies_exhausted_later")}
									</p>
								</div>
								<div className="flex gap-4">
									<ButtonLink href={urls.discover("dates")}>
										{t("leave_homie_mode")}
									</ButtonLink>
								</div>
							</>
						)
					}[mode]
				}
			</div>
		</ModelCard>
	);
};

export const FinishProfileError: React.FC = () => {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			title={t("complete_your_profile")}
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>{t("hidden_profile_finish")}</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.finish(1)}>
						{t("finish_profile")}
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};

export const ConfirmEmailError: React.FC = () => {
	const { t } = useTranslation();

	return (
		<ModelCard
			branded
			title={t("confirm_your_email")}
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>
					{t("hidden_profile_confirm_email")}
				</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.confirmEmail()}>
						{t("confirm_email")}
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};
