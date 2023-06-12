"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import React, { Dispatch, useEffect } from "react";
import { Portal } from "react-portal";
import { twMerge } from "tailwind-merge";

import { useScrollLock } from "~/hooks/use-scroll-lock";

export interface ModalProps {
	children: React.ReactNode;
	visible: boolean;
	onVisibilityChange: Dispatch<boolean>;
}

export const ModalOuter: React.FC<
	ModalProps & { modalOuterProps?: HTMLMotionProps<"div"> }
> = ({ modalOuterProps, ...props }) => {
	const { children, visible, onVisibilityChange } = props;
	const [, setScrollLock] = useScrollLock();

	useEffect(() => {
		if (visible) setScrollLock(true);
		return () => setScrollLock(false);
	}, [visible, setScrollLock]);

	return (
		<AnimatePresence>
			{visible && (
				<Portal>
					<motion.div
						{...modalOuterProps}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ damping: 25 }}
						className={twMerge(
							"fixed left-0 top-0 z-50 flex h-screen w-screen cursor-pointer items-center justify-center backdrop-blur backdrop-brightness-90",
							modalOuterProps?.className
						)}
						onClick={() => {
							onVisibilityChange(false);
						}}
					>
						{children}
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	);
};

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
	return (
		<ModalOuter {...props}>
			<motion.div
				animate={{ y: 0 }}
				className="w-fit cursor-default rounded-3xl bg-brand-gradient p-1 shadow-brand-1"
				exit={{ y: "100%" }}
				initial={{ y: "100%" }}
				transition={{ damping: 25 }}
				onClick={(event) => {
					event.stopPropagation();
				}}
			>
				<div className="relative flex w-full flex-col justify-center gap-y-3 rounded-3xl bg-white-30 px-3 py-4 dark:bg-black-70">
					<div className="h-full">{children}</div>
				</div>
			</motion.div>
		</ModalOuter>
	);
};
