import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { capitalize } from "~/utilities";

export interface FormInputMessagesProps {
	messages?: Array<string>;
}

export const FormInputMessages: React.FC<FormInputMessagesProps> = ({
	messages
}) => {
	if (!messages || messages.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{messages.map((message, messageIndex) => (
				<div
					className="flex gap-2 font-nunito text-red-600 dark:text-red-400"
					key={messageIndex}
				>
					<ExclamationCircleIcon className="mt-1 h-6 w-6 shrink-0" />
					<span className="text-lg">{capitalize(message)}</span>
				</div>
			))}
		</div>
	);
};
