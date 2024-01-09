"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight
} from "lucide-react";

import { IconComponent } from "~/components/icons";

import {
	InputOptionEvent,
	InputOptionWindow,
	InputSelectOption
} from "./option-window";

const MonthNames = Object.freeze(
	Array.from({ length: 12 })
		.fill(null)
		.map((_, monthIndex) => {
			return new Date(2022, monthIndex, 1).toLocaleDateString(undefined, {
				month: "long"
			});
		})
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

type CalendarButtonProps = React.ComponentProps<"button"> & {
	Icon: IconComponent;
};

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
	options: Array<InputSelectOption<string>>;
	onOptionAction: React.EventHandler<
		InputOptionEvent<React.SyntheticEvent<HTMLButtonElement>, string>
	>;
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
				<ChevronDown className="h-4 w-4" strokeWidth={3} />
			</button>
			{visible && (
				<InputOptionWindow
					className="absolute mt-4 flex w-fit"
					options={props.options}
					onOptionClick={(event) => {
						props.onOptionAction(
							event as InputOptionEvent<
								React.SyntheticEvent<HTMLButtonElement>,
								string
							>
						);
						setVisible(false);
						setVisible(true);
					}}
					onOptionFocus={(event) => {
						props.onOptionAction(
							event as InputOptionEvent<
								React.SyntheticEvent<HTMLButtonElement>,
								string
							>
						);
					}}
				/>
			)}
		</div>
	);
};

const yearInMilliseconds = 3.154e10;

export type MinmaxDate = "now" | Date;

export type InputCalendarProps = Omit<
	React.ComponentProps<"div">,
	"onChange"
