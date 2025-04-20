/* eslint-disable no-restricted-imports */
import { createNavigation } from "next-intl/navigation";

import { log as _log } from "~/log";

import { routing } from "./routing";

const log = _log.extend("navigation");

export const {
	Link,
	permanentRedirect,
	redirect: _redirect,
	usePathname,
	useRouter,
	getPathname
}
	= createNavigation(routing);

export function redirect(options: Parameters<typeof _redirect>[0]) {
	log("%s(%O)", redirect.name, options);
	return _redirect(options);
}

export {
	useParams,
	useSearchParams
} from "next/navigation";
