"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FC, startTransition, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";

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
import { InputLabel, InputLabelHint, InputSelect } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { Slider } from "~/components/inputs/slider";
import { NewBadge, PremiumBadge } from "~/components/badge";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { capitalize } from "~/utilities";
import {
	CustomWeightList,
	DefaultProfileCustomWeights,
	Profile,
	ProfileMonopolyList,
	ProfileRelationshipLabel,
	ProfileRelationshipList
} from "~/api/user/profile";
import { Matchmaking } from "~/api/matchmaking";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";

const absMinAge = 18;
const absMaxAge = 60;

export const MatchmakingForm: FC = () => {
	const [session] = useSession();
	const t = useTranslations("profile");
	const router = useRouter();
	const toasts = useToast();

	const genders = useAttributeList("gender").filter(
		({ simple, fallback }) => simple || fallback
	);
	const tAttribute = useAttributeTranslation();

	const [passesPending, setPassesPending] = useState(false);

	if (!session) return null;
	const { user } = session;
	const { preferences, customWeights = DefaultProfileCustomWeights } =
		user.profile;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				gender: preferences?.attributes.gender || [],
				age: [
					preferences?.agemin ?? absMinAge,
					preferences?.agemax ?? absMaxAge
				],
				relationships: user.profile.relationships ?? [],
				monopoly: user.profile.monopoly,
				languages: user.profile.languages,
				weightCountry: customWeights.country,
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
			onSubmit={async (values) => {
				const [agemin, agemax] = values.age;
				const { gender: _, ...preferenceAttributes } =
					preferences?.attributes ?? {};

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
							...Object.values(preferenceAttributes).flat(),
							...values.gender
						]
					}),
					Profile.updateCustomWeights(user.id, {
						country: values.weightCountry,
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
									items={genders.map((gender) => {
										const { name, plural } = tAttribute[gender.id] ?? {
											name: gender.id
										};

										return {
											key: gender.id,
											label: gender.fallback
												? "Other genders"
												: (plural ?? name)
										};
									})}
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
												: max === absMaxAge
													? `${min}+`
													: `${min}-${max}`
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
					<FormField name="relationships">
						{(field) => (
							<>
								<InputLabel className="items-center">
									I&apos;m open to...
									<NewBadge />
								</InputLabel>
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
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								className="w-full"
								Icon={passesPending ? Loader2 : Trash2}
								iconClassName={twMerge("h-5", passesPending && "animate-spin")}
								size="sm"
							>
								Reset passes
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogDescription>
								This will permanently undo all profiles you&apos;ve passed on.
							</AlertDialogDescription>
							<DialogFooter>
								<AlertDialogCancel asChild>
									<Button kind="tertiary" size="sm">
										Cancel
									</Button>
								</AlertDialogCancel>
								<AlertDialogAction asChild>
									<Button
										size="sm"
										onClick={async () => {
											setPassesPending(true);
											await Matchmaking.resetPasses()
												.then(() => {
													setPassesPending(false);
													toasts.add("Passes reset");
													return router.refresh();
												})
												.catch(toasts.addError);
										}}
									>
										Reset passes
									</Button>
								</AlertDialogAction>
							</DialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<div className="flex flex-col gap-4">
						<InputLabel className="flex items-center gap-2 text-2xl font-semibold">
							<span>Matchmaking priorities</span>
							<PremiumBadge />
						</InputLabel>
						<span className="select-none">
							Customize who you see on Flirtual. Slide right to increase
							importance, left to decrease. Premium subscribers unlock full
							customization.
						</span>
						<span className="select-none">
							For example, slide &quot;Same country&quot; to the right to see
							more people from your country, or left if you want to see more
							people from other countries.
						</span>
					</div>
					{CustomWeightList.map((key) => {
						if (
							(key === "monopoly" && !fields.monopoly.props.value) ||
							(key === "relationships" && !fields.relationships.props.value) ||
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
														games: "Shared VR games",
														defaultInterests: "Shared interests",
														customInterests: "Shared custom interests",
														personality: "Personality match",
														relationships: "Relationship types",
														monopoly:
															fields.monopoly.props.value === "monogamous"
																? "Monogamous"
																: "Non-monogamous",
														languages: "Shared languages",
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
											onValueChange={(values) => onChange(values[0]!)}
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
