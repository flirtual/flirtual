"use client";

import React, { useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { clamp } from "~/utilities";

export const SliderInputInner: React.FC<
	Omit<React.ComponentProps<"input">, "type">
> = (props) => (
	<input
		{...props}
		type="range"
		className={twMerge(
			"absolute w-full appearance-none bg-transparent focus:outline-none range-thumb:pointer-events-auto range-thumb:rounded-full range-thumb:border-none range-thumb:shadow-brand-1 focus:range-thumb:ring-2 focus:range-thumb:ring-theme-1 focus:range-thumb:ring-offset-2 focus:range-thumb:ring-offset-white-20",
			props.disabled
				? "range-thumb:h-4 range-thumb:w-4 range-thumb:bg-black-40"
				: "range-thumb:h-6  range-thumb:w-6 range-thumb:bg-brand-gradient focus:range-thumb:dark:ring-offset-black-50",
			props.className
		)}
	/>
);

export interface InputSliderProps {
	min?: number;
	max?: number;
	step?: number;
	value: number;
	disabled?: boolean;
	onChange: React.Dispatch<number>;
}

export const InputSlider: React.FC<InputSliderProps> = (props) => {
	const { disabled = false } = props;
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

	const onChange = useCallback(
		(value: number) => {
			props.onChange.call(null, clamp(value, limit.min, limit.max));
		},
		[limit, props.onChange]
	);

	return (
		<div className="relative flex h-6 shrink-0 items-center">
			<div className="absolute h-2 w-full rounded-full bg-black-50 shadow-brand-1" />
			<div
				className={twMerge(
					"absolute h-2 rounded-full",
					disabled ? "bg-black-30" : "bg-brand-gradient"
				)}
				style={{
					width: `${((props.value - limit.min) / limit.diff) * 100}%`
				}}
			/>
			<SliderInputInner
				disabled={disabled}
				max={limit.max}
				min={limit.min}
				step={step}
				value={props.value}
				onInput={({ currentTarget }) => {
					onChange(currentTarget.valueAsNumber);
				}}
			/>
		</div>
	);
};
