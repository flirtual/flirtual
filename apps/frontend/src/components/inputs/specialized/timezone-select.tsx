import { SelectItemText } from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { createContext, use, useMemo } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { listTimezones } from "~/api/timezones";

import { InputSelect, SelectItem } from "../select";
import type { InputSelectProps } from "../select";

function formatTime(offsetSeconds: number): string {
	const now = new Date();
	const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
	const tzTime = new Date(utcTime + offsetSeconds * 1000);
	return tzTime.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit"
	});
}

function getCityName(timezoneId: string): string {
	const parts = timezoneId.split("/");
	return parts[parts.length - 1].replace(/_/g, " ");
}

const OffsetMapContext = createContext<Map<string, number>>(new Map());

const TimezoneSelectItem: FC<{ value: string }> = ({ value: timezoneId }) => {
	const offsetMap = use(OffsetMapContext);
	const offset = offsetMap.get(timezoneId);

	const city = getCityName(timezoneId);
	const time = offset !== undefined ? formatTime(offset) : "";

	return (
		<SelectItem
			className="truncate hocus:outline-none"
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

	const { data: timezones = [] } = useQuery({
		queryKey: ["timezones"],
		queryFn: listTimezones,
		staleTime: Infinity
	});

	const browserTimezone = useMemo(
		() => Intl.DateTimeFormat().resolvedOptions().timeZone,
		[]
	);
	const preferredTimezone = prefer ?? browserTimezone;

	const offsetMap = useMemo(
		() => new Map(timezones.map((tz) => [tz.id, tz.offset])),
		[timezones]
	);

	const options = useMemo(() => {
		return timezones
			.map((tz) => {
				const city = getCityName(tz.id);
				const time = formatTime(tz.offset);

				return {
					id: tz.id,
					name: `${city} (${time})`,
					offset: tz.offset
				};
			})
			.sort((a, b) => {
				if (a.id === preferredTimezone) return -1;
				if (b.id === preferredTimezone) return 1;
				return 0;
			});
	}, [timezones, preferredTimezone]);

	return (
		<OffsetMapContext value={offsetMap}>
			<InputSelect
				{...props}
				optional
				Item={TimezoneSelectItem}
				options={options}
				placeholder={t("select_timezone")}
			/>
		</OffsetMapContext>
	);
}
