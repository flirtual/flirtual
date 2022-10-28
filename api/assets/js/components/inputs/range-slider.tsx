import React, { useCallback, useMemo } from "react";
import { twMerge } from "tailwind-merge";

import { clamp } from "~/utilities";

const RangeInput: React.FC<Omit<React.ComponentProps<"input">, "type">> = (props) => (
	<input
		{...props}
		type="range"
		className={twMerge(
			"focus:range-thumb:ring-brand-coral range-thumb:border-none focus:range-thumb:ring-2 focus:range-thumb:ring-offset-2 range-thumb:bg-brand-gradient range-thumb:pointer-events-auto range-thumb:w-6 range-thumb:h-6 range-thumb:shadow-brand-1 range-thumb:rounded-full absolute w-full bg-transparent appearance-none pointer-events-none focus:outline-none",
			props.className
		)}
	/>
);

export type RangeSliderValue = [min: number, max: number];

export interface RangeSliderProps {
	min?: number;
	max?: number;
	step?: number;
	value: RangeSliderValue;
	onChange: (value: RangeSliderValue) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = (props) => {
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
		([min, max]: RangeSliderValue) => {
			props.onChange.call(null, [clamp(min, limit.min, max), clamp(max, min, limit.max)]);
		},
		[limit, props.onChange]
	);

	return (
		<div className="relative flex items-center h-6">
			<div className="bg-brand-black shadow-brand-1 absolute w-full h-2 rounded-full" />
			<div
				className="bg-brand-gradient absolute h-2 rounded-full"
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
