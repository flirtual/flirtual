import { DatetimePicker, ErrorCode } from "@capawesome-team/capacitor-datetime-picker";
import { useCallback, useRef, useState } from "react";

import { useDevice } from "~/hooks/use-device";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";
import { useMutation } from "~/query";

import { Popover, PopoverAnchor, PopoverContent } from "../popover";
import { InputCalendar } from "./calendar";
import type { InputCalendarProps, MinmaxDate } from "./calendar";
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

export type InputDateSelectProps = {
	disabled?: boolean;
	onDisabledClick?: () => void;
} & Pick<
	InputCalendarProps,
	"max" | "min" | "onChange" | "value"
>;

export const InputDateSelect: React.FC<InputDateSelectProps> = (props) => {
	const { native } = useDevice();

	const [inputValue, setInputValue] = useState(() => toDateString(props.value));
	const [drawerVisible, setDrawerVisible] = useState(false);

	const reference = useRef<HTMLDivElement>(null);

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
		<Popover open={drawerVisible && !props.disabled} onOpenChange={setDrawerVisible}>
			<PopoverAnchor ref={reference}>
				<div className={props.disabled ? "[&_input]:pointer-events-none" : undefined} onClick={() => props.disabled && props.onDisabledClick?.()}>
					<InputText
						className="w-full"
						disabled={props.disabled}
						type="date"
						value={inputValue}
						onBlur={() => {
							if (props.disabled) return;
							const value = fromDateString(inputValue);

							if (!Number.isNaN(value.getTime())) return;
							const now = new Date();

							setInputValue(toDateString(now));
							props.onChange(now);
						}}
						onChange={(value) => {
							if (props.disabled) return;
							setDrawerVisible(true);

							const date = fromDateString(value);
							setInputValue(value);

							if (Number.isNaN(date.getTime())) return;
							props.onChange(date);
						}}
						onClick={() => !props.disabled && setDrawerVisible(true)}
						onFocus={() => !props.disabled && setDrawerVisible(true)}
						onKeyDown={(event) => {
							if (props.disabled) return;
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
				</div>
			</PopoverAnchor>
			<PopoverContent
				align="start"
				onInteractOutside={(event) => {
					if (reference.current?.contains(event.target as Node)) {
						event.preventDefault();
					}
				}}
				onOpenAutoFocus={(event) => event.preventDefault()}
			>
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
			</PopoverContent>
		</Popover>
	);
};

interface InputDateSelectNativeProps {
	value: Date;
	onChange: (value: Date) => void;
	min?: MinmaxDate;
	max?: MinmaxDate;
	disabled?: boolean;
	onDisabledClick?: () => void;
}

const InputDateSelectNative: React.FC<InputDateSelectNativeProps> = ({
	value,
	onChange,
	min,
	max,
	disabled,
	onDisabledClick
}) => {
	const [selectedDate, setSelectedDate] = useState(value);
	const [theme] = useTheme();

	const toast = useToast();

	const { mutate } = useMutation({
		mutationKey: ["date-picker"],
		mutationFn: async () => DatetimePicker.present({
			mode: "date",
			locale: "en-US",
			value: selectedDate.toISOString(),
			theme,
			min:
					min && (min === "now" ? new Date().toISOString() : min.toISOString()),
			max:
					max && (max === "now" ? new Date().toISOString() : max.toISOString())
		}),
		onSuccess: ({ value }) => {
			const newDate = new Date(value);

			setSelectedDate(newDate);
			onChange(newDate);
		},
		onError: (error) => {
			if ("code" in error && typeof error.code === "string" && [ErrorCode.canceled, ErrorCode.dismissed].includes(error.code))
				return;

			toast.addError(error);
		}
	});

	return (
		<div className={disabled ? "[&_input]:pointer-events-none" : undefined} onClick={() => disabled && onDisabledClick?.()}>
			<InputText
				readOnly
				className="w-full"
				disabled={disabled}
				type="date"
				value={selectedDate.toLocaleDateString(undefined, { weekday: undefined })}
				onClick={() => !disabled && mutate()}
			/>
		</div>
	);
};

export default InputDateSelectNative;
