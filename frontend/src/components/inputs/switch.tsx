"use client";

import { twMerge } from "tailwind-merge";

type SwitchInputProps = React.ComponentProps<"input"> & { label: string };

const SwitchInput: React.FC<SwitchInputProps> = ({ label, ...props }) => (
	<div className="relative flex h-10 w-14 items-center justify-center">
		<input
			{...props}
			type="radio"
			className={twMerge(
				"peer absolute h-full w-full rounded-none border-none bg-transparent checked:bg-brand-gradient focus:shadow-none focus:outline-none focus:ring-transparent focus:ring-offset-0",
				props.className
			)}
		/>
		<label className={twMerge("pointer-events-none absolute", props.checked && "text-white")}>
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
		<div className="flex w-fit shrink-0 grow-0 overflow-hidden rounded-xl bg-brand-grey shadow-brand-1 focus-within:ring-2 focus-within:ring-brand-coral focus-within:ring-offset-2">
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
