"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export const SuccessMessage: React.FC = () => {
	const searchParameters = useSearchParams();
	if (!searchParameters.get("success")) return null;

	return (
		<div className="flex gap-4 overflow-hidden rounded-xl bg-brand-gradient px-1">
			<div className="flex w-full flex-col gap-4 rounded-xl bg-white-25 p-6 dark:bg-black-80">
				<div className="relative">
					<h1 className="text-xl font-semibold">
						We&apos;ve received your order.
					</h1>
					<Link
						className="absolute right-0 top-0"
						href={urls.subscription.default}
					>
						<X className="h-6 w-6" />
					</Link>
				</div>
				<div className="flex flex-col">
					<span>Your subscription should now be applied to your account.</span>
					<span>
						If your subscription is missing or you need any other help, please{" "}
						<InlineLink href={urls.resources.contact}>contact us</InlineLink>.
					</span>
				</div>
			</div>
		</div>
	);
};
