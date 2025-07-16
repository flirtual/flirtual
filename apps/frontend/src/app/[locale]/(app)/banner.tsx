import { Slot } from "@radix-ui/react-slot";
import { MoveRight } from "lucide-react";
import type { FC, PropsWithChildren, ReactNode, RefAttributes } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { InlineLink, type InlineLinkProps } from "~/components/inline-link";
import { useLocation } from "~/hooks/use-location";
import { useOptionalSession } from "~/hooks/use-session";

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

export type BannerProps = PropsWithChildren<{
	className?: string;
	icon?: ReactNode;
}> & RefAttributes<HTMLDivElement>;

const defaultBannerIcon = <MoveRight />;

export function Banner({ children, className, ref, icon = defaultBannerIcon }: BannerProps) {
	return (
		<div
			className={twMerge(
				"z-50 flex w-full justify-center bg-black-70 text-white-20",
				className
			)}
			ref={ref}
		>
			<div className="relative flex w-full items-center justify-center px-8 py-4 pt-[max(calc(var(--safe-area-inset-top,0rem)+0.5rem),1rem)]">
				<div className="relative flex items-center gap-4 font-montserrat leading-none desktop:text-lg">
					{icon && <Slot className="mt-[0.15rem] w-6 shrink-0 animate-bounce-x">{icon}</Slot>}
					<span>{children}</span>
				</div>
			</div>
		</div>
	);
}

export const AppBanner: FC = () => {
	const session = useOptionalSession();
	const { t } = useTranslation();

	if (!session) return null;

	if (!["finished_profile", "visible"].includes(session.user.status)) {
		return (
			<Banner>
				{t.rich("nutritious_challenge_blue_end", {
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
				{t.rich("exuberant_green_horse_fowl", {
					link: (children) => (
						<BannerLink href="/confirm-email">{children}</BannerLink>
					)
				})}
			</Banner>
		);
	}

	return null;
};
