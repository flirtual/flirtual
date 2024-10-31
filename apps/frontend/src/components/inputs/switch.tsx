"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export type SwitchValue = boolean | null;

export interface InputSwitchProps {
	value: SwitchValue;
	onChange: React.Dispatch<boolean>;
	yes?: string;
	no?: string;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { yes, no, value, onChange } = props;
	const t = useTranslations("inputs.switch");

	const ariaChecked = value === null ? "mixed" : value;

	return (
		<div
			aria-checked={ariaChecked}
			className="group/switch focusable-within relative isolate grid size-fit h-11 shrink-0 grow-0 cursor-pointer grid-cols-2 items-center overflow-hidden rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60"
			data-checked={ariaChecked}
			role="checkbox"
			tabIndex={0}
		>
			<input
				checked={value || false}
				className="hidden"
				type="checkbox"
				onChange={({ target: { checked } }) => onChange(checked)}
			/>
			<motion.div
				layout
				transition={{
					type: "spring",
					stiffness: 700,
					damping: 30
				}}
				className="absolute right-0 h-full w-1/2 rounded-xl bg-brand-gradient shadow-brand-1 group-aria-checked/switch:left-0 group-aria-checked/switch:right-[unset] group-data-[checked=mixed]/switch:right-1/4 group-data-[checked=mixed]/switch:opacity-0"
			/>
			<div className="z-10 flex h-full items-center justify-center px-4 group-aria-checked/switch:text-white-10 vision:text-black-80" onClick={() => onChange(value === null ? true : !value)}>
				<span>{yes ?? t("yes")}</span>
			</div>
			<div className="z-10 flex h-full items-center justify-center px-4 text-white-10 group-aria-checked/switch:text-black-80 group-data-[checked=mixed]/switch:text-black-80 dark:group-aria-checked/switch:text-white-10 dark:group-data-[checked=mixed]/switch:text-white-10" onClick={() => onChange(value === null ? false : !value)}>
				<span>{no ?? t("no")}</span>
			</div>
		</div>
	);
};
