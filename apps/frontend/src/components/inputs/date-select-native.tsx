import { useState } from "react";
import { DatetimePicker } from "@capawesome-team/capacitor-datetime-picker";

import { useTheme } from "~/hooks/use-theme";
import { resolveTheme } from "~/theme";

import { InputText } from "./text";
import { MinmaxDate } from "./calendar";

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
		} catch (reason) {
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
