import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

export interface FormInputMessagesProps {
	messages?: Array<string>;
}

export const FormInputMessages: React.FC<FormInputMessagesProps> = ({ messages }) => {
	if (!messages || messages.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{messages.map((message, messageIdx) => (
				<div className="font-nunito flex gap-2 text-red-600 items-center" key={messageIdx}>
					<ExclamationCircleIcon className="w-6 h-6" />
					<span className="text-lg">{`${message[0].toUpperCase()}${message.slice(1)}`}</span>
				</div>
			))}
		</div>
	);
};
