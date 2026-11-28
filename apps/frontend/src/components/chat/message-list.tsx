import type { FC } from "react";
import { Fragment, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

import { useChat, useChatState } from "./context";
import { JumpToLatest } from "./jump-to-latest";
import { Message } from "./message";
import { messageList } from "./selectors";
import type { ChatMessage } from "./store";

interface Run {
	key: string;
	messages: Array<{ message: ChatMessage; day: string | null }>;
}

const dayKey = (value: string) => new Date(value).toDateString();
const senderKey = (message: ChatMessage) => message.system || !message.senderId ? "system" : message.senderId;
const messageKey = (message: ChatMessage) => message.clientId ?? message.id;

function runs(messages: Array<ChatMessage>): Array<Run> {
	const result: Array<Run> = [];
	let previous: ChatMessage | undefined;

	for (const message of messages) {
		const day = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt) ? message.createdAt : null;
		const last = result.at(-1);

		if (last && previous && senderKey(previous) === senderKey(message) && senderKey(message) !== "system") last.messages.push({ message, day });
		else result.push({ key: messageKey(message), messages: [{ message, day }] });

		previous = message;
	}

	return result;
}

const DayDivider: FC<{ value: string }> = ({ value }) => {
	const [locale] = useLocale();
	const date = new Date(value);

	const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	const days = Math.round((midnight(date) - midnight(new Date())) / 86_400_000);
	const label = days >= -1
		? new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" }).format(days, "day")
		: new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(date);

	return (
		<div className="mx-2 mt-5 grid shrink-0 grid-cols-[1fr_max-content_1fr] items-center gap-3 text-sm text-theme-2">
			<hr className="border-current" />
			<span className="first-letter:uppercase">{label}</span>
			<hr className="border-current" />
		</div>
	);
};

export const MessageList: FC = () => {
	const { store } = useChat();
	const { editing, state: { messages, more, loadingOlder } } = useChatState();
	const sentinel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = sentinel.current;
		if (!element || !more) return;

		const observer = new IntersectionObserver(([entry]) => {
			if (entry?.isIntersecting) void store.loadOlder();
		}, { root: element.closest(messageList), rootMargin: "400px 0px 0px 0px" });
		observer.observe(element);
		return () => observer.disconnect();
	}, [store, more, loadingOlder]);

	const matchOnly = messages.length === 1 && messages[0]!.system;

	return (
		<div className="relative flex min-h-0 grow flex-col">
			<div
				data-message-list
				className={twMerge("flex min-h-0 grow flex-col-reverse overflow-x-hidden overflow-y-auto overscroll-contain px-[18px] py-[10px]", matchOnly && "justify-center [&_[data-match]]:mt-0!")}
			>
				{runs(messages).toReversed().map((run) => (
					<div key={run.key} className="chat-run relative flex shrink-0 flex-col-reverse">
						{run.messages.toReversed().map(({ message, day }, index, all) => (
							<Fragment key={messageKey(message)}>
								<Message editing={editing === message.id} first={index === all.length - 1} message={message} />
								{day && !matchOnly && <DayDivider value={day} />}
							</Fragment>
						))}
					</div>
				))}
				{more && <div className="h-px shrink-0" ref={sentinel} />}
				{loadingOlder && (
					<div className="flex shrink-0 justify-center py-4">
						<div className="size-6 animate-spin rounded-full border-2 border-theme-2 border-t-transparent" />
					</div>
				)}
			</div>
			<JumpToLatest className="absolute right-[18px] bottom-[10px]" />
		</div>
	);
};
