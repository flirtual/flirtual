import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import { byId, gendersOptions } from "~/api/data";
import type { LikesYouGenderFilter, ProspectKind } from "~/api/matchmaking";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { homieMode } from "~/features";
import { useLocale } from "~/i18n";

interface FilterButtonProps {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}

const FilterButton: FC<FilterButtonProps> = ({ active, onClick, children }) => (
	<button
		className={twMerge(
			"flex size-full items-center justify-center px-3 transition-colors first:pl-4 last:pr-4 desktop:w-auto",
			active
				? "bg-brand-gradient text-white-20"
				: "text-black-70 dark:text-white-20 hocus:bg-white-40 dark:hocus:bg-black-50"
		)}
		type="button"
		onClick={onClick}
	>
		{children}
	</button>
);

interface FilterGroupProps<T extends string> {
	value: T | undefined;
	onChange: (value: T | undefined) => void;
	options: Array<{ key: T; label: ReactNode }>;
	className?: string;
}

function FilterGroup<T extends string>({ value, onChange, options, className }: FilterGroupProps<T>) {
	return (
		<div className={twMerge(
			"flex h-11 flex-1 shrink-0 overflow-hidden rounded-xl bg-white-30 shadow-brand-1 dark:bg-black-60 vision:bg-white-30/70 desktop:flex-none",
			className
		)}
		>
			{options.map((option) => (
				<FilterButton
					key={option.key}
					active={value === option.key}
					onClick={() => onChange(value === option.key ? undefined : option.key)}
				>
					{option.label}
				</FilterButton>
			))}
		</div>
	);
}

export interface LikesFiltersProps {
	kind: ProspectKind | undefined;
	gender: LikesYouGenderFilter | undefined;
	onKindChange: (kind: ProspectKind | undefined) => void;
	onGenderChange: (gender: LikesYouGenderFilter | undefined) => void;
}

export const LikesFilters: FC<LikesFiltersProps> = ({
	kind,
	gender,
	onKindChange,
	onGenderChange
}) => {
	const [locale] = useLocale();
	const { data: genders } = useSuspenseQuery({ ...gendersOptions({ locale }), select: byId });

	return (
		<div className="grid grid-cols-3 flex-wrap gap-2 desktop:flex">
			{homieMode && (
				<FilterGroup
					options={[
						{ key: "love", label: <HeartIcon className="h-5" gradient={false} /> },
						{ key: "friend", label: <PeaceIcon className="h-5" gradient={false} /> }
					]}
					value={kind}
					onChange={onKindChange}
				/>
			)}
			<FilterGroup
				options={[
					{ key: "woman", label: genders.woman?.plural ?? "Women" },
					{ key: "man", label: genders.man?.plural ?? "Men" },
					{ key: "other", label: genders.other?.name ?? "Other" }
				]}
				className={homieMode ? "col-span-2" : "col-span-3"}
				value={gender}
				onChange={onGenderChange}
			/>
		</div>
	);
};
