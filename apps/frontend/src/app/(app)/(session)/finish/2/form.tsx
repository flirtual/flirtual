"use client";

import { CheckCircle2, MoveLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import {
	Profile,
	ProfileMonopolyList,
	ProfileRelationshipList
} from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputLanguageAutocomplete } from "~/components/inputs/specialized";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const Finish2Form: FC = () => {
	const platforms = useAttributes("platform");
	const sexualities = useAttributes("sexuality");

	const [session, mutateSession] = useSession();
	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

	const router = useRouter();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			fields={{
				relationships: profile.relationships ?? [],
				monopoly: profile.monopoly,
				new: profile.new ?? false,
				languages: user.profile.languages ?? [],
				platformId: user.profile.attributes.platform || [],
				sexualityId: user.profile.attributes.sexuality || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async ({ ...values }) => {
				const newProfile = await Profile.update(user.id, {
					...values,
					relationships: values.relationships ?? [],
					monopoly: values.monopoly ?? "none",
					languages: values.languages,
					new: values.new
				});

				await mutateSession({
					...session,
					user: {
						...user,
						profile: newProfile
					}
				});

				router.push(urls.finish(3));
			}}
		>
			{({ FormField }) => (
				<>
					<div className="flex flex-col">
						<div className="flex gap-4 pb-6 desktop:pb-6">
							<CheckCircle2 className="mt-1.5 size-7 shrink-0 text-pink" />
							<span>
								{t.rich(user.emailConfirmedAt ? "actual_stock_camel_devour" : "clean_extra_goldfish_pause", {
									strong: (children) => <strong>{children}</strong>
								})}
							</span>
						</div>
						<hr className="border-t-2 border-white-30 dark:border-black-60" />
					</div>
					<FormField name="relationships">
						{(field) => (
							<>
								<InputLabel>{t("im_open_to")}</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={ProfileRelationshipList.map((item) => ({
										key: item,
										label: t(({
											serious: "serious_dating_hint",
											vr: "casual_dating_hint",
											hookups: "casual_fun",
											friends: "new_friends"
										} as const)[item])
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="sexualityId">
						{(field) => (
							<>
								<InputLabel>{t("sexuality")}</InputLabel>
								<InputAutocomplete
									{...field.props}
									options={sexualities.map((sexuality) => {
										const { id, definitionLink } = typeof sexuality === "string" ? { id: sexuality } : sexuality;

										const { name, definition }
											= (tAttribute[
												id
											] as AttributeTranslation<"sexuality">) ?? {};

										return {
											key: id,
											label: name ?? id,
											definition,
											definitionLink
										};
									})}
									limit={3}
									placeholder={t("select_your_sexualities")}
								/>
							</>
						)}
					</FormField>
					<FormField name="monopoly">
						{(field) => (
							<>
								<InputLabel>{t("relation_type")}</InputLabel>
								<InputSelect
									{...field.props}
									optional
									options={ProfileMonopolyList.map((value) => ({
										id: value,
										name: t(value)
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>{t("language")}</InputLabel>
								<InputLanguageAutocomplete limit={5} {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="platformId">
						{(field) => (
							<>
								<InputLabel>{t("vr_setup")}</InputLabel>
								<InputAutocomplete
									{...field.props}
									options={platforms.map((platformId) => ({
										key: platformId,
										label: tAttribute[platformId]?.name || platformId
									}))}
									limit={8}
									placeholder={t("select_the_platforms_you_use")}
								/>
							</>
						)}
					</FormField>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>{t("nimble_hour_bumblebee_savor")}</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
					<div className="flex justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.finish(1)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>{t("back")}</span>
						</ButtonLink>
						<FormButton className="min-w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};
