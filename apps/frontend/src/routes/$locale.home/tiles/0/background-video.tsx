import { useTranslation } from "react-i18next";

import { Image } from "~/components/image";
import { urls } from "~/urls";

const posterUrl = urls.media("7d9eca06-b0d6-4d96-bdfc-b64c4edc59b7");

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
			poster={posterUrl}
		>
			<source
				src="https://static.flirtual.com/video.webm"
				type="video/webm; codecs=vp9"
			/>
			<source src="https://static.flirtual.com/video.mp4" type="video/mp4" />
			<Image
				priority
				alt={t("mellow_short_shark_propel")}
				src={posterUrl}
			/>
		</video>
	);
};
