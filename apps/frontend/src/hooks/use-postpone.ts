// @ts-expect-error: Next.js doesn't provide types for this.
import { parse } from "next/dist/compiled/stacktrace-parser";
import { Postpone } from "next/dist/server/app-render/dynamic-rendering";

import { server } from "~/const";
import { usePathname } from "~/i18n/navigation";
import { log as _log } from "~/log";

const log = _log.extend("rendering");

export function usePostpone(reason: string) {
	const route = usePathname();

	if (server) {
		// eslint-disable-next-line unicorn/error-message
		const error = new Error();

		let methodNames = (parse(error.stack) as Array<{ methodName: string }>).map(({ methodName }) => methodName);
		methodNames = methodNames.slice(1, methodNames.indexOf("react-stack-bottom-frame"));

		log(`${route} postponed rendering due to ${reason}:\n${methodNames.map((methodName) => `  at ${methodName}`).join("\n")}`);
		Postpone({ reason, route });
	}
}
