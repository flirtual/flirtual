"use client";

import {
	Brain,
	Dices,
	Gamepad2,
	HeartHandshake,
	MoonStar,
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
import { groupBy } from "~/utilities";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useDevice } from "~/hooks/use-device";
import { Profile } from "~/api/user/profile";
import {
	useAttributeList,
	useAttributeTranslation
} from "~/hooks/use-attribute-list";
import { Pill } from "~/components/profile/pill/pill";

import type { FC } from "react";

const categoryIcons: Record<string, React.ReactNode> = {
	iiCe39JvGQAAtsrTqnLddb: <Star />,
	TgrEr2C6DAcp69Winej5Q4: <Tags />,
	aSCFm5P7awrqNKnknWuChQ: <User />,
	"59oWHt4bZSdQ6tj8f4CWs9": <Gamepad2 />,
	fQK3RUCYFW4WeSfLkzVP42: <Music />,
	DAweztCvdXBa5cKvhgNsPY: <Trophy />,
	"9os9Yxxr6zGR4k7kh5BKrB": <HeartHandshake />,
	nFiqbX3n6aiEdKe3JbynBL: <MoonStar />,
	"43i5J3VsKCvU4HGRJHjehn": <Brain />,
	hR3X5w26ba6M98fVB2kVxX: <Dices />,
	tmQbiXNw7d9Ys2DG9Ddg28: <Star />
};

const HighlightedText: FC<{ children: string; snippet: string }> = ({
	children,
	snippet
}) => {
	const parts = children.split(new RegExp(`(${snippet})`, "gi"));
	if (!snippet || parts.length === 1) return children;

	return (
		<span>
			{parts.map((part, index) => {
				if (part.toLowerCase() !== snippet.toLowerCase()) return part;
				return (
					<span className="font-bold" key={index}>
						{part}
					</span>
				);
			})}
		</span>
	);
};

export const InterestsForm: FC = () => {
	const { platform } = useDevice();
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	const interestCategories = useAttributeList("interest-category");
	const interests = useAttributeList("interest");

	const categorizedInterests = groupBy(interests, ({ category }) => category);

	const tAttribute = useAttributeTranslation();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				filter: "",
				defaultInterests: profile.attributes.interest,
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
			{({
				FormField,
				fields: {
					filter: {
						props: { value: filter }
					},
					defaultInterests,
					customInterests
				}
			}) => {
				const defaultCount = defaultInterests.props.value.length;
				const customCount = customInterests.props.value.length;

				return (
					<>
						<InputLabel>
							Choose up to 10 interests. You can add your own custom interests
							at the bottom of the page.
						</InputLabel>
						<FormField name="filter">
							{(field) => (
								<InputText
									{...field.props}
									Icon={Search}
									placeholder="Search interests..."
								/>
							)}
						</FormField>
						{interestCategories.map((categoryId) => {
							const { name: categoryName } = tAttribute[categoryId] || {
								name: categoryId
							};
							const categoryIcon = categoryIcons[categoryId];

							const filteredInterests = categorizedInterests[categoryId]
								?.filter((interest) => {
									if (!filter) return true;

									const interestName =
										tAttribute[interest.id]?.name || interest.id;
									return (
										interestName.toLowerCase().includes(filter.toLowerCase()) ||
										interest.synonyms?.some((synonym) =>
											synonym.toLowerCase().includes(filter.toLowerCase())
										)
									);
								})
								.sort(({ id: a }, { id: b }) => {
									const aName = tAttribute[a]?.name || a;
									const bName = tAttribute[b]?.name || b;

									return aName.localeCompare(bName);
								});

							if (!filteredInterests || filteredInterests.length === 0)
								return null;

							return (
								<FormField key={categoryId} name="defaultInterests">
									{(field) => (
										<>
											<InputLabel className="flex flex-row items-center gap-2">
												{categoryIcon} {categoryName}
											</InputLabel>
											<div className="flex flex-wrap gap-2">
												{filteredInterests.map(({ id: interestId }) => {
													const { name: interestName } = tAttribute[
														interestId
													] || { name: interestId };
													const active = field.props.value.includes(interestId);

													return (
														<Pill
															key={interestId}
															active={active}
															hocusable={false}
															className="hover:bg-white-40 data-[active]:bg-brand-gradient data-[active]:text-white-10 hover:dark:bg-black-50"
															onClick={() => {
																if (defaultCount + customCount >= 10 && !active)
																	return toasts.add({
																		type: "warning",
																		value:
																			"You've reached the maximum of 10 interests"
																	});

																const value = active
																	? field.props.value.filter(
																			(id) => id !== interestId
																		)
																	: [...field.props.value, interestId];
																field.props.onChange(value);
															}}
														>
															<HighlightedText snippet={filter}>
																{interestName}
															</HighlightedText>
														</Pill>
													);
												})}
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
										}}
									/>
								</>
							)}
						</FormField>
						<FormButton>Update</FormButton>
						{defaultCount + customCount > 0 && (
							<div
								className="pointer-events-none fixed bottom-[max(calc(env(safe-area-inset-bottom,0rem)+4.5rem),5.5rem)] right-4 flex size-14 items-center justify-center rounded-full vision:bottom-4 desktop:bottom-4"
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
				);
			}}
		</Form>
	);
};
