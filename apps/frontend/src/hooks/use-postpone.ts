import { Postpone } from "next/dist/server/app-render/dynamic-rendering";

import { server } from "~/const";
import { usePathname } from "~/i18n/navigation";
import { log as _log } from "~/log";

const log = _log.extend("rendering");

export function usePostpone(reason: string) {
	const route = usePathname();

	if (server) {
		log("%s used %s, which postpones rendering.", route, reason);
		Postpone({ reason, route });
	}
}
