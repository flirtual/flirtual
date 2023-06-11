"use client";

import { useCallback, useState } from "react";

import { DrawerOrPopover } from "../drawer-or-popover";

import { InputCalendar, InputCalendarProps } from "./calendar";
import { InputText } from "./text";

function toDateString(value: Date): string {
	const day = String(value.getDate()).padStart(2, "0"),
		month = String(value.getMonth() + 1).padStart(2, "0"),
		year = String(value.getFullYear()).padStart(4, "0");

	return `${month}/${day}/${year}`;
}

function fromDateString(value: string): globalThis.Date {
	const values = value.split("/");

	const month = Number.parseInt(values[0]) - 1,
		day = Number.parseInt(values[1]),
		year = Number.parseInt(values[2]);

	return new Date(year, month, day);
}

export type InputDateSelectProps = Pick<
	InputCalendarProps,
	"value" | "onChange" | "min" | "max"
>;

export const InputDateSelect: React.FC<InputDateSelectProps> = (props) => {
	const [inputValue, setInputValue] = useState(toDateString(props.value));
	const [drawerVisible, setDrawerVisible] = useState(false);

	const progressDate = useCallback(
		(type: number, direction: -1 | 1) => {
			const value = new globalThis.Date(
				props.value.getFullYear() + (type === 0 ? direction : 0),
				props.value.getMonth() + (type === 1 ? direction : 0),
				props.value.getDate() + (type === 2 ? direction : 0)
			);

			setInputValue(toDateString(value));
			props.onChange.call(null, value);
		},
		[props.value, props.onChange]
	);

	return (
		<DrawerOrPopover
			visible={drawerVisible}
			onVisibilityChange={setDrawerVisible}
		>
			<div className="flex h-full w-full justify-center">
				<InputCalendar
					className="w-fit sm:shadow-brand-1"
					{...props}
					value={props.value}
					onChange={(value) => {
						setInputValue(toDateString(value));
						props.onChange(value);
					}}
					onDateClick={() => {
						setDrawerVisible(false);
					}}
				/>
			</div>
			<InputText
				className="w-full"
				type="date"
				value={inputValue}
				onClick={() => setDrawerVisible(true)}
				onFocus={() => setDrawerVisible(true)}
				onBlur={() => {
					const value = fromDateString(inputValue);

					if (!Number.isNaN(value.getTime())) return;
					const now = new Date();

					setInputValue(toDateString(now));
					props.onChange(now);
				}}
				onChange={(value) => {
					setDrawerVisible(true);

					const date = fromDateString(value);
					setInputValue(value);

					if (Number.isNaN(date.getTime())) return;
					props.onChange(date);
				}}
				onKeyDown={(event) => {
					const { currentTarget } = event;

					const type = [
						...inputValue
							.slice(currentTarget.selectionStart ?? 0, inputValue.length)
							.matchAll(/\//g)
					].length;

					/**
					 * When an input field in changed, the input selection is
					 * reset to the end of the field, this function returns the selection
					 * to where it was prior to updating the input field on the next frame.
					 */
					const preserveSelection = () => {
						const { currentTarget } = event;
						const { selectionStart, selectionEnd } = currentTarget;

						setTimeout(
							() =>
								currentTarget.setSelectionRange(selectionStart, selectionEnd),
							0
						);
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
		</DrawerOrPopover>
	);
};
