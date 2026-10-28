import { useTranslation } from "react-i18next";

import { Image } from "~/components/image";
import PosterImage from "~/static/home/hero-poster.png";
import VideoMp4 from "~/static/home/hero.mp4";
import VideoWebm from "~/static/home/hero.webm";

export const BackgroundVideo: React.FC = () => {
	const { t } = useTranslation();

	return (
		<video
			autoPlay
			disablePictureInPicture
			disableRemotePlayback
			loop
			muted
			playsInline
			className="absolute left-0 top-0 size-full object-cover brightness-50"
			poster={PosterImage}
		>
			<source src={VideoWebm} type="video/webm; codecs=vp9" />
			<source src={VideoMp4} type="video/mp4" />
			<Image
				priority
				alt={t("landing_dates_alt")}
				src={PosterImage}
			/>
		</video>
	);
};
