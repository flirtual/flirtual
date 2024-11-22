"use client";

import { MoveRight } from "lucide-react";
import { type FC, forwardRef, type PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

import { InlineLink, type InlineLinkProps } from "~/components/inline-link";
import { useInternationalization, useTranslations } from "~/hooks/use-internationalization";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";

export const BannerLink: FC<PropsWithChildren<InlineLinkProps>> = ({
	href,
	children,
	...props
}) => (
	<InlineLink
		{...props}
		className="font-semibold before:absolute before:left-0 before:top-0 before:size-full"
		highlight={false}
		href={href}
	>
		{children}
	</InlineLink>
);

export const SelfLink: FC<
	PropsWithChildren<
		{ query?: Record<string, string | null> } & Omit<InlineLinkProps, "href">
	>
> = ({ children, query, ...props }) => {
	const location = useLocation();

	const url = new URL(location.href);
	if (query)
		Object.entries(query).forEach(([key, value]) => {
			if (value === null) return url.searchParams.delete(key);
			url.searchParams.set(key, value);
		});

	return (
		<BannerLink href={url.href} {...props}>
			{children}
		</BannerLink>
	);
};

export const Banner = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ className?: string }>
>(({ children, className }, reference) => {
	return (
		<div
			className={twMerge(
				"flex w-full justify-center bg-black-70 text-white-20",
				className
			)}
			ref={reference}
		>
			<div className="relative flex w-full items-center justify-center px-8 py-4 pt-[max(calc(env(safe-area-inset-top,0rem)+0.5rem),1rem)]">
				<div className="relative flex items-center gap-4 font-montserrat leading-none desktop:text-lg">
					<MoveRight className="mt-[0.15rem] w-6 shrink-0 animate-bounce-x" />
					<span>{children}</span>
				</div>
			</div>
		</div>
	);
});

Banner.displayName = "Banner";

export const AppBanner: FC = () => {
	const [session] = useSession();
	const t = useTranslations("banners");
	const tPreferred = useTranslations("_preferred.banners");

	const { locale, translating, } = useInternationalization();

	if (!session) return null;

	const languageNames = new Intl.DisplayNames(locale.preferred, {
		type: "language"
	});

	if (!["finished_profile", "visible"].includes(session.user.status)) {
		return (
			<Banner>
				{t.rich("finish_profile", {
					link: (children) => (
						<BannerLink
							href={
								session.user.status === "registered"
									? "/onboarding/1"
									: "/finish/1"
							}
						>
							{children}
						</BannerLink>
					)
				})}
			</Banner>
		);
	}

	if (!session.user.emailConfirmedAt) {
		return (
			<Banner>
				{t.rich("confirm_email", {
					link: (children) => (
						<BannerLink href="/confirm-email">{children}</BannerLink>
					)
				})}
			</Banner>
		);
	}

	if (translating) {
		return (
			<Banner>
				{t.rich("translating", {
					link: (children) => (
						<SelfLink query={{ translating: null }}>{children}</SelfLink>
					)
				})}
			</Banner>
		);
	}

	if (locale.current !== locale.preferred) {
		return (
			<Banner>
				{tPreferred.rich("language", {
					current: languageNames.of(locale.current),
					preferred: languageNames.of(locale.preferred),
					link: (children) => (
						<SelfLink lang={locale.preferred}>{children}</SelfLink>
					)
				})}
			</Banner>
		);
	}

	return null;
};
