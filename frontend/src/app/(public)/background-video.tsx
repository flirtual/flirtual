import { UCImage } from "~/components/uc-image";

export const BackgroundVideo: React.FC = () => (
	<video
		autoPlay
		disablePictureInPicture
		disableRemotePlayback
		loop
		muted
		playsInline
		className="absolute top-0 left-0 h-full w-full object-cover brightness-50"
		poster="https://media.flirtu.al/6be390d0-4479-4a98-8c7a-10257ea5585a/-/format/auto/-/quality/smart/-/resize/1920x/"
	>
		<source
			src="https://media.flirtu.al/300c30ee-6b22-48a7-8d40-dc0deaf673ed/video.webm"
			type="video/webm; codecs=vp9"
		/>
		<source
			src="https://media.flirtu.al/e67df8d2-295c-4bc0-9ebf-33f477267edd/video.mp4"
			type="video/mp4"
		/>
		<UCImage src="6be390d0-4479-4a98-8c7a-10257ea5585a" />
	</video>
);
