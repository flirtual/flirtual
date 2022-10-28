import React, { useCallback } from "react";
import { twMerge } from "tailwind-merge";

const SwitchInput: React.FC<React.ComponentProps<"input"> & { text: string }> = ({
	text,
	...props
}) => (
	<div className="flex relative items-center justify-center h-10 w-14">
		<input
			{...props}
			type="radio"
			className={twMerge(
				"checked:bg-brand-gradient peer absolute h-full w-full bg-transparent focus:shadow-none focus:ring-transparent focus:ring-offset-0 focus:outline-none rounded-none border-none",
				props.className
			)}
		/>
		<label className={twMerge("absolute pointer-events-none", props.checked && "text-white")}>
			{text}
		</label>
	</div>
);

export interface SwitchProps {
	value: boolean;
	name: string;
	onChange: (value: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = (props) => {
	const { value, name } = props;

	const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
		(event) => {
			props.onChange.call(null, event.target.value === "yes");
		},
		[props.onChange]
	);

	return (
		<div className="bg-brand-grey shadow-brand-1 focus-within:ring-brand-coral rounded-xl flex overflow-hidden focus-within:ring-2 focus-within:ring-offset-2">
			<SwitchInput checked={value} name={name} text="Yes" value="yes" onChange={onChange} />
			<SwitchInput checked={!value} name={name} text="No" value="no" onChange={onChange} />
		</div>
	);
};
