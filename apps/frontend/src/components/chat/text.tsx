import type { FC } from "react";
import { Fragment } from "react";

import { isKlipyMedia } from "~/api/embed";

import { jumboEmojiSegments, splitEmoji } from "./custom-emoji";
import { customEmojiNames } from "./custom-emojis";
import { CustomEmoji, Twemoji } from "./emoji";
import { LinkEmbeds } from "./link-embed";
import { messageLinks, soleLink } from "./links";
import type { MarkupNode } from "./markup";

function renderNode(node: MarkupNode, interactive: boolean, key: number) {
	if (typeof node === "string") return <Fragment key={key}>{node}</Fragment>;

	switch (node.type) {
		case "bold":
			return <strong key={key} className="font-bold"><Markup interactive={interactive} nodes={node.children} /></strong>;
		case "italic":
			return <em key={key}><Markup interactive={interactive} nodes={node.children} /></em>;
		case "strikethrough":
			return <s key={key}><Markup interactive={interactive} nodes={node.children} /></s>;
		case "autoLink":
			return interactive
				? <a key={key} className="break-all text-inherit underline" href={node.url} rel="noopener noreferrer" target="_blank">{node.text}</a>
				: <Fragment key={key}>{node.text}</Fragment>;
		case "bulletList":
			return interactive
				? <ul key={key} className="m-0 list-disc pl-0"><Markup nodes={node.children} /></ul>
				: <Markup key={key} interactive={false} nodes={node.children} />;
		case "bulletPoint":
			return interactive
				? <li key={key} className="mb-1 ml-4 last:mb-0"><Markup nodes={node.children} /></li>
				: (
						<Fragment key={key}>
							<Markup interactive={false} nodes={node.children} />
							{" "}
						</Fragment>
					);
	}
}

export const Markup: FC<{ nodes: Array<MarkupNode>; interactive?: boolean }> = ({ nodes, interactive = true }) => (
	<>{nodes.map((node, index) => renderNode(node, interactive, index))}</>
);

export const MessageText: FC<{ nodes: Array<MarkupNode>; gif: { width: number; height: number } | null }> = ({ nodes, gif }) => {
	const links = messageLinks(nodes);
	const sole = soleLink(nodes);
	const textShown = !sole || !isKlipyMedia(sole);

	return (
		<>
			{textShown && (
				<div className="contents">
					{jumboEmojiSegments(splitEmoji(nodes, customEmojiNames)).map((segment, index) => {
						/* eslint-disable react/no-array-index-key */
						if (segment.type === "emoji") return <CustomEmoji key={index} name={segment.name} />;
						if (segment.type === "twemoji") return <Twemoji key={index} codepoints={segment.codepoints} text={segment.text} />;
						return <span key={index} className="whitespace-pre-wrap"><Markup nodes={segment.children} /></span>;
						/* eslint-enable react/no-array-index-key */
					})}
				</div>
			)}
			{links.length > 0 && <LinkEmbeds gifSize={gif ? { width: String(gif.width), height: String(gif.height) } : undefined} links={links} />}
		</>
	);
};
