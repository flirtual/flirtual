import { Trash2 } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Conversation } from "~/api/conversations";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { conversationsKey, invalidate } from "~/query";
import { urls } from "~/urls";

export interface LeaveButtonProps {
	conversationId: string;
}

export const LeaveButton: FC<LeaveButtonProps> = (props) => {
	const { conversationId } = props;
	const navigate = useNavigate();
	const toasts = useToast();
	const { t } = useTranslation();

	return (
		<button
			className="-m-3 mr-0 p-4 text-white-20 outline-none transition-opacity hover:opacity-80 focus:opacity-80"
			type="button"
			onClick={async () => {
				await Conversation.leave(conversationId)
					.catch(toasts.addError);

				await invalidate({ queryKey: conversationsKey() });
				await navigate(urls.conversations.list());
			}}
		>
			<Trash2 className="size-[1.625rem]" />
			<span className="sr-only">{t("remove")}</span>
		</button>
	);
};
