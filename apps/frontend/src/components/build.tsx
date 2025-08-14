import { useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import { commitIdShort, commitUrl } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { lazy } from "~/lazy";

import { Link } from "./link";

const DeviceInformation: FC = withSuspense(lazy(async () => () => {
	const { id: deviceId, userAgent, native } = useDevice();

	return (
		<>
			<span>{userAgent}</span>
			<span>{deviceId}</span>
			{native && <span>Native</span>}
		</>
	);
}));

export const BuildInformation: FC = () => {
	const [hidden, setHidden] = useState(false);
	const { t } = useTranslation();

	if (hidden) return null;

	return (
		<button className="absolute bottom-20 right-0 flex max-w-lg flex-col items-end justify-center px-4 py-3 text-right text-xs text-black-90 opacity-75 dark:text-white-10 desktop:bottom-[unset] desktop:top-20" type="button" onClick={() => setHidden(true)}>
			<Link href={commitUrl}>{t("version", { version: commitIdShort })}</Link>
			<DeviceInformation />
		</button>
	);
};
