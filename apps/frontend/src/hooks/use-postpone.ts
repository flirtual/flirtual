import { Postpone } from "next/dist/server/app-render/dynamic-rendering";
import React from "react";

import { isServer } from "~/const";
import { usePathname } from "~/i18n/navigation";

export function usePostpone(reason: string) {
	const route = usePathname();
	if (isServer) Postpone({ reason, route });
}
