import { useTranslations } from "next-intl";
import Image from "next/image";

import { urls } from "~/urls";

export function LoadingIndicator() {
	const t = useTranslations();

	return (
		<div className="flex min-h-[80vh] w-full items-center justify-center opacity-75">
			<Image
				priority
				alt={t("meta.name")}
				className="hidden w-1/2 max-w-sm animate-pulse vision:block dark:block"
				height={1000}
				src={urls.media("flirtual-white.svg", "files")}
				width={3468}
			/>
			<Image
				priority
				alt={t("meta.name")}
				className="block w-1/2 max-w-sm animate-pulse vision:hidden dark:hidden"
				height={1000}
				src={urls.media("flirtual-black.svg", "files")}
				width={3468}
			/>
		</div>
	);
}
