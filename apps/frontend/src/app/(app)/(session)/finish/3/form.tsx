"use client";

import { type FC, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
	Brain,
	Dices,
	Gamepad2,
	HeartHandshake,
	MoonStar,
	MoveLeft,
	Music,
	Pencil,
	Search,
	Star,
	Tags,
	Trophy,
	User
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { filterBy, groupBy } from "~/utilities";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";
import { ButtonLink } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { Profile } from "~/api/user/profile";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";

export const Finish3Form: FC = (props) => {
	const { platform } = useDevice();
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	const interestCategories = useAttributes("interest-category");
	const interests = useAttributes("interest");

	const categorizedInterests = groupBy(interests, ({ category }) => category);

	const tAttribute = useAttributeTranslation();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				filter: "",
				defaultInterests: profile.attributes.interest || [],
				customInterests: profile.customInterests
			}}
			onSubmit={async ({ defaultInterests, customInterests }) => {
				await Profile.update(user.id, {
					customInterests,
					interestId: defaultInterests
				}).then(() => {
					toasts.add("Saved interests");
					return router.refresh();
				});
			}}
		>
			{({ FormField }) => (
				<>
					<InputLabel>
						Choose up to 10 interests. You can add your own custom interests at
						the bottom of the page.
					</InputLabel>
					<InputText
						Icon={Search}
						placeholder="Search interests..."
						onChange={setSearchTerm}
					/>
					{categories.map((category) => {
						const filteredInterests = filterInterests(
							categorizedInterests[category.name]!
						);
						if (filteredInterests.length === 0) return null;

						return (
							<FormField key={category.name} name="defaultInterests">
								{(field) => (
									<>
										<InputLabel className="flex flex-row items-center gap-2">
											{category.icon} {category.name}
										</InputLabel>
										<div className="flex flex-wrap gap-2">
											{filteredInterests.map((interest) => (
												<div
													key={interest.id}
													className={twMerge(
														"cursor-pointer select-none rounded-xl px-3 py-1 shadow-brand-1",
														field.props.value.includes(interest.id)
															? "bg-brand-gradient text-white-10"
															: "bg-white-30 text-black-70 hover:bg-white-40 vision:bg-white-30/70 dark:bg-black-60 dark:text-white-20 hover:dark:bg-black-50"
													)}
													onClick={() => {
														if (
															defaultCount + customCount >= 10 &&
															!field.props.value.includes(interest.id)
														)
															return toasts.add({
																type: "warning",
																value:
																	"You've reached the maximum of 10 interests"
															});

														const value = field.props.value.includes(
															interest.id
														)
															? field.props.value.filter(
																	(id) => id !== interest.id
																)
															: [...field.props.value, interest.id];
														field.props.onChange(value);
														setDefaultCount(value.length);
													}}
												>
													{highlightMatch(interest.name)}
												</div>
											))}
										</div>
									</>
								)}
							</FormField>
						);
					})}
					<FormField name="customInterests">
						{(field) => (
							<>
								<InputLabel
									className="flex flex-row items-center gap-2"
									hint="(optional)"
								>
									<Pencil /> Custom interests
								</InputLabel>
								<InputLabelHint className="-mt-2">
									Press {platform === "apple" ? "Return" : "Enter"}{" "}
									<small>⏎</small> after each interest
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									supportArbitrary
									dropdown={false}
									limit={10}
									placeholder="Type your custom interests..."
									options={field.props.value.map((interest) => ({
										key: interest,
										label: interest
									}))}
									onChange={(value) => {
										if (defaultCount + value.length > 10)
											return toasts.add({
												type: "warning",
												value: "You've reached the maximum of 10 interests"
											});

										value = value
											.map((interest) => interest.trim())
											.filter(
												(v, index, a) =>
													a.findIndex(
														(t) => t.toLowerCase() === v.toLowerCase()
													) === index
											);

										field.props.onChange(value);
										setCustomCount(value.length);
									}}
								/>
							</>
						)}
					</FormField>
					<div className="flex justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.finish(2)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>Back</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm" />
					</div>
					{defaultCount + customCount > 0 && (
						<div
							className="pointer-events-none fixed bottom-[max(calc(env(safe-area-inset-bottom,0rem)+7.5rem),8rem)] right-4 flex size-14 items-center justify-center rounded-full vision:bottom-14 desktop:bottom-4"
							style={{
								backgroundImage: `conic-gradient(var(--theme-1) ${
									((defaultCount + customCount) / 10) * 360
								}deg, transparent 0deg)`
							}}
						>
							<div className="flex size-12 flex-col items-center justify-center rounded-full bg-white-20 text-sm font-extrabold text-theme-1 dark:bg-black-70">
								{defaultCount + customCount}/10
							</div>
						</div>
					)}
				</>
			)}
		</Form>
	);
};
