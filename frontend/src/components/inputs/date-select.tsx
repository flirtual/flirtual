"use client";

import { useCallback, useState } from "react";

import { InputCalendar, InputCalendarProps } from "./calendar";
import { InputText } from "./text";

function toDateString(value: Date): string {
	return value.toLocaleDateString("en-CA");
}

function fromDateString(value: string): globalThis.Date {
	const [year, month, day] = value.split("-");
	return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
}

export type InputDateSelectProps = Pick<InputCalendarProps, "value" | "onChange">;

export const InputDateSelect: React.FC<InputDateSelectProps> = (props) => {
	const [inputValue, setInputValue] = useState(toDateString(props.value));

	const progressDate = useCallback(
		(type: number, direction: -1 | 1) => {
			const value = new globalThis.Date(
				props.value.getFullYear() + (type === 2 ? direction : 0),
				props.value.getMonth() + (type === 1 ? direction : 0),
				props.value.getDate() + (type === 0 ? direction : 0)
			);

			setInputValue(toDateString(value));
			props.onChange.call(null, value);
		},
		[props.value, props.onChange]
	);

	return (
		<div
			className="group relative"
			onBlur={() => {
				const value = fromDateString(inputValue);

				if (!Number.isNaN(value.getTime())) return;
				const now = new Date();

				setInputValue(toDateString(now));
				props.onChange(now);
			}}
		>
			<InputText
				className="w-full"
				type="date"
				value={inputValue}
				onChange={(value) => {
					const date = fromDateString(value);
					setInputValue(value);

					if (Number.isNaN(date.getTime())) return;
					props.onChange(date);
				}}
				onKeyDown={(event) => {
					const { currentTarget } = event;

					const type = [
						...inputValue.slice(currentTarget.selectionStart ?? 0, inputValue.length).matchAll(/-/g)
					].length;

					/**
					 * When an input field in changed, the input selection is
					 * reset to the end of the field, this function returns the selection
					 * to where it was prior to updating the input field on the next frame.
					 */
					const preserveSelection = () => {
						const { currentTarget } = event;
						const { selectionStart, selectionEnd } = currentTarget;

						setTimeout(() => currentTarget.setSelectionRange(selectionStart, selectionEnd), 0);
					};

					switch (event.key) {
						case "ArrowUp": {
							progressDate(type, 1);
							preserveSelection();

							event.preventDefault();
							return;
						}
						case "ArrowDown": {
							progressDate(type, -1);
							preserveSelection();

							event.preventDefault();
							return;
						}
					}
				}}
			/>
			<InputCalendar
				className="absolute z-10 mt-4 hidden group-focus-within:flex"
				value={props.value}
				onChange={(value) => {
					setInputValue(toDateString(value));
					props.onChange(value);
				}}
			/>
		</div>
	);
};
