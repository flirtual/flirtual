"use client";

import { useRouter } from "next/navigation";

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
import { fromEntries } from "~/utilities";
import { InputCountrySelect } from "~/components/inputs/specialized";
import { useSession } from "~/hooks/use-session";
import { useInternationalization } from "~/hooks/use-internationalization";
import { User } from "~/api/user";
import { Profile } from "~/api/user/profile";
import {
	useAttributeList,
	useAttributeTranslation,
	type AttributeTranslation
} from "~/hooks/use-attribute-list";

import type { FC } from "react";

const AttributeKeys = [...(["gender", "game", "interest"] as const)];

export const Onboarding1Form: FC = () => {
	const [session, mutateSession] = useSession();
	const { country: systemCountry } = useInternationalization();
	const router = useRouter();

	const games = useAttributeList("game");
	const genders = useAttributeList("gender");
	const interests = useAttributeList("interest");

	const tAttribute = useAttributeTranslation();

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
				country: user.profile.country ?? systemCountry,
				game: profile.attributes.game || [],
				gender: profile.attributes.gender || [],
				interest: profile.attributes.interest || []
			}}
			onSubmit={async ({ bornAt, ...values }) => {
				const [newUser, newProfile] = await Promise.all([
					User.update(user.id, {
						bornAt: bornAt.toISOString(),
						required: ["bornAt"]
					}),
					Profile.update(user.id, {
						country: values.country ?? "none",
						...fromEntries(
							AttributeKeys.map((type) => {
								return [
									`${type}Id`,
									type === "gender"
										? values[type]?.filter((id) => id !== "other")
										: values[type]
								] as const;
							})
						)
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
							const simpleGenders = genders.filter((gender) => gender.simple);
							const simpleGenderIds = new Set(
								simpleGenders.map((gender) => gender.id)
							);
							const checkboxValue = field.props.value?.some(
								(id) => !simpleGenderIds.has(id) && id !== "other"
							)
								? [...field.props.value, "other"]
								: field.props.value;

							return (
								<>
									<InputLabel {...field.labelProps}>My gender</InputLabel>
									<InputCheckboxList
										{...field.props}
										value={checkboxValue ?? []}
										items={[
											...simpleGenders.map((gender) => ({
												conflicts: gender.conflicts ?? [],
												key: gender.id,
												label: tAttribute[gender.id]?.name ?? gender.id
											})),
											{
												key: "other",
												label: "Other genders"
											}
										]}
									/>
									{checkboxValue?.includes("other") && (
										<InputAutocomplete
											{...field.props}
											limit={4}
											placeholder="Select your gender(s)..."
											value={field.props.value || []}
											options={genders.map((gender) => {
												const { name, definition } =
													(tAttribute[
														gender.id
													] as AttributeTranslation<"gender">) ?? {};

												return {
													definition,
													definitionLink: gender.definitionLink,
													hidden: simpleGenderIds.has(gender.id),
													key: gender.id,
													label: name ?? gender.id
												};
											})}
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
									value={field.props.value || []}
									options={games.map((game) => ({
										key: game,
										label: tAttribute[game]?.name ?? game
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
									value={field.props.value || []}
									options={interests
										.filter(
											(interest) =>
												interest.category === "iiCe39JvGQAAtsrTqnLddb"
										)
										.map((interest) => ({
											key: interest.id,
											label: tAttribute[interest.id]?.name ?? interest.id
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
