import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const {
	Link,
	permanentRedirect,
	redirect,
	usePathname,
	useRouter,
	getPathname
}
	= createNavigation(routing);
