import { useTranslations } from "next-intl";

import { Image } from "~/components/image";
import { urls } from "~/urls";

export const BackgroundVideo: React.FC = () => {
	const t = useTranslations();

	return (
		<video
			autoPlay
			disablePictureInPicture
			disableRemotePlayback
			loop
			muted
			playsInline
			className="absolute left-0 top-0 size-full object-cover brightness-50"
			poster="https://static.flirtual.com/6be390d0-4479-4a98-8c7a-10257ea5585a"
		>
			<source
				src="https://static.flirtual.com/video.webm"
				type="video/webm; codecs=vp9"
			/>
			<source src="https://static.flirtual.com/video.mp4" type="video/mp4" />
			<Image
				fill
				priority
				alt={t("mellow_short_shark_propel")}
				src={urls.media("6be390d0-4479-4a98-8c7a-10257ea5585a")}
			/>
		</video>
	);
};
