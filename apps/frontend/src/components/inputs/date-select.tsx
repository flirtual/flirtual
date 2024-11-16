/* eslint-disable react/prefer-destructuring-assignment */
"use client";

import { DatetimePicker } from "@capawesome-team/capacitor-datetime-picker";
import { useCallback, useState } from "react";

import { useDevice } from "~/hooks/use-device";
import { useTheme } from "~/hooks/use-theme";
import { resolveTheme } from "~/theme";

import { Popover } from "../popover";
import {
	InputCalendar,
	type InputCalendarProps,
	type MinmaxDate
} from "./calendar";
import { InputText } from "./text";

/**
 * Both `toDateString` and `fromDateString` are horribly broken on different locale settings.
 * We should use proper date formatting libraries to handle this.
 */
function toDateString(value: Date): string {
	const day = String(value.getDate()).padStart(2, "0");
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const year = String(value.getFullYear()).padStart(4, "0");

	return `${month}/${day}/${year}`;
}

function fromDateString(value: string): globalThis.Date {
	const values = value.split("/");

	const month = Number.parseInt(values[0]!) - 1;
	const day = Number.parseInt(values[1]!);
	const year = Number.parseInt(values[2]!);

	return new Date(year, month, day);
}

export type InputDateSelectProps = Pick<
	InputCalendarProps,
	"max" | "min" | "onChange" | "value"
>;

export const InputDateSelect: React.FC<InputDateSelectProps> = (props) => {
	const { native } = useDevice();

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

	if (native) return <InputDateSelectNative {...props} />;

	return (
		<Popover open={drawerVisible} onOpenChange={setDrawerVisible}>
			<div className="flex size-full justify-center">
				<InputCalendar
					className="w-fit shadow-brand-1"
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
				onClick={() => setDrawerVisible(true)}
				onFocus={() => setDrawerVisible(true)}
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
						}
					}
				}}
			/>
		</Popover>
	);
};

interface InputDateSelectNativeProps {
	value: Date;
	onChange: (value: Date) => void;
	min?: MinmaxDate;
	max?: MinmaxDate;
}

const InputDateSelectNative: React.FC<InputDateSelectNativeProps> = ({
	value,
	onChange,
	min,
	max
}) => {
	const [selectedDate, setSelectedDate] = useState(value);
	const { sessionTheme } = useTheme();

	const openDatePicker = async () => {
		try {
			const date = await DatetimePicker.present({
				mode: "date",
				locale: "en-US",
				value: selectedDate.toISOString(),
				theme: resolveTheme(sessionTheme),
				min:
					min && (min === "now" ? new Date().toISOString() : min.toISOString()),
				max:
					max && (max === "now" ? new Date().toISOString() : max.toISOString())
			});

			if (date.value) {
				const newDate = new Date(date.value);
				setSelectedDate(newDate);
				onChange(newDate);
			}
		}
		catch (reason) {
			console.error("Failed to open date picker", reason);
		}
	};

	return (
		<InputText
			readOnly
			className="w-full"
			type="date"
			value={selectedDate.toLocaleDateString(undefined, { weekday: undefined })}
			onClick={openDatePicker}
			onFocus={openDatePicker}
		/>
	);
};

export default InputDateSelectNative;
