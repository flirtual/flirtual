"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MoveRight, X } from "lucide-react";
import React from "react";
import { twMerge } from "tailwind-merge";

import { usePreferences } from "~/hooks/use-preferences";

export const HeaderMessage: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ children, ...props }) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [dismissMobile, setDismissMobile] = usePreferences(
		"dismissMobile",
		false
	);

	// todo: fix header dismissal
	return (
		<AnimatePresence>
			{!dismissMobile && (
				<motion.div
					{...props}
					animate={{ height: "max-content" }}
					exit={{ height: 0 }}
					initial={{ height: dismissMobile ? 0 : "max-content" }}
					transition={{ damping: 25 }}
					className={twMerge(
						"flex w-full justify-center bg-black-70 text-white-20",
						props.className
					)}
				>
					<div className="relative flex w-full max-w-screen-lg items-center justify-center px-8 py-4">
						<div className="relative flex gap-4 font-montserrat leading-none sm:text-lg">
							<MoveRight className="w-6 animate-bounce-x" />
							<span>{children}</span>
						</div>
						<button
							className="absolute right-8"
							type="button"
							//onClick={() => setDismissMobile(true)}
						>
							<X className="w-6" strokeWidth={2} />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
