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
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Dispatch, FC } from "react";
import { groupBy } from "remeda";
import { twMerge } from "tailwind-merge";

import { Profile } from "~/api/user/profile";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { Pill } from "~/components/profile/pill/pill";
import { useAttributes, useAttributeTranslation } from "~/hooks/use-attribute";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

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
					// eslint-disable-next-line react/no-array-index-key
					<span className="font-bold" key={`${part}-${index}`}>
						{part}
					</span>
				);
			})}
		</span>
	);
};

export const InterestSelectList: FC<{
	filter: string;
	selected: Array<string>;
	onSelected: Dispatch<Array<string>>;
	maximum: number;
}> = ({ filter, selected, onSelected, maximum }) => {
	const interestCategories = useAttributes("interest-category");
	const interests = useAttributes("interest");

	const categorizedInterests = groupBy(interests, ({ category }) => category);

	const tAttribute = useAttributeTranslation();

	return (
		<div className="flex flex-col gap-8">
			{interestCategories.map((categoryId) => {
				const { name: categoryName } = tAttribute[categoryId] || {
					name: categoryId
				};
				const categoryIcon = categoryIcons[categoryId];

				const filteredInterests = categorizedInterests[categoryId]
					?.filter((interest) => {
						if (!filter) return true;

						const interestName = tAttribute[interest.id]?.name || interest.id;
						return (
							interestName.toLowerCase().includes(filter.toLowerCase())
							|| interest.synonyms?.some((synonym) =>
								synonym.toLowerCase().includes(filter.toLowerCase())
							)
						);
					})
					.sort(({ id: a }, { id: b }) => {
						const aName = tAttribute[a]?.name || a;
						const bName = tAttribute[b]?.name || b;

						return aName.localeCompare(bName);
					});

				if (!filteredInterests || filteredInterests.length === 0) return null;

				return (
					<div className="flex flex-col gap-4" key={categoryId}>
						<InputLabel className="flex flex-row items-center gap-2">
							{categoryIcon}
							{" "}
							{categoryName}
						</InputLabel>
						<div className="flex flex-wrap gap-2">
							{filteredInterests.map(({ id: interestId }) => {
								const { name: interestName } = tAttribute[interestId] || {
									name: interestId
								};
								const active = selected.includes(interestId);

								return (
									<Pill
										className={twMerge(
											"data-[active]:bg-brand-gradient",
											!active && selected.length >= maximum
												? "cursor-default opacity-50"
												: "hover:bg-white-40 data-[active]:text-white-10 hover:dark:bg-black-50"
										)}
										active={active}
										hocusable={false}
										key={interestId}
										onClick={() =>
											onSelected(
												active
													? selected.filter((id) => id !== interestId)
													: [...selected, interestId]
											)}
									>
										<HighlightedText snippet={filter}>
											{interestName}
										</HighlightedText>
									</Pill>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export const InterestSelectCustomInput: FC<{
	value: Array<string>;
	onChange: Dispatch<Array<string>>;
}> = ({ value, onChange }) => {
	const { platform } = useDevice();
	const t = useTranslations();

	return (
		<>
			<InputLabel
				className="flex flex-row items-center gap-2"
				hint={t("optional")}
			>
				<Pencil />
				{" "}
				{t("custom_interests")}
			</InputLabel>
			<InputLabelHint className="-mt-2">
				{t.rich(platform === "apple" ? "wide_shy_loris_gleam" : "born_game_pony_empower", {
					small: (children) => <small>{children}</small>
				})}
			</InputLabelHint>
			<InputAutocomplete
				supportArbitrary
				options={value.map((interest) => ({
					key: interest,
					label: interest
				}))}
				dropdown={false}
				limit={10}
				placeholder={t("type_your_custom_interests")}
				value={value}
				onChange={(value) =>
					onChange(
						value
							.map((interest) => interest.trim())
							.filter(
								(v, index, a) =>
									a.findIndex((t) => t.toLowerCase() === v.toLowerCase())
									=== index
							)
					)}
			/>
		</>
	);
};

export const InterestSelectCount: FC<{ current: number; maximum: number; className?: string }> = ({
	current,
	maximum,
	className
}) => {
	if (current === 0) return null;

	return (
		<div
			style={{
				backgroundImage: `conic-gradient(var(--theme-1) ${(current / maximum) * 360
				}deg, transparent 0deg)`
			}}
			className={twMerge("pointer-events-none fixed bottom-[max(calc(var(--safe-area-inset-bottom,0rem)+4.5rem),5.5rem)] right-4 flex size-14 items-center justify-center rounded-full vision:bottom-4 desktop:bottom-4", className)}
		>
			<div className="flex size-12 flex-col items-center justify-center rounded-full bg-white-20 text-sm font-extrabold text-theme-1 dark:bg-black-70">
				{current}
				/
				{maximum}
			</div>
		</div>
	);
};

// eslint-disable-next-line react-refresh/only-export-components
export const maximumInterests = 10;

export const InterestsForm: FC = () => {
	const [session] = useOptionalSession();
	const toasts = useToast();
	const router = useRouter();
	const t = useTranslations();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			fields={{
				filter: "",
				defaultInterests: profile.attributes.interest || [],
				customInterests: profile.customInterests
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ defaultInterests, customInterests }) => {
				await Profile.update(user.id, {
					customInterests,
					interestId: defaultInterests
				}).then(() => {
					toasts.add(t("bad_tangy_lynx_tend"));
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
				const totalInterests
					= defaultInterests.props.value.length
						+ customInterests.props.value.length;

				return (
					<>
						<InputLabel>{t("chunky_weak_tadpole_relish")}</InputLabel>
						<FormField name="filter">
							{(field) => (
								<InputText
									{...field.props}
									Icon={Search}
									placeholder={t("search_interests")}
								/>
							)}
						</FormField>
						<FormField name="defaultInterests">
							{({ props: { value, onChange } }) => (
								<InterestSelectList
									maximum={
										maximumInterests - customInterests.props.value.length
									}
									filter={filter}
									selected={value}
									onSelected={(newValues) => {
										if (
											totalInterests >= maximumInterests
											&& newValues.length >= value.length
										)
											return toasts.add({
												type: "warning",
												value: t("inclusive_silly_ibex_succeed")
											});

										onChange(newValues);
									}}
								/>
							)}
						</FormField>
						<FormField name="customInterests">
							{({ props: { value, onChange } }) => (
								<InterestSelectCustomInput
									value={value}
									onChange={(newValues) => {
										if (
											totalInterests >= maximumInterests
											&& newValues.length >= value.length
										)
											return toasts.add({
												type: "warning",
												value: t("inclusive_silly_ibex_succeed")
											});

										onChange(newValues);
									}}
								/>
							)}
						</FormField>
						<FormButton>{t("update")}</FormButton>
						<InterestSelectCount
							current={totalInterests}
							maximum={maximumInterests}
						/>
					</>
				);
			}}
		</Form>
	);
};
