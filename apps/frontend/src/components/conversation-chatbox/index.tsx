import { twemoji } from "@sableclient/twemoji-font/package.json";
import type Picker from "emoji-picker-element/picker";
import type { EmojiClickEvent } from "emoji-picker-element/shared";
import type { FC } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { ProspectKind } from "~/api/matchmaking";
import type { User } from "~/api/user";
import { customEmojis } from "~/components/chat/custom-emojis";
import { useDevice } from "~/hooks/use-device";
import { usePreferences } from "~/hooks/use-preferences";
import { useOptionalSession } from "~/hooks/use-session";
import { useTalkjs } from "~/hooks/use-talkjs";
import { useTheme } from "~/hooks/use-theme";
import { lazy } from "~/lazy";

import { customEmojiPickerEntries, pickedCustomEmoji } from "../chat/custom-emoji";
import { reactionEmojiVersion } from "../chat/emoji-favorites";
import emojiPickerStyles from "../chat/emoji-picker.css?inline";
import { followTabSwipes } from "../chat/emoji-tab-swipes";
import { frame } from "../chat/frame";
import { hideKeyboardOnScroll } from "../chat/keyboard";
import { anchorMessageLists } from "../chat/scroll-anchor";
import { followStickyAvatars } from "../chat/sticky-avatars";
import { followEditors, insertCustomEmoji } from "./custom-emoji-editor";
import { followReactionPickers } from "./reaction-picker";

const Chatbox = lazy(() => import("./chatbox").then(({ default: Chatbox }) => Chatbox));

const customEmojiPicker = customEmojiPickerEntries(customEmojis);

const emojiVersion = twemoji.version;
const reactionPickerEmojiVersion = String(Math.min(Number.parseFloat(emojiVersion), reactionEmojiVersion));

const swipeable = new WeakSet<Picker>();

// TalkJS mounts <emoji-picker> elements (message field, reactions) without a way to pass custom
// emoji (https://github.com/nolanlawson/emoji-picker-element#custom-emoji) or styles for their
// shadow roots.
function followEmojiPickers(element: HTMLElement) {
	const styles = new CSSStyleSheet();
	styles.replaceSync(emojiPickerStyles);

	const setUpPickers = () => {
		for (const picker of element.querySelectorAll<Picker>("emoji-picker")) {
			if (picker.customEmoji !== customEmojiPicker) picker.customEmoji = customEmojiPicker;
			const version = picker.closest(".t-reaction-picker") ? reactionPickerEmojiVersion : emojiVersion;
			if (picker.getAttribute("emoji-version") !== version) picker.setAttribute("emoji-version", version);
			picker.toggleAttribute("data-without-favorites", !!picker.closest("[data-message-menu]"));
			if (!swipeable.has(picker)) {
				swipeable.add(picker);
				followTabSwipes(picker);
			}

			const root = picker.shadowRoot;
			if (root && !root.adoptedStyleSheets.includes(styles))
				root.adoptedStyleSheets = [...root.adoptedStyleSheets, styles];
		}
	};

	// Runs before TalkJS's own listener on the message field's picker, which can't insert them.
	const onEmojiClick = (event: Event) => {
		const { target, detail } = event as EmojiClickEvent;
		const shortcode = pickedCustomEmoji(detail);
		const editor = target instanceof Element ? target.closest(".chat-message-field")?.querySelector(".chat-editor") : null;
		const input = editor?.querySelector<HTMLElement>("[contenteditable]");
		if (!shortcode || !editor || !input) return;

		event.stopPropagation();
		if (insertCustomEmoji(editor, shortcode)) return;
		input.focus();
		document.execCommand("insertText", false, shortcode);
	};

	setUpPickers();
	const observer = new MutationObserver(setUpPickers);
	observer.observe(element, { childList: true, subtree: true });
	element.addEventListener("emoji-click", onEmojiClick, { capture: true });

	return () => {
		observer.disconnect();
		element.removeEventListener("emoji-click", onEmojiClick, { capture: true });
	};
}

function followChatbox(element: HTMLDivElement) {
	const stopEmoji = followEmojiPickers(element);
	const stopAvatars = followStickyAvatars(element);
	const stopReactionPickers = followReactionPickers(element);
	const stopAnchors = anchorMessageLists(element);
	const stopEditors = followEditors(element);
	const stopKeyboard = hideKeyboardOnScroll(element);

	return () => {
		stopEmoji();
		stopAvatars();
		stopReactionPickers();
		stopAnchors();
		stopEditors();
		stopKeyboard();
	};
}

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
			className={twMerge(frame, className)}
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
