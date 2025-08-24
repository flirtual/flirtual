// import { defaultLocale, i18n } from "~/i18n";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";
import { ReportView } from "./report-view";

export const meta: Route.MetaFunction = (options) => {
	// const t = i18n.getFixedT(options.params.locale ?? defaultLocale);
	return metaMerge([...rootMeta(options), { title: "Reports" }]);
};

export default function ReportPage() {
	return <ReportView />;
}
