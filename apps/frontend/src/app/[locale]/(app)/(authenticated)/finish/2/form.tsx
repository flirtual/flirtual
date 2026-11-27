import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, MoveLeft } from "lucide-react";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";

import { sexualitiesOptions } from "~/api/data";
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
	InputSelect
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputLanguageAutocomplete } from "~/components/inputs/specialized";
import { useOptionalSession } from "~/hooks/use-session";
import { useLocale, useNavigate } from "~/i18n";
import { mutate, sessionKey } from "~/query";

import { nextFinishStepUrl, previousFinishStepUrl } from "../navigation";

export const Finish2Form: FC = () => {
	const [locale] = useLocale();
	const { data: sexualities } = useSuspenseQuery(sexualitiesOptions({ locale }));

	const session = useOptionalSession();
	const { t } = useTranslation();

	const navigate = useNavigate();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			fields={{
				relationships: profile.relationships ?? [],
				monopoly: profile.monopoly,
				languages: user.profile.languages ?? [],
				sexualityId: user.profile.sexualities || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async ({ ...values }) => {
				const newProfile = await Profile.update(user.id, {
					...values,
					relationships: values.relationships ?? [],
					monopoly: values.monopoly ?? null,
					languages: values.languages
				});

				await mutate(sessionKey(), {
					...session,
					user: {
						...user,
						profile: newProfile
					}
				});

				navigate(nextFinishStepUrl("details", user));
			}}
		>
			{({ FormField }) => (
				<>
					<div className="flex flex-col">
						<div className="flex gap-4 pb-6 desktop:pb-6">
							<CheckCircle2 className="mt-1.5 size-7 shrink-0 text-pink" />
							<span>
								<Trans i18nKey={user.emailConfirmedAt ? "finish_visible_notice" : "finish_ready_notice"} />
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
											hookups: "hookups_hint",
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
										const { id, name, definition, definitionLink } = sexuality;

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
								<InputLabel>{t("relationship_type")}</InputLabel>
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
					<div className="flex justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={previousFinishStepUrl("details")}
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
