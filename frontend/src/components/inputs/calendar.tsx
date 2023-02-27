"use client";

import { useCallback, useEffect, useState } from "react";
import {
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon
} from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";

import { InputOptionWindow, InputOptionEvent, InputSelectOption } from "./select";

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
			"focusable flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient p-1 text-white-20 shadow-brand-1",
			props.className
		)}
	>
		<Icon className="w-3" strokeWidth={3} />
	</button>
);

interface LabelSelectProps {
	options: Array<InputSelectOption>;
	onOptionAction: React.EventHandler<InputOptionEvent<React.SyntheticEvent<HTMLButtonElement>>>;
	children: React.ReactNode;
}

const LabelSelect: React.FC<LabelSelectProps> = (props) => {
	const [visible, setVisible] = useState(false);

	return (
		<div
			className="focusable-within relative rounded-xl"
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
				className="flex items-center gap-2 px-3 font-montserrat text-xl font-semibold focus:outline-none"
				type="button"
			>
				<span className="w-12">{props.children}</span>
				<ChevronDownIcon className="h-4 w-4" strokeWidth={3} />
			</button>
			<InputOptionWindow
				className={twMerge("absolute mt-4 w-fit", visible ? "flex" : "hidden")}
				options={props.options}
				onOptionClick={props.onOptionAction}
				onOptionFocus={props.onOptionAction}
			/>
		</div>
	);
};

export type InputCalendarProps = Omit<React.ComponentProps<"div">, "onChange"> & {
	value: Date;
	onChange: React.Dispatch<Date>;
};

export const InputCalendar: React.FC<InputCalendarProps> = (props) => {
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
				"focusable-within h-fit select-none rounded-3xl bg-white-20 p-4 font-nunito text-black-70 dark:bg-black-60 dark:text-white-20",
				elementProps.className
			)}
		>
			<div className="w-full">
				<div className="mb-4 flex items-center justify-between">
					<div className="flex gap-2">
						<CalendarButton Icon={ChevronDoubleLeftIcon} onClick={() => progressYear(-1)} />
						<CalendarButton Icon={ChevronLeftIcon} onClick={() => progressMonth(-1)} />
					</div>
					<div className="mx-4 flex w-full justify-center gap-2">
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
					<div className="flex gap-2">
						<CalendarButton Icon={ChevronRightIcon} onClick={() => progressMonth(1)} />
						<CalendarButton Icon={ChevronDoubleRightIcon} onClick={() => progressYear(1)} />
					</div>
				</div>

				<div className="-mx-2">
					<table className="w-full text-black-70 dark:text-white-10">
						<thead>
							<tr>
								{["S", "M", "T", "W", "T", "F", "S"].map((name, idx) => (
									<th className="h-10 w-10 select-none font-extrabold" key={idx}>
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
															"focusable h-10 w-10 rounded-xl text-center hover:bg-white-40 dark:hover:bg-black-60",
															!currentMonth && "text-black-50 dark:text-black-10",
															dateEqual(props.value, date) && "bg-brand-gradient text-white-20"
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
