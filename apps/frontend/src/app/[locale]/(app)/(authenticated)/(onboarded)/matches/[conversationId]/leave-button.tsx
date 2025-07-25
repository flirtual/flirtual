"use client";

import { Trash2 } from "lucide-react";
import type { FC } from "react";

import { Conversation } from "~/api/conversations";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "~/i18n/navigation";
import { urls } from "~/urls";

export interface LeaveButtonProps {
	conversationId: string;
}

export const LeaveButton: FC<LeaveButtonProps> = (props) => {
	const { conversationId } = props;
	const router = useRouter();
	const toasts = useToast();

	return (
		<button
			className="-m-3 mr-0 p-4 text-white-20 outline-none transition-opacity hover:opacity-80 focus:opacity-80"
			type="button"
			onClick={async () => {
				await Conversation.leave(conversationId)
					.catch(toasts.addError);

				return router.push(urls.conversations.list());
			}}
		>
			<Trash2 className="size-[1.625rem]" />
			<span className="sr-only">Remove</span>
		</button>
	);
};
