"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, MoveLeft } from "lucide-react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { urls } from "~/urls";
import { filterBy, fromEntries } from "~/utilities";
import { InputLanguageAutocomplete } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import {
	ProfileMonopolyLabel,
	ProfileMonopolyList,
	ProfileRelationshipLabel,
	ProfileRelationshipList
} from "~/api/user/profile";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { ButtonLink } from "~/components/button";
import { HeartIcon } from "~/components/icons/gradient/heart";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

const AttributeKeys = [...(["sexuality", "platform"] as const)];

export interface Finish2Props {
	platforms: AttributeCollection<"platform">;
	sexualities: AttributeCollection<"sexuality">;
}

export const Finish2Form: FC<Finish2Props> = (props) => {
	const { platforms, sexualities } = props;

	const [session, mutateSession] = useSession();
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
				...(fromEntries(
					AttributeKeys.map((type) => {
						return [
							type,
							filterBy(profile.attributes, "type", type).map(({ id }) => id) ??
								[]
						] as const;
					})
				) as { [K in (typeof AttributeKeys)[number]]: Array<string> })
			}}
			onSubmit={async ({ ...values }) => {
				const newProfile = await api.user.profile.update(user.id, {
					body: {
						relationships: values.relationships ?? [],
						monopoly: values.monopoly ?? "none",
						languages: values.languages,
						new: values.new,
						// @ts-expect-error: don't want to deal with this.
						...(fromEntries(
							AttributeKeys.map((type) => {
								return [`${type}Id`, values[type]] as const;
							})
						) as {
							[K in (typeof AttributeKeys)[number] as `${K}Ids`]: Array<string>;
						})
					}
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
					<FormField name="sexuality">
						{(field) => (
							<>
								<InputLabel>Sexuality</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={3}
									placeholder="Select your sexualities..."
									options={sexualities.map((sexuality) => ({
										key: sexuality.id,
										label: sexuality.name
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
									options={ProfileMonopolyList.map((item) => ({
										id: item,
										name: ProfileMonopolyLabel[item]
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
					<FormField name="platform">
						{(field) => (
							<>
								<InputLabel>VR setup</InputLabel>
								<InputAutocomplete
									{...field.props}
									limit={8}
									placeholder="Select the platforms you use..."
									options={platforms.map((platform) => ({
										key: platform.id,
										label: platform.name
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
