"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

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
	const t = useTranslations();
	const [heart, setHeart] = useState(hearts[0]);

	const updateHeart = () =>
		setHeart(hearts[Math.floor(Math.random() * hearts.length)]!);

	return (
		<span className="group hidden desktop:inline" onMouseEnter={updateHeart}>
			{t.rich("deft_raw_cod_fond", {
				heart,
				action: (children) => (
					<button
						className="inline-block w-[1.5em] origin-center transition-transform duration-200 group-hover:scale-125"
						type="button"
						onClick={updateHeart}
					>
						{children}
					</button>
				)
			})}
		</span>
	);
};
