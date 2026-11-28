import EmojiBonk from "~/static/emoji/bonk.gif";
import EmojiChad from "~/static/emoji/chad.png";
import EmojiCool from "~/static/emoji/cool.png";
import EmojiCupid from "~/static/emoji/cupid.png";
import EmojiDj from "~/static/emoji/dj.png";
import EmojiEtto from "~/static/emoji/etto.png";
import EmojiEw from "~/static/emoji/ew.png";
import EmojiHeadphones from "~/static/emoji/headphones.gif";
import EmojiLong from "~/static/emoji/long.png";
import EmojiNerd from "~/static/emoji/nerd.png";
import EmojiPat from "~/static/emoji/pat.gif";
import EmojiPatient from "~/static/emoji/patient.png";
import EmojiPride from "~/static/emoji/pride.png";
import EmojiRose from "~/static/emoji/rose.png";
import EmojiThink from "~/static/emoji/think.png";
import EmojiThumbsup from "~/static/emoji/thumbsup.png";
import EmojiYonk from "~/static/emoji/yonk.png";
import EmojiFlirtual from "~/static/icon-color.svg?w=64&h=64&fit=contain&background=transparent&imagetools";
import EmojiDeveloper from "~/static/mascot-hardhat.png?w=64&h=64&fit=contain&background=transparent&imagetools";

const emojis: Array<{ name: string; url: string; hidden?: boolean }> = [
	{ name: "bonk", url: EmojiBonk },
	{ name: "chad", url: EmojiChad },
	{ name: "cool", url: EmojiCool },
	{ name: "cupid", url: EmojiCupid },
	{ name: "developer", url: EmojiDeveloper },
	{ name: "dj", url: EmojiDj },
	{ name: "etto", url: EmojiEtto },
	{ name: "ew", url: EmojiEw },
	{ name: "flirtual", url: EmojiFlirtual },
	{ name: "headphones", url: EmojiHeadphones },
	{ name: "long", url: EmojiLong },
	{ name: "nerd", url: EmojiNerd },
	{ name: "pat", url: EmojiPat },
	{ name: "patient", url: EmojiPatient },
	{ name: "pride", url: EmojiPride },
	{ name: "rose", url: EmojiRose },
	{ name: "think", url: EmojiThink },
	{ name: "thumbsup", url: EmojiThumbsup },
	{ name: "yonk", url: EmojiYonk }
];

export const customEmojis = Object.fromEntries(
	emojis.map(({ name, url, hidden = false }) => [
		`:${name}:`,
		{
			url,
			hidden
		}
	])
);

export const customEmojiNames: ReadonlySet<string> = new Set(Object.keys(customEmojis));
