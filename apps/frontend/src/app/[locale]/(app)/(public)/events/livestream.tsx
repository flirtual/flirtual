"use client";

import { useEffect, useRef, useState } from "react";

export const Livestream: React.FC = () => {
	const [live, setLive] = useState(false);
	const videoReference = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		const video = videoReference.current;

		const handleLoadedData = () => {
			setLive(true);
		};

		if (video) {
			video.addEventListener("loadeddata", handleLoadedData);
			video.load();

			return () => {
				video.removeEventListener("loadeddata", handleLoadedData);
			};
		}
	}, []);

	return (
		<div className={live ? "flex flex-col gap-4" : "hidden"}>
			<h1 className="text-2xl font-semibold">Live</h1>
			<video
				controls
				ref={videoReference}
				src="https://stream.vrcdn.live/live/flirtual.live.mp4"
			/>
		</div>
	);
};
