"use client";

import { useEffect, useState } from "react";

const hearts = [
	"♥︎",
	"🩷",
	"❤️",
	"🧡",
	"💛",
	"💚",
	"🩵",
	"💙",
	"💜",
	"🖤",
	"🩶",
	"🤍",
	"🤎",
	"❤️‍🔥",
	"❤️‍🩹",
	"❣️",
	"💕",
	"💞",
	"💓",
	"💗",
	"💖",
	"💘",
	"💝",
	"💟",
	"♥️",
	"💌",
	"🫀",
	"🫶"
];

export const MadeWithLove: React.FC = () => {
	const [heart, setHeart] = useState(hearts[0]);

	const updateHeart = () =>
		setHeart(hearts[Math.floor(Math.random() * hearts.length)]!);

	useEffect(() => () => setHeart(hearts[0]), []);

	return (
		<span className="group hidden desktop:inline" onMouseEnter={updateHeart}>
			Made with{" "}
			<button
				type="button"
				onClick={updateHeart}
				className="inline-block w-[1.5em] origin-center transition-transform duration-200 group-hover:scale-125"
			>
				{heart}
			</button>{" "}
			in VR
		</span>
	);
};
