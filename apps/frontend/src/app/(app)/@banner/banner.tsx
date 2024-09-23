import { MoveRight } from "lucide-react";
import { forwardRef, type FC, type PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";

import { InlineLink, type InlineLinkProps } from "~/components/inline-link";

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

export const Banner = forwardRef<
	HTMLDivElement,
	PropsWithChildren<{ className?: string }>
>(({ children, className }, reference) => {
	return (
		<div
			ref={reference}
			className={twMerge(
				"flex w-full justify-center bg-black-70 text-white-20",
				className
			)}
		>
			<div className="max-w-screen-lg relative flex w-full items-center justify-center px-8 py-4 pt-[max(calc(env(safe-area-inset-top,0rem)+0.5rem),1rem)]">
				<div className="relative flex items-center gap-4 font-montserrat leading-none desktop:text-lg">
					<MoveRight className="mt-[0.15rem] w-6 shrink-0 animate-bounce-x" />
					<span>{children}</span>
				</div>
			</div>
		</div>
	);
});
