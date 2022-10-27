import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	XMarkIcon
} from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";

import { OptionWindow, OptionEvent, SelectOption } from ".";

import { IconComponent } from "~/components/icons";

const MonthNames = Object.freeze(
	new Array(12).fill(undefined).map((_, monthIdx) => {
		return new Date(2022, monthIdx, 1).toLocaleDateString(undefined, { month: "long" });
	})
);

const Years = Object.freeze(
	new Array(150).fill(undefined).map((_, idx) => new Date().getFullYear() - idx)
);

export function getMonthLength(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getMonthDayOffset(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/**
 * A loose date comparison, only compares date, not time.
 */
export function dateEqual(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

type CalendarButtonProps = React.ComponentProps<"button"> & { Icon: IconComponent };

const CalendarButton: React.FC<CalendarButtonProps> = ({ Icon, ...props }) => (
	<button
		{...props}
		type="button"
		className={twMerge(
			"bg-brand-gradient shadow-brand-1 p-1 rounded-full w-7 h-7 flex items-center justify-center text-white",
			props.className
		)}
	>
		<Icon className="w-3" strokeWidth={3} />
	</button>
);

export interface LabelSelectProps {
	options: Array<SelectOption>;
	onOptionAction: React.EventHandler<OptionEvent<React.SyntheticEvent<HTMLButtonElement>>>;
	children: React.ReactNode;
}

export const LabelSelect: React.FC<LabelSelectProps> = (props) => {
	const [visible, setVisible] = useState(false);

	return (
		<div
			className="focus-within:ring-brand-coral w-full relative focus-within:ring-2 focus-within:ring-offset-2 rounded-xl"
			tabIndex={-1}
			onBlur={({ currentTarget, relatedTarget }) => {
				if (currentTarget.contains(relatedTarget)) return;
				setVisible(false);
			}}
			onFocus={() => {
				setVisible(true);
			}}
		>
			<button
				className="font-montserrat text-xl px-3 flex gap-2 items-center focus:outline-none "
				type="button"
			>
				<span className="">{props.children}</span>
				<ChevronDownIcon className="w-4 h-4" strokeWidth={3} />
			</button>
			<OptionWindow
				className={twMerge("absolute w-fit mt-4", visible ? "flex" : "hidden")}
				options={props.options}
				onOptionClick={props.onOptionAction}
				onOptionFocus={props.onOptionAction}
			/>
		</div>
	);
};

export type CalendarProps = Omit<React.ComponentProps<"div">, "onChange"> & {
	value: Date;
	onChange: React.Dispatch<Date>;
};

export const Calendar: React.FC<CalendarProps> = (props) => {
	const { value, onChange, ...elementProps } = props;
	const [displayDate, setDisplayDate] = useState(value);

	useEffect(() => setDisplayDate(value), [value]);

	const progressMonth = useCallback((direction: -1 | 1) => {
		setDisplayDate((displayDate) => {
			const newDisplayDate = new Date(displayDate);

			newDisplayDate.setMonth(displayDate.getMonth() + direction);
			return newDisplayDate;
		});
	}, []);

	const progressYear = useCallback((direction: -1 | 1) => {
		setDisplayDate((displayDate) => {
			const newDisplayDate = new Date(displayDate);

			newDisplayDate.setFullYear(displayDate.getFullYear() + direction);
			return newDisplayDate;
		});
	}, []);

	const dayOffset = getMonthDayOffset(displayDate);
	const monthLength = getMonthLength(displayDate);

	const lastMonthLength = getMonthLength(
		new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, displayDate.getDate())
	);

	return (
		<div
			{...elementProps}
			tabIndex={-1}
			className={twMerge(
				"shadow-brand-1 select-none focus-within:ring-2 focus-within:ring-brand-coral focus-within:ring-offset-2 rounded-3xl p-4 bg-white md:w-96",
				elementProps.className
			)}
		>
			<div className="w-full">
				<div className="flex items-center justify-between mb-4">
					<div className="flex gap-1">
						<CalendarButton Icon={ChevronDoubleLeftIcon} onClick={() => progressYear(-1)} />
						<CalendarButton Icon={ChevronLeftIcon} onClick={() => progressMonth(-1)} />
					</div>
					<div className="flex gap-2 w-full mx-4 justify-center">
						<LabelSelect
							options={MonthNames.map((label, key) => ({ key: key.toString(), label }))}
							onOptionAction={({ option }) => {
								const monthIdx = Number.parseInt(option.key);
								onChange(new Date(value.getFullYear(), monthIdx, value.getDate()));
							}}
						>
							{displayDate.toLocaleDateString("en-CA", { month: "short" })}
						</LabelSelect>
						<LabelSelect
							options={Years.map((label) => ({ key: label.toString(), label: label.toString() }))}
							onOptionAction={({ option }) => {
								const yearIdx = Number.parseInt(option.key);
								onChange(new Date(yearIdx, value.getMonth(), value.getDate()));
							}}
						>
							{displayDate.toLocaleDateString("en-CA", { year: "numeric" })}
						</LabelSelect>
					</div>
					<div className="flex gap-1">
						<CalendarButton Icon={ChevronRightIcon} onClick={() => progressMonth(1)} />
						<CalendarButton Icon={ChevronDoubleRightIcon} onClick={() => progressYear(1)} />
					</div>
				</div>

				<div className="-mx-2">
					<table className="w-full text-black">
						<thead>
							<tr>
								{["S", "M", "T", "W", "T", "F", "S"].map((name, idx) => (
									<th className="w-10 h-10 select-none" key={idx}>
										{name}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{new Array(6).fill(undefined).map((_, weekIdx) => {
								return (
									<tr className="" key={weekIdx}>
										{new Array(7).fill(undefined).map((_, dayIdx) => {
											const previousMonth = weekIdx === 0 && dayIdx < dayOffset;

											const nth = dayIdx + (7 * weekIdx - dayOffset) + 1;
											const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), nth);

											const nextMonth = nth > monthLength;
											const currentMonth = !previousMonth && !nextMonth;

											const day = previousMonth
												? lastMonthLength - (dayOffset - dayIdx) + 1
												: nextMonth
												? nth % monthLength
												: nth;

											return (
												<td className="p-1" key={dayIdx}>
													<button
														type="button"
														className={twMerge(
															"w-10 h-10 text-center font-mono focus:ring-2 focus:ring-brand-coral hover:bg-brand-grey focus:ring-offset-2 rounded-xl focus:outline-none",
															!currentMonth && "text-gray-500",
															dateEqual(props.value, date) && "bg-brand-gradient text-white"
														)}
														onClick={() => onChange(date)}
													>
														{day.toLocaleString("en-US", {
															minimumIntegerDigits: 2,
															useGrouping: false
														})}
													</button>
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
