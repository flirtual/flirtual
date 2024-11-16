import { AlertCircle, AlertTriangle, Check, Info } from "lucide-react";
import { type FC, type PropsWithChildren, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

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

export type FormMessageProps = PropsWithChildren<Omit<FormMessage, "value">>;

export const FormMessage: FC<FormMessageProps> = (props) => {
	const { type, size = "md", children } = props;
	const Icon = formMessageIcon[type];
	const reference = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (reference.current) {
			reference.current.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center"
			});
		}
	}, [children]);

	return (
		<div
			className={twMerge(
				"select-children flex gap-2 font-nunito",
				formMessageStyle[type],
				formMessageSize[size]
			)}
			ref={reference}
		>
			<Icon className="mt-0.5 size-6 shrink-0" />
			<span>{children}</span>
		</div>
	);
};

export interface FormInputMessagesProps {
	messages?: Array<FormMessage>;
}

export const FormInputMessages: React.FC<FormInputMessagesProps> = ({
	messages
}) => {
	const message = messages?.[0];
	if (!message) return null;

	return (
		<FormMessage {...message}>
			{message.value}
		</FormMessage>
	);
};
