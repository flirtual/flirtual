import { Clipboard } from "@capacitor/clipboard";
import { Copy } from "lucide-react";

import { Button } from "~/components/button";
import { environment } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { logout, useOptionalSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";
import { evictQueries, invalidate, restoreQueries, saveQueries } from "~/query";

export const DebugInfo: React.FC = () => {
	const { t } = useTranslation();

	const {
		userAgent,
		operatingSystem,
		nativePlatform,
		native,
		vision,
		deviceId,
		versions,
	} = useDevice();
	const [locale] = useLocale();

	const session = useOptionalSession();

	const data = JSON.stringify({
		at: new Date().toISOString(),
		environment,
		locale,
		user: session?.user.id || null,
		sudoerId: session?.sudoerId,
		deviceId,
		agent: userAgent,
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
				onClick={() => Clipboard.write({ string: data })}
			>
				{t("copy")}
			</Button>
			<code className="select-text overflow-auto whitespace-pre-wrap text-xs">
				{data}
			</code>
			<p>
				Internal tools, avoid touching this unless you know what you're doing. You may break something.
			</p>
			<div className="flex flex-wrap gap-2">
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => saveQueries()}
				>
					Save queries
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => restoreQueries()}
				>
					Restore queries
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => evictQueries()}
				>
					Evict queries
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => invalidate()}
				>
					Invalidate queries
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => window.location.reload()}
				>
					Reload app
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => logout()}
				>
					Logout
				</Button>
			</div>
		</>
	);
};
