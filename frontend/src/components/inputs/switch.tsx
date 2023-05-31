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
		<label
			className={twMerge(
				"pointer-events-none absolute select-none",
				props.checked ? "text-white-20" : "text-black-80 dark:text-white-20"
			)}
		>
			{label}
		</label>
	</div>
);

export type SwitchValue = null | boolean;

export interface InputSwitchProps {
	value: SwitchValue;
	name: string;
	onChange: React.Dispatch<boolean>;
	invert?: boolean;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { name, invert = false } = props;
	const value = invert && props.value !== null ? !props.value : props.value;

	return (
		<div className="focusable-within flex h-fit w-fit shrink-0 grow-0 overflow-hidden rounded-xl bg-white-30 shadow-brand-1 dark:bg-black-60">
			<SwitchInput
				checked={value === null ? false : value}
				label="Yes"
				name={name}
				value="yes"
				onChange={() => props.onChange(invert ? false : true)}
			/>
			<SwitchInput
				checked={value === null ? false : !value}
				label="No"
				name={name}
				value="no"
				onChange={() => props.onChange(invert ? true : false)}
			/>
		</div>
	);
};
