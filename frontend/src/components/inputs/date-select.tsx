"use client";

import { useCallback, useState } from "react";

import { DrawerOrPopover } from "../drawer-or-popover";

import { InputCalendar, InputCalendarProps } from "./calendar";
import { InputText } from "./text";

function toDateString(value: Date): string {
	const day = String(value.getDate()).padStart(2, "0"),
		month = String(value.getMonth() + 1).padStart(2, "0"),
		year = String(value.getFullYear());

	return `${day}/${month}/${year}`;
}

function fromDateString(value: string): globalThis.Date {
	const [year, month, day] = value.split("/");
	return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
}

export type InputDateSelectProps = Pick<InputCalendarProps, "value" | "onChange">;

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
		<DrawerOrPopover visible={drawerVisible} onVisibilityChange={setDrawerVisible}>
			<div className="flex h-full w-full justify-center">
				<InputCalendar
					className="w-fit sm:shadow-brand-1"
					value={props.value}
					onChange={(value) => {
						setInputValue(toDateString(value));
						props.onChange(value);
					}}
				/>
			</div>
			<InputText
				className="sm w-full"
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
		</DrawerOrPopover>
	);
};
