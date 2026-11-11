import type Picker from "emoji-picker-element/picker";
import type { EmojiClickEvent } from "emoji-picker-element/shared";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { ProspectKind } from "~/api/matchmaking";
import type { User } from "~/api/user";
import * as brand from "~/brand";
import { useDevice } from "~/hooks/use-device";
import { usePreferences } from "~/hooks/use-preferences";
import { useOptionalSession } from "~/hooks/use-session";
import { customEmojis, useTalkjs } from "~/hooks/use-talkjs";
import { useTheme } from "~/hooks/use-theme";
import { lazy } from "~/lazy";

import { customEmojiPickerEntries, pickedCustomEmoji } from "./custom-emoji";
import { followStickyAvatars } from "./sticky-avatars";

const Chatbox = lazy(() => import("./chatbox").then(({ default: Chatbox }) => Chatbox));

const customEmojiPicker = customEmojiPickerEntries(customEmojis, brand.name);

// TalkJS mounts <emoji-picker> elements (message field, reactions) without a way to pass custom
// emoji: https://github.com/nolanlawson/emoji-picker-element#custom-emoji
function followCustomEmojiPickers(element: HTMLElement) {
	const addCustomEmoji = () => {
		for (const picker of element.querySelectorAll<Picker>("emoji-picker"))
			if (picker.customEmoji !== customEmojiPicker) picker.customEmoji = customEmojiPicker;
	};

	// Runs before TalkJS's own listener on the message field's picker, which can't insert them.
	const insertCustomEmoji = (event: Event) => {
		const { target, detail } = event as EmojiClickEvent;
		const shortcode = pickedCustomEmoji(detail);
		const editor = element.querySelector<HTMLElement>(".chat-editor [contenteditable]");
		if (!shortcode || !editor || !(target instanceof Element) || !target.closest(".chat-message-field")) return;

		event.stopPropagation();
		editor.focus();
		document.execCommand("insertText", false, shortcode);
	};

	addCustomEmoji();
	const observer = new MutationObserver(addCustomEmoji);
	observer.observe(element, { childList: true, subtree: true });
	element.addEventListener("emoji-click", insertCustomEmoji, { capture: true });

	return () => {
		observer.disconnect();
		element.removeEventListener("emoji-click", insertCustomEmoji, { capture: true });
	};
}

function followChatbox(element: HTMLDivElement) {
	const stopEmoji = followCustomEmojiPickers(element);
	const stopAvatars = followStickyAvatars(element);

	return () => {
		stopEmoji();
		stopAvatars();
	};
}

// The chatbox fills the viewport below the conversation header, any banner and the navigation.
const height = [
	"[--chatbox-header:max(var(--status-bar-height,0rem),calc(max(calc(var(--status-bar-inset-top,var(--safe-area-inset-top,0rem))_+_0.25rem),0.75rem)_+_3.375rem))]",
	"split:[--chatbox-header:calc(var(--safe-area-inset-top,0rem)_+_4rem)]",
	"[--chatbox-below:calc(max(calc(var(--safe-area-inset-bottom,0rem)_-_0.25rem),0.5rem)_+_4rem)]",
	// Natively, the composer's own padding sits in the safe area, overlapping the space reserved for
	// it. Above a tab bar along the bottom, that padding counts towards the gap kept from the bar.
	"native-nav:[--chatbox-below:max(calc(var(--safe-area-inset-bottom,0rem)_-_0.75rem_+_var(--tab-bar-gap,0rem)),0rem)]",
	// The layout pulls the page up under a banner, into the top safe area the banner already pads.
	"[--chatbox-banner:max(0rem,calc(var(--banner-height,0rem)_+_min(0rem,calc(0.5rem_-_var(--safe-area-inset-top,0rem)))))]",
	"h-[calc(100dvh_-_var(--chatbox-banner)_-_var(--chatbox-header)_-_var(--chatbox-below))]",
	"vision:h-[calc(100dvh_-_8.125rem)]"
].join(" ");

export const ConversationChatbox: FC<
	{
		conversationId: string | null;
		participant?: User;
		kind?: ProspectKind;
	} & React.ComponentProps<"div">
> = ({ conversationId, participant, kind, className, ...props }) => {
	const session = useOptionalSession();
	const talkjs = useTalkjs();

	const [theme] = useTheme();
	const { native, vision } = useDevice();
	const { t } = useTranslation();
	const [fontSize] = usePreferences<number>("font_size", 16);

	const me = session?.user;
	const themeCustom = useMemo(() => ({
		matchMessage: t("talkjs_match_message"),
		people: Object.fromEntries([me, participant].filter((user) => !!user).map((user) => [user.talkjsId, user])),
		match: me && participant && kind ? { kind, me, participant } : undefined
	}), [t, me, participant, kind]);

	const talkjsUserId = session?.user.talkjsId;

	return (
		<div
			data-block
			data-chatbox
			className={twMerge(height, "relative w-full overflow-hidden bg-white-20 dark:bg-black-70 vision:bg-transparent native-nav:-mb-[min(var(--safe-area-inset-bottom,0rem),0.75rem)] tab-bar-bottom:mb-0 desktop:mb-0 desktop:max-h-152 desktop:rounded-xl desktop:pt-0 desktop:before:pointer-events-none desktop:before:absolute desktop:before:inset-0 desktop:before:z-10 desktop:before:size-full desktop:before:rounded-xl desktop:before:shadow-brand-inset desktop:before:content-['']", className)}
			{...props}
			ref={followChatbox}
		>
			{talkjs && talkjsUserId && (
				<Chatbox
					colorScheme={vision ? "dark" : theme}
					conversationId={conversationId}
					enterSendsMessage={!native}
					fontSize={fontSize}
					placeholder={t("talkjs_input_placeholder", { name: participant?.profile.displayName || t("unnamed_user") })}
					themeCustom={themeCustom}
					userId={talkjsUserId}
				/>
			)}
		</div>
	);
};