> & {
	value: Date;
	offset?: number;
	min?: MinmaxDate;
	max?: MinmaxDate;
	onChange: React.Dispatch<Date>;
	onDateClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const InputCalendar: React.FC<InputCalendarProps> = (props) => {
	const {
		value,
		offset = 128,
		min: minDate,
		max: maxDate,
		onChange,
		onDateClick,
		...elementProps
	} = props;
	const [displayDate, setDisplayDate] = useState(value);

	const min = useMemo(
		() =>
			(minDate === "now" ? new Date() : minDate) ||
			new Date(Date.now() - offset * yearInMilliseconds),
		[minDate, offset]
	);

	const max = useMemo(
		() =>
			(maxDate === "now" ? new Date() : maxDate) ||
			new Date(Date.now() + offset * yearInMilliseconds),
		[maxDate, offset]
	);

	const compare = useCallback(
		(value: Date) => {
			if (value.getTime() < min.getTime()) return -1;
			if (value.getTime() > max.getTime()) return 1;
			return 0;
		},
		[min, max]
	);

	const clamp = useCallback(
		(value: Date) => {
			const overflow = compare(value);
			return overflow === 0 ? value : overflow === 1 ? max : min;
		},
		[min, max, compare]
	);

	const years = useMemo(() => {
		const currentYear = new Date().getFullYear();

		const minYear = min.getFullYear();
		const maxYear = max.getFullYear();

		return Array.from({ length: offset * 2 })
			.fill(null)
			.map((_, index) => {
				const year = currentYear + (index - offset);

				if (year < minYear || year > maxYear) return null;
				return year;
			})
			.filter(Boolean)
			.reverse();
	}, [offset, min, max]);

	const doChange = useCallback<typeof onChange>(
		(value) => onChange(clamp(value)),
		[onChange, clamp]
	);

	useEffect(() => setDisplayDate(clamp(value)), [value, clamp]);

	const progressMonth = useCallback(
		(direction: -1 | 1) => {
			setDisplayDate((displayDate) => {
				const newDisplayDate = new Date(displayDate);

				newDisplayDate.setMonth(displayDate.getMonth() + direction);
				return clamp(newDisplayDate);
			});
		},
		[clamp]
	);

	const progressYear = useCallback(
		(direction: -1 | 1) => {
			setDisplayDate((displayDate) => {
				const newDisplayDate = new Date(displayDate);
				newDisplayDate.setFullYear(displayDate.getFullYear() + direction);

				return clamp(newDisplayDate);
			});
		},
		[clamp]
	);

	const dayOffset = getMonthDayOffset(displayDate);
	const monthLength = getMonthLength(displayDate);

	const lastMonthLength = getMonthLength(
		new Date(
			displayDate.getFullYear(),
			displayDate.getMonth() - 1,
			displayDate.getDate()
		)
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
						<CalendarButton
							Icon={ChevronsLeft}
							onClick={() => progressYear(-1)}
						/>
						<CalendarButton
							Icon={ChevronLeft}
							onClick={() => progressMonth(-1)}
						/>
					</div>
					<div className="mx-4 flex w-full justify-center gap-2">
						<LabelSelect
							options={MonthNames.map((label, monthIndex) => ({
								key: monthIndex.toString(),
								label,
								active: monthIndex === value.getMonth()
							}))}
							onOptionAction={({ option }) => {
								if (!option.key) return;
								doChange(
									new Date(
										value.getFullYear(),
										Number.parseInt(option.key),
										value.getDate()
									)
								);
							}}
						>
							{displayDate.toLocaleDateString("en-CA", { month: "short" })}
						</LabelSelect>
						<LabelSelect
							options={years.map((year) => ({
								key: year.toString(),
								label: year.toString(),
								active: value.getFullYear() === year
							}))}
							onOptionAction={({ option }) => {
								if (!option.key) return;
								doChange(
									new Date(
										Number.parseInt(option.key),
										value.getMonth(),
										value.getDate()
									)
								);
							}}
						>
							{displayDate.toLocaleDateString("en-CA", { year: "numeric" })}
						</LabelSelect>
					</div>
					<div className="flex gap-2">
						<CalendarButton
							Icon={ChevronRight}
							onClick={() => progressMonth(1)}
						/>
						<CalendarButton
							Icon={ChevronsRight}
							onClick={() => progressYear(1)}
						/>
					</div>
				</div>

				<div className="-mx-2">
					<table className="w-full text-black-70 dark:text-white-10">
						<thead>
							<tr>
								{["S", "M", "T", "W", "T", "F", "S"].map((name, index) => (
									<th
										className="h-10 w-10 select-none font-extrabold"
										key={index}
									>
										{name}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 6 })
								.fill(null)
								.map((_, weekIndex) => {
									return (
										<tr className="" key={weekIndex}>
											{Array.from({ length: 7 })
												.fill(null)
												.map((_, dayIndex) => {
													const previousMonth =
														weekIndex === 0 && dayIndex < dayOffset;

													const nthDay =
														dayIndex + (7 * weekIndex - dayOffset) + 1;
													const date = new Date(
														displayDate.getFullYear(),
														displayDate.getMonth(),
														nthDay
													);

													const nextMonth = nthDay > monthLength;
													const currentMonth = !previousMonth && !nextMonth;

													const day = previousMonth
														? lastMonthLength - (dayOffset - dayIndex) + 1
														: nextMonth
															? nthDay % monthLength
															: nthDay;

													const disabled = !(compare(date) === 0);
													const active = dateEqual(props.value, date);

													return (
														<td className="p-1" key={dayIndex}>
															<button
																type="button"
																className={twMerge(
																	"h-10 w-10 rounded-xl text-center hover:bg-white-40 dark:hover:bg-black-60",
																	disabled
																		? ""
																		: "focusable bg-white-25 dark:bg-black-50",
																	active
																		? "bg-brand-gradient text-white-20"
																		: (!currentMonth || disabled) &&
																				"text-black-30 dark:text-black-10"
																)}
																onClick={(event) => {
																	doChange(date);
																	onDateClick?.(event);
																}}
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
