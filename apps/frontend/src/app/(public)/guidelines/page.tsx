import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("guidelines");

	return {
		title: t("title")
	};
}

export default function GuidelinesPage() {
	const t = useTranslations("guidelines");

	return (
		<SoleModelLayout>
			<ModelCard className="w-full desktop:max-w-2xl" title={t("title")}>
				<div className="flex flex-col gap-8">
					<p>{t("spry_sweet_maggot_charm")}</p>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">
							{t("late_lime_llama_kick")}
						</h1>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("male_same_millipede_devour")}
							</h2>
							<p>{t("this_zippy_orangutan_care")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("lost_best_shell_breathe")}
							</h2>
							<p>{t("round_aqua_lemur_dance")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("steep_tense_opossum_play")}
							</h2>
							<p>{t("jolly_loose_rook_offer")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("main_solid_jannes_blend")}
							</h2>
							<p>{t("spare_plain_piranha_catch")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("crisp_stale_worm_edit")}
							</h2>
							<p>{t("fancy_direct_cougar_bubble")}</p>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">
							{t("solid_misty_shell_play")}
						</h1>
						<p className="italic">{t("dull_lost_cowfish_lock")}</p>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("dull_candid_elephant_love")}
							</h2>
							<p>{t("sunny_swift_lion_find")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("left_weird_mule_aim")}
							</h2>
							<p>{t("extra_quick_tern_radiate")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("each_actual_vulture_enjoy")}
							</h2>
							<p>{t("just_clean_mallard_bless")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("only_crisp_tiger_savor")}
							</h2>
							<p>{t("due_major_manatee_work")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("stock_sea_antelope_hack")}n
							</h2>
							<p>{t("aqua_less_chipmunk_startle")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("born_sharp_swan_pull")}
							</h2>
							<p>
								{t.rich("curly_gross_tadpole_boost", {
									"mental-health": (children) => (
										<InlineLink href={urls.guides.mentalHealth}>
											{children}
										</InlineLink>
									)
								})}
							</p>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<h1 className="text-2xl font-semibold">
							{t("fuzzy_sleek_javelina_boost")}
						</h1>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("keen_tense_jan_twist")}
							</h2>
							<p>{t("away_large_mammoth_exhale")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("muddy_happy_weasel_earn")}
							</h2>
							<p>{t("deft_major_snake_feel")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("stout_extra_worm_climb")}
							</h2>
							<p>{t("antsy_noble_mink_mend")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("main_moving_racoon_hike")}
							</h2>
							<p>{t("spare_direct_lark_grow")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("ideal_gray_snake_pause")}
							</h2>
							<p>{t("ornate_just_cuckoo_fond")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h2 className="text-xl font-semibold">
								{t("direct_next_worm_clap")}
							</h2>
							<p>
								{t.rich("major_wild_iguana_love", {
									vulnerability: (children) => (
										<InlineLink href={urls.resources.vulnerabilityReport}>
											{children}
										</InlineLink>
									),
									email: (children) => (
										<InlineLink href={urls.resources.contactDirect}>
											{children}
										</InlineLink>
									)
								})}
							</p>
						</div>
					</div>
					<div className="flex flex-col gap-4">
						<p className="italic">{t("swift_level_donkey_attend")}</p>
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">{t("keen_these_cheetah_aid")}</h3>
							<p>{t("gaudy_cozy_eagle_assure")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">{t("male_long_camel_pat")}</h3>
							<p>{t("last_fair_polecat_animate")}</p>
						</div>
						<div className="flex flex-col gap-1">
							<h3 className="font-semibold">{t("loved_lost_nils_adapt")}</h3>
							<ul>
								<li>
									<InlineLink href={urls.resources.termsOfService}>
										{t("sound_strong_impala_breathe")}
									</InlineLink>
								</li>
								<li>
									<InlineLink href={urls.resources.privacyPolicy}>
										{t("last_honest_rabbit_transform")}
									</InlineLink>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
