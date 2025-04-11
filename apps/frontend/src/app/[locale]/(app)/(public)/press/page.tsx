import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ButtonLink } from "~/components/button";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { PressItem } from "./press-item";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations();

	return {
		title: t("press")
	};
}

export default async function PressPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const { locale } = await params;
	const t = await getTranslations();

	return (
		<ModelCard
			className="w-full desktop:max-w-2xl"
			containerProps={{ className: "gap-8" }}
			title={t("press")}
		>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("press_kit")}
				</span>
				<ButtonLink
					download
					className="w-fit"
					href={urls.media("presskit.zip", "files")}
				>
					{t("download")}
				</ButtonLink>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("contact_us")}
				</span>
				<ButtonLink className="w-fit" href={urls.resources.pressEmail}>
					{urls.resources.pressEmail.split(":")[1]}
				</ButtonLink>
			</div>
			<div className="flex flex-col gap-4">
				<span className="text-2xl font-semibold">
					{t("newsroom")}
				</span>
				<div className="flex flex-col gap-4">
					{[
						{
							name: "How to find love in a virtual world",
							href: "https://www.cbc.ca/newsinteractives/features/ottawa-metaverse-vr-dating",
							site: "CBC News",
							date: new Date("5 December 2022")
						},
						// locale === "ko" && ({
						// 	name: "데이트 시장까지 노리는 메타버스 … 새로운 트렌드 만들까?",
						// 	href: "https://www.metanews.co.kr/news/articleView.html?idxno=16941",
						// 	site: "페타뉴스",
						// 	date: new Date("25 August 2022")
						// }),
						{
							name: "‘Phantom Touch’ and the (Real) Pleasures of Virtual Dating",
							href: "https://www.nytimes.com/2022/08/18/style/virtual-dating-metaverse.html",
							site: "The New York Times",
							date: new Date("18 August 2022")
						},
						// locale === "es"
						// 	? {
						// 			name: "Amor en el metaverso: compañías de citas se meten de lleno en la realidad virtual",
						// 			href: "https://forbes.pe/negocios/2022-08-12/amor-en-el-metaverso-companias-de-citas-se-meten-de-lleno-en-la-realidad-virtual-%ef%bf%bc",
						// 			site: "Forbes",
						// 			date: new Date("12 August 2022")
						// 		}
						// : {
						{
							name: "Looking For Love In The Metaverse",
							href: "https://www.forbes.com/sites/davidwestenhaver/2022/08/07/looking-for-love-in-the-metaverse/",
							site: "Forbes",
							date: new Date("7 August 2022")
						},
						{
							name: "Flirt-ual reality: How people are dating in the Metaverse",
							href: "https://www.today.com/video/how-people-are-looking-for-love-in-the-metaverse-145313861770",
							site: "The Today Show",
							date: new Date("2 August 2022")
						},
						// locale === "fr" && ({
						// 	name: "J'ai interviewé un des créateurs de Flirtual, le premier site de rencontre en VR",
						// 	href: "https://www.tiktok.com/@l_nny/video/7104206153416051974",
						// 	site: "L_nny",
						// 	date: new Date("1 June 2022")
						// }),
						{
							name: "Flirt in the Metaverse and Hook Up in the Real World With ‘Flirtual’ Dating App",
							href: "https://virtualrealitytimes.com/2022/05/06/flirt-in-the-metaverse-and-hook-up-in-the-real-world-with-flirtual-dating-app/",
							site: "Virtual Reality Times",
							date: new Date("6 May 2022")
						},
						locale === "ja" && ({
							name: "海外発、ソーシャルVR向けマッチングアプリ「Flirtual」って知ってる？",
							href: "https://metacul-frontier.com/?p=689",
							site: "メタカル最前線",
							date: new Date("5 May 2022")
						}),
						{
							name: "A Dating App for Meeting Avatars in VR Aims to Build Very Real Relationships",
							href: "https://www.roadtovr.com/flirtual-vr-dating-app-tinder-for-virtual-reality/",
							site: "Road to VR",
							date: new Date("3 May 2022")
						},
						{
							name: "What Will Make Virtual Reality Dating Go Mainstream?",
							href: "https://futureofsex.net/dating-relationships/what-will-make-virtual-reality-dating-go-mainstream/",
							site: "Future of Sex",
							date: new Date("22 April 2021")
						},
						{
							name: "Bond Touch Bracelets and the New Frontiers of Digital Dating",
							href: "https://www.newyorker.com/culture/culture-desk/bond-touch-bracelets-and-the-new-frontiers-of-digital-dating",
							site: "The New Yorker",
							date: new Date("2 January 2020")
						},
						{
							name: "Virtual Reality for Dating discussed at the iDate Dating Industry Conference on Jan 31 - Feb 1, 2019 in Florida",
							href: "https://www.webwire.com/ViewPressRel.asp?aId=233678",
							site: "WebWire",
							date: new Date("17 January 2019")
						},
						{
							name: "Dating Website Celebrates 2000 Users",
							href: "https://sites.google.com/view/virtual-week-ality/july-25th-2018/dating-website-celebrates-2000-users",
							site: "Virtual Week-ality",
							date: new Date("25 July 2018")
						}
					].map((item) => (
						item && <PressItem {...item} key={`${item.date}/${item.name}`} />
					))}
				</div>
			</div>
		</ModelCard>
	);
}
