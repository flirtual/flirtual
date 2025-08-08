import { Chrome, RotateCw, Smartphone, WifiOff } from "lucide-react";
import { m } from "motion/react";
import { Trans, useTranslation } from "react-i18next";

import { urls } from "~/urls";

import { Link } from "../link";

export function LongerThanUsual() {
	const { t } = useTranslation();

	return (
		<m.div
			key="longer-than-usual"
			animate={{ opacity: 1, y: 0 }}
			className="flex w-full max-w-md flex-col gap-4 px-4 pt-8"
			initial={{ opacity: 0, y: -20 }}
		>
			<p className="font-semibold">{t("crisp_lime_raven_arise")}</p>
			<ul className="ml-4 flex list-disc flex-col gap-2">
				<li>
					<Trans
						components={{
							icon: <WifiOff className="inline-block size-4 shrink-0" />
						}}
						i18nKey="tough_sleek_wasp_reside"
					/>
				</li>
				<li>{t("game_vexed_goldfish_dash")}</li>
				<li>
					<Trans
						components={{
							"browser-icon": <Chrome className="inline-block size-4 shrink-0" />,
							"device-icon": <Smartphone className="inline-block size-4 shrink-0" />
						}}
						i18nKey="sweet_strong_poodle_endure"
					/>
				</li>
				<li>
					<button
						className="underline"
						type="button"
						onClick={() => location.reload()}
					>
						<RotateCw className="mr-1 inline-block size-4 shrink-0" />
						{t("refresh_the_app")}
					</button>
				</li>
				<li>
					<Trans
						components={{
							contact: (
								<Link
									className="whitespace-nowrap lowercase underline"
									href={urls.resources.contact}
								/>
							)
						}}
						i18nKey="yummy_salty_porpoise_greet"
					/>
				</li>
			</ul>
		</m.div>
	);
}
