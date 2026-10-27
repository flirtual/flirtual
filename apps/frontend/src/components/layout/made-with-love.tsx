import { useState } from "react";
import { Trans } from "react-i18next";

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
	const [heart, setHeart] = useState(hearts[0]!);

	const updateHeart = () =>
		setHeart(hearts[Math.floor(Math.random() * hearts.length)]!);

	return (
		<span className="group hidden desktop:inline" onMouseEnter={updateHeart}>
			<Trans
				components={{
					action: (
						<button
							className="inline-block w-[1.5em] origin-center transition-transform duration-200 group-hover:scale-125"
							type="button"
							onClick={updateHeart}
						/>
					)
				}}
				i18nKey="footer_made_with_love"
				values={{ heart }}
			/>
		</span>
	);
};
