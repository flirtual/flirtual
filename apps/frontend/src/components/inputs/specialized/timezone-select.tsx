import { SelectItemText } from "@radix-ui/react-select";
import { createContext, use, useCallback, useMemo, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { createOffsetTimeFormatter, millisecondsUntilNextMinute } from "~/date";
import { useAttributes } from "~/hooks/use-attribute";
import { useTimeout } from "~/hooks/use-interval";
import { useBrowserTimezone } from "~/hooks/use-timezone";

import { InputSelect, SelectItem } from "../select";
import type { InputSelectProps } from "../select";

const formatTimeAtOffset = createOffsetTimeFormatter();

function useCurrentMinute(): number {
	const [now, setNow] = useState(Date.now);
	useTimeout(useCallback(() => setNow(Date.now()), []), millisecondsUntilNextMinute(now));

	return now;
}

function getCityName(timezoneId: string): string {
	const parts = timezoneId.split("/");
	return parts[parts.length - 1].replace(/_/g, " ");
}

const TimesContext = createContext<Map<string, string>>(new Map());

const TimezoneSelectItem: FC<{ value: string }> = ({ value: timezoneId }) => {
	const times = use(TimesContext);

	const city = getCityName(timezoneId);
	const time = times.get(timezoneId) ?? "";

	return (
		<SelectItem
			className="truncate hocus:outline-hidden"
			value={timezoneId}
		>
			<span className="w-24 shrink-0 text-right">
				(
				{time}
				)
			</span>
			<span className="ml-3"><SelectItemText>{city}</SelectItemText></span>
		</SelectItem>
	);
};

export type InputTimezoneSelectProps = {
	prefer?: string;
} & Omit<InputSelectProps<string | null>, "Item" | "options">;

export function InputTimezoneSelect({ prefer, ...props }: InputTimezoneSelectProps) {
	const { t } = useTranslation();

	const timezones = useAttributes("timezone");

	const browserTimezone = useBrowserTimezone();
	const preferredTimezone = prefer ?? browserTimezone;

	const now = useCurrentMinute();

	const times = useMemo(
		() => new Map(timezones.map((tz) => [tz.id, formatTimeAtOffset(now, tz.offset)])),
		[now, timezones]
	);

	const options = useMemo(() => timezones
		.map((tz) => ({
			id: tz.id,
			name: `${getCityName(tz.id)} time (${times.get(tz.id)})`
		}))
		.sort((a, b) => {
			if (a.id === preferredTimezone) return -1;
			if (b.id === preferredTimezone) return 1;
			return 0;
		}), [preferredTimezone, times, timezones]);

	return (
		<TimesContext value={times}>
			<InputSelect
				{...props}
				optional
				Item={TimezoneSelectItem}
				options={options}
				placeholder={t("select_timezone")}
			/>
		</TimesContext>
	);
}
