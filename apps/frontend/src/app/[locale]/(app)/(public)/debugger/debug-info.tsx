"use client";

import { Clipboard } from "@capacitor/clipboard";
import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "~/components/button";
import { environment } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

export const DebugInfo: React.FC = () => {
	const t = useTranslations();

	const {
		userAgent: { ua },
		operatingSystem,
		nativePlatform,
		native,
		vision,
		deviceId,
		versions,
	} = useDevice();
	const locale = useLocale();

	const session = useOptionalSession();

	const data = JSON.stringify({
		at: new Date().toISOString(),
		environment,
		locale,
		user: session?.user.id || null,
		sudoerId: session?.sudoerId,
		deviceId,
		agent: ua,
		operatingSystem,
		platform: nativePlatform,
		native,
		vision,
		versions
	}, null, 2);

	return (
		<>
			<p>{t("bad_jumpy_sheep_gasp")}</p>
			<Button
				Icon={Copy}
				size="sm"
				onClick={() => Clipboard.write({ string: data })}
			>
				{t("copy")}
			</Button>
			<code className="select-text overflow-auto whitespace-pre-wrap text-xs">
				{data}
			</code>
		</>
	);
};
