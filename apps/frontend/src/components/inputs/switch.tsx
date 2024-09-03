"use client";

import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

type SwitchInputProps = React.ComponentProps<"input"> & { label: string };

const SwitchInput: React.FC<SwitchInputProps> = ({ label, ...props }) => (
	<div className="relative flex h-11 items-center justify-center">
		<input
			{...props}
			type="radio"
			className={twMerge(
				"peer absolute size-full rounded-none border-none bg-transparent checked:bg-brand-gradient focus:shadow-none focus:outline-none focus:ring-transparent focus:ring-offset-0",
				props.className
			)}
		/>
		<label
			className={twMerge(
				"pointer-events-none shrink-0 select-none px-4",
				props.checked
					? "z-10 text-white-20"
					: "text-black-80 dark:text-white-20"
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
	yes?: string;
	no?: string;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { name, invert = false, yes, no } = props;
	const t = useTranslations("inputs.switch");

	const value = invert && props.value !== null ? !props.value : props.value;

	return (
		<div className="focusable-within grid size-fit h-11 shrink-0 grow-0 grid-cols-2 overflow-hidden rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60">
			<SwitchInput
				checked={value === null ? false : value}
				label={yes ?? t("yes")}
				name={name}
				value="yes"
				onChange={() => props.onChange(invert ? false : true)}
			/>
			<SwitchInput
				checked={value === null ? false : !value}
				label={no ?? t("no")}
				name={name}
				value="no"
				onChange={() => props.onChange(invert ? true : false)}
			/>
		</div>
	);
};
