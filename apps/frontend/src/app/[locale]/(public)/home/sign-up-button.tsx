"use client";

import { Cat } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import useSound from "use-sound";

import { ButtonLink } from "~/components/button";
import { FlirtualMark } from "~/components/mark";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const SignUpButton: FC<{ tabIndex?: number }> = ({ tabIndex }) => {
	const { t } = useTranslation ();
	const { receptive_fairies_legal_thumb: flittyMessages } = {};// useMessages();
	const toasts = useToast();

	const [squeak] = useSound(urls.media("squeak.mp3"));
	const [squeakCount, setSqueakCount] = useState(0);

	/*
	t("receptive_fairies_legal_thumb.0");
	t("receptive_fairies_legal_thumb.1");
	t("receptive_fairies_legal_thumb.2");
	t("receptive_fairies_legal_thumb.3");
	t("receptive_fairies_legal_thumb.4");
	t("receptive_fairies_legal_thumb.5");
	t("receptive_fairies_legal_thumb.6");
	t("receptive_fairies_legal_thumb.7");
	t("receptive_fairies_legal_thumb.8");
	t("receptive_fairies_legal_thumb.9");
	t("receptive_fairies_legal_thumb.10");
	t("receptive_fairies_legal_thumb.11");
	t("receptive_fairies_legal_thumb.12");
	t("receptive_fairies_legal_thumb.13");
	t("receptive_fairies_legal_thumb.14");
	t("receptive_fairies_legal_thumb.15");
	t("receptive_fairies_legal_thumb.16");
	t("receptive_fairies_legal_thumb.17");
	t("receptive_fairies_legal_thumb.18");
	t("receptive_fairies_legal_thumb.19");
	t("receptive_fairies_legal_thumb.20");
	t("receptive_fairies_legal_thumb.21");
	t("receptive_fairies_legal_thumb.22");
	t("receptive_fairies_legal_thumb.23");
	t("receptive_fairies_legal_thumb.24");
	t("receptive_fairies_legal_thumb.25");
	t("receptive_fairies_legal_thumb.26");
	t("receptive_fairies_legal_thumb.27");
	t("receptive_fairies_legal_thumb.28");
	t("receptive_fairies_legal_thumb.29");
	t("receptive_fairies_legal_thumb.30");
	t("receptive_fairies_legal_thumb.31");
	t("receptive_fairies_legal_thumb.32");
	t("receptive_fairies_legal_thumb.33");
	t("receptive_fairies_legal_thumb.34");
	t("receptive_fairies_legal_thumb.35");
	t("receptive_fairies_legal_thumb.36");
	t("receptive_fairies_legal_thumb.37");
	t("receptive_fairies_legal_thumb.38");
	t("receptive_fairies_legal_thumb.39");
	t("receptive_fairies_legal_thumb.40");
	t("receptive_fairies_legal_thumb.41");
	t("receptive_fairies_legal_thumb.42");
	t("receptive_fairies_legal_thumb.43");
	t("receptive_fairies_legal_thumb.44");
	t("receptive_fairies_legal_thumb.45");
	t("receptive_fairies_legal_thumb.46");
	t("receptive_fairies_legal_thumb.47");
	t("receptive_fairies_legal_thumb.48");
	t("receptive_fairies_legal_thumb.49");
	t("receptive_fairies_legal_thumb.50");
	t("receptive_fairies_legal_thumb.51");
	t("receptive_fairies_legal_thumb.52");
	t("receptive_fairies_legal_thumb.53");
	t("receptive_fairies_legal_thumb.54");
	t("receptive_fairies_legal_thumb.55");
	t("receptive_fairies_legal_thumb.56");
	t("receptive_fairies_legal_thumb.57");
	t("receptive_fairies_legal_thumb.58");
	t("receptive_fairies_legal_thumb.59");
	t("receptive_fairies_legal_thumb.60");
	t("receptive_fairies_legal_thumb.61");
	t("receptive_fairies_legal_thumb.62");
	t("receptive_fairies_legal_thumb.63");
	t("receptive_fairies_legal_thumb.64");
	t("receptive_fairies_legal_thumb.65");
	t("receptive_fairies_legal_thumb.66");
	t("receptive_fairies_legal_thumb.67");
	t("receptive_fairies_legal_thumb.68");
	t("receptive_fairies_legal_thumb.69");
	t("receptive_fairies_legal_thumb.70");
	t("receptive_fairies_legal_thumb.71");
	t("receptive_fairies_legal_thumb.72");
	t("receptive_fairies_legal_thumb.73");
	t("receptive_fairies_legal_thumb.74");
	t("receptive_fairies_legal_thumb.75");
	t("receptive_fairies_legal_thumb.76");
	t("receptive_fairies_legal_thumb.77");
	t("receptive_fairies_legal_thumb.78");
	t("receptive_fairies_legal_thumb.79");
	t("receptive_fairies_legal_thumb.80");
	t("receptive_fairies_legal_thumb.81");
	t("receptive_fairies_legal_thumb.82");
	t("receptive_fairies_legal_thumb.83");
	t("receptive_fairies_legal_thumb.84");
	t("receptive_fairies_legal_thumb.85");
	t("receptive_fairies_legal_thumb.86");
	t("receptive_fairies_legal_thumb.87");
	t("receptive_fairies_legal_thumb.88");
	t("receptive_fairies_legal_thumb.89");
	t("receptive_fairies_legal_thumb.90");
	t("receptive_fairies_legal_thumb.91");
	t("receptive_fairies_legal_thumb.92");
	t("receptive_fairies_legal_thumb.93");
	t("receptive_fairies_legal_thumb.94");
	t("receptive_fairies_legal_thumb.95");
	t("receptive_fairies_legal_thumb.96");
	t("receptive_fairies_legal_thumb.97");
	t("receptive_fairies_legal_thumb.98");
	t("receptive_fairies_legal_thumb.99");
	t("receptive_fairies_legal_thumb.100");
	*/

	return (
		<div className="group/mark relative">
			<FlirtualMark
				className="group-hocus-within/mark:-top-9 absolute right-1 top-0 w-16 origin-[bottom_center] rotate-[14deg] cursor-grab transition-all active:scale-x-110 active:scale-y-90 active:cursor-grabbing"
				onClick={() => {
					squeak();

					const message = flittyMessages[(squeakCount / 5).toString() as keyof typeof flittyMessages];
					if (message)
						toasts.add({
							value: message,
							icon: Cat,
							duration: "long"
						});

					setSqueakCount(squeakCount + 1);
				}}
			/>
			<ButtonLink className="isolate" href={urls.register} kind="primary" size="sm" tabIndex={tabIndex}>
				{t("sign_up")}
			</ButtonLink>
		</div>
	);
};
