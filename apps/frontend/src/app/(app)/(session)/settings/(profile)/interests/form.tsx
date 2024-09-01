"use client";

import { type FC, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
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

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { filterBy } from "~/utilities";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useDevice } from "~/hooks/use-device";

import type { AttributeCollection } from "~/api/attributes";

export interface InterestsFormProps {
	interests: AttributeCollection<"interest">;
}

export const InterestsForm: FC<InterestsFormProps> = (props) => {
	const { interests } = props;

	const { platform } = useDevice();
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();

	const [searchTerm, setSearchTerm] = useState("");
	const [defaultCount, setDefaultCount] = useState(0);
	const [customCount, setCustomCount] = useState(0);

	useEffect(() => {
		if (!session) return;
		setDefaultCount(
			filterBy(session?.user.profile.attributes, "type", "interest").length
		);
		setCustomCount(session?.user.profile.customInterests.length ?? 0);
	}, [session]);

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	const sortInterests = (interests: AttributeCollection<"interest">) => {
		return interests.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
		);
	};

	const filterInterests = (interests: AttributeCollection<"interest">) => {
		return interests.filter(
			(interest) =>
				interest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				interest.metadata.synonyms?.some((synonym) =>
					synonym.toLowerCase().includes(searchTerm.toLowerCase())
				)
		);
	};

	const highlightMatch = (text: string) => {
		if (!searchTerm) return text;
		const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
		return parts.map((part, index) =>
			part.toLowerCase() === searchTerm.toLowerCase() ? (
				<span className="text-pink" key={index}>
					{part}
				</span>
			) : (
				part
			)
		);
	};

	const categories = [
		{ name: "Popular", icon: <Star /> },
		{ name: "General", icon: <Tags /> },
		{ name: "Identity", icon: <User /> },
		{ name: "Games", icon: <Gamepad2 /> },
		{ name: "Music", icon: <Music /> },
		{ name: "Sports", icon: <Trophy /> },
		{ name: "Love languages", icon: <HeartHandshake /> },
		{ name: "Astrology", icon: <MoonStar /> },
		{ name: "Personality types", icon: <Brain /> },
		{ name: "Alignment", icon: <Dices /> }
	];

	const categorizedInterests: Record<
		string,
		AttributeCollection<"interest">
	> = {};

	const gameGenres = sortInterests(
		interests.filter(
			(interest) => interest.metadata?.category === "Game genres"
		)
	);
	const games = sortInterests(
		interests.filter((interest) => interest.metadata?.category === "Games")
	);
	categorizedInterests["Games"] = [...gameGenres, ...games];

	for (const category of categories) {
		if (category.name !== "Games")
			categorizedInterests[category.name] = sortInterests(
				interests.filter(
					(interest) => interest.metadata?.category === category.name
				)
			);
	}

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				defaultInterests: filterBy(profile.attributes, "type", "interest").map(
					({ id }) => id
				),
				customInterests: profile.customInterests
			}}
			onSubmit={async ({ defaultInterests, customInterests }) => {
				await api.user.profile
					.update(user.id, {
						body: {
							customInterests,
							interestId: defaultInterests
						}
					})
					.then(() => {
						toasts.add("Saved interests");
						return router.refresh();
					})
					.catch(toasts.addError);
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
			)}
		</Form>
	);
};
