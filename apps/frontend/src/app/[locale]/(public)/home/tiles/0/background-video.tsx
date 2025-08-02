import { useTranslation } from "react-i18next";
import PosterImage from "virtual:remote/7d9eca06-b0d6-4d96-bdfc-b64c4edc59b7";
import VideoMp4 from "virtual:remote/video.mp4";
import VideoWebm from "virtual:remote/video.webm";

import { Image } from "~/components/image";

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
				alt={t("mellow_short_shark_propel")}
				src={PosterImage}
			/>
		</video>
	);
};
