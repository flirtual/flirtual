/* eslint-disable import/named */
/* eslint-disable import/default */
import React from "react";

import { Calendar, CalendarProps } from "./calendar";
import { Text } from "./text";

export const Date: React.FC<Pick<CalendarProps, "value" | "onChange">> = (props) => (
	<div className="flex flex-col gap-4">
		<Text className="" type="date" value={props.value.toLocaleDateString("en-CA")} />
		<Calendar value={props.value} onChange={props.onChange} />
	</div>
);
