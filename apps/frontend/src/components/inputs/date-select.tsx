import { DatetimePicker, ErrorCode } from "@capawesome-team/capacitor-datetime-picker";
import { useCallback, useRef, useState } from "react";

import { useBreakpoint } from "~/hooks/use-breakpoint";
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
	const desktop = useBreakpoint("desktop");

	const [inputValue, setInputValue] = useState(() => toDateString(props.value));
	const [drawerVisible, setDrawerVisible] = useState(false);

	const reference = useRef<HTMLDivElement>(null);
	const calendarReference = useRef<HTMLDivElement>(null);

	// Whether the calendar was opened by pressing the field: the calendar is
	// focused instead of the field, so the keyboard doesn't pop up on mobile.
	const openedByPointerReference = useRef(false);
	const suppressClickReference = useRef(false);
	const restoringFocusReference = useRef(false);

	const openDrawer = () => {
		// On mobile, scroll the field to the top so the calendar fits below.
		if (!desktop && !drawerVisible)
			reference.current?.scrollIntoView({ block: "start" });

		setDrawerVisible(true);
	};

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

	const inputField = (
		<InputText
			className="w-full"
			disabled={props.disabled}
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
				openDrawer();

				const date = fromDateString(value);
				setInputValue(value);

				if (Number.isNaN(date.getTime())) return;
				props.onChange(date);
			}}
			onClick={() => openDrawer()}
			onFocus={() => {
				if (restoringFocusReference.current) {
					restoringFocusReference.current = false;
					return;
				}

				openDrawer();
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
					}
				}
			}}
		/>
	);

	if (props.disabled) {
		return (
			<div className="[&_input]:pointer-events-none" onClick={() => props.onDisabledClick?.()}>
				{inputField}
			</div>
		);
	}

	return (
		<Popover open={drawerVisible} onOpenChange={setDrawerVisible}>
			<PopoverAnchor
				className="scroll-mt-28"
				ref={reference}
				onClickCapture={(event) => {
					if (!suppressClickReference.current) return;
					suppressClickReference.current = false;

					// The field would focus itself on click; the calendar has focus.
					event.preventDefault();
					event.stopPropagation();
				}}
				onPointerDownCapture={(event) => {
					if (drawerVisible) {
						suppressClickReference.current = false;
						return;
					}

					event.preventDefault();
					openedByPointerReference.current = true;
					suppressClickReference.current = true;
					openDrawer();
				}}
			>
				{inputField}
			</PopoverAnchor>
			<PopoverContent
				align="start"
				avoidCollisions={false}
				// The scaled-down calendar (mobile) is smaller than its layout box;
				// presses on the dead area land outside the content, dismissing.
				className="pointer-events-none"
				onCloseAutoFocus={(event) => {
					event.preventDefault();

					// This fires after the calendar unmounts: focus on the body means it
					// was dropped from within the calendar. Outside interactions have
					// already moved focus elsewhere, leave those alone.
					if (document.activeElement && document.activeElement !== document.body)
						return;

					const input = reference.current?.querySelector("input");
					if (!input) return;

					restoringFocusReference.current = true;

					// Focusing a read-only input keeps the mobile keyboard hidden.
					input.readOnly = true;
					input.focus();

					setTimeout(() => {
						input.readOnly = false;
					}, 0);
				}}
				onInteractOutside={(event) => {
					if (reference.current?.contains(event.target as Node)) {
						event.preventDefault();
					}
				}}
				onOpenAutoFocus={(event) => {
					event.preventDefault();

					if (!openedByPointerReference.current) return;
					openedByPointerReference.current = false;

					calendarReference.current?.focus();
				}}
			>
				<InputCalendar
					className="pointer-events-auto w-fit shadow-brand-1"
					{...props}
					ref={calendarReference}
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
