import { m } from "motion/react";
import { useTranslation } from "react-i18next";

export type SwitchValue = boolean | null;

export interface InputSwitchProps {
	value: SwitchValue;
	onChange: React.Dispatch<boolean>;
	yes?: string;
	no?: string;
}

export const InputSwitch: React.FC<InputSwitchProps> = (props) => {
	const { yes, no, value, onChange } = props;
	const { t } = useTranslation();

	const ariaChecked = value === null ? "mixed" : value;

	return (
		<div
			aria-checked={ariaChecked}
			className="group focusable-within relative isolate grid size-fit h-11 shrink-0 grow-0 cursor-pointer grid-cols-2 items-center overflow-hidden rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60"
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
			{value !== null && (
				<m.div
					layout
					animate={{
						scale: 1,
						opacity: 1,
					}}
					initial={{
						scale: 0.8,
						opacity: 0.8,
					}}
					style={{
						justifySelf: value
							? "start"
							: "end"
					}}
					transition={{
						type: "spring",
						duration: 0.3,
						ease: "easeInOut",
						bounce: 0.25
					}}
					className="absolute inset-0 w-1/2 rounded-xl bg-brand-gradient"
				/>
			)}
			<span
				className="relative flex h-full items-center justify-center px-4 group-aria-checked:text-white-10 vision:text-black-80"
				onClick={() => onChange(true)}
			>
				{yes ?? t("yes")}
			</span>
			<span
				className="relative flex h-full items-center justify-center px-4 text-white-10 group-aria-checked:text-black-80 group-data-[checked=mixed]:text-black-80 dark:group-aria-checked:text-white-10 dark:group-data-[checked=mixed]:text-white-10"
				onClick={() => onChange(false)}
			>
				{no ?? t("no")}
			</span>
		</div>
	);
};
