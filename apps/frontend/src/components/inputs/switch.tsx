"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export type SwitchValue = null | boolean;

export interface InputSwitchProps {
	value: SwitchValue;
	onChange: React.Dispatch<boolean>;
	yes?: string;
	no?: string;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { yes, no, value, onChange } = props;
	const t = useTranslations("inputs.switch");

	return (
		<label
			aria-checked={value === null ? "mixed" : value}
			className="group/switch focusable-within relative isolate grid size-fit h-11 shrink-0 grow-0 cursor-pointer grid-cols-2 items-center overflow-hidden rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60"
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
				className="absolute right-0 h-full w-1/2 rounded-xl bg-brand-gradient group-aria-checked/switch:left-0"
				transition={{
					type: "spring",
					stiffness: 700,
					damping: 30
				}}
			/>
			<span className="z-10 px-4 group-aria-checked/switch:text-white-10">
				{yes ?? t("yes")}
			</span>
			<span className="z-10 px-4 group-aria-checked/switch:text-white-10">
				{no ?? t("no")}
			</span>
		</label>
	);
};
