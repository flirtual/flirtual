import { Info } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { InlineThemeSelect } from "~/app/[locale]/(app)/(authenticated)/settings/(account)/appearance/theme-preview";
import { emptyObject } from "~/utilities";

import { InlineLanguageSelect } from "./inputs/specialized/language-select";
import { SupportButton } from "./layout/support-button";
import { FlirtualLogo } from "./logo";

export type ModelCardProps = {
	title?: React.ReactNode;
	titleProps?: React.ComponentProps<"div">;
	containerProps?: React.ComponentProps<"div">;
	branded?: boolean;
	miniFooter?: boolean;
	inset?: boolean;
} & React.ComponentProps<"div">;

export const ModelCard: React.FC<ModelCardProps> = ({
	children,
	title,
	titleProps = emptyObject,
	containerProps = emptyObject,
	branded = false,
	miniFooter = false,
	inset = true,
	...props
}) => {
	const { t } = useTranslation();

	return (
		<>
			{branded && (
				<FlirtualLogo className="motion-preset-confetti mx-auto mb-8 hidden h-20 text-black-80 dark:text-[snow] desktop:flex" />
			)}
			<div
				{...props}
				className={twMerge(
					"h-fit w-full shrink-0 rounded-2xl desktop:w-full desktop:max-w-lg desktop:shadow-brand-1",
					props.className
				)}
			>
				{title && (
					<div
						{...titleProps}
						className={twMerge(
							"w-full bg-brand-gradient py-7 text-center font-montserrat text-3xl font-extrabold text-white-20 desktop:w-full desktop:rounded-t-2xl desktop:px-8 desktop:pb-4 desktop:pt-[1.125rem] desktop:text-2xl android:desktop:pt-[1.125rem]",
							inset
							&& "pt-[max(calc(var(--safe-area-inset-top,0rem)+1rem),1.75rem)]",
							titleProps.className
						)}
					>
						{title}
					</div>
				)}
				<div className={twMerge("h-full vision:bg-none desktop:rounded-2xl desktop:bg-brand-gradient desktop:p-1", title && "desktop:rounded-t-none desktop:pt-0")}>
					<div
						{...containerProps}
						className={twMerge(
							"flex size-full flex-col px-8 py-10 pb-[max(var(--safe-area-inset-bottom,0rem),2.5rem)] vision:bg-transparent vision:text-white-20 dark:bg-transparent dark:text-white-20 desktop:rounded-xl desktop:bg-white-20 desktop:px-16 desktop:shadow-brand-inset dark:desktop:bg-black-70",
							containerProps.className
						)}
					>
						{children}
					</div>
				</div>
			</div>
			{miniFooter && (
				<footer className={twMerge(
					"mb-8 mt-auto grid grid-cols-3 items-center justify-center gap-4 desktop:mb-0 desktop:mt-8",
				)}
				>
					<SupportButton className="flex items-center gap-0.5em whitespace-nowrap">
						<Info className="inline-block size-em" />
						{" "}
						{t("need_help")}
					</SupportButton>
					<InlineThemeSelect />
					<InlineLanguageSelect />
				</footer>
			)}
		</>
	);
};
