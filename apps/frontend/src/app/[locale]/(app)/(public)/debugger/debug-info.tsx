import { Clipboard } from "@capacitor/clipboard";
import { captureEvent } from "@sentry/react-router";
import { Copy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Button } from "~/components/button";
import { commitId, production } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { logout, useOptionalSession } from "~/hooks/use-session";
import { useLocale } from "~/i18n";
import { evictQueries, invalidate, restoreQueries, saveQueries } from "~/query";

export const DebugInfo: React.FC = () => {
	const { t } = useTranslation();

	const device = useDevice();
	const [locale] = useLocale();

	const [seeMore, setSeeMore] = useState(false);
	const session = useOptionalSession();

	const eventId = useMemo(() => captureEvent({ message: "Debug info" }), []);

	const data = useMemo(() => JSON.stringify({
		at: new Date().toISOString(),
		eventId,
		production,
		sha: commitId,
		locale,
		user: session?.user.id || null,
		sudoerId: session?.sudoerId,
		device
	}), [eventId, device, locale, session?.sudoerId, session?.user.id]);

	const copy = useCallback(() => Clipboard.write({ string: `\`\`\`json\n${data}\n\`\`\`` }), [data]);

	return (
		<>
			<p>{t("bad_jumpy_sheep_gasp")}</p>
			<Button
				Icon={Copy}
				onClick={copy}
			>
				{t("copy")}
			</Button>
			<code
				className={twMerge("cursor-pointer select-none overflow-auto whitespace-pre-wrap break-all text-left text-xs opacity-75", !seeMore && "line-clamp-3")}
				onClick={() => {
					setSeeMore(!seeMore);
					copy();
				}}
			>
				{data}
			</code>
			<div className="grid grid-cols-3 gap-2">
				<span className="col-span-3 font-semibold">App</span>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => window.location.reload()}
				>
					Reload
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => logout()}
				>
					Logout
				</Button>
				<span className="col-span-3 font-semibold">Cache</span>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => saveQueries()}
				>
					Write
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => restoreQueries()}
				>
					Restore
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={async () => {
						await evictQueries();
						await invalidate();
					}}
				>
					Clear
				</Button>
				<Button
					className="bg-red-500"
					size="xs"
					onClick={() => invalidate()}
				>
					Invalidate
				</Button>
			</div>
		</>
	);
};
