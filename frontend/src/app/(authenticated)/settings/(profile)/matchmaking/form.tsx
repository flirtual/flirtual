"use client";

import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { DefaultProfileCustomWeights, ProfilePreferenceGender } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputLabel,
	InputLabelHint,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { InputSlider } from "~/components/inputs/slider";
import { PremiumBadge } from "~/components/premium-badge";
import { useCurrentUser } from "~/hooks/use-current-user";
import { capitalize, entries } from "~/utilities";

const CustomWeightLabels: { [K in keyof typeof DefaultProfileCustomWeights]: React.ReactNode } = {
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
};

export const MatchmakingForm: React.FC = () => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	const { preferences } = user.profile;
	const customWeights = user.profile.customWeights ?? DefaultProfileCustomWeights;

	const absMinAge = 18;
	const absMaxAge = 100;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				gender: (preferences.gender ?? []) as Array<ProfilePreferenceGender>,
				ageRange: [
					preferences.agemin ?? absMinAge,
					preferences.agemax ?? absMaxAge
				] as InputRangeSliderValue,
				serious: false,
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
				if (!user) return;

				const [agemin, agemax] = values.ageRange;
				await Promise.all([
					api.user.profile.updatePreferences(user.id, {
						agemin: agemin === absMinAge ? null : agemin,
						agemax: agemax === absMaxAge ? null : agemax,
						gender: values.gender
					}),
					api.user.profile.updateCustomWeights(user.id, {
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
					})
				]);
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={{
										men: { label: "Men" },
										women: { label: "Women" },
										other: { label: "Other" }
									}}
								/>
							</>
						)}
					</FormField>
					<FormField name="ageRange">
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
					{entries(CustomWeightLabels).map(([key, label]) => (
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
										{label}
									</InputLabel>
									<InputSlider
										{...field.props}
										disabled={key === "country" ? false : !user.subscription}
										max={3}
										min={0}
										step={0.25}
									/>
								</>
							)}
						</FormField>
					))}
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};
