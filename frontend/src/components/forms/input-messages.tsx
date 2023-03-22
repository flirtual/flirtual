import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { capitalize } from "~/utilities";

export interface FormInputMessagesProps {
	messages?: Array<string>;
}

export const FormInputMessages: React.FC<FormInputMessagesProps> = ({ messages }) => {
	if (!messages || messages.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{messages.map((message, messageIdx) => (
				<div
					className="flex items-center gap-2 font-nunito text-red-600 dark:text-red-400"
					key={messageIdx}
				>
					<ExclamationCircleIcon className="h-6 w-6" />
					<span className="text-lg">{capitalize(message)}</span>
				</div>
			))}
		</div>
	);
};
