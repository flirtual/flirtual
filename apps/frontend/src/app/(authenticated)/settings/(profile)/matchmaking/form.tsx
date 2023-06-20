"use client";

import { useRouter } from "next/navigation";
import { FC, startTransition, useState } from "react";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { AttributeCollection } from "~/api/attributes";
import {
	CustomWeightList,
	DefaultProfileCustomWeights,
	ProfileMonopolyLabel,
	ProfileMonopolyList
} from "~/api/user/profile";
import { Button } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputLabel,
	InputLabelHint,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import { PremiumBadge } from "~/components/premium-badge";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { capitalize, excludeBy, filterBy } from "~/utilities";

const absMinAge = 18;
const absMaxAge = 100;

export interface MatchmakingFormProps {
	genders: AttributeCollection<"gender">;
}

export const MatchmakingForm: FC<MatchmakingFormProps> = ({ genders }) => {
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();

	const [expanded, setExpanded] = useState(false);

	if (!session) return null;
	const { user } = session;
	const { preferences, customWeights = DefaultProfileCustomWeights } =
		user.profile;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				gender: filterBy(preferences?.attributes ?? [], "type", "gender").map(
					({ id }) => id
				),
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				],
				serious: user.profile.serious ?? false,
				monopoly: user.profile.monopoly,
				weightCountry: customWeights.country,
				weightCustomInterests: customWeights.customInterests,
				weightDefaultInterests: customWeights.defaultInterests,
				weightDomsub: customWeights.domsub,
				weightGames: customWeights.games,
				weightKinks: customWeights.kinks,
				weightLikes: customWeights.likes,
				weightMonopoly: customWeights.monopoly,
				weightPersonality: customWeights.personality,
				weightSerious: customWeights.serious
			}}
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;

				await Promise.all([
					api.user.profile.update(user.id, {
						query: {
							required: ["serious"]
						},
						body: {
							serious: values.serious,
							monopoly: values.monopoly ?? "none"
						}
					}),
					api.user.profile.updatePreferences(user.id, {
						query: {
							requiredAttributes: ["gender"]
						},
						body: {
							agemin: agemin === absMinAge ? null : agemin,
							agemax: agemax === absMaxAge ? null : agemax,
							attributes: [
								...excludeBy(
									preferences?.attributes ?? [],
									"type",
									"gender"
								).map(({ id }) => id),
								...values.gender
							]
						}
					}),
					api.user.profile.updateCustomWeights(user.id, {
						body: {
							country: values.weightCountry,
							customInterests: values.weightCustomInterests,
							defaultInterests: values.weightCustomInterests,
							domsub: values.weightDomsub,
							games: values.weightGames,
							kinks: values.weightKinks,
							likes: values.weightLikes,
							monopoly: values.weightMonopoly,
							personality: values.weightPersonality,
							serious: values.weightSerious
						}
					})
				]);

				startTransition(() => router.refresh());
				toasts.add("Saved matchmaking preferences");
			}}
		>
			{({ FormField, fields }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={genders.map((gender) => ({
										key: gender.id,
										label: gender.metadata?.plural ?? gender.name
									}))}
								/>
							</>
						)}
					</FormField>
					<FormField name="age">
						{({ labelProps, props: { value, onChange, ...props } }) => {
							const [min, max] = value;

							return (
								<>
									<InputLabel
										{...labelProps}
										hint={
											min === absMinAge && max === absMaxAge
												? "any age"
												: `${min} to ${max}`
										}
									>
										Age range
									</InputLabel>
									<Slider
										{...props}
										max={absMaxAge}
										min={absMinAge}
										value={value}
										onValueChange={onChange}
									/>
								</>
							);
						}}
					</FormField>
					<FormField
						className="flex-col-reverse gap-4 sm:flex-row sm:items-center"
						name="serious"
					>
						{(field) => (
							<>
								<InputSwitch {...field.props} />
								<InputLabel {...field.labelProps} inline>
									Are you open to serious dating?
								</InputLabel>
							</>
						)}
					</FormField>
					<Button
						className="w-32"
						kind="secondary"
						size="sm"
						onClick={() => setExpanded((expanded) => !expanded)}
					>
						{expanded ? "Less ▲" : "More ▼"}
					</Button>
					{expanded && (
						<FormField name="monopoly">
							{(field) => (
								<InputSelect
									{...field.props}
									optional
									placeholder="Relationship type"
									options={ProfileMonopolyList.map((item) => ({
										key: item,
										label: ProfileMonopolyLabel[item]
									}))}
								/>
							)}
						</FormField>
					)}
					<div className="flex flex-col gap-4">
						<InputLabel className="flex items-center gap-2 text-2xl font-semibold">
							<span>Matchmaking priorities</span>
							<PremiumBadge />
						</InputLabel>
						<span>
							Customize who you see on Flirtual. Slide right to increase
							importance, left to decrease. Premium subscribers unlock full
							customization.
						</span>
						<span>
							For example, slide &quot;Same country&quot; to the right to see
							more people from your country, or left if you want to see more
							people from other countries.
						</span>
					</div>
					{CustomWeightList.map((key) => {
						if (
							(key === "monopoly" && !fields.monopoly.props.value) ||
							(key === "serious" && !fields.serious.props.value) ||
							(["domsub", "kinks"].includes(key) && !user.preferences?.nsfw)
						)
							return null;

						return (
							<FormField key={key} name={`weight${capitalize(key)}`}>
								{({ labelProps, props: { value, onChange, ...props } }) => (
									<>
										<InputLabel
											{...labelProps}
											hint={
												<InputLabelHint
													className={twMerge(
														"ml-auto",
														value === 0 ? "!text-red-500" : ""
													)}
												>
													{value}x
												</InputLabelHint>
											}
										>
											<span>
												{
													{
														country: "Same country",
														monopoly:
															fields.monopoly.props.value === "monogamous"
																? "Monogamous"
																: "Non-monogamous",
														games: "Shared VR games",
														defaultInterests: "Shared interests",
														customInterests: "Shared custom interests",
														personality: "Personality match",
														serious: "Open to serious dating",
														domsub:
															user.profile.domsub === "dominant"
																? "Submissive"
																: user.profile.domsub === "submissive"
																? "Dominant"
																: user.profile.domsub === "switch"
																? "Switch"
																: "Dom/sub/switch match",
														kinks: "Kink compatibility",
														likes: "People who have liked you"
													}[key]
												}
											</span>
										</InputLabel>
										<Slider
											{...props}
											max={2}
											min={0}
											step={0.25}
											value={[value]}
											disabled={
												key === "country" ? false : !user.subscription?.active
											}
											onValueChange={(values) => onChange(values[0])}
										/>
									</>
								)}
							</FormField>
						);
					})}
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
