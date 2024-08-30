"use client";

import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { CalendarDays, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { omit } from "~/utilities";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

import type { IconComponent } from "../icons";
import type React from "react";

export type InputTextProps = Omit<React.ComponentProps<"input">, "onChange"> & {
	Icon?: IconComponent;
	iconColor?: string;
	connection?: boolean;
	onChange?: React.Dispatch<string>;
};

export const InputText: React.FC<InputTextProps> = (props) => {
	const inputReference = useRef<HTMLInputElement>(null);
	const [inputVisible, setInputVisible] = useState(props.type !== "password");
	const t = useTranslations("inputs.text");

	const type = inputVisible
		? props.type === "date" || props.type === "password"
			? "text"
			: props.type || "text"
		: "password";

	const Icon = props.Icon ?? (props.type === "date" ? CalendarDays : undefined);
	const InputVisibleIcon = inputVisible ? Eye : EyeOff;

	return (
		<div
			className="focusable-within flex items-center overflow-hidden rounded-xl bg-white-40 text-black-80 shadow-brand-1 vision:bg-white-40/70 dark:bg-black-60 dark:text-white-20"
			onClick={() => inputReference.current?.focus()}
		>
			{Icon && (
				<div
					style={{ background: props.iconColor }}
					className={twMerge(
						"flex items-center justify-center bg-brand-gradient p-2 text-white-20",
						props.connection && "h-12 w-14"
					)}
				>
					<Icon className="size-7" />
				</div>
			)}
			<input
				{...omit(props, ["type", "Icon"])}
				ref={inputReference}
				type={type}
				className={twMerge(
					"w-full border-none bg-transparent px-4 py-2 font-nunito caret-theme-2 placeholder:text-black-20 focus:outline-none focus:ring-0 disabled:text-black-20 dark:placeholder:text-white-50 dark:disabled:text-white-50",
					type === "number" &&
						"[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
					props.className
				)}
				onChange={(event) => {
					if (!props?.onChange) return;
					props.onChange(event.target.value);
				}}
			/>
			{props.type === "password" && (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							className="mr-4"
							type="button"
							onClick={() => setInputVisible((inputVisible) => !inputVisible)}
						>
							<InputVisibleIcon className="size-5" />
						</button>
					</TooltipTrigger>
					<TooltipContent align="center">
						{inputVisible ? t("hide") : t("show")}
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};
