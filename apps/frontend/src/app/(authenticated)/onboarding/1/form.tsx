"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputDateSelect,
	InputLabel,
	InputLabelHint
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { urls } from "~/urls";
import { filterBy, fromEntries } from "~/utilities";
import { InputCountrySelect } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

const AttributeKeys = [...(["gender", "game", "interest"] as const)];

export interface Onboarding1Props {
	games: AttributeCollection<"game">;
	interests: AttributeCollection<"interest">;
	genders: AttributeCollection<"gender">;
	ipcountry: string | null;
}

export const Onboarding1Form: FC<Onboarding1Props> = (props) => {
	const { games, genders, interests, ipcountry } = props;

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
				bornAt: user.bornAt
					? new Date(user.bornAt.replaceAll("-", "/"))
					: new Date(),
				country:
					user.profile.country ??
					(ipcountry !== null && ipcountry !== "XX" && ipcountry !== "T1"
						? ipcountry?.toLowerCase()
						: null),
				...(fromEntries(
					AttributeKeys.map((type) => {
						return [
							type,
							filterBy(profile.attributes, "type", type).map(({ id }) => id) ??
								[]
						] as const;
					})
				) as { [K in (typeof AttributeKeys)[number]]: Array<string> }),
				interest: [
					...filterBy(profile.attributes, "type", "interest").map(
						({ id }) => id
					),
					...profile.customInterests
				]
			}}
			onSubmit={async ({ bornAt, interest, gender, ...values }) => {
				const customInterests = interest.filter(
					(id) => !interests.some((interest) => interest.id === id)
				);

				const [newUser, newProfile] = await Promise.all([
					api.user.update(user.id, {
						query: {
							required: ["bornAt"]
						},
						body: {
							bornAt: bornAt.toISOString()
						}
					}),
					api.user.profile.update(user.id, {
						body: {
							country: values.country ?? "none",
							customInterests,
							// @ts-expect-error: don't want to deal with this.
							...(fromEntries(
								AttributeKeys.filter(
									(key) => key !== "interest" && key !== "gender"
								).map((type) => {
									return [`${type}Id`, values[type]] as const;
								})
							) as {
								[K in (typeof AttributeKeys)[number] as `${K}Ids`]: Array<string>;
							}),
							genderId: gender.filter((id) => id !== "other"),
							interestId: interest.filter((id) => !customInterests.includes(id))
						}
					})
				]);

				await mutateSession({
					...session,
					user: {
						...newUser,
						profile: newProfile
					}
				});

				router.push(urls.onboarding(2));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="bornAt">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									className="flex-col desktop:flex-row"
								>
									Date of birth
								</InputLabel>
								<InputDateSelect
									{...field.props}
									max="now"
									min={new Date("1900/01/01")}
								/>
							</>
						)}
					</FormField>
					<FormField name="gender">
						{(field) => {
							const simpleGenders = genders.filter(
								(gender) => gender.metadata?.simple
							);
							const simpleGenderIds = new Set(
								simpleGenders.map((gender) => gender.id)
							);
							const checkboxValue = field.props.value.some(
								(id) => !simpleGenderIds.has(id) && id !== "other"
							)
								? [...field.props.value, "other"]
								: field.props.value;

							return (
								<>
									<InputLabel {...field.labelProps}>My gender</InputLabel>
									<InputCheckboxList
										{...field.props}
										value={checkboxValue}
										items={[
											...simpleGenders.map((gender) => ({
												key: gender.id,
												label: gender.name,
												conflicts:
													gender.metadata &&
													Array.isArray(gender.metadata.conflicts)
														? gender.metadata.conflicts
														: []
											})),
											{
												key: "other",
												label: "Other genders"
											}
										]}
									/>
									{checkboxValue.includes("other") && (
										<InputAutocomplete
											{...field.props}
											limit={4}
											placeholder="Select your gender(s)..."
											options={genders.map((gender) => ({
												key: gender.id,
												label: gender.name,
												definition: gender.metadata.definition,
												definitionLink: gender.metadata.definitionLink,
												hidden: simpleGenderIds.has(gender.id)
											}))}
										/>
									)}
								</>
							);
						}}
					</FormField>
					<FormField name="country">
						{(field) => (
							<>
								<InputLabel hint="(optional)">Location</InputLabel>
								<InputCountrySelect {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="game">
						{(field) => (
							<>
								<InputLabel hint="(up to 5)">VR apps/games</InputLabel>
								<InputLabelHint className="-mt-2">
									After matching on Flirtual, you can meet up in any social app
									or multiplayer game.
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									limit={5}
									placeholder="Select your favorite games..."
									options={games.map((game) => ({
										key: game.id,
										label: game.name
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="interest">
						{(field) => (
							<>
								<InputLabel hint="(up to 10)">Interests</InputLabel>
								<InputLabelHint className="-mt-2">
									You&apos;ll have a chance to add more interests later.
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									limit={10}
									placeholder="Select your interests..."
									options={interests
										.filter(
											(interest) => interest.metadata.category === "Popular"
										)
										.map((interest) => ({
											key: interest.id,
											label: interest.name
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
								/>
							</>
						)}
					</FormField>
					<FormButton className="ml-auto w-36" size="sm" />
				</>
			)}
		</Form>
	);
};
