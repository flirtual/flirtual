/* eslint-disable react-hooks/rules-of-hooks */
// @ts-expect-error: Next.js doesn't provide types for this.
import { parse } from "next/dist/compiled/stacktrace-parser";
import { Postpone } from "next/dist/server/app-render/dynamic-rendering";

import { server } from "~/const";
import { usePathname, useSelectedLayoutSegments } from "~/i18n/navigation";
import { logRendering } from "~/log";

const debug = false;

export function postpone(reason: string) {
	if (server) {
		const pathname = usePathname();
		const route = useSelectedLayoutSegments().join("/") || pathname;

		if (debug) {
			// eslint-disable-next-line unicorn/error-message
			const error = new Error();

			let methodNames = (parse(error.stack) as Array<{ methodName: string }>).map(({ methodName }) => methodName);
			methodNames = methodNames.slice(1, methodNames.indexOf("react-stack-bottom-frame"));

			logRendering(`${route} postponed rendering due to ${reason}:\n${methodNames.map((methodName) => `  at ${methodName}`).join("\n")}`);
		}

		Postpone({ reason, route });
	}
}
