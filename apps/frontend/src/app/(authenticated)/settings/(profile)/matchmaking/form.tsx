"use client";

import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
	const [likesPending, setLikesPending] = useState(false);
	const [passesPending, setPassesPending] = useState(false);

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
							defaultInterests: values.weightDefaultInterests,
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
					<div className="flex flex-col gap-4">
						<Button
							className="w-28"
							kind="secondary"
							size="sm"
							onClick={() => setExpanded((expanded) => !expanded)}
						>
							<div className="flex gap-1">
								{expanded ? (
									<>
										Less
										<ChevronUp />
									</>
								) : (
									<>
										More
										<ChevronDown />
									</>
								)}
							</div>
						</Button>
						{expanded && (
							<>
								<FormField name="monopoly">
									{(field) => (
										<InputSelect
											{...field.props}
											optional
											placeholder="Relationship type"
											options={ProfileMonopolyList.map((item) => ({
												id: item,
												name: ProfileMonopolyLabel[item]
											}))}
										/>
									)}
								</FormField>
								<div className="flex gap-4">
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="w-1/2"
												Icon={likesPending ? Loader2 : undefined}
												iconClassName="animate-spin h-5"
												size="sm"
											>
												Reset likes
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Are you sure?</AlertDialogTitle>
											</AlertDialogHeader>
											<AlertDialogDescription>
												This will permanently undo all likes and homies
												you&apos;ve sent. This won&apos;t affect your matches.
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
															setLikesPending(true);
															await api.matchmaking
																.resetLikes()
																.then(() => {
																	setLikesPending(false);
																	toasts.add("Likes reset");
																	return router.refresh();
																})
																.catch(toasts.addError);
														}}
													>
														Reset likes
													</Button>
												</AlertDialogAction>
											</DialogFooter>
										</AlertDialogContent>
									</AlertDialog>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												className="w-1/2"
												Icon={passesPending ? Loader2 : undefined}
												iconClassName="animate-spin h-5"
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
												This will permanently undo all profiles you&apos;ve
												passed on.
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
															await api.matchmaking
																.resetPasses()
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
								</div>
							</>
						)}
					</div>
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
