"use client";

import React, { useCallback, useMemo } from "react";

import { SliderInputInner } from "./slider";

import { clamp } from "~/utilities";

export type InputRangeSliderValue = [min: number, max: number];

export interface InputRangeSliderProps {
	min?: number;
	max?: number;
	step?: number;
	value: InputRangeSliderValue;
	disabled?: boolean;
	onChange: React.Dispatch<InputRangeSliderValue>;
}

export const InputRangeSlider: React.FC<InputRangeSliderProps> = (props) => {
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

	const min = props.value[0];
	const max = props.value[1];

	const onChange = useCallback(
		([min, max]: InputRangeSliderValue) => {
			props.onChange.call(null, [
				clamp(min, limit.min, max),
				clamp(max, min, limit.max)
			]);
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
			<SliderInputInner
				className="pointer-events-none"
				disabled={disabled}
				max={limit.max}
				min={limit.min}
				step={step}
				value={min}
				onInput={({ currentTarget }) => {
					onChange([currentTarget.valueAsNumber, props.value[1]]);
				}}
			/>
			<SliderInputInner
				className="pointer-events-none"
				disabled={disabled}
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
