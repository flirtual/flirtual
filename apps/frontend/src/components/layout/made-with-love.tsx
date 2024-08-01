"use client";

import { useEffect, useState } from "react";

export const MadeWithLove: React.FC = () => {
	const [heart, setHeart] = useState("♥︎");
	const hearts = [
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

	const updateHeart = () => {
		setHeart(hearts[Math.floor(Math.random() * hearts.length)]!);
	};

	useEffect(() => {
		return () => {
			setHeart("♥︎");
		};
	}, []);

	return (
		<span className="group hidden desktop:inline" onMouseEnter={updateHeart}>
			Made with{" "}
			<span className="inline-block origin-center transition-transform duration-200 group-hover:scale-125">
				{heart}
			</span>{" "}
			in VR
		</span>
	);
};
