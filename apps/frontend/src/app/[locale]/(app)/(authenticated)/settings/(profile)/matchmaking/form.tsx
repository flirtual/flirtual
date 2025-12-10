import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { capitalize } from "remeda";
import { twMerge } from "tailwind-merge";

import { Matchmaking } from "~/api/matchmaking";
import {
	CustomWeightList,
	DefaultProfileCustomWeights,
	Profile,
	ProfileMonopolyList,
	ProfileRelationshipList
} from "~/api/user/profile";
import { PremiumBadge } from "~/components/badge";
import { Button } from "~/components/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "~/components/dialog/alert";
import { DialogFooter } from "~/components/dialog/dialog";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputCheckbox, InputLabel, InputLabelHint, InputSelect } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import {

	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import type { AttributeTranslation } from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { invalidate, sessionKey } from "~/query";

const absMinAge = 18;
const absMaxAge = 60;

export const MatchmakingForm: FC = () => {
	const session = useSession();
	const toasts = useToast();
	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();

	const genders = useAttributes("gender").filter(
		({ simple, fallback }) => simple || fallback
	);

	const [passesPending, setPassesPending] = useState(false);

	const { user } = session;
	const { preferences, customWeights = DefaultProfileCustomWeights }
		= user.profile;

	return (
		<Form
			fields={{
				visionFilter: user.profile.customFilters?.some(({ preferred, type, value }) => preferred && type === "platform" && value === "vision"),
				gender: preferences?.attributes.gender || [],
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				],
				relationships: user.profile.relationships ?? [],
				monopoly: user.profile.monopoly,
				languages: user.profile.languages,
				weightLocation: customWeights.location,
				weightCustomInterests: customWeights.customInterests,
				weightDefaultInterests: customWeights.defaultInterests,
				weightDomsub: customWeights.domsub,
				weightGames: customWeights.games,
				weightKinks: customWeights.kinks,
				weightLikes: customWeights.likes,
				weightRelationships: customWeights.relationships,
				weightMonopoly: customWeights.monopoly,
				weightLanguages: customWeights.languages,
				weightPersonality: customWeights.personality
			}}
			className="flex flex-col gap-8"
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				const { gender: _, ...preferenceAttributes }
					= preferences?.attributes ?? {};

				await Promise.all([
					Profile.update(user.id, {
						required: ["relationships"],
						relationships: values.relationships ?? [],
						monopoly: values.monopoly ?? "none"
					}),
					Profile.updatePreferences(user.id, {
						requiredAttributes: ["gender"],
						agemin: agemin === absMinAge ? null : agemin,
						agemax: agemax === absMaxAge ? null : agemax,
						attributes: [
							...Object.values(preferenceAttributes).flat().filter(Boolean),
							...values.gender
						]
					}),
					Profile.updateCustomWeights(user.id, {
						location: values.weightLocation,
						customInterests: values.weightCustomInterests,
						defaultInterests: values.weightDefaultInterests,
						domsub: values.weightDomsub,
						games: values.weightGames,
						kinks: values.weightKinks,
						likes: values.weightLikes,
						relationships: values.weightRelationships,
						monopoly: values.weightMonopoly,
						languages: values.weightLanguages,
						personality: values.weightPersonality
					}),
					Profile.updateCustomFilters(user.id, values.visionFilter
						? [{
								preferred: true,
								type: "platform",
								value: "vision"
							}]
						: [])
				]);

				await invalidate({ queryKey: sessionKey() });
				toasts.add(t("east_low_niklas_list"));
			}}
		>
			{({ FormField, fields }) => (
				<>
					{user.platforms?.includes("vision") && (
						<FormField name="visionFilter">
							{(field) => (
								<div className="flex items-center gap-4">
									<InputCheckbox {...field.props} />
									<InputLabel {...field.labelProps}>
										{t("legal_actual_newt_soar")}
									</InputLabel>
								</div>
							)}
						</FormField>
					)}
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>{t("want_to_meet")}</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={genders.map((gender) => {
										const { name, plural } = (tAttribute[
											gender.id
										] as AttributeTranslation<"gender">) ?? {
											name: gender.id
										};

										return {
											key: gender.id,
											label: gender.fallback
												? t("other_genders")
												: (plural ?? name)
										};
									})}
								/>
							</>
						)}
					</FormField>
					<FormField name="age">
						{({ labelProps, props: { value, onChange, ...props } }) => {
							const [min, max] = value as [number, number];

							return (
								<>
									<InputLabel
										{...labelProps}
										hint={
											min === absMinAge && max === absMaxAge
												? t("any_age")
												: max === absMaxAge
													? t("number_plus", { number: min })
													: min === max
														? min
														: t("number_range", { from: min, to: max })
										}
									>
										{t("age_range")}
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
					<FormField name="relationships">
						{(field) => (
							<>
								<InputLabel className="items-center">{t("im_open_to")}</InputLabel>
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
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								className="w-full"
								Icon={passesPending ? Loader2 : Trash2}
								iconClassName={twMerge("h-5", passesPending && "animate-spin")}
								size="sm"
							>
								{t("reset_passes")}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogDescription>
								{t("noble_cute_lionfish_thrive")}
							</AlertDialogDescription>
							<DialogFooter>
								<AlertDialogCancel asChild>
									<Button kind="tertiary" size="sm">
										{t("cancel")}
									</Button>
								</AlertDialogCancel>
								<AlertDialogAction asChild>
									<Button
										size="sm"
										onClick={async () => {
											setPassesPending(true);
											await Matchmaking.resetPasses()
												.then(async () => {
													setPassesPending(false);
													toasts.add(t("passes_reset"));

													return invalidate({ predicate: ({ queryKey }) => queryKey[0] === "query" });
												})
												.catch(toasts.addError);
										}}
									>
										{t("reset_passes")}
									</Button>
								</AlertDialogAction>
							</DialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<div className="flex flex-col gap-4">
						<InputLabel className="flex items-center gap-2 text-2xl font-semibold">
							<span>{t("matchmaking_priorities")}</span>
							<PremiumBadge />
						</InputLabel>
						<span>
							{t("safe_good_rat_bask")}
						</span>
						<span>
							{t("weird_dizzy_baboon_support")}
						</span>
					</div>
					{CustomWeightList.map((key) => {
						if (
							(key === "monopoly" && !fields.monopoly.props.value)
							|| (key === "relationships" && !fields.relationships.props.value)
							|| (["domsub", "kinks"].includes(key) && !user.preferences?.nsfw)
						)
							return null;

						return (
							<FormField key={key} name={`weight${capitalize(key)}`}>
								{({ labelProps, props: { value, onChange, ...props } }) => (
									<>
										<InputLabel
											{...labelProps}
											hint={(
												<InputLabelHint
													className={twMerge(
														"ml-auto",
														value === 0 ? "!text-red-500" : ""
													)}
												>
													{t("number_multiplier", { number: value })}
												</InputLabelHint>
											)}
										>
											<span>
												{
													{
														location: t("location"),
														games: t("shared_vr_games"),
														defaultInterests: t("shared_interests"),
														customInterests: t("shared_custom_interests"),
														personality: t("personality_match"),
														relationships: t("relationship_types"),
														monopoly:
															fields.monopoly.props.value === "monogamous"
																? t("monogamous")
																: t("nonmonogamous"),
														languages: t("shared_languages"),
														domsub:
															user.profile.domsub === "dominant"
																? t("submissive")
																: user.profile.domsub === "submissive"
																	? t("dominant")
																	: user.profile.domsub === "switch"
																		? t("switch")
																		: t("domsubswitch_match"),
														kinks: t("kink_compatibility"),
														likes: t("people_who_have_liked_you")
													}[key]
												}
											</span>
										</InputLabel>
										<Slider
											{...props}
											disabled={
												key === "location" ? false : !user.subscription?.active
											}
											max={2}
											min={0}
											step={0.25}
											value={[value]}
											onValueChange={(values) => onChange(values[0]!)}
										/>
									</>
								)}
							</FormField>
						);
					})}
					<FormButton>{t("update")}</FormButton>
				</>
			)}
		</Form>
	);
};
