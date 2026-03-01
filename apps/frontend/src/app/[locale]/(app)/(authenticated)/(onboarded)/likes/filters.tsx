import type { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import type { LikesYouGenderFilter, ProspectKind } from "~/api/matchmaking";
import { HeartIcon } from "~/components/icons/gradient/heart";
import { PeaceIcon } from "~/components/icons/gradient/peace";
import { useAttributeTranslation } from "~/hooks/use-attribute";

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
				: "text-black-70 hocus:bg-white-40 dark:text-white-20 dark:hocus:bg-black-50"
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
			"flex h-11 flex-1 shrink-0 overflow-hidden rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60 desktop:flex-none",
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
	const tAttribute = useAttributeTranslation("gender");

	return (
		<div className="grid grid-cols-3 flex-wrap gap-2 desktop:flex">
			<FilterGroup
				options={[
					{ key: "love", label: <HeartIcon className="h-5" gradient={false} /> },
					{ key: "friend", label: <PeaceIcon className="h-5" gradient={false} /> }
				]}
				value={kind}
				onChange={onKindChange}
			/>
			<FilterGroup
				options={[
					{ key: "woman", label: tAttribute.tpkW7r8PZ2RUuYGUSYi82N?.plural ?? "Women" },
					{ key: "man", label: tAttribute.rhw3rcbheU7vc9vcSy6W6V?.plural ?? "Men" },
					{ key: "other", label: tAttribute.jAL62ePbibxaG4FPu7S8LG?.name ?? "Other" }
				]}
				className="col-span-2"
				value={gender}
				onChange={onGenderChange}
			/>
		</div>
	);
};
