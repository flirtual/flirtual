const characterMap: { [key: string]: string } = {
	"@": "＠",
	"#": "＃",
	$: "＄",
	"%": "％",
	"&": "＆",
	"=": "＝",
	"+": "＋",
	"/": "⁄",
	"\\": "＼",
	";": ";",
	":": "˸",
	",": "‚",
	"?": "?",
	"!": "ǃ",
	'"': "＂",
	"<": "≺",
	">": "≻",
	".": "․",
	"^": "＾",
	"{": "｛",
	"}": "｝",
	"[": "［",
	"]": "］",
	"(": "（",
	")": "）",
	"|": "｜",
	"*": "∗"
};

export function escapeVRChat(value: string): string {
	return [...value].map((char) => characterMap[char] || char).join("");
}
