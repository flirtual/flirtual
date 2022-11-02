"use client";

import { twMerge } from "tailwind-merge";

type SwitchInputProps = React.ComponentProps<"input"> & { label: string };

const SwitchInput: React.FC<SwitchInputProps> = ({ label, ...props }) => (
	<div className="flex relative items-center justify-center h-10 w-14">
		<input
			{...props}
			type="radio"
			className={twMerge(
				"peer checked:bg-brand-gradient absolute h-full w-full bg-transparent focus:shadow-none focus:ring-transparent focus:ring-offset-0 focus:outline-none rounded-none border-none",
				props.className
			)}
		/>
		<label className={twMerge("absolute pointer-events-none", props.checked && "text-white")}>
			{label}
		</label>
	</div>
);

export interface InputSwitchProps {
	value: boolean;
	name: string;
	onChange: React.Dispatch<boolean>;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { value, name } = props;

	return (
		<div className="bg-brand-grey shadow-brand-1 grow-0 w-fit shrink-0 focus-within:ring-brand-coral rounded-xl flex overflow-hidden focus-within:ring-2 focus-within:ring-offset-2">
			<SwitchInput
				checked={value}
				label="Yes"
				name={name}
				value="yes"
				onChange={() => props.onChange(true)}
			/>
			<SwitchInput
				checked={!value}
				label="No"
				name={name}
				value="no"
				onChange={() => props.onChange(false)}
			/>
		</div>
	);
};
