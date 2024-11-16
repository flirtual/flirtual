"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";

import { InlineLink } from "~/components/inline-link";
import { urls } from "~/urls";

export const SuccessMessage: React.FC = () => {
	const searchParameters = useSearchParams();
	if (!searchParameters.get("success")) return null;

	return (
		<div className="flex flex-col gap-4 rounded-xl bg-brand-gradient p-6 text-white-20 shadow-brand-1">
			<div className="relative">
				<h1 className="text-xl font-semibold">
					We&apos;ve received your order.
				</h1>
				<Link
					className="absolute right-0 top-0"
					href={urls.subscription.default}
				>
					<X className="size-6" />
				</Link>
			</div>
			<div className="flex flex-col">
				<span>
					Your subscription will be applied to your account momentarily.
				</span>
				<span>
					If you need any help with your purchase, please
					{" "}
					<InlineLink
						className="underline"
						highlight={false}
						href={urls.resources.contact}
					>
						contact us
					</InlineLink>
					.
				</span>
			</div>
		</div>
	);
};
