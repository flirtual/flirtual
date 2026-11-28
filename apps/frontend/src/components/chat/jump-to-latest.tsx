import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { scrollBehavior } from "~/utilities";

import { messageList } from "./selectors";

export function JumpToLatest({ className = "sticky bottom-0 shrink-0" }: { className?: string }) {
	const { t } = useTranslation();
	const anchor = useRef<HTMLDivElement>(null);
	const [shown, setShown] = useState(false);

	useEffect(() => {
		const list = anchor.current?.closest(messageList) ?? anchor.current?.parentElement?.querySelector(messageList);
		if (!list) return;

		const update = () => setShown(-list.scrollTop > list.clientHeight);
		update();
		list.addEventListener("scroll", update, { passive: true });
		return () => list.removeEventListener("scroll", update);
	}, []);

	return (
		<div className={twMerge("pointer-events-none z-10 h-0", className)} ref={anchor}>
			<button
				className={twMerge(
					"pointer-events-auto absolute right-0 bottom-0 flex size-10 items-center justify-center rounded-full bg-white-30 text-black-80 shadow-brand-1 transition-[opacity,scale] dark:bg-black-60 dark:text-white-20 hocus:text-theme-2 vision:bg-white-30/70 vision:text-black-80",
					!shown && "pointer-events-none scale-75 opacity-0"
				)}
				aria-label={t("jump_to_latest")}
				inert={!shown}
				type="button"
				onClick={() => (anchor.current?.closest(messageList) ?? anchor.current?.parentElement?.querySelector(messageList))?.scrollTo({ top: 0, behavior: scrollBehavior() })}
			>
				<ChevronDown className="size-6 fill-none!" />
			</button>
		</div>
	);
}
