import type { FC } from "react";

import type { ProspectKind } from "~/api/matchmaking";
import { ButtonLink } from "~/components/button";
import { InlineLink } from "~/components/inline-link";
import { ModelCard } from "~/components/model-card";
import { useTranslations } from "next-intl";
import { urls } from "~/urls";

export interface OutOfProspectsErrorProps {
	mode: ProspectKind;
}

export const OutOfProspectsError: FC<OutOfProspectsErrorProps> = ({ mode }) => {
	const t = useTranslations();

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
									<p>{t("full_zesty_finch_exhale")}</p>
									<p>
										{t.rich("round_stout_iguana_stab", {
											link: (children) => (
												<InlineLink href={urls.settings.matchmaking()}>
													{children}
												</InlineLink>
											)
										})}
									</p>
									<p>{t("sea_giant_anteater_slurp")}</p>
									<p>
										{t.rich("main_large_goat_succeed", {
											link: (children) => (
												<InlineLink href={urls.browse("friend")}>
													{children}
												</InlineLink>
											)
										})}
									</p>
								</div>
								<div className="flex gap-4">
									<ButtonLink href={urls.settings.matchmaking()} size="sm">
										{t("filters")}
									</ButtonLink>
									<ButtonLink href={urls.browse("friend")} size="sm">
										{t("homie_mode")}
									</ButtonLink>
								</div>
							</>
						),
						friend: (
							<>
								<div className="flex flex-col gap-4">
									<p>{t("pretty_last_shrike_bend")}</p>
									<p>
										{t("stout_tired_warbler_inspire")}
									</p>
								</div>
								<div className="flex gap-4">
									<ButtonLink href={urls.browse()} size="sm">
										{t("sharp_gray_sloth_clasp")}
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
	const t = useTranslations();

	return (
		<ModelCard
			branded
			title={t("complete_your_profile")}
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>{t("silly_petty_meerkat_hug")}</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.finish(1)} size="sm">
						{t("finish_profile")}
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};

export const ConfirmEmailError: React.FC = () => {
	const t = useTranslations();

	return (
		<ModelCard
			branded
			title={t("confirm_your_email")}
			titleProps={{ className: "desktop:text-3xl" }}
		>
			<div className="flex flex-col gap-4">
				<p>
					{t("heroic_big_firefox_enrich")}
				</p>
				<div className="flex gap-4">
					<ButtonLink href={urls.confirmEmail()} size="sm">
						{t("confirm_email")}
					</ButtonLink>
				</div>
			</div>
		</ModelCard>
	);
};
