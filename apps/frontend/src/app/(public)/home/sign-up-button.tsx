"use client";

import { Cat } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import { type FC, useState } from "react";
import useSound from "use-sound";

import { ButtonLink } from "~/components/button";
import { FlirtualMark } from "~/components/mark";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

export const SignUpButton: FC = () => {
	const t = useTranslations("landing");
	const { landing: { flitty_messages: flittyMessages } } = useMessages() as unknown as { landing: { flitty_messages: Record<string, string> } };
	const toasts = useToast();

	const [squeak] = useSound(urls.media("squeak.mp3"));
	const [squeakCount, setSqueakCount] = useState(0);

	/*
	t("flitty_messages.0");
	t("flitty_messages.1");
	t("flitty_messages.2");
	t("flitty_messages.3");
	t("flitty_messages.4");
	t("flitty_messages.5");
	t("flitty_messages.6");
	t("flitty_messages.7");
	t("flitty_messages.8");
	t("flitty_messages.9");
	t("flitty_messages.10");
	t("flitty_messages.11");
	t("flitty_messages.12");
	t("flitty_messages.13");
	t("flitty_messages.14");
	t("flitty_messages.15");
	t("flitty_messages.16");
	t("flitty_messages.17");
	t("flitty_messages.18");
	t("flitty_messages.19");
	t("flitty_messages.20");
	t("flitty_messages.21");
	t("flitty_messages.22");
	t("flitty_messages.23");
	t("flitty_messages.24");
	t("flitty_messages.25");
	t("flitty_messages.26");
	t("flitty_messages.27");
	t("flitty_messages.28");
	t("flitty_messages.29");
	t("flitty_messages.30");
	t("flitty_messages.31");
	t("flitty_messages.32");
	t("flitty_messages.33");
	t("flitty_messages.34");
	t("flitty_messages.35");
	t("flitty_messages.36");
	t("flitty_messages.37");
	t("flitty_messages.38");
	t("flitty_messages.39");
	t("flitty_messages.40");
	t("flitty_messages.41");
	t("flitty_messages.42");
	t("flitty_messages.43");
	t("flitty_messages.44");
	t("flitty_messages.45");
	t("flitty_messages.46");
	t("flitty_messages.47");
	t("flitty_messages.48");
	t("flitty_messages.49");
	t("flitty_messages.50");
	t("flitty_messages.51");
	t("flitty_messages.52");
	t("flitty_messages.53");
	t("flitty_messages.54");
	t("flitty_messages.55");
	t("flitty_messages.56");
	t("flitty_messages.57");
	t("flitty_messages.58");
	t("flitty_messages.59");
	t("flitty_messages.60");
	t("flitty_messages.61");
	t("flitty_messages.62");
	t("flitty_messages.63");
	t("flitty_messages.64");
	t("flitty_messages.65");
	t("flitty_messages.66");
	t("flitty_messages.67");
	t("flitty_messages.68");
	t("flitty_messages.69");
	t("flitty_messages.70");
	t("flitty_messages.71");
	t("flitty_messages.72");
	t("flitty_messages.73");
	t("flitty_messages.74");
	t("flitty_messages.75");
	t("flitty_messages.76");
	t("flitty_messages.77");
	t("flitty_messages.78");
	t("flitty_messages.79");
	t("flitty_messages.80");
	t("flitty_messages.81");
	t("flitty_messages.82");
	t("flitty_messages.83");
	t("flitty_messages.84");
	t("flitty_messages.85");
	t("flitty_messages.86");
	t("flitty_messages.87");
	t("flitty_messages.88");
	t("flitty_messages.89");
	t("flitty_messages.90");
	t("flitty_messages.91");
	t("flitty_messages.92");
	t("flitty_messages.93");
	t("flitty_messages.94");
	t("flitty_messages.95");
	t("flitty_messages.96");
	t("flitty_messages.97");
	t("flitty_messages.98");
	t("flitty_messages.99");
	t("flitty_messages.100");
	*/

	return (
		<div className="group/mark relative">
			<FlirtualMark
				className="absolute right-1 top-0 w-16 origin-[bottom_center] rotate-[14deg] cursor-grab transition-all active:scale-x-110 active:scale-y-90 active:cursor-grabbing group-hocus-within/mark:-top-9"
				onClick={() => {
					squeak();

					const message = flittyMessages[squeakCount / 5];
					if (message)
						toasts.add({
							value: message,
							icon: Cat,
							duration: "long"
						});

					setSqueakCount(squeakCount + 1);
				}}
			/>
			<ButtonLink className="isolate" href={urls.register} kind="primary">
				{t("sign_up")}
			</ButtonLink>
		</div>
	);
};
