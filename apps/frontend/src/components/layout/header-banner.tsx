"use client";

import { MoveRight } from "lucide-react";

import { useSession } from "~/hooks/use-session";
import { useLocation } from "~/hooks/use-location";

import { InlineLink } from "../inline-link";

import type { FC } from "react";

export const HeaderBanner: FC = () => {
	const [session] = useSession();
	const location = useLocation();

	let type: string | null = null;

	if (!session?.user.id || location.pathname.split("/")[1] !== "browse") return;

	if (!["finished_profile", "visible"].includes(session.user.status))
		type = "finish";
	else if (!session.user.emailConfirmedAt) type = "confirm";

	if (!type) return null;

	return (
		<div className="fixed top-0 z-10 flex w-full justify-center bg-black-70 text-white-20 shadow-brand-1 desktop:relative desktop:shadow-none">
			<div className="max-w-screen-lg relative flex w-full items-center justify-center px-8 py-4 pt-[max(calc(env(safe-area-inset-top,0rem)+0.5rem),1rem)]">
				<div className="relative flex items-center gap-4 font-montserrat leading-none desktop:text-lg">
					<MoveRight className="mt-[0.15rem] w-6 animate-bounce-x" />
					<span>
						{
							{
								finish: (
									<>
										<InlineLink
											className="font-semibold underline before:absolute before:left-0 before:top-0 before:size-full"
											highlight={false}
											href={
												session.user.status === "registered"
													? "/onboarding/1"
													: "/finish/1"
											}
										>
											Complete your profile
										</InlineLink>{" "}
										so people can see you and match!
									</>
								),
								confirm: (
									<>
										<InlineLink
											className="font-semibold before:absolute before:left-0 before:top-0 before:size-full"
											highlight={false}
											href="/confirm-email"
										>
											Confirm your email
										</InlineLink>{" "}
										so people can see you and match!
									</>
								),
								mobile: (
									<>
										<InlineLink
											className="font-semibold before:absolute before:left-0 before:top-0 before:size-full"
											highlight={false}
											href="/download"
										>
											Download the mobile app
										</InlineLink>{" "}
										for a better experience!
									</>
								)
							}[type as string]
						}
					</span>
				</div>
				{/* {dismissCallback && (
					<button
						className="absolute right-8"
						type="button"
						onClick={dismissCallback}
					>
						<X className="w-6" strokeWidth={2} />
					</button>
				)} */}
			</div>
		</div>
	);
};
