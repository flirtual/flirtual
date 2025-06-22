import { AlertCircle, AlertTriangle, Check, Info } from "lucide-react";
import { motion } from "motion/react";
import { type FC, type PropsWithChildren, useLayoutEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { useFormContext } from "~/hooks/use-input-form";

import type { IconComponent } from "../icons";

export type FormMessageType = "error" | "informative" | "success" | "warning";
export type FormMessageSize = "md" | "sm";

export interface FormMessage {
	type: FormMessageType;
	size?: FormMessageSize;
	value: string;
}

const formMessageStyle: Record<FormMessageType, string> = {
	error: "text-red-600 dark:text-red-400",
	warning: "text-yellow-600 dark:text-yellow-400",
	success: "text-green-600 dark:text-green-400",
	informative: "text-black-60 dark:text-white-50"
};

const formMessageIcon: Record<FormMessageType, IconComponent> = {
	error: AlertCircle,
	warning: AlertTriangle,
	success: Check,
	informative: Info
};

const formMessageSize: Record<FormMessageSize, string> = {
	sm: "text-md",
	md: "text-lg"
};

const formMessageIconSize: Record<FormMessageSize, string> = {
	sm: "mt-1 size-4",
	md: "mt-0.5 size-6"
};

export type FormMessageProps = PropsWithChildren<{ className?: string } & Omit<FormMessage, "value">>;

export const FormMessage: FC<FormMessageProps> = (props) => {
	const { submitCount } = useFormContext();
	const { type, size = "md", className, children } = props;
	const Icon = formMessageIcon[type];

	const reference = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		reference.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "center"
		});
	}, [children, submitCount]);

	return (
		<motion.div
			className={twMerge(
				"motion-preset-rebound select-children flex gap-2 font-nunito motion-duration-200",
				formMessageStyle[type],
				formMessageSize[size],
				className
			)}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			initial={{ opacity: 0, y: -10 }}
			ref={reference}
		>
			<Icon className={twMerge("shrink-0", formMessageIconSize[size])} />
			<span>{children}</span>
		</motion.div>
	);
};

export interface FormInputMessagesProps {
	messages?: Array<FormMessage>;
	className?: string;
}

export const FormInputMessages: React.FC<FormInputMessagesProps> = ({
	messages,
	className
}) => {
	const message = messages?.[0];

	return (
		<>
			{message && (
				<FormMessage {...message} className={className}>
					{message.value}
				</FormMessage>
			)}
		</>
	);
};
