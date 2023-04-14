"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
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
	InputRangeSlider,
	InputRangeSliderValue,
	InputSelect,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputSlider } from "~/components/inputs/slider";
import { PremiumBadge } from "~/components/premium-badge";
import { useAttributeList } from "~/hooks/use-attribute-list";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { capitalize, excludeBy, filterBy } from "~/utilities";

const absMinAge = 18;
const absMaxAge = 100;

export const MatchmakingForm: React.FC = () => {
	const [session] = useSession();
	const toasts = useToast();

	const [expanded, setExpanded] = useState(false);

	const genders = useAttributeList("gender")
		.filter((gender) => gender.metadata?.simple)
		.sort((a, b) => ((a.metadata?.order ?? 0) > (b.metadata?.order ?? 0) ? 1 : -1));

	if (!session) return null;
	const { user } = session;
	const { preferences, customWeights = DefaultProfileCustomWeights } = user.profile;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				gender: filterBy(preferences?.attributes ?? [], "type", "gender").map(({ id }) => id),
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				] satisfies InputRangeSliderValue,
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
								...excludeBy(preferences?.attributes ?? [], "type", "gender").map(({ id }) => id),
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

				toasts.add({ type: "success", label: "Successfully updated matchmaking settings!" });
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
						{(field) => {
							const [min, max] = field.props.value;

							return (
								<>
									<InputLabel
										{...field.labelProps}
										hint={min === absMinAge && max === absMaxAge ? "any age" : `${min} to ${max}`}
									>
										Age range
									</InputLabel>
									<InputRangeSlider {...field.props} max={absMaxAge} min={absMinAge} />
								</>
							);
						}}
					</FormField>
					<FormField className="flex-col-reverse gap-4 sm:flex-row sm:items-center" name="serious">
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
							Moving a slider to the left will decrease its priority in matchmaking. Moving a slider
							to the right will increase its priority. Flirtual Supporters can customize each slider
							in their matchmaking algorithm.
						</span>
					</div>
					{CustomWeightList.map((key) => {
						if (
							(["monopoly", "domsub", "kinks"].includes(key) && !user.preferences?.nsfw) ||
							(key === "serious" && !fields.serious.props.value)
						)
							return null;

						return (
							<FormField key={key} name={`weight${capitalize(key)}`}>
								{(field) => (
									<>
										<InputLabel
											{...field.labelProps}
											hint={
												<InputLabelHint
													className={twMerge(
														"ml-auto",
														field.props.value === 0 ? "!text-red-500" : ""
													)}
												>
													{field.props.value}x
												</InputLabelHint>
											}
										>
											{
												{
													country: "Same country",
													games: "Social VR games in common",
													defaultInterests: "Standard interests in common",
													customInterests: "Custom interests in common",
													personality: "Personality similarity",
													serious: "Open to serious dating",
													monopoly: "NSFW match",
													domsub: "Dom/sub/switch match",
													kinks: "Kink matches",
													likes: "People who have liked you"
												}[key]
											}
										</InputLabel>
										<InputSlider
											{...field.props}
											disabled={key === "country" ? false : !user.subscription}
											max={2}
											min={0}
											step={0.25}
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
