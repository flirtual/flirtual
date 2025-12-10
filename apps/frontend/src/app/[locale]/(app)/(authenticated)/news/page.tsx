import { useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { NewsDialog } from "~/components/modals/news";
import { newsItems } from "~/components/modals/news-items/index";
import { ModelCard } from "~/components/model-card";
import { i18n } from "~/i18n";
import { isLocale } from "~/i18n/languages";
import { metaMerge, rootMeta } from "~/meta";

import type { Route } from "./+types/page";

export const meta: Route.MetaFunction = (options) => {
	invariant(isLocale(options.params.locale));
	const t = i18n.getFixedT(options.params.locale);

	return metaMerge([
		...rootMeta(options),
		{ title: t("page_title", { name: t("updates") }) }
	]);
};

const publicNews = [
	"2024_wrapped",
	"2024_100k",
	"2024_homies_day",
	"2023_apps_themes",
	"2023_matchmaking",
	"2023_rewrite"
] as const;

export default function NewsPage() {
	const { t } = useTranslation();
	const [selectedNews, setSelectedNews] = useState<string | null>(null);

	return (
		<>
			<ModelCard
				className="desktop:max-w-3xl"
				inset={false}
				title={t("updates")}
			>
				<div className="flex flex-col gap-4">
					{publicNews.map((news) => (
						<button
							key={news}
							className="flex flex-col gap-1 rounded-xl bg-white-30 p-4 text-left shadow-brand-1 transition-colors hover:bg-white-40 vision:bg-white-10/50 vision:hover:bg-white-20/50 dark:bg-black-60 dark:hover:bg-black-50"
							type="button"
							onClick={() => setSelectedNews(news)}
						>
							<span className="font-montserrat font-semibold">
								{t(`news.${news}.title`)}
							</span>
							<span className="text-sm text-black-50 dark:text-white-40">
								{new Date(newsItems[news].date).toLocaleDateString(undefined, {
									year: "numeric",
									month: "long",
									day: "numeric",
									timeZone: "UTC"
								})}
							</span>
						</button>
					))}
				</div>
			</ModelCard>

			{selectedNews && (
				<NewsDialog
					news={[selectedNews]}
					onClose={() => setSelectedNews(null)}
				/>
			)}
		</>
	);
}
