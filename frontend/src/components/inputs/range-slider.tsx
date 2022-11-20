"use client";

import React, { useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { clamp } from "~/utilities";

const RangeInput: React.FC<Omit<React.ComponentProps<"input">, "type">> = (props) => (
	<input
		{...props}
		type="range"
		className={twMerge(
			"pointer-events-none absolute w-full appearance-none bg-transparent focus:outline-none range-thumb:pointer-events-auto range-thumb:h-6 range-thumb:w-6 range-thumb:rounded-full range-thumb:border-none range-thumb:bg-brand-gradient range-thumb:shadow-brand-1 focus:range-thumb:ring-2 focus:range-thumb:ring-coral focus:range-thumb:ring-offset-2 focus:range-thumb:ring-offset-white-20 focus:range-thumb:dark:ring-offset-black-50",
			props.className
		)}
	/>
);

export type InputRangeSliderValue = [min: number, max: number];

export interface InputRangeSliderProps {
	min?: number;
	max?: number;
	step?: number;
	value: InputRangeSliderValue;
	onChange: React.Dispatch<InputRangeSliderValue>;
}

export const InputRangeSlider: React.FC<InputRangeSliderProps> = (props) => {
	const step = props.step ?? 1;

	const limit = useMemo(() => {
		const min = props.min ?? 0;
		const max = props.max ?? 100;
		const diff = max - min;

		return {
			min,
			max,
			diff
		};
	}, [props.min, props.max]);

	const min = props.value[0];
	const max = props.value[1];

	const onChange = useCallback(
		([min, max]: InputRangeSliderValue) => {
			props.onChange.call(null, [clamp(min, limit.min, max), clamp(max, min, limit.max)]);
		},
		[limit, props.onChange]
	);

	return (
		<div className="relative flex h-6 shrink-0 items-center">
			<div className="absolute h-2 w-full rounded-full bg-black-50 shadow-brand-1 dark:bg-black-60" />
			<div
				className="absolute h-2 rounded-full bg-brand-gradient"
				style={{
					marginLeft: `${((min - limit.min) / limit.diff) * 100}%`,
					width: `${((max - min) / limit.diff) * 100}%`
				}}
			/>
			<RangeInput
				max={limit.max}
				min={limit.min}
				step={step}
				value={min}
				onInput={({ currentTarget }) => {
					onChange([currentTarget.valueAsNumber, props.value[1]]);
				}}
			/>
			<RangeInput
				max={limit.max}
				min={limit.min}
				step={step}
				value={max}
				onInput={({ currentTarget }) => {
					onChange([props.value[0], currentTarget.valueAsNumber]);
				}}
			/>
		</div>
	);
};
