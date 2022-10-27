import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { twMerge } from "tailwind-merge";

import { IconComponent } from "~/components/icons";

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

type ProgressMonthButtonProps = React.ComponentProps<"button"> & { Icon: IconComponent };

const ProgressMonthButton: React.FC<ProgressMonthButtonProps> = ({ Icon, ...props }) => (
	<button
		{...props}
		type="button"
		className={twMerge(
			"bg-brand-gradient p-1 rounded-full w-7 h-7 flex items-center justify-center text-white",
			props.className
		)}
	>
		<Icon className="w-3" strokeWidth={3} />
	</button>
);

export interface CalendarProps {
	value: Date;
	onChange: React.Dispatch<React.SetStateAction<Date>>;
}

export const Calendar: React.FC<CalendarProps> = (props) => {
	const [displayDate, setDisplayDate] = useState(props.value);

	const progressMonth = useCallback((direction: -1 | 1) => {
		setDisplayDate((displayDate) => {
			const newDisplayDate = new Date(displayDate);

			newDisplayDate.setMonth(displayDate.getMonth() + direction);
			return newDisplayDate;
		});
	}, []);

	const dayOffset = getMonthDayOffset(displayDate);
	const monthLength = getMonthLength(displayDate);

	const lastMonthLength = getMonthLength(
		new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, displayDate.getDate())
	);

	return (
		<div className="shadow-brand-1 rounded-3xl p-4 bg-white md:w-96">
			<div className="w-full">
				<div className="flex items-center justify-between mb-4">
					<span className="font-montserrat text-left text-xl text-black">
						{displayDate.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
					</span>
					<div className="flex space-x-4">
						<ProgressMonthButton Icon={ChevronLeftIcon} onClick={() => progressMonth(-1)} />
						<ProgressMonthButton Icon={ChevronRightIcon} onClick={() => progressMonth(1)} />
					</div>
				</div>
				<div className="-mx-2">
					<table className="w-full text-black">
						<thead>
							<tr>
								{["S", "M", "T", "W", "T", "F", "S"].map((name, idx) => (
									<th className="w-10 h-10" key={idx}>
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
															"w-10 h-10 text-center focus:ring-2 focus:ring-brand-coral hover:bg-brand-grey focus:ring-offset-2 rounded-xl focus:outline-none",
															!currentMonth && "text-gray-500",
															dateEqual(props.value, date) && "bg-brand-gradient text-white"
														)}
														onClick={() => {
															props.onChange(date);
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
