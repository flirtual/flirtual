import { Chatbox as TalkjsChatbox } from "@talkjs/react-components";
import type { CSSProperties, FC } from "react";

import { talkjsAppId } from "~/const";

import { theme } from "./theme";
import type { ThemeCustom } from "./theme";

import "@talkjs/react-components/default.css";
import "./theme.css";

export interface ChatboxProps {
	userId: string;
	conversationId: string | null;
	colorScheme: "dark" | "light";
	enterSendsMessage: boolean;
	fontSize: number;
	placeholder: string;
	themeCustom: ThemeCustom;
}

const Chatbox: FC<ChatboxProps> = ({ userId, conversationId, colorScheme, enterSendsMessage, fontSize, placeholder, themeCustom }) => (
	<TalkjsChatbox
		messageFieldSpellcheck
		style={{
			"--t-font-size-xs": `${fontSize - 4}px`,
			"--t-font-size-sm": `${fontSize - 2}px`,
			"--t-font-size-base": `${fontSize}px`,
			"--t-font-size-lg": `${fontSize + 2}px`
		} as CSSProperties}
		appId={talkjsAppId}
		chatHeaderVisible={false}
		className="size-full"
		colorScheme={colorScheme}
		conversationId={conversationId}
		enterSendsMessage={enterSendsMessage}
		messageFieldPlaceholder={placeholder}
		theme={theme}
		themeCustom={themeCustom}
		userId={userId}
	/>
);

export default Chatbox;
