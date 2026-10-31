import { Cat } from "lucide-react";
import { useState } from "react";
import type { FC, PropsWithChildren } from "react";
import useSound from "use-sound";

import { Mark } from "~/components/mark";
import { useToast } from "~/hooks/use-toast";
import { useMessages } from "~/i18n";
import Squeak from "~/static/easter-eggs/squeak.mp3";

export const SqueakyFlitty: FC<PropsWithChildren> = ({ children }) => {
	const { flitty_reactions: flittyMessages } = useMessages();
	const toasts = useToast();

	const [squeak] = useSound(Squeak);
	const [squeakCount, setSqueakCount] = useState(0);

	/*
	t("flitty_reactions.0");
	t("flitty_reactions.1");
	t("flitty_reactions.2");
	t("flitty_reactions.3");
	t("flitty_reactions.4");
	t("flitty_reactions.5");
	t("flitty_reactions.6");
	t("flitty_reactions.7");
	t("flitty_reactions.8");
	t("flitty_reactions.9");
	t("flitty_reactions.10");
	t("flitty_reactions.11");
	t("flitty_reactions.12");
	t("flitty_reactions.13");
	t("flitty_reactions.14");
	t("flitty_reactions.15");
	t("flitty_reactions.16");
	t("flitty_reactions.17");
	t("flitty_reactions.18");
	t("flitty_reactions.19");
	t("flitty_reactions.20");
	t("flitty_reactions.21");
	t("flitty_reactions.22");
	t("flitty_reactions.23");
	t("flitty_reactions.24");
	t("flitty_reactions.25");
	t("flitty_reactions.26");
	t("flitty_reactions.27");
	t("flitty_reactions.28");
	t("flitty_reactions.29");
	t("flitty_reactions.30");
	t("flitty_reactions.31");
	t("flitty_reactions.32");
	t("flitty_reactions.33");
	t("flitty_reactions.34");
	t("flitty_reactions.35");
	t("flitty_reactions.36");
	t("flitty_reactions.37");
	t("flitty_reactions.38");
	t("flitty_reactions.39");
	t("flitty_reactions.40");
	t("flitty_reactions.41");
	t("flitty_reactions.42");
	t("flitty_reactions.43");
	t("flitty_reactions.44");
	t("flitty_reactions.45");
	t("flitty_reactions.46");
	t("flitty_reactions.47");
	t("flitty_reactions.48");
	t("flitty_reactions.49");
	t("flitty_reactions.50");
	t("flitty_reactions.51");
	t("flitty_reactions.52");
	t("flitty_reactions.53");
	t("flitty_reactions.54");
	t("flitty_reactions.55");
	t("flitty_reactions.56");
	t("flitty_reactions.57");
	t("flitty_reactions.58");
	t("flitty_reactions.59");
	t("flitty_reactions.60");
	t("flitty_reactions.61");
	t("flitty_reactions.62");
	t("flitty_reactions.63");
	t("flitty_reactions.64");
	t("flitty_reactions.65");
	t("flitty_reactions.66");
	t("flitty_reactions.67");
	t("flitty_reactions.68");
	t("flitty_reactions.69");
	t("flitty_reactions.70");
	t("flitty_reactions.71");
	t("flitty_reactions.72");
	t("flitty_reactions.73");
	t("flitty_reactions.74");
	t("flitty_reactions.75");
	t("flitty_reactions.76");
	t("flitty_reactions.77");
	t("flitty_reactions.78");
	t("flitty_reactions.79");
	t("flitty_reactions.80");
	t("flitty_reactions.81");
	t("flitty_reactions.82");
	t("flitty_reactions.83");
	t("flitty_reactions.84");
	t("flitty_reactions.85");
	t("flitty_reactions.86");
	t("flitty_reactions.87");
	t("flitty_reactions.88");
	t("flitty_reactions.89");
	t("flitty_reactions.90");
	t("flitty_reactions.91");
	t("flitty_reactions.92");
	t("flitty_reactions.93");
	t("flitty_reactions.94");
	t("flitty_reactions.95");
	t("flitty_reactions.96");
	t("flitty_reactions.97");
	t("flitty_reactions.98");
	t("flitty_reactions.99");
	t("flitty_reactions.100");
	*/

	return (
		<div className="group/mark relative">
			<Mark
				className="absolute top-0 right-1 w-16 origin-[bottom_center] rotate-14 cursor-grab transition-all active:scale-x-110 active:scale-y-90 active:cursor-grabbing group-hocus-within/mark:-top-9"
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
			{children}
		</div>
	);
};
