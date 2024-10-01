"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, MoveLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { urls } from "~/urls";
import { InputLanguageAutocomplete } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { ButtonLink } from "~/components/button";
import {
	Profile,
	ProfileMonopolyList,
	ProfileRelationshipLabel,
	ProfileRelationshipList
} from "~/api/user/profile";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";

import type { FC } from "react";

export const Finish2Form: FC = () => {
	const platforms = useAttributeList("platform");
	const sexualities = useAttributeList("sexuality");

	const [session, mutateSession] = useSession();
	const t = useTranslations("profile");
	const tAttribute = useAttributeTranslation();

	const router = useRouter();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				relationships: profile.relationships ?? [],
				monopoly: profile.monopoly,
				new: profile.new ?? false,
				languages: user.profile.languages ?? [],
				platformId: user.profile.attributes.platform || [],
				sexualityId: user.profile.attributes.sexuality || []
			}}
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
								Your profile is{" "}
								{user.emailConfirmedAt ? "now visible" : "good to go"}! The rest
								is <strong>optional</strong>, but helps us find the best people
								for you. You can always add more later in your Profile Settings.
							</span>
						</div>
						<hr className="border-t-2 border-white-30 dark:border-black-60" />
					</div>
					<FormField name="relationships">
						{(field) => (
							<>
								<InputLabel>I&apos;m open to...</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={ProfileRelationshipList.map((item) => ({
										key: item,
										label: ProfileRelationshipLabel[item]
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="sexualityId">
						{(field) => (
							<>
								<InputLabel>Sexuality</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									placeholder="Select your sexualities..."
									options={sexualities.map((sexuality) => ({
										key: sexuality.id,
										label: tAttribute[sexuality.id]?.name || sexuality.id
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="monopoly">
						{(field) => (
							<>
								<InputLabel>Relationship type</InputLabel>
								<InputSelect
									{...field.props}
									optional
									options={ProfileMonopolyList.map((value) => ({
										id: value,
										name: t("brave_funny_vulture_sail", { value })
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="languages">
						{(field) => (
							<>
								<InputLabel>Language</InputLabel>
								<InputLanguageAutocomplete limit={5} {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="platformId">
						{(field) => (
							<>
								<InputLabel>VR setup</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={8}
									placeholder="Select the platforms you use..."
									options={platforms.map((platformId) => ({
										key: platformId,
										label: tAttribute[platformId]?.name || platformId
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>Are you new to Virtual Reality?</InputLabel>
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
							<span>Back</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};
